checkForLinkedBombs = (linksArray, bombCountArray, checkForIndex, unionArray = [], unionArrayIndices = []) => {
  if (!checkForIndex) checkForIndex = 0;
  console.log("checkForIndex,", checkForIndex, unionArray, unionArrayIndices);
  if(!unionArrayIndices){
      union.forEach((ele,i)=>{
        unionArrayIndices[i]=''
      })
  }
  let union = [],
    linkPositions = [];
  let trueArray = [],
    falseArray = [],
    unAssigned = [],
    combinationIndeces = [];
  if (unionArray.length == 0)
    linksArray.forEach((link, i) => {
      union = arrayUnion(union, link, (a, b) => a.i == b.i && a.j == b.j);
    });
  else union = unionArray;

  console.log(linksArray, bombCountArray, checkForIndex);
  union.forEach((ele, i) => {
    let positions = [];
    linksArray.forEach((link, index) => {
      let contains = -1;
      link.forEach((element, j) => {
        if (objectEquality(ele, element)) contains = j;
      });
      positions[index] = contains;
    });
    linkPositions.push(positions);
  });

  if (checkForIndex > linksArray.length - 1 || unionArrayIndices === null) {
    console.log("nulled");
    return null;
  } else if (unionArrayIndices && unionArrayIndices.length > 0) {
    console.log("ifcAse ", checkForIndex);
    unionArrayIndices.forEach((arrayIndex, i) => {
      if (linkPositions[i][checkForIndex] != -1) {
        if (arrayIndex === "") unAssigned.push(union[i]);
        else arrayIndex ? trueArray.push(union[i]) : falseArray.push(union[i]);
      }
      console.log(trueArray, falseArray, unAssigned, checkForIndex);
    });

    if (
      trueArray.length > bombCountArray[unionArrayIndices] ||
      unAssigned.length < bombCountArray[unionArrayIndices] - trueArray.length - falseArray.length
    ){console.log('nulled')
      return null;}
    else if (trueArray.length == bombCountArray[unionArrayIndices]) {
      console.log("falsed");
      unAssigned.forEach(ele => {
        unionArrayIndices[union.findIndex(x => x.i == ele.i && x.j == ele.j)] = false;
      });
      unionArrayIndices = checkForLinkedBombs(linksArray, bombCountArray, checkForIndex + 1, union, unionArrayIndices);
    } else if (unAssigned.length == bombCountArray[unionArrayIndices] - trueArray.length - falseArray.length) {
      console.log("trued");
      unAssigned.forEach(ele => {
        unionArrayIndices[union.findIndex(x => x.i == ele.i && x.j == ele.j)] = true;
      });
      unionArrayIndices = checkForLinkedBombs(linksArray, bombCountArray, checkForIndex + 1, union, unionArrayIndices);
    } else if (unAssigned.length > bombCountArray[unionArrayIndices] - trueArray.length - falseArray.length) {
        console.log('ifCombi')
      unionArrayIndices = goForCombinations(
        linksArray,
        bombCountArray,
        checkForIndex,
        union,
        unionArrayIndices,
        difference(linksArray[checkForIndex], [...trueArray, ...falseArray])
      );
    }
    return unionArrayIndices;
  } else if (unionArrayIndices.length == 0) {
    console.log("else");
    return goForCombinations(
      linksArray,
      bombCountArray,
      checkForIndex,
      union,
      unionArrayIndices,
      linksArray[checkForIndex]
    );
  }
};

let arrayUnion = (arr1, arr2, equalityFunc) => {
  var union = arr1.concat(arr2);
  for (var i = 0; i < union.length; i++) {
    for (var j = i + 1; j < union.length; j++) {
      if (equalityFunc(union[i], union[j])) {
        union.splice(j, 1);
        j--;
      }
    }
  }
  return union;
};

let objectEquality = (obj1, obj2) => obj1.i == obj2.i && obj1.j == obj2.j;

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

let goForCombinations = (linksArray, bombCountArray, checkForIndex, union, unionArrayIndices = [], differenceArray) => {
  if (!checkForIndex) checkForIndex = 0;
  console.log("checkForIndex,", checkForIndex);
  combinationIndeces = [];
  k_combinations(differenceArray, bombCountArray[checkForIndex]).forEach(combination => {
    console.log(combination, differenceArray);
    let indices = [...unionArrayIndices];
    combination.forEach(ele => {
      console.log(union, ele.i, ele.j);
      console.log(
        union,
        union.findIndex(x => x.i == ele.i && x.j == ele.j),
        ele.i,
        ele.j,
        union
      );
      indices[union.findIndex(x => x.i == ele.i && x.j == ele.j)] = true;
    });
    linksArray[checkForIndex].forEach(ele => {
      if (indices[union.findIndex(x => x.i == ele.i && x.j == ele.j)] != true)
        indices[union.findIndex(x => x.i == ele.i && x.j == ele.j)] = false;

      console.log(
        union.findIndex(x => x.i == ele.i && x.j == ele.j),
        ele.i,
        ele.j,
        union
      );
    });
    if (checkForIndex < linksArray.length - 1) {
      console.log("check");
      console.log(indices);
      let result = checkForLinkedBombs(linksArray, bombCountArray, checkForIndex + 1, union, indices);
      console.log("checkForIndex,", checkForIndex);
      console.log(result);
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
        let combination = combinationIndeces[index];
        if (!combination || combination == null || combination[i] != intersection) {
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
  console.log(intersectionIndices);
  return intersectionIndices;
};
