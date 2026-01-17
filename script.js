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
let nextPiece = null;
let player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0
};

// Pre-calculated values for performance
let blockSizeX, blockSizeY;
let gridCache = null;

// Initialize the game
function init() {
    canvas = document.getElementById('tetris');
    ctx = canvas.getContext('2d');
    nextCanvas = document.getElementById('next-piece');
    nextCtx = nextCanvas.getContext('2d');

    // Calculate block sizes once
    blockSizeX = canvas.width / COLS;
    blockSizeY = canvas.height / ROWS;

    // Don't scale the context initially - we'll handle sizing in draw functions
    // ctx.scale(BLOCK_SIZE, BLOCK_SIZE);
    // nextCtx.scale(BLOCK_SIZE, BLOCK_SIZE);

    // Initialize the board
    createBoard();

    // Create the first piece
    resetGame();

    // Initially pause the game until start button is clicked
    paused = true;

    // Add event listener for start button
    document.getElementById('start-button').addEventListener('click', () => {
        if (gameOver) {
            // Reset the game if it's over
            resetGame();
            gameOver = false;
        }
        paused = !paused;
        document.getElementById('start-button').textContent = paused ? 'Start Game' : 'Pause Game';
    });

    // Pre-draw the grid to a cached image
    createGridCache();

    // Start the game loop
    requestAnimationFrame(update);

    // Event listeners for controls
    document.addEventListener('keydown', event => {
        // Prevent default behavior when canvas/game has focus to avoid scrolling
        if ([32, 37, 38, 39, 40].includes(event.keyCode)) {
            event.preventDefault();
        }

        if (gameOver) return;

        if (event.keyCode === 80) { // P key to pause
            paused = !paused;
            document.getElementById('start-button').textContent = paused ? 'Start Game' : 'Pause Game';
            return;
        }

        if (event.keyCode === 32) { // Space bar - hard drop
            if (!paused) { // Only allow hard drop when game is not paused
                playerHardDrop();
            }
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
        }
    });

    // Focus the canvas element to ensure keyboard events go to the game
    canvas.focus();
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

    // If nextPiece is null, generate one
    if (!nextPiece) {
        nextPiece = createPiece(pieces[pieces.length * Math.random() | 0]);
    }

    // Assign the next piece to the player
    player.matrix = nextPiece;

    // Generate a new next piece
    nextPiece = createPiece(pieces[pieces.length * Math.random() | 0]);

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
    // Clear the next piece canvas
    nextCtx.fillStyle = '#111';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (nextPiece) {
        const [piece, type] = nextPiece;

        // Calculate a dynamic block size for the preview
        const maxPieceSize = Math.max(piece[0].length, piece.length);
        const blockSize = Math.min(nextCanvas.width / (maxPieceSize + 2), nextCanvas.height / (maxPieceSize + 2));

        // Calculate offsets to center the piece
        const offsetX = (nextCanvas.width - piece[0].length * blockSize) / 2;
        const offsetY = (nextCanvas.height - piece.length * blockSize) / 2;

        nextCtx.fillStyle = COLORS[type]; // Use the color of the piece
        nextCtx.strokeStyle = '#000';
        nextCtx.lineWidth = 0.5;

        piece.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    nextCtx.fillRect(offsetX + x * blockSize, offsetY + y * blockSize, blockSize, blockSize);
                    nextCtx.strokeRect(offsetX + x * blockSize, offsetY + y * blockSize, blockSize, blockSize);
                }
            });
        });
    }
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

    // Draw the grid
    drawGrid();

    // Draw the board
    drawMatrix(board, {x: 0, y: 0});

    // Draw the current piece
    drawMatrix(player.matrix[0], player.pos, player.matrix[1]);
}

// Create a cached grid image to avoid redrawing every frame
function createGridCache() {
    // Create an offscreen canvas for the grid
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = canvas.width;
    gridCanvas.height = canvas.height;
    const gridCtx = gridCanvas.getContext('2d');

    // Draw the grid on the offscreen canvas
    // Draw vertical lines
    for (let x = 0; x <= COLS; x++) {
        gridCtx.beginPath();
        gridCtx.moveTo(x * blockSizeX, 0);
        gridCtx.lineTo(x * blockSizeX, canvas.height);
        gridCtx.strokeStyle = '#222';
        gridCtx.lineWidth = 0.5;
        gridCtx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= ROWS; y++) {
        gridCtx.beginPath();
        gridCtx.moveTo(0, y * blockSizeY);
        gridCtx.lineTo(canvas.width, y * blockSizeY);
        gridCtx.strokeStyle = '#222';
        gridCtx.lineWidth = 0.5;
        gridCtx.stroke();
    }

    // Store the cached grid
    gridCache = gridCanvas;
}

// Draw the grid (now just draws the cached grid)
function drawGrid() {
    if (gridCache) {
        ctx.drawImage(gridCache, 0, 0);
    }
}

// Draw a matrix at a given position
function drawMatrix(matrix, offset, type = null) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = COLORS[type || value];
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 0.5;

                // Calculate the position using the pre-calculated block size
                const posX = (x + offset.x) * blockSizeX;
                const posY = (y + offset.y) * blockSizeY;

                ctx.fillRect(posX, posY, blockSizeX, blockSizeY);
                ctx.strokeRect(posX, posY, blockSizeX, blockSizeY);
            }
        });
    });
}

// Check for collision
function collide() {
    const [matrix, type] = player.matrix;
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            if (matrix[y][x] !== 0) {
                // Check if out of bounds or collides with placed pieces
                if (
                    typeof board[y + player.pos.y] === 'undefined' ||
                    typeof board[y + player.pos.y][x + player.pos.x] === 'undefined' ||
                    x + player.pos.x < 0 ||
                    x + player.pos.x >= COLS ||
                    y + player.pos.y >= ROWS ||
                    board[y + player.pos.y][x + player.pos.x] !== 0
                ) {
                    return true;
                }
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

// Sweep completed lines - more efficient version
function sweep() {
    let lineCount = 0;
    let y = ROWS - 1;

    // Process from bottom to top
    while (y >= 0) {
        // Check if the entire row is filled
        let isComplete = true;
        for (let x = 0; x < COLS; x++) {
            if (board[y][x] === 0) {
                isComplete = false;
                break;
            }
        }

        if (isComplete) {
            // Found a complete line, remove it and shift everything down
            for (let row = y; row > 0; row--) {
                for (let x = 0; x < COLS; x++) {
                    board[row][x] = board[row - 1][x];
                }
            }

            // Fill the top row with zeros
            for (let x = 0; x < COLS; x++) {
                board[0][x] = 0;
            }

            lineCount++;
            // Don't increment y, check the same position again since we shifted
        } else {
            y--; // Move to the next row
        }
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
        // Ensure drop interval doesn't become too fast or negative
        dropInterval = Math.max(100, 1000 - (level - 1) * 50);

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
let lastFrameTime = 0;
function update(currentTime = 0) {
    // Calculate delta time for consistent movement across different frame rates
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

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
        // Draw semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw game over text
        ctx.font = '30px Arial';
        ctx.fillStyle = '#FF4136';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);

        ctx.font = '20px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('Press Start to play again', canvas.width / 2, canvas.height / 2 + 60);
    }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', init);