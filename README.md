# minesweeper
A complete minesweeper game using p5 js

##### You can either play it in the single player mode or you can ask the AI to solve it
##### You can place the flag on an element by clicking on element while pressing the metakey ( command on mac,ctrl on windows )
#### You can play it [here](https://satyasaibhushan.github.io/minesweeper) 
  
##### The AI created here solves the puzzle using 3 rules and a heuristic

#### RULE-1: 
     If the  no.of un-revealed spaces around an element is equal to the number on the element,
     then set all surroundings to flags 
#### RULE-2: 
     if the no.of neigbouring flags of an element is equal to the number on the element,
     then reveal all other spaces
#### RULE-3:
     solving the constrained links for bombs using combinations of bombs that satisify the constraint,
     then getting the intersection of the possibilities
#### RULE-4:     
     Rule 4 is used in the final stages of the game when we have constraints but also limited unrevealed elements,
     It follows as arranging the falgs around these spaces while satisfying the constranits,
     We then make deductions from these arrangements if possible or we go by guessing using the probablities
#### HEURISTIC-1:          
     It's basically when you have no enough information to work with,
     It basically reveals random elements wishing there's no bomb there
     
###### You can also test the program by simulating 100(say)games and then you can view the results in the console by searching an object named results showing the various wins / losses number and a reason if lost

###### The default value of the mine factor is 0.1 i.e, 1 bomb per 10 squares. You can vary the value within a reasonable range(say 0.7 to 1.7)
