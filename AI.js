function AI() {
  this.checkForRule1 = (grid, i, j) => {
    if ((i || i == 0) && (j || j == 0)) {
      let unRevealedNeighbours = calculateUnrevealedNeighbours(grid, i, j);
      if (grid[i][j].neighbourCount == unRevealedNeighbours.length) {
        // uncheckedCellQueue.indexOf(grid[i][j]) != -1
        // ? uncheckedCellQueue.splice(uncheckedCellQueue.indexOf(grid[i][j]), 1)
        // : "";
        unRevealedNeighbours.forEach(ele => {
          setFlagAt(ele.i, ele.j, false);
          confirmedBombs.push(grid[i][j]);
        });
      }
    }
  };
  this.checkForRule2 = (grid, i, j) => {
    if ((i || i == 0) && (j || j == 0)) {
      if (grid[i][j].neighbourCount == grid[i][j].surroundingFlags()) {
        if (uncheckedCellQueue.indexOf(grid[i][j]) != -1) {
          uncheckedCellQueue.splice(uncheckedCellQueue.indexOf(grid[i][j]), 1);
          grid[i][j].isQueued = false;
        }
        for (let x = -1; x < 2; x++) {
          for (let y = -1; y < 2; y++) {
            if (grid[i + x] && grid[i + x][y + j] && !grid[i + x][y + j].isRevealed && !grid[i + x][y + j].isFlagged) {
              grid[i + x][y + j].isRevealed = true;
              uncheckedCellQueue.push(grid[i + x][y + j]);
              grid[i + x][y + j].isQueued = true;
            }
          }
        }
      }
    }
  };
  this.checkForRule3 = (grid, queue) => {
    let tripletLinks = getLinks(queue);
    tripletLinks.forEach(triplet => {
      let unrevealedNeighbours = [],
        unrevealedNeighbourIndices = [];
      remainingSurroundingBombCount = [];
      triplet.forEach(ele => {
        unrevealedNeighbours.push(calculateUnrevealedNeighbours(grid, ele.i, ele.j).filter(ele => !ele.isFlagged));
        remainingSurroundingBombCount.push(ele.neighbourCount - ele.surroundingFlags());
      });
      unrevealedNeighbours.forEach(array => {
        let indeces = [];
        array.forEach((ele, index) => {
          indeces[index] = {};
          indeces[index].i = ele.i;
          indeces[index].j = ele.j;
        //   indeces[index].isConstraint = true;
        //   indeces[index].constraintValue = "";
        });
        unrevealedNeighbourIndices.push(indeces);
      });
      console.log(checkForLinkedBombs(unrevealedNeighbourIndices, remainingSurroundingBombCount));
    });
  };
  let calculateUnrevealedNeighbours = (grid, i, j) => {
    let neighbours = [];
    for (let x = -1; x < 2; x++) {
      for (let y = -1; y < 2; y++) {
        if (grid[i + x] && grid[i + x][y + j] && !grid[i + x][y + j].isRevealed) {
          neighbours.push(grid[i + x][y + j]);
        }
      }
    }
    return neighbours;
  };
  let isSubsetOf = (set, subset) => {
    return Array.from(new Set([...set, ...subset])).length === set.length;
  };

  let getLinks = array => {
    let links = [];
    array.forEach(ele => {
      let triplet = [];
      for (let x = -1; x < 2; x++) {
        for (let y = -1; y < 2; y++) {
          if (
            grid[ele.i + x] &&
            grid[ele.i + x][y + ele.j] &&
            grid[ele.i + x][y + ele.j].isRevealed &&
            grid[ele.i + x][ele.j + y].isQueued
          ) {
            triplet.push(grid[ele.i + x][y + ele.j]);
          }
        }
      }
      triplet.length >= 3 ? links.push(triplet) : "";
    });
    return links;
  };

  
}
