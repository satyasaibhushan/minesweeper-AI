const colorValues = [
  '',
  'rgb(3, 2, 200)',
  'rgb(78, 133, 48)',
  'rgb(235, 35, 16)',
  'rgb(41, 41, 153)',
  'rgb(99, 6, 3)',
  'rgb(65, 128, 128)',
  27,
  122,
];

function Cell(i, j, w) {
  this.i = i;
  this.j = j;
  this.w = w;
  this.x = i * w;
  this.y = j * w;

  this.isMine = false;
  this.isRevealed = false;
  this.isMineActive = false

  this.neighbourCount = 0;

  this.show = () => {
    stroke(0);
    strokeWeight(1)
    noFill();
    image(tileImg,this.x, this.y,this.w, this.w)
    rect(this.x, this.y, this.w, this.w);
    if (this.isRevealed) {
      if (this.isMine) {
        image(bombImg,this.x, this.y,this.w, this.w)
        if(this.isMineActive)fill(255,0,0,125);
        ellipse(this.x + this.w * 0.5, this.y + this.w * 0.5, this.w * 0.5);
      } else {
        fill(192);
        rect(this.x, this.y, this.w, this.w);
        // image(emptyTile,this.x, this.y, this.w, this.w)
        if (this.neighbourCount > 0) {
          strokeWeight(0)
          textFont(font)
          textAlign(CENTER);
          fill(0);
          fill(colorValues[this.neighbourCount])
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
