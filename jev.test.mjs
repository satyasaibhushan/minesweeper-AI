import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { buildRequest, readMove, splitRequest, evaluateRequests } from './jev-api.mjs';

function answer(board, mines, judgments) {
  const request = buildRequest({ board, mines });
  const answers = {};
  judgments.forEach((risk, i) => {
    answers[`risk_${i}`] = { noul: risk };
  });
  return readMove({ answers }, request, board);
}
test('sends the full visible board and rules without hidden data', () => {
  const board = [['F', 1, '?'], [1, 1, 0]];
  const request = buildRequest({ board, mines: 1, isMine: [[true]], key: 'secret' });
  assert.deepEqual(request.state.board, board);
  assert.equal(request.state.totalMines, 1);
  assert.equal(Object.keys(request.questions).length, 1);
  assert.match(request.questions.risk_0.instructions.target, /x=2, y=0/);
  assert.match(request.state.rules.join(' '), /Never flag a guess/);
  assert.equal(JSON.stringify(request).includes('secret'), false);
  assert.equal(JSON.stringify(request).includes('isMine'), false);
});
test('remaining flags and covered count are explicit global evidence', () => {
  const state = buildRequest({board: [['F', 1, '?'], [1, '?', '?']], mines: 2}).state;
  assert.equal(state.flagsLeft, 1);
  assert.equal(state.unflaggedCoveredCount, 3);
  assert.equal(buildRequest({board: [['F', 1, '?']], mines: 1}).state.flagsLeft, 0);
  const allMines = buildRequest({board: [[2, '?', '?']], mines: 2}).state;
  assert.equal(allMines.flagsLeft, allMines.unflaggedCoveredCount);
});
test('cell context counts visible neighbors and flags without supplying a decision', () => {
  const request = buildRequest({board: [['F', 2, '?'], [0, 1, '?']], mines: 2});
  const context = request.questions.risk_0.instructions;
  assert.deepEqual(context.adjacentClues, [
    {at:'1,0', number:2, flags:1, coveredCount:2, covered:['TARGET','2,1']},
    {at:'1,1', number:1, flags:1, coveredCount:2, covered:['TARGET','2,1']}
  ]);
  assert.equal('deduction' in context, false);
});
test('large boards retain every cell and all evidence across bounded requests', async () => {
  const board = Array.from({ length: 20 }, () => Array(20).fill('?'));
  const request = buildRequest({ board, mines: 40 });
  assert.equal(Object.keys(request.questions).length, 400);
  const parts = splitRequest(request);
  assert.ok(parts.length >= 1);
  assert.ok(splitRequest(request, 10000).length > 1);
  assert.deepEqual(Object.assign({}, ...parts.map(p => p.questions)), request.questions);
  for (const part of parts) {
    assert.deepEqual(part.state, request.state);
    assert.ok(Buffer.byteLength(JSON.stringify(part)) <= 60000);
  }
  let active = 0, peak = 0;
  const result = await evaluateRequests(request, async part => {
    peak = Math.max(peak, ++active);
    await new Promise(resolve => setTimeout(resolve, 5));
    active--;
    return { model: 'test', answers: part.questions, usage: { input_tokens: 10, output_tokens: 5 } };
  });
  assert.ok(peak <= 3);
  assert.deepEqual(result.raw.answers, request.questions);
  assert.equal(result.raw.usage.input_tokens, parts.length * 10);
  await assert.rejects(evaluateRequests(request, async () => { throw new Error('upstream failed'); }), /upstream failed/);
});
test('probability above 90% flags and safe confidence above 90% opens', () => {
  const plan = answer([['?', 1, '?'], [1, 1, 0]], 1, [0.91, 0.09]);
  assert.deepEqual(plan.moves.map(({action, x}) => [action, x]), [['flag', 0], ['open', 2]]);
  assert.ok(plan.moves.every(move => !move.reason.startsWith('Guess:')));
});
test('one round includes all flags and opens at the inclusive 90% threshold', () => {
  const plan = answer([['?', '?', '?', '?', '?']], 2, [0.9, 0.99, 0.1, 0.01, 0.5]);
  assert.deepEqual(plan.moves.map(({action, x}) => [action, x]), [
    ['flag', 1], ['flag', 0], ['open', 3], ['open', 2]
  ]);
  assert.ok(plan.moves.every(move => !move.reason.startsWith('Guess:')));
});
test('below 90% confidence remains a guess', () => {
  const plan = answer([['?', '?']], 1, [0.8999, 0.1001]);
  assert.equal(plan.moves.length, 1);
  assert.equal(plan.moves[0].x, 1);
  assert.match(plan.moves[0].reason, /Guess:/);
});
test('flags remain fixed and are excluded from questions and moves', () => {
  const board = [['F', 1, '?']];
  const request = buildRequest({board, mines: 1});
  assert.equal(Object.keys(request.questions).length, 1);
  assert.match(request.questions.risk_0.instructions.target, /x=2, y=0/);
  const plan = answer(board, 1, [0.02]);
  assert.deepEqual(plan.moves.map(({action, x}) => [action, x]), [['open', 2]]);
});
test('flags alone trigger a fresh evaluation before any guess', () => {
  const plan = answer([['?', '?', '?']], 1, [0.95, 0.4, 0.3]);
  assert.deepEqual(plan.moves.map(({action, x}) => [action, x]), [['flag', 0]]);
});
test('all confident safe opens run together without a stale guess', () => {
  const plan = answer([['?', '?', '?']], 1, [0.01, 0.09, 0.4]);
  assert.deepEqual(plan.moves.map(({action, x}) => [action, x]), [['open', 0], ['open', 1]]);
  assert.ok(plan.moves.every(move => !move.reason.startsWith('Guess:')));
});
test('flag budget prioritizes highest probability and never unflags', () => {
  const plan = answer([['?', '?']], 1, [0.91, 0.99]);
  assert.deepEqual(plan.moves.map(({action, x}) => [action, x]), [['flag', 1]]);
  const next = answer([['?', 'F']], 1, [0.91]);
  assert.deepEqual(next.moves.map(({action, x}) => [action, x]), [['open', 0]]);
  assert.match(next.moves[0].reason, /Guess:/);
});
test('malformed or missing probabilities fail closed', () => {
  for (const risk of [undefined, null, '0.1', NaN, -0.1, 1.1]) {
    assert.throws(() => answer([['?', '?']], 1, [risk, 0.2]), /Invalid mine probability/);
  }
  assert.throws(() => answer([['?', '?']], 1, []), /Invalid mine probability/);
  assert.throws(() => buildRequest({board: [['F', 1]], mines: 1}), /No moves/);
});
test('rejects invalid board contents', () => {
  for (const board of [[[true]], [[9]], [['secret']], [['?', '?'], ['?']]]) {
    assert.throws(() => buildRequest({ board, mines: 0 }));
  }
});
function game() {
  const context = vm.createContext({ setTimeout, clearTimeout });
  vm.runInContext(readFileSync('jev.js', 'utf8'), context);
  vm.runInContext(`
    let cols = 2, rows = 2, w = 30, noOfBombs = 1;
    let isGameOver = false, isAISolving = false, continuousAI = false;
    let revealedArray = [], confirmedBombs = [], uncheckedCellQueue = [], guessedElements = [], remainingFlags = 1;
    const flagDiv = { elt: {} };
    function Cell(i,j) { this.i=i; this.j=j; this.isMine=false; this.neighbourCount=1; this.isRevealed=false; }
    let grid = [[new Cell(0,0),new Cell(0,1)],[new Cell(1,0),new Cell(1,1)]];
    grid[1][1].isMine=true;
  `, context);
  return code => vm.runInContext(code, context);
}
test('loss stops and retry restores same mines without leaked reveals', () => {
  const run = game();
  run('restoreJevBoard()');
  assert.equal(run('revealJevCell(1,1)'), 'Loss');
  assert.equal(run('isGameOver'), true);
  assert.equal(run('grid.flat().some(c => c.isCompletionFlag)'), false);
  run('restoreJevBoard()');
  assert.equal(run('grid[1][1].isMine'), true);
  assert.equal(run('grid.flat().some(c => c.isRevealed)'), false);
  assert.equal(run('isGameOver'), false);
});
test('win requires all safe cells, not flags; retries preserve starting reveals', () => {
  const run = game();
  run('grid[0][0].isRevealed = true; restoreJevBoard()');
  assert.equal(run('revealJevCell(0,1)'), null);
  assert.equal(run('revealJevCell(1,0)'), 'Win');
  assert.equal(run('grid[1][1].isFlagged && grid[1][1].isCompletionFlag'), true);
  assert.equal(run('remainingFlags'), 0);
  assert.equal(run('flagDiv.elt.textContent'), 'No of flags left : 0');
  run('restoreJevBoard()');
  assert.equal(run('grid[0][0].isRevealed'), true);
  assert.equal(run('grid[0][1].isRevealed'), false);
  assert.equal(run('grid[1][1].isFlagged'), false);
  assert.equal(run('remainingFlags'), 1);
});
test('flood reveal never opens a mine', () => {
  const run = game();
  run('grid[0][0].neighbourCount = 0; restoreJevBoard()');
  assert.equal(run('revealJevCell(0,0)'), 'Win');
  assert.equal(run('grid[1][1].isRevealed'), false);
});

