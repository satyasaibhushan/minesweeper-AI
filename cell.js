function Cell(i, j, w) {
  this.i = i;
  this.j = j;
  this.w = w;
  this.x = i * w;
  this.y = j * w;

  this.isMine = false;
  this.isRevealed = false;

  this.neighbourCount = 0;

  this.show = () => {
    stroke(0);
    noFill();
    rect(this.x, this.y, this.w, this.w);
    if (this.isRevealed) {
      if (this.isMine) {
        fill(127);
        ellipse(this.x + this.w * 0.5, this.y + this.w * 0.5, this.w * 0.5);
      } else {
        fill(200);
        rect(this.x, this.y, this.w, this.w);
        if (this.neighbourCount > 0) {
          textAlign(CENTER);
          fill(0);
          text(this.neighbourCount, this.x + this.w * 0.5, this.y + this.w - 6);
        }
      }
    }
  };

  this.contains = (x, y) => x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.w;

  this.reveal =() =>{
    this.isRevealed = true;
    revealedCount++
    setTimeout(() => {
        if(revealedCount+mineCount == rows*cols) alert('Congratulations You Won')
    }, 10);
     if (this.neighbourCount == 0) {
      // flood fill time
      this.floodFill();
    }
  }
  this.floodFill = ()=>{
    for (let i = this.i-1; i <= this.i+1; i++) {
        if (i < 0 || i >= cols) continue;
    
        for (let j = this.j-1; j <= this.j+1; j++) {
          if (j < 0 || j >= rows) continue;
    
          let neighbor = grid[i][j];
          if (!neighbor.isRevealed) {
            neighbor.reveal();
          }
        }
      }
  }
}
