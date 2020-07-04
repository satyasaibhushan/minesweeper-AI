function AI() {
  this.checkForRule1 = (grid, i, j) => {
    if ((i || i == 0) && (j || j == 0)) {
      let unRevealedNeighbours = calculateUnrevealedNeighbours(grid, i, j);
      if (grid[i][j].neighbourCount == unRevealedNeighbours.length) {
        unRevealedNeighbours.forEach(ele => {
          setFlagAt(ele.i, ele.j, false);
          AIsolvedCount[0]++;
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
              grid[i + x][y + j].reveal()
              AIsolvedCount[0]++;
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
        });
        unrevealedNeighbourIndices.push(indeces);
      });
      let result = checkForLinkedBombs(unrevealedNeighbourIndices, remainingSurroundingBombCount);
      if (result != undefined) {
        let [values, elements] = result;
        elements.forEach((ele, i) => {
          AIsolvedCount[0]++;
          if (values[i] === true) {
            setFlagAt(ele.i, ele.j, false);
          } else if (values[i] === false) {
            grid[ele.i][ele.j].reveal()
          }
        });
      }
    });
  };

  this.selectRandomElements = (grid, list, index = 0) => {
    if (index > w / 2) {
      console.log("Many Attempts of random selection");
      return;
    }
    if (list.length > w && confirmedBombs.length < Minefactor * w*w/2) {
      let element = list[floor(random(list.length - 1))];
      let revealedNeighbours = 0;

      for (let x = -1; x < 2; x++) {
        for (let y = -1; y < 2; y++) {
          if (
            grid[element.i + x] &&
            grid[element.i + x][y + element.j] &&
            grid[element.i + x][y + element.j].isRevealed
          ) {
            revealedNeighbours++;
          }
        }
      }
      if (revealedNeighbours == 0) {
        element.reveal()
        AIsolvedCount[0]++;
      } else {
        this.selectRandomElements(grid, list, index);
      }
    }
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
      triplet.length >= 2 ? links.push(triplet) : "";
    });
    return links;
  };
}