test('flag, unflag and open obey game rules and retry discards learned flags', () => {
  const run = game();
  run('restoreJevBoard()');
  assert.equal(run("applyJevMove({action:'flag', x:0, y:0})"), null);
  assert.equal(run('remainingFlags'), 0);
  assert.equal(run('visibleJevBoard()[0][0]'), 'F');
  assert.equal(run('isGameOver'), false);
  assert.throws(() => run("applyJevMove({action:'open', x:0, y:0})"));
  assert.throws(() => run("applyJevMove({action:'flag', x:1, y:0})"));
  run("applyJevMove({action:'unflag', x:0, y:0})");
  assert.equal(run('remainingFlags'), 1);
  run("applyJevMove({action:'flag', x:1, y:1})");
  assert.equal(run('isGameOver'), false);
  run('restoreJevBoard()');
  assert.equal(run('grid.flat().some(c=>c.isFlagged || c.isRevealed)'), false);
  assert.equal(run("applyJevMove({action:'open', x:1, y:1})"), 'Loss');
});
test('flood fill leaves flagged safe cells closed until unflagged', () => {
  const run = game();
  run('grid[0][0].neighbourCount = 0; restoreJevBoard()');
  run("applyJevMove({action:'flag',x:0,y:1})");
  assert.equal(run("applyJevMove({action:'open',x:0,y:0})"), null);
  assert.equal(run('grid[0][1].isRevealed'), false);
  run("applyJevMove({action:'unflag',x:0,y:1})");
  assert.equal(run("applyJevMove({action:'open',x:0,y:1})"), 'Win');
});
