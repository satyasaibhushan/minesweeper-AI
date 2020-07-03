let checkForLinkedBombs = (linksArray, bombCountArray) => {
  let union = [],
    linkPositions = [],
    trueArray = [],
    falseArray = [],
    unionArrayIndices = [[]];
  unAssigned = [];

  linksArray.forEach((link, i) => {
    union = arrayUnion(union, link, (a, b) => a.i == b.i && a.j == b.j);
  });
  union.forEach((ele, i) => {
    let positions = [];
    unionArrayIndices[0][i] = "";
    linksArray.forEach((link, index) => {
      let contains = -1;
      link.forEach((element, j) => {
        if (objectEquality(ele, element)) contains = j;
      });
      positions[index] = contains;
    });
    linkPositions.push(positions);
  });

  for (let index = 0; index < linksArray.length; index++) {
    for (let possibilityIndex = unionArrayIndices.length-1; possibilityIndex >=0; possibilityIndex--) {
      let possibility = unionArrayIndices[possibilityIndex];
      trueArray = [];
      falseArray = [];
      possibility.forEach((ele, i) => {
        linksArray[index].forEach(link => {
          if (objectEquality(link, union[i])) {
            if (ele === true) trueArray.push(union[i]);
            else if (ele === false) falseArray.push(union[i]);
          }
        });
      });
      let results = constraintCombinations(linksArray[index], bombCountArray[index], trueArray, falseArray);
      if (results == null || results.length == 0) {
        unionArrayIndices.splice(possibilityIndex, 1);
      } else {
        results.forEach(result => {
          indices = [...unionArrayIndices[possibilityIndex]];
          difference(linksArray[index], result).forEach((ele, i) => {
            union.forEach((element, j) => {
              if (objectEquality(ele, element)) indices[j] = false;
            });
          });
          result.forEach(ele => {
            union.forEach((element, i) => {
              if (objectEquality(ele, element)) indices[i] = true;
            });
          });
          if (unionArrayIndices.length == 1 && unionArrayIndices[0][0] == "") {
            unionArrayIndices.splice(0, 1);
          } else if (results.length == 1) unionArrayIndices[possibilityIndex] = indices;
          if (results.length != 1) unionArrayIndices.push(indices);
        });
    }
    if(results.length>1&& index!=0){
        unionArrayIndices.splice(possibilityIndex,1)
      }
    }
  }
  console.log(unionArrayIndices);
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
let comparer = otherArray => {
  return function (current) {
    return (
      otherArray.filter(function (other) {
        return other.i == current.i && other.j == current.j;
      }).length == 0
    );
  };
};

let checkForConstraint = (indecesArray, numberOfTrues) => {
  let number = 0;
  indecesArray.forEach(ele => {
    if (ele == true) number++;
  });
  return number == numberOfTrues;
};

let constraintCombinations = (set, k, include, dontInclude) => {
  include = include.filter(x => {
    set.forEach(ele => {
      if (ele == x) return false;
    });
    return true;
  });
  dontInclude = dontInclude.filter(x => {
    set.forEach(ele => {
      if (ele == x) return false;
    });
    return true;
  });
  let iterables = set.filter(comparer([...include])).filter(comparer([...dontInclude]));
  let combinations = k_combinations(iterables, k - include.length);
  if (k == include.length) {
    combinations = [include];
  } else if (k < include.length || iterables.length == 0) return null;
  else {
    combinations.forEach((ele, i) => {
      combinations[i] = [...ele, ...include];
    });
  }
  return combinations;
};
