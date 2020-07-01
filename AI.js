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
          indeces[index].isConstraint = true;
          indeces[index].constraintValue = "";
        });
        unrevealedNeighbourIndices.push(indeces);
      });
     console.log (checkForLinkedBombs(unrevealedNeighbourIndices, remainingSurroundingBombCount));
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
            triplet.push(grid[ele.i + x][y + ele.j]);
          }
        }
      }
      triplet.length >= 3 ? links.push(triplet) : "";
    });
    return links;
  };


  let checkForLinkedBombs = (linksArray, bombCountArray) => {
    let possibilities = new Array (linksArray.length),
      combinationCount = 0;
    console.log(1, linksArray, bombCountArray);
    let tempLinksArray = JSON.parse(JSON.stringify(linksArray));
    let tempBombCount = JSON.parse(JSON.stringify(bombCountArray));
    
    if(linksArray == null) {
        console.log('null recieved')
        return null
    }

    else
    for (let i = 0; i < linksArray.length; i++) {  
        let link = linksArray[i];
        console.log([...link].filter(ele => ele.constraintValue||ele.constraintValue==='').length,bombCountArray[i])
        possibilities.push(new Array(link.length))
        if(tempLinksArray==null || linksArray ==null){
            return null
        }
      else if ([...link].filter(ele => ele.constraintValue||ele.constraintValue==='').length <= bombCountArray[i]) {
        console.log("nulled", link,i, [...link].filter(ele => ele.constraintValue||ele.constraintValue==='').length, bombCountArray[i]);
        return null;
      } else if ([...link].filter(ele => ele.constraintValue||ele.constraintValue==='').length == bombCountArray[i] && bombCountArray[i] != 0) {
        console.log("trued");
        link.forEach((ele, j) => {
          tempLinksArray.forEach((temp, x) => {
            temp.forEach(element=>{
            if (temp.indexOf(element) != -1) {
              temp[temp.indexOf(element)].isConstraint = false;
              link[temp.indexOf(element)].constraintValue = true;
              possibilities[x][temp.indexOf(element)] = true;
              tempBombCount[x]--;
            }
          })})
        });
        continue
      } else if (bombCountArray[i] == 0) {
        console.log("falsed");
        link.forEach((ele, j) => {
          tempLinksArray.forEach((temp, x) => {
            temp.forEach(element=>{
            if (temp.indexOf(element) != -1) {
              temp[temp.indexOf(element)].isConstraint = false;
              temp[temp.indexOf(element)].constraintValue = true;
              possibilities[x][temp.indexOf(element)] = false;
            }})
          });
        });
         continue
      } else {
        k_combinations(link, bombCountArray[i]).forEach(combination => {
            console.log("combinations",combination);
          let possibility = [];
          let tempLinksCopy = JSON.parse(JSON.stringify(tempLinksArray))
          let tempBombCopy = JSON.parse(JSON.stringify(tempBombCount))
          tempBombCopy[i] = 0;
          link.forEach((ele, j) => {
            tempLinksCopy.forEach((temp, x) => {
                temp.forEach(element=>{
              if (temp.indexOf(element) != -1) {
                temp[temp.indexOf(element)].isConstraint = false;
                temp[temp.indexOf(element)].constraintValue =
                  combination.indexOf(ele) != -1 ? true : false;
                //   possibility[x][link.indexOf(tempLinksArray[i][j])] = combination.indexOf(ele) != -1 ? true : false;
                combination.indexOf(ele) != -1 ? tempBombCopy[x]-- : "";
              }
            })})
          });
          if(checkForLinkedBombs(tempLinksCopy, bombCountArray)== null) return null
          else
         tempLinksArray = ( checkForLinkedBombs(tempLinksCopy
            
            , bombCountArray))
        //   if (possibility != null)
        //     possibilities = possibilities ? [[...possibilities], [...possibility]] : [...possibility];
        });
      }
    }
    console.log(tempLinksArray);
    // console.log(possibilities);
    return tempLinksArray;
  };


  let k_combinations = (set, k) => {
    var i, j, combs, head, tailcombs;
    if (k > set.length || k <= 0) {
      return [];
    }
    if (k == set.length) {
      return [set];
    }
    if (k == 1) {
      combs = [];
      for (i = 0; i < set.length; i++) {
        combs.push([set[i]]);
      }
      return combs;
    }
    combs = [];
    for (i = 0; i < set.length - k + 1; i++) {
      head = set.slice(i, i + 1);
      tailcombs = k_combinations(set.slice(i + 1), k - 1);
      for (j = 0; j < tailcombs.length; j++) {
        combs.push(head.concat(tailcombs[j]));
      }
    }
    return combs;
  };
  let getAllIndexes = (arr, val) => {
    var indexes = [],
      i = -1;
    while ((i = arr.indexOf(val, i + 1)) != -1) {
      indexes.push(i);
    }
    return indexes;
  };
  let difference = (arr1, arr2) => arr1.filter(x => !arr2.includes(x));
}
