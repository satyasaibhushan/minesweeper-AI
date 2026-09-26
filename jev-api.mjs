export function buildRequest(data) {
  const { board, mines } = data;
  if (!Array.isArray(board) || board.length < 1 || board.length > 20 || !Array.isArray(board[0])) throw new TypeError('Invalid board');
  const width = board[0].length;
  if (width < 1 || width > 20 || !Number.isInteger(mines) || mines < 0 || mines >= width * board.length) throw new TypeError('Invalid dimensions');
  if (board.some(row => !Array.isArray(row) || row.length !== width || row.some(cell => cell !== '?' && cell !== 'F' && (!Number.isInteger(cell) || cell < 0 || cell > 8)))) throw new TypeError('Invalid cell');
  const cells = board.flatMap((row, y) => row.flatMap((cell, x) =>
    cell === '?' ? [{ x, y }] : []));
  if (!cells.length) throw new TypeError('No moves');
  // Describe visible neighborhoods only; Jev still makes every mine/safe decision.
  const clues = board.flatMap((row, y) => row.flatMap((number, x) => {
    if (typeof number !== 'number') return [];
    const covered = [];
    let flags = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const value = board[y + dy]?.[x + dx];
      if (value === 'F') flags++;
      if (value === '?') covered.push(`${x + dx},${y + dy}`);
    }
    return covered.length ? [{ at: `${x},${y}`, number, flags, coveredCount: covered.length, covered }] : [];
  }));
  const questions = {};
  cells.forEach(({ x, y }, index) => {
    questions[`risk_${index}`] = {
      type: 'noul',
      instructions: {
        question: 'Does TARGET contain a mine?',
        target: `x=${x}, y=${y}`,
        adjacentClues: clues.filter(clue => clue.covered.includes(`${x},${y}`)).map(clue => ({
          ...clue, covered: clue.covered.map(id => id === `${x},${y}` ? 'TARGET' : id)
        })),
        focus: 'Inspect the revealed numbers surrounding TARGET. Each number is an exact count of mines around that numbered cell, including TARGET. Check all those clues together.',
        checks: [
          'Could TARGET be safe and still satisfy every surrounding number? If a clue needs TARGET to reach its mine count, TARGET must be a mine.',
          'Could TARGET be a mine and still satisfy every surrounding number? If that would exceed a clue already satisfied by flags, TARGET must be safe.',
          'Example: a 1 with TARGET as its only covered neighbor and no flags proves TARGET is a mine. A 1 already touching a flag proves its other covered neighbors are safe.',
          'Use overlapping clues from the full board when needed. Estimate an uncertain risk only when both mine and safe arrangements remain possible.'
        ]
      },
      criteria: { true: 'Mine.', false: 'Safe.' }
    };
  });
  return {
    model: 'jev-latest',
    state: {
      board, totalMines: mines,
      flagsLeft: mines - board.flat().filter(cell => cell === 'F').length,
      unflaggedCoveredCount: cells.length,
      rules: [
        'This is the whole visible Minesweeper board. Coordinates start at zero: board[y][x], x is column, y is row. ? is covered, F is flagged, 0 through 8 are revealed clues.',
        'Each clue counts mines in its eight surrounding cells, including diagonals, within the board. Opening a mine loses. Treat flags as confirmed mines. Do not remove flags.',
        'Local examples: clue 1, flags 1, covered [TARGET, A] means TARGET is safe. Clue 2, flags 0, covered [TARGET, A] means TARGET is a mine. Clue 1, flags 0, covered [TARGET, A] alone leaves TARGET uncertain. Apply these patterns to any number of covered neighbors.',
        'For each revealed clue: if its number equals the count of adjacent flags, all other adjacent covered cells are safe.',
        'If the clue minus adjacent flags equals the count of adjacent unflagged covered cells, all those cells are mines.',
        'Combine overlapping clues. Consider mine arrangements satisfying them all: a cell is certain only if every possible arrangement agrees.',
        'flagsLeft is the exact number of mines remaining among the unflagged covered cells. If flagsLeft is zero, all those cells are safe. If flagsLeft equals unflaggedCoveredCount, all those cells are mines. Otherwise combine this total with surrounding numbers to rule out arrangements that require too many or too few mines.',
        'Flag cells with at least 90% mine probability. Open cells with at least 90% safe probability. Continue with the updated board. Only when neither action is available, open the lowest-risk cell as a guess. Never flag a guess.'
      ]
    },
    questions
  };
}

