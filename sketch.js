let grid, cols, rows, mineCount, revealedCount;
let w = 20;
let Minefactor = 0.1;
let  tileImg,emptyTile,bombImg
let isGameOver =false;
let font

function preload(){
  tileImg = loadImage('../src/tile.png')
  emptyTile = loadImage('../src/tile1.png')
  bombImg = loadImage('../src/bomb.png')
  font = loadFont('../src/font.ttf')
}
function setup() {
  createCanvas(401, 401);
  frameRate(5)
  cols = floor(width / w);
  rows = floor(height / w);
  grid = new Array(cols);
  revealedCount = 0;
  for (let i = 0; i < grid.length; i++) {
    grid[i] = new Array(rows);
  }

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j] = new Cell(i, j, w);
    }
  }

  for (mineCount = 0; mineCount < Math.floor(rows * cols * Minefactor); ) {
    let i = floor(random(cols));
    let j = floor(random(rows));

    if (!grid[i][j].isMine) {
      grid[i][j].isMine = true;
      mineCount++;
      for (let x = i - 1; x <= i + 1; x++) {
        for (let y = j - 1; y <= j + 1; y++) {
          if (grid[x] && grid[x][y]) {
            grid[x][y].neighbourCount++;
          }
        }
      }
    }
  }
}

function gameOver() {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j].isMine ? grid[i][j].isRevealed = true:''
      isGameOver = true
    }
  }
}
function mousePressed(e) {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (grid[i][j].contains(mouseX, mouseY) && !isGameOver) {
        if (e.metaKey) {
             console.log('hi')
        } else {
          grid[i][j].isRevealed ? " " : grid[i][j].reveal();
          if (grid[i][j].isMine) {
            grid[i][j].isMineActive = true
            gameOver();
          }
        }
      }
    }
  }
}

function draw() {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j].show();
    }
  }
  if(mouseIsPressed){

  }
}
