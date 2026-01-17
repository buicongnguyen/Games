// Tetris game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 24;
const COLORS = [
    null,
    '#FF0D72', // I
    '#0DC2FF', // J
    '#0DFF72', // L
    '#F538FF', // O
    '#FF8E0D', // S
    '#FFE138', // T
    '#3877FF'  // Z
];

// Tetromino shapes
const SHAPES = [
    [],
    [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], // I
    [[2,0,0], [2,2,2], [0,0,0]],                   // J
    [[0,0,3], [3,3,3], [0,0,0]],                   // L
    [[4,4], [4,4]],                                // O
    [[0,5,5], [5,5,0], [0,0,0]],                   // S
    [[0,6,0], [6,6,6], [0,0,0]],                   // T
    [[7,7,0], [0,7,7], [0,0,0]]                    // Z
];

// Game variables
let canvas, ctx, nextCanvas, nextCtx;
let board = [];
let score = 0;
let level = 1;
let lines = 0;
let gameOver = false;
let paused = false;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0
};

// Initialize the game
function init() {
    canvas = document.getElementById('tetris');
    ctx = canvas.getContext('2d');
    nextCanvas = document.getElementById('next-piece');
    nextCtx = nextCanvas.getContext('2d');

    // Scale canvases
    ctx.scale(BLOCK_SIZE, BLOCK_SIZE);
    nextCtx.scale(BLOCK_SIZE, BLOCK_SIZE);

    // Initialize the board
    createBoard();
    
    // Create the first piece
    resetGame();
    
    // Start the game loop
    requestAnimationFrame(update);
    
    // Event listeners for controls
    document.addEventListener('keydown', event => {
        if (gameOver) return;
        
        if (event.keyCode === 80) { // P key to pause
            paused = !paused;
            return;
        }
        
        if (paused) return;
        
        if (event.keyCode === 37) { // Left arrow
            playerMove(-1);
        } else if (event.keyCode === 39) { // Right arrow
            playerMove(1);
        } else if (event.keyCode === 40) { // Down arrow
            playerDrop();
        } else if (event.keyCode === 38) { // Up arrow
            playerRotate(1);
        } else if (event.keyCode === 32) { // Space bar
            playerHardDrop();
        }
    });
}

// Create the game board
function createBoard() {
    board = [];
    for (let y = 0; y < ROWS; y++) {
        board.push(Array(COLS).fill(0));
    }
}

// Reset the game state
function resetGame() {
    score = 0;
    level = 1;
    lines = 0;
    gameOver = false;
    paused = false;
    dropInterval = 1000;
    
    updateScore();
    
    // Create a new piece
    playerReset();
}

// Reset the player's position and get a new piece
function playerReset() {
    const pieces = 'ILJOTSZ';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (COLS / 2 | 0) - (player.matrix[0].length / 2 | 0);
    
    // Game over condition
    if (collide()) {
        gameOver = true;
    }
    
    // Draw next piece preview
    drawNextPiece();
}

// Draw the next piece preview
function drawNextPiece() {
    nextCtx.fillStyle = '#111';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    // Create a temporary piece to draw
    const pieces = 'ILJOTSZ';
    const nextPiece = createPiece(pieces[pieces.length * Math.random() | 0]);
    
    nextCtx.fillStyle = COLORS[nextPiece.type];
    nextCtx.strokeStyle = '#000';
    nextCtx.lineWidth = 0.05;
    
    nextPiece.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                nextCtx.fillRect(x, y, 1, 1);
                nextCtx.strokeRect(x, y, 1, 1);
            }
        });
    });
}

// Create a piece based on the type
function createPiece(type) {
    if (type === 'I') return [SHAPES[1], 1];
    if (type === 'J') return [SHAPES[2], 2];
    if (type === 'L') return [SHAPES[3], 3];
    if (type === 'O') return [SHAPES[4], 4];
    if (type === 'S') return [SHAPES[5], 5];
    if (type === 'T') return [SHAPES[6], 6];
    if (type === 'Z') return [SHAPES[7], 7];
}

// Draw the game board and current piece
function draw() {
    // Clear the canvas
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw the board
    drawMatrix(board, {x: 0, y: 0});
    
    // Draw the current piece
    drawMatrix(player.matrix[0], player.pos, player.matrix[1]);
}

// Draw a matrix at a given position
function drawMatrix(matrix, offset, type = null) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = COLORS[type || value];
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 0.05;
                
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

// Check for collision
function collide() {
    const [matrix, type] = player.matrix;
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            if (matrix[y][x] !== 0 &&
               (board[y + player.pos.y] &&
                board[y + player.pos.y][x + player.pos.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// Merge the current piece with the board
function merge() {
    player.matrix[0].forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + player.pos.y][x + player.pos.x] = player.matrix[1];
            }
        });
    });
}

// Move the player horizontally
function playerMove(dir) {
    player.pos.x += dir;
    if (collide()) {
        player.pos.x -= dir;
    }
}

// Rotate the player's piece
function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix[0], dir);
    
    while (collide()) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix[0], -dir);
            player.pos.x = pos;
            return;
        }
    }
}

// Rotate a matrix
function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < y; x++) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

// Drop the player's piece
function playerDrop() {
    player.pos.y++;
    if (collide()) {
        player.pos.y--;
        merge();
        playerReset();
        sweep();
        updateScore();
    }
    dropCounter = 0;
}

// Hard drop - drop the piece all the way down
function playerHardDrop() {
    while (!collide()) {
        player.pos.y++;
    }
    player.pos.y--;
    merge();
    playerReset();
    sweep();
    updateScore();
}

// Sweep completed lines
function sweep() {
    let lineCount = 0;
    outer: for (let y = ROWS - 1; y >= 0; y--) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        
        // Remove the line
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        lineCount++;
        
        // Since we removed a row, we need to check the same index again
        y++;
    }
    
    if (lineCount > 0) {
        // Update score based on number of lines cleared
        if (lineCount === 1) {
            score += 40 * level;
        } else if (lineCount === 2) {
            score += 100 * level;
        } else if (lineCount === 3) {
            score += 300 * level;
        } else if (lineCount === 4) {
            score += 1200 * level;
        }
        
        lines += lineCount;
        level = Math.floor(lines / 10) + 1;
        dropInterval = 1000 - (level - 1) * 50; // Increase speed with level
        
        updateScore();
    }
}

// Update the score display
function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
}

// Main game update loop
function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    
    if (!paused && !gameOver) {
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
    }
    
    draw();
    
    if (!gameOver) {
        requestAnimationFrame(update);
    } else {
        // Display game over message
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '0.8px Arial';
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', COLS / 2, ROWS / 2);
        ctx.fillText(`Score: ${score}`, COLS / 2, ROWS / 2 + 1);
    }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', init);