function probability(value) {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

export function readMove(result, request, board) {
  const estimates = board.flatMap((row, y) => row.flatMap((cell, x) =>
    cell === '?' ? [{ x, y }] : [])).map(({ x, y }, index) => {
    const mineProbability = result.answers?.[`risk_${index}`]?.noul;
    if (!probability(mineProbability)) throw new Error('Invalid mine probability');
    const deduction = mineProbability >= 0.9 ? 'mine' : mineProbability <= 0.1 ? 'safe' : 'uncertain';
    return { x, y, mineProbability, flagged: false, deduction,
      confidence: Math.max(mineProbability, 1 - mineProbability) };
  });
  const byRisk = [...estimates].sort((a, b) => a.mineProbability - b.mineProbability || a.y - b.y || a.x - b.x);
  const moves = [];
  const move = (cell, action, reason) => ({ ...cell, action, reason });
  let remainingFlags = request.state.totalMines - board.flat().filter(cell => cell === 'F').length;
  for (const cell of [...byRisk].reverse().filter(cell => cell.deduction === 'mine')) {
    if (remainingFlags <= 0) break;
    moves.push(move(cell, 'flag', 'Mine confidence ≥90%.'));
    remainingFlags--;
  }
  for (const cell of byRisk.filter(cell => cell.deduction === 'safe')) {
    moves.push(move(cell, 'open', 'Safe confidence ≥90%.'));
  }
  // New flags affect the next evaluation. Finish confident moves before guessing.
  if (!moves.length) {
    if (!byRisk.length) throw new Error('No unflagged cells remain.');
    moves.push(move(byRisk[0], 'open', 'Guess: no available confident move; lowest estimated mine risk.'));
  }
  return { moves, estimates };
}

// Byte limits are conservative bounds for the documented token budgets, not token counts.
export function splitRequest(request, maxBytes = 60000) {
  const batches = [];
  let questions = {};
  const bytes = value => Buffer.byteLength(JSON.stringify(value));
  for (const [id, question] of Object.entries(request.questions)) {
    if (bytes({ state: request.state, question }) > 30000) throw new Error('Jev state and question exceed the context budget.');
    const candidate = { ...request, questions: { ...questions, [id]: question } };
    if (bytes(candidate) > maxBytes) {
      if (!Object.keys(questions).length) throw new Error('Jev question exceeds the request budget.');
      batches.push({ ...request, questions });
      questions = {};
      if (bytes({ ...request, questions: { [id]: question } }) > maxBytes) throw new Error('Jev question exceeds the request budget.');
    }
    questions[id] = question;
  }
  if (Object.keys(questions).length) batches.push({ ...request, questions });
  return batches;
}

export async function evaluateRequests(request, evaluate) {
  const requests = splitRequest(request);
  const calls = new Array(requests.length);
  let next = 0, failure;
  // Bound simultaneous requests while preserving every question and all shared evidence.
  await Promise.all(Array.from({ length: Math.min(3, requests.length) }, async () => {
    while (next < requests.length && !failure) {
      const index = next++;
      const part = requests[index];
      const start = performance.now();
      try {
        const response = await evaluate(part);
        calls[index] = { request: part, response, apiMs: performance.now() - start,
          requestBytes: Buffer.byteLength(JSON.stringify(part)) };
      } catch (error) { failure = error; }
    }
  }));
  if (failure) throw failure;
  if (!calls.length) throw new Error('No Jev questions.');
  const model = calls[0].response.model;
  if (calls.some(call => call.response.model !== model)) throw new Error('Jev model changed within the batch.');
  const answers = Object.assign({}, ...calls.map(call => call.response.answers));
  const hasUsage = calls.every(call => Number.isFinite(call.response.usage?.input_tokens) && Number.isFinite(call.response.usage?.output_tokens));
  const usage = hasUsage ? {
    input_tokens: calls.reduce((sum, call) => sum + call.response.usage.input_tokens, 0),
    output_tokens: calls.reduce((sum, call) => sum + call.response.usage.output_tokens, 0)
  } : undefined;
  return { raw: calls.length === 1 ? calls[0].response : { model, answers, usage }, calls };
}
