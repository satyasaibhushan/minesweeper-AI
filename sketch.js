let grid,
  cols,
  rows,
  mineCount,
  remainingFlags = 0;
let w = 30;
let Minefactor = 0.18;
let noOfBombs = 0;
let tileImg, emptyTile, bombImg, flagImg;
let isGameOver = false;
let font;
let flagDiv;
let revealedArray = [],
  confirmedBombs = [],
  uncheckedCellQueue = [];
let AIsolvedCount = [0];

let trackMouse = false;

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
  let ai = new AI();
  activateAI.mousePressed(_ => {
    if (!isGameOver)
      new Promise((res, rej) => res())
        .then(_ => {
          console.log("rule1,2");
          for (let index = uncheckedCellQueue.length - 1; index >= 0; index--) {
            ai.checkForRule1(grid, uncheckedCellQueue[index].i, uncheckedCellQueue[index].j);
          }
          for (let index = uncheckedCellQueue.length - 1; index >= 0; index--) {
            ai.checkForRule2(grid, uncheckedCellQueue[index].i, uncheckedCellQueue[index].j);
          }
        })
        .then(_ => {
          console.log("rule3");
          ai.checkForRule3(grid, uncheckedCellQueue);
        })
        .then(_ => {
          console.log(AIsolvedCount[1], AIsolvedCount[0]);
          if (AIsolvedCount[1] == AIsolvedCount[0]) {
            let unrevealedElements = [].concat(...grid);
            unrevealedElements = unrevealedElements
              .filter(comparer([...revealedArray]))
              .filter(comparer([...confirmedBombs]));
            if (
              unrevealedElements.length > sqrt(rows * cols) &&
              confirmedBombs.length < noOfBombs - sqrt(noOfBombs * 2)
            ) {
              console.log("random");
              ai.heuristic1(grid, unrevealedElements);
            } else {
              console.log("final");
              ai.checkForRule4(grid, unrevealedElements, uncheckedCellQueue);
            }
          }
          AIsolvedCount[1] = AIsolvedCount[0];
        });
    // .then(_=>{
    //   if(AIsolvedCount[1]==AIsolvedCount[0]){
    //     console.log('hiw')
    //   }

    // })
  });
  col = color(127, 0.5);
  activateAI.style("background-color", col);
  activateAI.style("outline-width", 0);
  activateAI.elt.className = "activateButton";

  checkbox = createCheckbox("label", false);
  checkbox.changed(showIndex);
  mouseIndexes = createSpan("Mouse Indexes");

  frameRate(5);
  cols = floor(width / w);
  rows = floor(height / w);
  noOfBombs = Minefactor * rows * cols;
  grid = new Array(cols);
  for (let i = 0; i < grid.length; i++) {
    grid[i] = new Array(rows);
  }

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j] = new Cell(i, j, w);
    }
  }

  for (mineCount = 0; mineCount < Math.floor(noOfBombs); ) {
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
  remainingFlags = floor(noOfBombs);
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
        if (e.metaKey && remainingFlags >= 0 && !grid[i][j].isRevealed) {
          setFlagAt(i, j);
        } else if (!grid[i][j].isFlagged && !(remainingFlags == 0 && e.metaKey)) {
          if (!grid[i][j].isRevealed) {
            grid[i][j].reveal();
          }
        }
      }
    }
  }
}
function setFlagAt(i, j, unflag = true) {
  if (unflag) {
    if (grid[i][j].isFlagged) {
      grid[i][j].isFlagged = false;
      remainingFlags++;
      confirmedBombs = confirmedBombs.filter(comparer([grid[i][j]]));
    } else {
      grid[i][j].isFlagged = true;
      remainingFlags--;
      confirmedBombs.push(grid[i][j]);
    }
  } else {
    if (!grid[i][j].isFlagged) {
      remainingFlags--;
      confirmedBombs.push(grid[i][j]);
    }
    grid[i][j].isFlagged ? "" : (grid[i][j].isFlagged = true);
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
  if (trackMouse) {
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        if (grid[i][j].contains(mouseX, mouseY)) {
          mouseIndexes.elt.innerHTML = "(" + i + " , " + j + ")";
        }
      }
    }
  }
}

function showIndex() {
  if (this.checked()) {
    trackMouse = true;
  } else {
    trackMouse = false;
    mouseIndexes.elt.innerHTML = "";
  }
}
