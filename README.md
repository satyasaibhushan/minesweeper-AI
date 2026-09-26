# minesweeper
A complete minesweeper game using p5 js

##### You can either play it in the single player mode or you can ask the AI to solve it
##### You can place the flag on an element by clicking on element while pressing the metakey ( command on mac,ctrl on windows )
#### You can play it [here](https://satyasaibhushan.github.io/minesweeper-AI/) 
  
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

## Play with Jev locally

Requires Node 22 or newer. Run `npm start`, then open http://127.0.0.1:4317.
Set `JEV_API_KEY=your-key` in the repo's gitignored `.env` file. The server reads
it on each request, so key changes need no restart. An exported `JEV_API_KEY`
environment variable takes precedence. The browser never receives the key.

**Solve with JEV** starts one attempt. Each round is one board evaluation; a response can
produce several moves. The attempt stops on win, loss, API error, or Stop. Click
again to retry the same puzzle and starting reveals without previous-attempt
memory. The refresh icon generates a new puzzle. Winning marks any remaining covered
cells with completion flags, recorded separately from model predictions and moves.

Jev receives the whole visible board, total mine count and plain rules distilled
from the original solver, plus explicit flags-left and covered-cell counts:
count adjacent flags, identify safe cells and mines,
combine overlapping clues, use the remaining mine count, then guess when needed.
Each unflagged covered cell gets a mine-risk estimate, with its adjacent clues,
flag counts and covered neighbors explicitly listed. Counting is preprocessing;
Jev still decides whether the cell is mined. Short examples distinguish forced
mines, safe cells and ambiguous cells.
No solver computes deductions for Jev. Hidden mines never enter its request.

The adapter flags at least 90% mine probability and opens at most 10% mine probability.
Every qualifying flag and open is applied in the same round before another request.
Flags stay fixed. After confident moves it evaluates the updated board, guessing
the lowest-risk unflagged cell only when no confident move is available.

Large requests use up to three parallel calls, each with the full board and rules.
The panel shows attempt time, rounds, moves and API timing, including network time.
Details contains raw responses and a JSON trace download. M/S marks model claims;
percentages show estimated risk. Hidden mines are used only for post-game scoring.

Run `npm test` for request, move handling and game lifecycle checks.
