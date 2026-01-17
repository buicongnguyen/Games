# Tetris Game

A classic Tetris game implemented using HTML5 Canvas and vanilla JavaScript.

## How to Play

1. Open `index.html` in your web browser to start the game.
2. Use the keyboard controls to manipulate the falling tetrominoes:
   - **Left Arrow Key**: Move piece left
   - **Right Arrow Key**: Move piece right
   - **Down Arrow Key**: Soft drop (move piece down faster)
   - **Up Arrow Key**: Rotate piece clockwise
   - **Space Bar**: Hard drop (instantly drop the piece to the bottom)
   - **P Key**: Pause/Resume the game

## Game Features

- Classic Tetris gameplay with all 7 tetromino shapes
- Score tracking based on lines cleared
- Level progression that increases game speed
- Next piece preview
- Line clearing mechanics (1, 2, 3, or 4 lines at once)
- Game over detection

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