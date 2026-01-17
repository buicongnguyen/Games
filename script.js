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
let blockSizeX, blockSizeY, blockSize, offsetX, offsetY;
let gridCache = null;

// Best scores
let bestScores = [];

// Initialize the game
function init() {
    canvas = document.getElementById('tetris');
    ctx = canvas.getContext('2d');
    nextCanvas = document.getElementById('next-piece');
    nextCtx = nextCanvas.getContext('2d');

    // Calculate block sizes once - use minimum to ensure square blocks
    blockSizeX = canvas.width / COLS;
    blockSizeY = canvas.height / ROWS;
    blockSize = Math.min(blockSizeX, blockSizeY);

    // For square blocks, we'll use blockSize for both dimensions
    // and center the game board if there's extra space
    offsetX = (canvas.width - blockSize * COLS) / 2;
    offsetY = (canvas.height - blockSize * ROWS) / 2;

    // Don't scale the context initially - we'll handle sizing in draw functions
    // ctx.scale(BLOCK_SIZE, BLOCK_SIZE);
    // nextCtx.scale(BLOCK_SIZE, BLOCK_SIZE);

    // Initialize the board
    createBoard();

    // Create the first piece
    resetGame();

    // Initially pause the game until start button is clicked
    paused = true;

    // Set initial button text to "Start"
    document.getElementById('reset-button').textContent = 'Start';

    // Add event listener for pause button
    document.getElementById('pause-button').addEventListener('click', () => {
        // Toggle pause state
        paused = !paused;
        document.getElementById('pause-button').textContent = paused ? 'Resume' : 'Pause';
    });

    // Add event listener for reset/start button
    document.getElementById('reset-button').addEventListener('click', () => {
        if (gameOver) {
            // If game is over, reset and start a new game
            resetGame();
            gameOver = false;
            paused = false; // Start the game immediately after reset
            document.getElementById('reset-button').textContent = 'Reset';
            document.getElementById('pause-button').textContent = 'Pause';
        } else if (paused && !gameOver) {
            // If game is paused, start the game
            paused = false;
            document.getElementById('reset-button').textContent = 'Reset';
            document.getElementById('pause-button').textContent = 'Pause';
        } else {
            // If game is running, reset the game
            resetGame();
            gameOver = false;
            paused = false; // Start the game immediately after reset
            document.getElementById('reset-button').textContent = 'Reset';
            document.getElementById('pause-button').textContent = 'Pause';
        }
    });

    // Pre-draw the grid to a cached image
    createGridCache();

    // Initialize best scores
    initBestScores();

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
        // Update best scores when game actually ends
        updateBestScores();
        // Update reset button text to "Start" when game is over
        document.getElementById('reset-button').textContent = 'Start';
        // Update pause button text when game is over
        document.getElementById('pause-button').textContent = 'Pause';
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

        piece.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const posX = offsetX + x * blockSize;
                    const posY = offsetY + y * blockSize;

                    // Create a gradient for 3D effect
                    const gradient = nextCtx.createLinearGradient(
                        posX, posY,
                        posX, posY + blockSize
                    );

                    // Get the base color and create variations for 3D effect
                    const baseColor = COLORS[type];

                    // Parse the hex color to RGB
                    let r = parseInt(baseColor.substring(1, 3), 16);
                    let g = parseInt(baseColor.substring(3, 5), 16);
                    let b = parseInt(baseColor.substring(5, 7), 16);

                    // Calculate lighter and darker shades
                    const lightColor = `rgb(${Math.min(255, r + 60)}, ${Math.min(255, g + 60)}, ${Math.min(255, b + 60)})`;
                    const darkColor = `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`;

                    // Add gradient stops for 3D effect
                    gradient.addColorStop(0, lightColor);      // Top/left - lighter
                    gradient.addColorStop(0.5, baseColor);    // Middle - base color
                    gradient.addColorStop(1, darkColor);      // Bottom/right - darker

                    nextCtx.fillStyle = gradient;

                    // Draw the main block
                    nextCtx.fillRect(posX, posY, blockSize, blockSize);

                    // Add a subtle highlight for 3D effect
                    nextCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    nextCtx.fillRect(posX, posY, blockSize * 0.4, blockSize * 0.4);

                    // Draw a thin border
                    nextCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                    nextCtx.lineWidth = 1;
                    nextCtx.strokeRect(posX, posY, blockSize, blockSize);
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

    // Draw the grid on the offscreen canvas using square blocks and offset
    // Draw vertical lines
    for (let x = 0; x <= COLS; x++) {
        gridCtx.beginPath();
        gridCtx.moveTo(offsetX + x * blockSize, offsetY);
        gridCtx.lineTo(offsetX + x * blockSize, offsetY + ROWS * blockSize);
        gridCtx.strokeStyle = '#222';
        gridCtx.lineWidth = 0.5;
        gridCtx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= ROWS; y++) {
        gridCtx.beginPath();
        gridCtx.moveTo(offsetX, offsetY + y * blockSize);
        gridCtx.lineTo(offsetX + COLS * blockSize, offsetY + y * blockSize);
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
                // Calculate the position using the pre-calculated block size
                // Use the square block size for both dimensions and add offset for centering
                const posX = offsetX + (x + offset.x) * blockSize;
                const posY = offsetY + (y + offset.y) * blockSize;

                // Create a gradient for 3D effect
                const gradient = ctx.createLinearGradient(
                    posX, posY,
                    posX, posY + blockSize
                );

                // Get the base color and create variations for 3D effect
                const baseColor = COLORS[type || value];

                // Parse the hex color to RGB
                let r = parseInt(baseColor.substring(1, 3), 16);
                let g = parseInt(baseColor.substring(3, 5), 16);
                let b = parseInt(baseColor.substring(5, 7), 16);

                // Calculate lighter and darker shades
                const lightColor = `rgb(${Math.min(255, r + 60)}, ${Math.min(255, g + 60)}, ${Math.min(255, b + 60)})`;
                const darkColor = `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`;

                // Add gradient stops for 3D effect
                gradient.addColorStop(0, lightColor);      // Top/left - lighter
                gradient.addColorStop(0.5, baseColor);    // Middle - base color
                gradient.addColorStop(1, darkColor);      // Bottom/right - darker

                ctx.fillStyle = gradient;

                // Draw the main block with square dimensions
                ctx.fillRect(posX, posY, blockSize, blockSize);

                // Add a subtle highlight for 3D effect
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(posX, posY, blockSize * 0.4, blockSize * 0.4);

                // Draw a thin border
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.lineWidth = 1;
                ctx.strokeRect(posX, posY, blockSize, blockSize);
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

// Initialize best scores from localStorage
function initBestScores() {
    const savedScores = localStorage.getItem('tetrisBestScores');
    if (savedScores) {
        bestScores = JSON.parse(savedScores);
    } else {
        bestScores = [];
    }
    updateBestScoresDisplay();
}

// Update best scores and save to localStorage
function updateBestScores() {
    // Only add the score if it's high enough to be in the top 3
    // or if we don't have 3 scores yet
    if (bestScores.length < 3 || score > bestScores[bestScores.length - 1]) {
        // Add current score to the list
        bestScores.push(score);

        // Sort scores in descending order and keep only top 3
        bestScores.sort((a, b) => b - a);
        bestScores = bestScores.slice(0, 3);

        // Save to localStorage
        localStorage.setItem('tetrisBestScores', JSON.stringify(bestScores));
    }

    updateBestScoresDisplay();
}

// Update the best scores display
function updateBestScoresDisplay() {
    const bestScoresContainer = document.querySelector('.best-scores-container');
    if (bestScoresContainer) {
        // Clear existing content except the heading
        const heading = bestScoresContainer.querySelector('h3');
        bestScoresContainer.innerHTML = '';
        if (heading) {
            bestScoresContainer.appendChild(heading.cloneNode(true));
        } else {
            const newHeading = document.createElement('h3');
            newHeading.textContent = 'Best Scores:';
            bestScoresContainer.appendChild(newHeading);
        }

        if (bestScores.length > 0) {
            bestScores.forEach((bestScore, index) => {
                const scoreElement = document.createElement('p');
                scoreElement.textContent = `${index + 1}. ${bestScore}`;
                bestScoresContainer.appendChild(scoreElement);
            });
        } else {
            const noScores = document.createElement('p');
            noScores.textContent = 'No scores yet';
            bestScoresContainer.appendChild(noScores);
        }
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