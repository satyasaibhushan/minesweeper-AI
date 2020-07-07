let checkForFinalBombs = (totalList, totalCount, linksArray, bombCountArray) => {
  let union = [],
    remainingPart = [],
    results = [],
    lists = [],
    scores = [];
  linksArray.forEach((link, i) => {
    union = arrayUnion(union, link, (a, b) => a.i == b.i && a.j == b.j);
  });

  remainingPart = totalList.filter(comparer([...union]));
  let [deductions, unionArray, unionIndices, modifiedList] = checkForLinkedBombs(linksArray, bombCountArray);
  lists = modifiedList.concat(remainingPart);
  lists.forEach((ele, i) => {
    scores[i] = 0;
  });
  for (let i = unionIndices.length - 1; i >= 0; i--) {
    const possibility = unionIndices[i];
    let counts = {};
    for (let i = 0; i < possibility.length; i++) {
      let num = possibility[i];
      counts[num] = counts[num] ? counts[num] + 1 : 1;
    }
    if (counts[true] > totalCount) {
      unionIndices.splice(i, 1);
    } else if (counts[true] == totalCount) {
      let remainingPartResult = [].concat(unionIndices[i]);
      remainingPart.forEach(ele => {
        remainingPartResult.push(false);
      });
      results.push(remainingPartResult);
    } else {
      k_combinations(remainingPart, totalCount - counts[true]).forEach(combination => {
        let remainingPartResults = [];
        difference(remainingPart, combination).forEach((ele, i) => {
          remainingPart.forEach((element, j) => {
            if (objectEquality(ele, element)) remainingPartResults[j] = false;
          });
        });
        combination.forEach(ele => {
          remainingPart.forEach((element, i) => {
            if (objectEquality(ele, element)) remainingPartResults[i] = true;
          });
        });
        results.push(unionIndices[i].concat(remainingPartResults));
      });
    }
  }

  return new Promise((res, rej) => res())
    .then(_ => {
      results.forEach(result => {
        result.forEach((ele, i) => {
          if (ele === true) scores[i]++;
        });
      });
    })
    .then(_ => {
      scores.forEach((ele, i) => {
        scores[i] = ele / results.length;
      });
    })
    .then(_ => {
      let deductions = [],
        finalList = [];
      scores.forEach((ele, index) => {
        if (ele == 0) {
          deductions.push(false);
          finalList.push(lists[index]);
        } else if (ele == 1) {
          deductions.push(true);
          finalList.push(lists[index]);
        }
      });
      return [deductions, finalList];
    })
    .then(([deductions, finalList]) => {
      if (finalList.length > 0) {
        console.log('deductions')
       //deductions 
        return [deductions, finalList];
      } else {
        console.log('guessings')
        //guessings 
        deductions = [];
        finalList = [];
         let uncertainities = [],record=0.5,recordEleIndexes=[];

        scores.forEach((ele, index) => (ele < 0.5 ? uncertainities.push(ele) : uncertainities.push(1 - ele)));
        uncertainities.forEach((ele,index)=>{
            if(ele<record){
              record = ele
               recordEleIndexes=[index]
            }
            else if(ele==record){
              recordEleIndexes.push(index)
            }
        })
        recordEleIndexes.forEach(ele=>{
            finalList.push(lists[ele])
            scores[ele]<0.5 ? deductions.push(false):deductions.push(true)
        })
          let randomIndex = floor(random(0,deductions.length-0.000001))
          return [[deductions[randomIndex]],[finalList[randomIndex]]]
      }
    })
};
