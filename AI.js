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
        remainingSurroundingBombCount = [];
      triplet.forEach(ele => {
        unrevealedNeighbours.push(calculateUnrevealedNeighbours(grid, ele.i, ele.j).filter(ele => !ele.isFlagged));
        remainingSurroundingBombCount.push(ele.neighbourCount - ele.surroundingFlags());
      });
      console.log(unrevealedNeighbours, remainingSurroundingBombCount);
      checkForLinkedBombs(unrevealedNeighbours, remainingSurroundingBombCount);
    });
    // let iSameChuncks = [],
    //   jSameChuncks = [];
    // let k = 0;
    // let iOrder = [...queue].sort((a, b) => {
    //   if (a.i != b.i) return a.i - b.i;
    //   else return a.j - b.j;
    // });
    // let jOrder = [...queue].sort((a, b) => {
    //   if (a.j != b.j) return a.j - b.j;
    //   else return a.i - b.i;
    // });
    // iOrder.forEach((ele, x) => {
    //   iOrder[x - 1] &&
    //   iOrder[x] &&
    //   iOrder[x + 1] &&
    //   iOrder[x - 1].i == iOrder[x].i &&
    //   iOrder[x].i == iOrder[x + 1].i &&
    //   iOrder[x - 1].j + 1 == iOrder[x].j &&
    //   iOrder[x].j + 1 == iOrder[x + 1].j
    //     ? iSameChuncks.push([iOrder[x - 1], iOrder[x], iOrder[x + 1]])
    //     : "";
    // });
    // jOrder.forEach((ele, y) => {
    //   jOrder[y - 1] &&
    //   jOrder[y] &&
    //   jOrder[y + 1] &&
    //   jOrder[y - 1].j == jOrder[y].j &&
    //   jOrder[y].j == jOrder[y + 1].j &&
    //   jOrder[y - 1].i + 1 == jOrder[y].i &&
    //   jOrder[y].i + 1 == jOrder[y + 1].i
    //     ? jSameChuncks.push([jOrder[y - 1], jOrder[y], jOrder[y + 1]])
    //     : "";
    // });
    // console.log(queue, iOrder, jOrder, iSameChuncks, jSameChuncks);
    // while (k == 0 && iSameChuncks.length > 0) {
    //   let unrevealedNeighbours = [],
    //     remainingSurroundingBombCount = [],
    //     unrevealedNeighboursj = [];
    //   iSameChuncks[0].forEach(ele => {
    //     unrevealedNeighbours.push(calculateUnrevealedNeighbours(grid, ele.i, ele.j).filter(ele => !ele.isFlagged));
    //     unrevealedNeighboursj = unrevealedNeighbours.map(ele => ele.j);
    //     remainingSurroundingBombCount.push(ele.neighbourCount - ele.surroundingFlags());
    //   });
    //   console.log(unrevealedNeighbours, remainingSurroundingBombCount);

    //   k = 1;
    // }
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
  let calcDifference = (arr1, arr2) => {
    let difference = arr1.filter(x => !arr2.includes(x));
    return difference;
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
            console.log(grid[ele.i + x][y + ele.j]);
            triplet.push(grid[ele.i + x][y + ele.j]);
          }
        }
      }
      triplet.length >= 3 ? links.push(triplet) : "";
    });
    return links;
  };
  let checkForLinkedBombs = (linksArray, bombCountArray) => {
    let confirmedLinks = [],
      possibilitiesFor1sttrue = [],
      possibilitiesFor1stfalse = [],
      possibilities;
    let union = [];
    let linkPositions = [];
    linksArray.forEach((link, i) => {
      union = [...new Set([...union, ...linksArray[i]])];
    });
    union.forEach((ele, i) => {
      linksArray.forEach((link, index) => {
        positions[index] = link.indexOf(ele);
      });
    });

    console.log(union, linkPositions);
  };
}
