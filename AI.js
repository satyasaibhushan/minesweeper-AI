function AI() {
  let unRevealedNeighbours = [];
  this.checkForBombs = (grid, i, j) => {
    // for (let x = 0; x < cols; x++) {
    //     for (let y = 0; y < rows; y++) {
    //         console.log('hi',grid)
    //         if(grid[x][y].isRevealed)
    //         revealedArray.push(grid[x][y])
    //     }
    // }
    if (i && j) {
      unRevealedNeighbours = [];
      for (let x = -1; x < 2; x++) {
        for (let y = -1; y < 2; y++) {
          if (grid[i + x] &&grid[i + x][y + j] && !grid[i + x][y + j].isRevealed) {
            unRevealedNeighbours.push(grid[i + x][y + j]);
          }
        }
      }
      if (grid[i][j].neighbourCount == unRevealedNeighbours.length) {
        unRevealedNeighbours.forEach(ele=>{
            setFlagAt(ele.i,ele.j,false)
            confirmedBombs.push(grid[i][j])
        })
      }
    }
  };
}
