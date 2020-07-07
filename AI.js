function AI() {
    //rule 1 => if no.of un-revealed spaces is equal to the no.of bombs count then set all surroundings to flags
  //rule 2 => if no.of neigbouring flags  == bomb-count, then reveal all other spaces
  //rule 3 => solve the constrained links for bombs using combinations
  //rule 4 => deduce by no.of flags remaining .i.e,you arrange the flags in the spaces and calculate the probability
  //heuristic 1=> selecting a random spot
  
  this.beginSolving =()=>{
    if (!isGameOver)
      new Promise((res, rej) => res())
        .then(_ => {
          if(AIsolvedCount[0]!=0 || revealedArray.length>0){
          console.log("rule1,2,3");
          for (let index = uncheckedCellQueue.length - 1; index >= 0; index--) {
            this.checkForRule1(grid, uncheckedCellQueue[index].i, uncheckedCellQueue[index].j);
          }
          for (let index = uncheckedCellQueue.length - 1; index >= 0; index--) {
            this.checkForRule2(grid, uncheckedCellQueue[index].i, uncheckedCellQueue[index].j);
          }}
        })
        .then(_ => {
          if(AIsolvedCount[0]!=0) this.checkForRule3(grid, uncheckedCellQueue);
        })
        .then(_ => {
          // console.log(AIsolvedCount[1], AIsolvedCount[0]);
          //if  none of the 1st,2nd,3rd rules are not working then
          if (AIsolvedCount[1] == AIsolvedCount[0] || AIsolvedCount[0]==0) {
            let unrevealedElements = [].concat(...grid);
            unrevealedElements = unrevealedElements
              .filter(comparer([...revealedArray]))
              .filter(comparer([...confirmedBombs]));
            if (
              unrevealedElements.length > sqrt(rows * cols) &&
              confirmedBombs.length < noOfBombs - sqrt(noOfBombs * 2)
            ) {
              console.log("random");
              this.heuristic1(grid, unrevealedElements);
            } else {
              console.log("final");
              this.checkForRule4(grid, unrevealedElements, uncheckedCellQueue);
            }
          }
          AIsolvedCount[1] = AIsolvedCount[0];
        }).then(_=>{
          if(!isGameOver)
          setTimeout(() => {
            this.beginSolving()
          }, 500);
        })
  }

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
              grid[i + x][y + j].reveal();
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
        remainingSurroundingBombCount = [];
      triplet.forEach(ele => {
        unrevealedNeighbours.push(calculateUnrevealedNeighbours(grid, ele.i, ele.j).filter(ele => !ele.isFlagged));
        remainingSurroundingBombCount.push(ele.neighbourCount - ele.surroundingFlags());
      });
      let result = checkForLinkedBombs(unrevealedNeighbours, remainingSurroundingBombCount);
      // console.log(unrevealedNeighbourIndices,remainingSurroundingBombCount,tripletLinks,result)
      if (result != undefined) {
        let [values, elements] = result;
        elements.forEach((ele, i) => {
          if (values[i] === true) {
            AIsolvedCount[0]++;
            setFlagAt(ele.i, ele.j, false);
          } else if (values[i] === false) {
            AIsolvedCount[0]++;
            grid[ele.i][ele.j].reveal();
          }
        });
      }
    });
  };

  this.heuristic1 = (grid, list, index = 0) => {
    if (index > w / 2) {
      console.log("Many Attempts of random selection");
      return;
    }
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
      element.reveal();
      AIsolvedCount[0]++;
    } else {
      this.heuristic1(grid, list, index);
    }
  };

  this.checkForRule4 = (grid, list, queue) => {
    let links = [],
      bombCount = [],
      tempBombCount = [];
    let unSolvedBombs = noOfBombs - confirmedBombs.length;
    queue.forEach(ele => {
      let link = calculateUnrevealedNeighbours(grid, ele.i, ele.j).filter(ele => !ele.isFlagged);
      links.push(link);
      tempBombCount.push(ele.neighbourCount - ele.surroundingFlags());
    });
    const uniqueArray = links.filter((thing, index) => {
      const _thing = JSON.stringify(thing);
      return (
        index ===
        links.findIndex((obj, i) => {
          if (JSON.stringify(obj) === _thing) {
            if (index == i) bombCount.push(tempBombCount[i]);
            return true;
          }
        })
      );
    });
    if (noOfBombs - confirmedBombs.length == 0) {
      isGameOver = true;
    } else {
      let result = checkForFinalBombs(list, unSolvedBombs, uniqueArray, bombCount);
      if (!result) return;
      else {
        result.then(res => {
          [deductions, elements] = res;
          elements.forEach((ele, i) => {
            if (deductions[i] === true) {
              setFlagAt(ele.i, ele.j, false);
            } else if (deductions[i] === false) {
              grid[ele.i][ele.j].reveal();
            }
          });
        });
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
      for (let x = -2; x < 3; x++) {
        for (let y = -2; y < 3; y++) {
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
