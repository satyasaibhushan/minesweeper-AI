let grid,
  cols,
  rows,
  mineCount,
  remainingFlags = 0;
let w = 30;
let Minefactor = 0.1;
let tileImg, emptyTile, bombImg, flagImg;
let isGameOver = false;
let font;
let flagDiv;
let revealedArray = [],
  confirmedBombs = [],
  uncheckedCellQueue = [];

function preload() {
  tileImg = loadImage("../src/tile.png");
  emptyTile = loadImage("../src/tile1.png");
  bombImg = loadImage("../src/bomb.png");
  flagImg = loadImage("../src/flag.png");
  font = loadFont("../src/font.ttf");
}
function setup() {
  fill(200);
  topBar = createDiv("");
  flagDiv = createDiv("No of flags left : " + remainingFlags);
  topBar.elt.className = "topBar";
  flagDiv.elt.className = "topBarText";
  topBar.elt.append(flagDiv.elt);

  createCanvas(601, 601);
  let activateAI = createButton("Activate Ai");
  activateAI.mousePressed(_ => {
    let ai = new AI();
    uncheckedCellQueue.forEach(ele=>{
      ai.checkForBombs(grid,ele.i,ele.j);
    })
  });
  col = color(127, 0.5);
  activateAI.style("background-color", col);
  activateAI.style("outline-width", 0);
  activateAI.elt.className = "activateButton";
  frameRate(5);
  cols = floor(width / w);
  rows = floor(height / w);
  grid = new Array(cols);
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
  remainingFlags = floor(rows * cols * Minefactor);
  flagDiv.elt.innerHTML = "No of flags left : " + remainingFlags;
}

function gameOver() {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j].isFlagged ? (grid[i][j].isFlagged = false) : "";
      grid[i][j].isMine ? (grid[i][j].isRevealed = true) : "";
      isGameOver = true;
    }
  }
}
function mousePressed(e) {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (grid[i][j].contains(mouseX, mouseY) && !isGameOver) {
        if (e.metaKey && remainingFlags > 0 && !grid[i][j].isRevealed) {
          setFlagAt(i, j);
        } else if (!grid[i][j].isFlagged && !(remainingFlags == 0 && e.metaKey)) {
          if (!grid[i][j].isRevealed) {
            grid[i][j].reveal();
          }

          if (grid[i][j].isMine) {
            grid[i][j].isMineActive = true;
            gameOver();
          }
        }
      }
    }
  }
}
function setFlagAt(i, j,unflag = true) {
  if(unflag){
    grid[i][j].isFlagged = grid[i][j].isFlagged  ? false : true;
    grid[i][j].isFlagged ? remainingFlags-- : remainingFlags++;
  }
  else{
    grid[i][j].isFlagged ? '': remainingFlags--
    grid[i][j].isFlagged = true;

  }
  flagDiv.elt.innerHTML = "No of flags left : " + remainingFlags;
}

function draw() {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j].show();
    }
  }
  if (mouseIsPressed) {
  }
}
