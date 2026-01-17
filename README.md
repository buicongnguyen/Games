# Games
Contains games.

# Tetris Game

A classic Tetris game implemented using HTML5 Canvas and vanilla JavaScript with enhanced visuals and gameplay.

## How to Play

1. Open `index.html` in your web browser to load the game.
2. Click the **"Start Game"** button to begin playing.
3. Use the keyboard controls to manipulate the falling tetrominoes:
   - **Left Arrow Key**: Move piece left
   - **Right Arrow Key**: Move piece right
   - **Down Arrow Key**: Soft drop (move piece down faster)
   - **Up Arrow Key**: Rotate piece clockwise
   - **Space Bar**: Hard drop (instantly drop the piece to the bottom)
   - **P Key**: Pause/Resume the game
4. Click the **"Pause Game"** / **"Start Game"** button to pause/resume gameplay.

## Game Features

- Classic Tetris gameplay with all 7 tetromino shapes in vibrant colors
- Score tracking based on lines cleared
- Level progression that increases game speed
- Next piece preview
- Line clearing mechanics (1, 2, 3, or 4 lines at once)
- Game over detection with restart option
- Modern, sleek UI with gradient backgrounds and glass-morphism effects
- Responsive design that works on different screen sizes

## Scoring System

- 1 line: 40 points × current level
- 2 lines: 100 points × current level
- 3 lines: 300 points × current level
- 4 lines (Tetris): 1200 points × current level

Every 10 lines cleared increases the level by 1, making the game progressively faster.

## Files Included

- `index.html`: Main HTML structure
- `style.css`: Styling for the game interface
- `script.js`: Game logic implementation
- `README.md`: This file

Enjoy the game!
