function AI() {
  let unRevealedNeighbours = [];
  this.checkForRule1 = (grid, i, j) => {
    if ((i || i == 0) && (j || j == 0)) {
      unRevealedNeighbours = [];
      for (let x = -1; x < 2; x++) {
        for (let y = -1; y < 2; y++) {
          if (grid[i + x] && grid[i + x][y + j] && !grid[i + x][y + j].isRevealed) {
            unRevealedNeighbours.push(grid[i + x][y + j]);
          }
        }
      }
      if (grid[i][j].neighbourCount == unRevealedNeighbours.length) {
        unRevealedNeighbours.forEach(ele => {
          //   for (let x = -1; x < 2; x++) {
          //     for (let y = -1; y < 2; y++) {
          //       if (
          //         grid[ele.i + x] &&
          //         grid[ele.i + x][ele.j + y] &&
          //         grid[ele.i + x][ele.j + y].isRevealed
          //       ) {
          //           console.log(grid[ele.i + x][ele.j + y],grid[ele.i + x][ele.j + y].neighbourCount,grid[ele.i + x][ele.j + y].surroundingFlags())
          //         if (grid[ele.i + x][ele.j + y].neighbourCount == grid[ele.i + x][ele.j + y].surroundingFlags()) {
          //           grid[ele.i + x][ele.j + y].isQueued = false;
          //           console.log(uncheckedCellQueue.indexOf(grid[ele.i + x][ele.j + y]));
          //           uncheckedCellQueue.splice(uncheckedCellQueue.indexOf(grid[ele.i + x][ele.j + y]), 1);
          //         }
          //       }
          //     }
          //   }
          //   uncheckedCellQueue.indexOf(grid[i][j]) != -1
          //     ? uncheckedCellQueue.splice(uncheckedCellQueue.indexOf(grid[i][j]), 1)
          //     : "";
          setFlagAt(ele.i, ele.j, false);
          confirmedBombs.push(grid[i][j]);
        });
      }
    }
  };
  this.checkForRule2 = (grid, i, j) => {
    if ((i || i == 0) && (j || j == 0)) {
      if (grid[i][j].neighbourCount == grid[i][j].surroundingFlags()) {
        for (let x = -1; x < 2; x++) {
          for (let y = -1; y < 2; y++) {
            if (grid[i + x] && grid[i + x][y + j] && !grid[i + x][y + j].isRevealed && !grid[i + x][y + j].isFlagged) {
              grid[i + x][y + j].isRevealed = true;
              uncheckedCellQueue.push(grid[i + x][y + j]);
            }
          }
        }
        uncheckedCellQueue.indexOf(grid[i][j]) != -1
          ? uncheckedCellQueue.splice(uncheckedCellQueue.indexOf(grid[i][j]), 1)
          : "";
      }
    }
  };
}
