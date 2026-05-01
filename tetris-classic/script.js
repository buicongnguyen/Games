// Tetris game constants
const COLS = 10;
const ROWS = 20;
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
const LINE_CLEAR_ANIMATION_DURATION = 520;

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

const PIECE_MAP = {
    I: { shape: SHAPES[1], type: 1 },
    J: { shape: SHAPES[2], type: 2 },
    L: { shape: SHAPES[3], type: 3 },
    O: { shape: SHAPES[4], type: 4 },
    S: { shape: SHAPES[5], type: 5 },
    T: { shape: SHAPES[6], type: 6 },
    Z: { shape: SHAPES[7], type: 7 }
};

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
let nextPiece = null;
let animationFrameId = null;
let hasStarted = false;
let lineClearAnimation = null;
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
    hasStarted = false;

    // Add event listener for pause button
    document.getElementById('pause-button').addEventListener('click', () => {
        togglePause();
    });

    // Add event listener for reset/start button
    document.getElementById('reset-button').addEventListener('click', () => {
        stopGameLoop();
        resetGame();
        hasStarted = true;
        paused = false;
        updateControlButtons();
        draw();
        startGameLoop();
        canvas.focus();
    });

    // Pre-draw the grid to a cached image
    createGridCache();

    // Initialize best scores
    initBestScores();

    updateControlButtons();
    draw();

    // Event listeners for controls
    document.addEventListener('keydown', event => {
        // Prevent default behavior when canvas/game has focus to avoid scrolling
        if ([32, 37, 38, 39, 40].includes(event.keyCode)) {
            event.preventDefault();
        }

        if (gameOver) return;

        if (event.keyCode === 80) { // P key to pause
            togglePause();
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

    // Initialize touch controls
    initTouchControls();

    // Make touch controls draggable
    makeDraggable();
}

// Initialize touch controls for mobile devices
function initTouchControls() {
    // Left button
    document.getElementById('btn-left').addEventListener('click', () => {
        if (!paused && !gameOver) {
            playerMove(-1);
        }
    });

    // Right button
    document.getElementById('btn-right').addEventListener('click', () => {
        if (!paused && !gameOver) {
            playerMove(1);
        }
    });

    // Down button (soft drop)
    document.getElementById('btn-down').addEventListener('click', () => {
        if (!paused && !gameOver) {
            playerDrop();
        }
    });

    // Rotate button
    document.getElementById('btn-rotate').addEventListener('click', () => {
        if (!paused && !gameOver) {
            playerRotate(1);
        }
    });

    // Hard drop button
    document.getElementById('btn-hard-drop').addEventListener('click', () => {
        if (!paused && !gameOver) {
            playerHardDrop();
        }
    });
}

function updateControlButtons() {
    const pauseButton = document.getElementById('pause-button');
    const resetButton = document.getElementById('reset-button');

    if (!pauseButton || !resetButton) {
        return;
    }

    pauseButton.disabled = !hasStarted || gameOver;
    pauseButton.textContent = paused && hasStarted ? 'Resume' : 'Pause';
    resetButton.textContent = !hasStarted || gameOver ? 'Start' : 'Reset';
}

function togglePause() {
    if (!hasStarted || gameOver) {
        return;
    }

    paused = !paused;
    updateControlButtons();

    if (!paused) {
        startGameLoop();
    } else {
        stopGameLoop();
        draw();
        drawOverlay('PAUSED', 'Press Resume or P to continue', '#FFE138');
    }
}

function startGameLoop() {
    if (animationFrameId !== null) {
        return;
    }

    lastFrameTime = 0;
    animationFrameId = requestAnimationFrame(update);
}

function stopGameLoop() {
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

// Make the touch controls draggable
function makeDraggable() {
    const dragElement = document.getElementById('draggable-controls');

    if (!dragElement) {
        return;
    }

    const dragHandle = dragElement.querySelector('.drag-handle');
    if (!dragHandle) {
        return;
    }

    let dragStartX = 0;
    let dragStartY = 0;
    let elementStartLeft = 0;
    let elementStartTop = 0;

    dragHandle.addEventListener('mousedown', event => {
        event.preventDefault();
        beginDrag(event.clientX, event.clientY);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopMouseDrag);
    });

    dragHandle.addEventListener('touchstart', event => {
        event.preventDefault();
        const touch = event.touches[0];
        beginDrag(touch.clientX, touch.clientY);
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', stopTouchDrag);
        document.addEventListener('touchcancel', stopTouchDrag);
    }, { passive: false });

    function beginDrag(clientX, clientY) {
        const rect = dragElement.getBoundingClientRect();
        dragElement.style.top = `${rect.top}px`;
        dragElement.style.left = `${rect.left}px`;
        dragElement.style.bottom = 'auto';
        dragElement.style.right = 'auto';
        dragElement.style.transform = 'none';

        dragStartX = clientX;
        dragStartY = clientY;
        elementStartLeft = rect.left;
        elementStartTop = rect.top;
    }

    function updateDragPosition(clientX, clientY) {
        const nextLeft = elementStartLeft + (clientX - dragStartX);
        const nextTop = elementStartTop + (clientY - dragStartY);
        const maxLeft = Math.max(0, window.innerWidth - dragElement.offsetWidth);
        const maxTop = Math.max(0, window.innerHeight - dragElement.offsetHeight);
        const clampedLeft = Math.min(Math.max(0, nextLeft), maxLeft);
        const clampedTop = Math.min(Math.max(0, nextTop), maxTop);

        dragElement.style.left = `${clampedLeft}px`;
        dragElement.style.top = `${clampedTop}px`;
    }

    function handleMouseMove(event) {
        event.preventDefault();
        updateDragPosition(event.clientX, event.clientY);
    }

    function handleTouchMove(event) {
        event.preventDefault();
        const touch = event.touches[0];
        updateDragPosition(touch.clientX, touch.clientY);
    }

    function stopMouseDrag() {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', stopMouseDrag);
    }

    function stopTouchDrag() {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', stopTouchDrag);
        document.removeEventListener('touchcancel', stopTouchDrag);
    }
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
    dropInterval = 1000;
    dropCounter = 0;
    lastFrameTime = 0;
    nextPiece = null;
    lineClearAnimation = null;

    // Clear the board
    createBoard();

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
        updateControlButtons();
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
    const piece = PIECE_MAP[type];
    if (!piece) {
        throw new Error(`Unknown piece type: ${type}`);
    }

    return [piece.shape.map(row => [...row]), piece.type];
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
    if (player.matrix) {
        drawMatrix(player.matrix[0], player.pos, player.matrix[1]);
    }

    drawLineClearAnimation();
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
    const [matrix] = player.matrix;
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
    if (lineClearAnimation) {
        return;
    }

    player.pos.x += dir;
    if (collide()) {
        player.pos.x -= dir;
    }
}

// Rotate the player's piece
function playerRotate(dir) {
    if (lineClearAnimation) {
        return;
    }

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

function lockPiece() {
    merge();
    const completedRows = getCompletedRows();

    if (completedRows.length > 0) {
        startLineClearAnimation(completedRows);
        updateControlButtons();
        return;
    }

    playerReset();
    updateScore();
    updateControlButtons();
}

// Drop the player's piece
function playerDrop() {
    if (lineClearAnimation) {
        return;
    }

    player.pos.y++;
    if (collide()) {
        player.pos.y--;
        lockPiece();
    }
    dropCounter = 0;
}

// Hard drop - drop the piece all the way down
function playerHardDrop() {
    if (lineClearAnimation) {
        return;
    }

    while (!collide()) {
        player.pos.y++;
    }
    player.pos.y--;
    lockPiece();
    dropCounter = 0;
}

function getCompletedRows() {
    const completedRows = [];

    for (let y = 0; y < ROWS; y++) {
        let isComplete = true;
        for (let x = 0; x < COLS; x++) {
            if (board[y][x] === 0) {
                isComplete = false;
                break;
            }
        }

        if (isComplete) {
            completedRows.push(y);
        }
    }

    return completedRows;
}

function startLineClearAnimation(completedRows) {
    lineClearAnimation = {
        rows: [...completedRows],
        startTime: null,
        duration: getLineClearAnimationDuration()
    };
    player.matrix = null;
    dropCounter = 0;
}

function getLineClearAnimationDuration() {
    const prefersReducedMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return prefersReducedMotion ? 160 : LINE_CLEAR_ANIMATION_DURATION;
}

function getLineClearProgress(currentTime = performance.now()) {
    if (!lineClearAnimation) {
        return 1;
    }

    if (lineClearAnimation.startTime === null) {
        lineClearAnimation.startTime = currentTime;
    }

    return Math.min(
        (currentTime - lineClearAnimation.startTime) / lineClearAnimation.duration,
        1
    );
}

function updateLineClearAnimation(currentTime) {
    const progress = getLineClearProgress(currentTime);

    if (progress < 1) {
        return;
    }

    const clearedCount = lineClearAnimation.rows.length;
    removeCompletedRows(lineClearAnimation.rows);
    lineClearAnimation = null;
    applyLineClearScore(clearedCount);
    playerReset();
    updateScore();
    updateControlButtons();
}

function removeCompletedRows(rowsToClear) {
    const clearSet = new Set(rowsToClear);
    board = board.filter((row, y) => !clearSet.has(y));

    while (board.length < ROWS) {
        board.unshift(Array(COLS).fill(0));
    }
}

function applyLineClearScore(lineCount) {
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
}

function drawLineClearAnimation() {
    if (!lineClearAnimation) {
        return;
    }

    const currentTime = performance.now();
    const progress = getLineClearProgress(currentTime);
    const flare = Math.sin(progress * Math.PI);
    const boardWidth = COLS * blockSize;

    ctx.save();
    lineClearAnimation.rows.forEach(rowIndex => {
        const rowY = offsetY + rowIndex * blockSize;
        const scorchAlpha = Math.min(0.58, progress * 0.72);

        ctx.fillStyle = `rgba(8, 2, 0, ${scorchAlpha})`;
        ctx.fillRect(offsetX, rowY, boardWidth, blockSize);
    });
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    lineClearAnimation.rows.forEach(rowIndex => {
        const rowY = offsetY + rowIndex * blockSize;
        const rowGlow = ctx.createLinearGradient(offsetX, rowY, offsetX + boardWidth, rowY);
        rowGlow.addColorStop(0, `rgba(255, 78, 16, ${0.12 + flare * 0.35})`);
        rowGlow.addColorStop(0.5, `rgba(255, 225, 56, ${0.18 + flare * 0.45})`);
        rowGlow.addColorStop(1, `rgba(255, 78, 16, ${0.12 + flare * 0.35})`);

        ctx.fillStyle = rowGlow;
        ctx.fillRect(offsetX, rowY, boardWidth, blockSize);

        ctx.fillStyle = `rgba(255, 244, 180, ${0.35 * flare})`;
        ctx.fillRect(offsetX, rowY + blockSize * 0.45, boardWidth, Math.max(2, blockSize * 0.08));

        for (let x = 0; x < COLS; x++) {
            const cellX = offsetX + x * blockSize;
            const pulse = Math.sin(currentTime * 0.018 + x * 1.7 + rowIndex * 0.9);
            const flameCenter = cellX + blockSize * (0.5 + pulse * 0.08);
            const flameBase = rowY + blockSize * (0.94 - progress * 0.18);
            const flameHeight = blockSize * (0.56 + flare * 0.42 + pulse * 0.08);
            const flameWidth = blockSize * (0.42 + flare * 0.18);

            ctx.beginPath();
            ctx.moveTo(flameCenter - flameWidth * 0.5, flameBase);
            ctx.quadraticCurveTo(
                flameCenter - flameWidth * 0.2,
                flameBase - flameHeight * 0.55,
                flameCenter,
                flameBase - flameHeight
            );
            ctx.quadraticCurveTo(
                flameCenter + flameWidth * 0.28,
                flameBase - flameHeight * 0.45,
                flameCenter + flameWidth * 0.5,
                flameBase
            );
            ctx.closePath();
            ctx.fillStyle = `rgba(255, 80, 12, ${0.34 + flare * 0.45})`;
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(flameCenter - flameWidth * 0.22, flameBase);
            ctx.quadraticCurveTo(
                flameCenter - flameWidth * 0.08,
                flameBase - flameHeight * 0.36,
                flameCenter,
                flameBase - flameHeight * 0.62
            );
            ctx.quadraticCurveTo(
                flameCenter + flameWidth * 0.14,
                flameBase - flameHeight * 0.28,
                flameCenter + flameWidth * 0.22,
                flameBase
            );
            ctx.closePath();
            ctx.fillStyle = `rgba(255, 236, 88, ${0.28 + flare * 0.5})`;
            ctx.fill();
        }

        for (let spark = 0; spark < COLS * 2; spark++) {
            const sparkSeed = spark * 37 + rowIndex * 19;
            const sparkProgress = (progress + (sparkSeed % 11) / 16) % 1;
            const sparkX = offsetX + ((sparkSeed % 101) / 101) * boardWidth;
            const sparkY = rowY + blockSize * (0.92 - sparkProgress * 1.08);
            const sparkRadius = Math.max(1.2, blockSize * (0.035 + flare * 0.025));
            const sparkAlpha = (1 - sparkProgress) * (0.35 + flare * 0.55);

            ctx.beginPath();
            ctx.arc(sparkX, sparkY, sparkRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 196, 64, ${sparkAlpha})`;
            ctx.fill();
        }
    });

    ctx.restore();
}

// Sweep completed lines - more efficient version
function sweep() {
    const completedRows = getCompletedRows();
    const lineCount = completedRows.length;

    if (lineCount > 0) {
        removeCompletedRows(completedRows);
        applyLineClearScore(lineCount);
        updateScore();
    }
}

// Initialize best scores from localStorage
function initBestScores() {
    try {
        const savedScores = localStorage.getItem('tetrisBestScores');
        if (savedScores) {
            const parsedScores = JSON.parse(savedScores);
            bestScores = Array.isArray(parsedScores)
                ? parsedScores.filter(score => Number.isFinite(score))
                : [];
            bestScores.sort((a, b) => b - a);
            bestScores = bestScores.slice(0, 3);
        } else {
            bestScores = [];
        }
    } catch (error) {
        bestScores = [];
    }
    updateBestScoresDisplay();
}

// Update best scores and save to localStorage
function updateBestScores() {
    if (score <= 0) {
        updateBestScoresDisplay();
        return;
    }

    // Only add the score if it's high enough to be in the top 3
    // or if we don't have 3 scores yet
    if (bestScores.length < 3 || score > bestScores[bestScores.length - 1]) {
        // Add current score to the list
        bestScores.push(score);

        // Sort scores in descending order and keep only top 3
        bestScores.sort((a, b) => b - a);
        bestScores = bestScores.slice(0, 3);

        // Save to localStorage
        try {
            localStorage.setItem('tetrisBestScores', JSON.stringify(bestScores));
        } catch (error) {
            // Ignore storage failures so game-over flow still completes.
        }
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

function drawOverlay(title, subtitle, titleColor) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = '30px Arial';
    ctx.fillStyle = titleColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = '20px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 60);
}

// Main game update loop
let lastFrameTime = 0;
function update(currentTime = 0) {
    animationFrameId = null;

    if (lastFrameTime === 0) {
        lastFrameTime = currentTime;
    }

    // Calculate delta time for consistent movement across different frame rates
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    if (!paused && !gameOver && lineClearAnimation) {
        updateLineClearAnimation(currentTime);
    }

    if (!paused && !gameOver && !lineClearAnimation) {
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
    }

    draw();

    if (!gameOver && hasStarted && !paused) {
        animationFrameId = requestAnimationFrame(update);
    } else {
        if (gameOver) {
            drawOverlay('GAME OVER', 'Press Start to play again', '#FF4136');
        }
    }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', init);
