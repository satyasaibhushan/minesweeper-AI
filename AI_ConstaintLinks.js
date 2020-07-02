checkForLinkedBombs = (linksArray, bombCountArray, checkForIndex = 0, unionArrayIndices = []) => {
  let union = [],
    linkPositions = [];
  let unAssigned = [];
  let trueArray = [],
    falseArray = [],
    combinationIndeces = [];
  tempLinks = [];
  linksArray.forEach((link, i) => {
    union = [...new Set([...union, ...linksArray[i]])];
  });
  union.forEach((ele, i) => {
    let positions = [];
    linksArray.forEach((link, index) => {
      positions[index] = link.indexOf(ele);
    });
    linkPositions.push(positions);
  });

  if (checkForIndex > linksArray.length - 1) return null;

  if (unionArrayIndices && unionArrayIndices.length > 0) {
      console.log('ifCase',unionArrayIndices,checkForIndex)
    unionArrayIndices.forEach((arrayIndex, i) => {
      if (linkPositions[i][checkForIndex] != -1) {
        if (arrayIndex === "") unAssigned.push(union[i]);
        else arrayIndex ? trueArray.push(union[i]) : falseArray.push(union[i]);
      }
    });
    if (
      trueArray.length > bombCountArray[unionArrayIndices] ||
      unAssigned.length < bombCountArray[unionArrayIndices] - trueArray.length - falseArray.length
    )
      return null;
    else if (trueArray.length == bombCountArray[unionArrayIndices]) {
        console.log('falsed',unionArrayIndices,checkForIndex)
      unAssigned.forEach(ele => {
        unionArrayIndices[union.indexOf(ele)] = false;
      });
      unionArrayIndices = checkForLinkedBombs(linksArray, bombCountArray, checkForIndex++, unionArrayIndices);
    } else if (unAssigned.length == bombCountArray[unionArrayIndices] - trueArray.length - falseArray.length) {
        console.log('trued',unionArrayIndices,checkForIndex)
        unAssigned.forEach(ele => {
        unionArrayIndices[union.indexOf(ele)] = true;
      });
      unionArrayIndices = checkForLinkedBombs(linksArray, bombCountArray, checkForIndex++, unionArrayIndices);
    } else if (unAssigned.length > bombCountArray[unionArrayIndices] - trueArray.length - falseArray.length) {
        console.log('ifCaseCombined',unionArrayIndices,checkForIndex)
      combinationIndeces = [];
      k_combinations(
        difference(linksArray[checkForIndex], [...trueArray, ...falseArray]),
        bombCountArray[checkForIndex]
      ).forEach(combination => {
        let indices = [...unionArrayIndices];
        combination.forEach(ele => {
          indices[union.indexOf(ele)] = true;
        });
        linksArray[checkForIndex].forEach(ele => {
          if (indices[union.indexOf(ele)] != true) indices[union.indexOf(ele)] = false;
        });
        if (checkForIndex < linksArray.length - 1) {
          let result = checkForLinkedBombs(linksArray, bombCountArray, checkForIndex++, indices);
          if (result != null) {
            combinationIndeces.push(result);
          }
        } else return null;
      });
      if (combinationIndeces.length > 1) {
        let intersectionIndices = [];
        for (let i = 0; i < union.length; i++) {
          let intersection;
          for (let index = 0; index < combinationIndeces.length; index++) {
            if (combination == null || combination[i] != intersection) {
              intersection = "";
              return;
            } else if (intersection && combination[i] == intersection) {
              continue;
            } else if (!intersection) {
              intersection = combination[i];
            }
          }
          intersectionIndices.push(intersection);
        }
      } else intersectionIndices = combinationIndeces;
      unionArrayIndices = intersectionIndices;
      console.log(intersectionIndices)
    }
    console.log(unionArrayIndices)
    return unionArrayIndices;
  } else if (unionArrayIndices.length == 0) {
    console.log('elseCase',unionArrayIndices,checkForIndex)
    combinationIndeces = [];
    k_combinations(linksArray[checkForIndex], bombCountArray[checkForIndex]).forEach(combination => {
      let indices = [];
      combination.forEach(ele => {
        indices[union.indexOf(ele)] = true;
      });
      console.log(linksArray, checkForIndex);
      linksArray[checkForIndex].forEach(ele => {
        if (indices[union.indexOf(ele)] != true) indices[union.indexOf(ele)] = false;
      });
      if (checkForIndex < linksArray.length - 1) {
        let result = checkForLinkedBombs(linksArray, bombCountArray, checkForIndex++, indices);
        if (result != null) {
          combinationIndeces.push(result);
        }
      } else return null;
      if (combinationIndeces.length > 1) {
        let intersectionIndices = [];
        for (let i = 0; i < union.length; i++) {
          let intersection;
          for (let index = 0; index < combinationIndeces.length; index++) {
            if (combination == null || combination[i] != intersection) {
              intersection = "";
              return;
            } else if (intersection && combination[i] == intersection) {
              continue;
            } else if (!intersection) {
              intersection = combination[i];
            }
          }
          intersectionIndices.push(intersection);
        }
      } else intersectionIndices = combinationIndeces;
      return intersectionIndices;
    });
  } else if (!unionArrayIndices) return null;
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
