let jevRunning = false;
let jevSnapshot = null;
let jevButton, jevStatus, jevHistory;
let jevAttempt = 0;
let jevSelected = null;
let jevEstimates = new Map();
let jevTrace = [];

function setupJev() {
  const panel = document.createElement('section');
  panel.className = 'jev-panel';
  panel.innerHTML = `<h2>Jev</h2>
    <div class="jev-controls"><button id="jev-solve">Solve with JEV</button><button id="jev-stop" disabled>Stop</button></div>
    <p id="jev-status" role="status" aria-live="polite">Ready</p>
    <p id="jev-metrics" role="status" title="API batch wall time and median individual call, including network time.">API: waiting</p>
    <p id="jev-quality" title="Prediction matches include repeated claims across rounds. Guesses count safe outcomes."></p>
    <p id="jev-move" role="status"></p>
    <details><summary>Details</summary>
      <p class="jev-help">M / S = ≥90% mine / safe confidence. % = estimated mine risk.</p>
      <p id="jev-diagnostics" class="jev-help"></p>
      <p id="jev-move-detail" class="jev-help"></p>
      <button id="jev-export" disabled>Download attempt JSON</button>
      <details><summary>Raw response</summary><pre id="jev-raw">No calls yet.</pre></details>
    </details>
    <details><summary>Attempts</summary><ol id="jev-history" aria-label="Attempt results"></ol></details>`;
  document.body.append(panel);
  jevButton = document.getElementById('jev-solve');
  jevStatus = document.getElementById('jev-status');
  jevHistory = document.getElementById('jev-history');
  jevButton.onclick = solveWithJev;
  document.getElementById('jev-export').onclick = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(jevTrace, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `minesweeper-attempt-${jevAttempt}.json`;
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
}
async function jevPost(url, body, signal) {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Request failed.');
  return result;
}
function restoreJevBoard() {
  jevEstimates.clear();
  if (!jevSnapshot) jevSnapshot = grid.map(column => column.map(cell => ({ mine: cell.isMine, count: cell.neighbourCount, revealed: !isGameOver && cell.isRevealed && !cell.isMine, flagged: !isGameOver && Boolean(cell.isFlagged) })));
  grid = jevSnapshot.map((column, x) => column.map((saved, y) => {
    const cell = new Cell(x, y, w);
    cell.isMine = saved.mine;
    cell.neighbourCount = saved.count;
    cell.isRevealed = saved.revealed;
    cell.isFlagged = saved.flagged;
    return cell;
  }));
  revealedArray = grid.flat().filter(cell => cell.isRevealed);
  confirmedBombs = grid.flat().filter(cell => cell.isFlagged); uncheckedCellQueue = []; guessedElements = [];
  remainingFlags = Math.floor(noOfBombs) - confirmedBombs.length;
  flagDiv.elt.textContent = 'No of flags left : ' + remainingFlags;
  isGameOver = false; isAISolving = false; continuousAI = false;
}
function revealJevCell(x, y) {
  const selected = grid[x]?.[y];
  if (!selected || selected.isRevealed || selected.isFlagged) throw new Error('Jev returned an invalid move.');
  if (selected.isMine) {
    selected.isMineActive = true;
    for (const cell of grid.flat()) if (cell.isMine) cell.isRevealed = true;
    isGameOver = true;
    return 'Loss';
  }
  const queue = [selected];
  while (queue.length) {
    const cell = queue.pop();
    if (cell.isRevealed || cell.isMine || cell.isFlagged) continue;
    cell.isRevealed = true;
    revealedArray.push(cell);
    if (cell.neighbourCount === 0) {
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        const neighbor = grid[cell.i + dx]?.[cell.j + dy];
        if (neighbor && !neighbor.isRevealed && !neighbor.isMine && !neighbor.isFlagged) queue.push(neighbor);
      }
    }
  }
  if (grid.flat().every(cell => cell.isMine || cell.isRevealed)) {
    isGameOver = true;
    // The game is won. Mark remaining covered cells without crediting Jev predictions.
    for (const cell of grid.flat()) if (!cell.isRevealed && !cell.isFlagged) {
      cell.isFlagged = true;
      cell.isCompletionFlag = true;
      confirmedBombs.push(cell);
      remainingFlags--;
    }
    flagDiv.elt.textContent = 'No of flags left : ' + remainingFlags;
    return 'Win';
  }
  return null;
}
function visibleJevBoard() {
  return Array.from({ length: rows }, (_, y) => Array.from({ length: cols }, (_, x) => {
    const cell = grid[x][y];
    return cell.isFlagged ? 'F' : cell.isRevealed ? cell.neighbourCount : '?';
  }));
}
function applyJevMove(move) {
  const cell = grid[move.x]?.[move.y];
  if (isGameOver || !cell || cell.isRevealed) throw new Error('Jev returned an invalid move.');
  if (move.action === 'open') return revealJevCell(move.x, move.y);
  if (move.action === 'flag' && !cell.isFlagged && remainingFlags > 0) {
    cell.isFlagged = true;
    confirmedBombs.push(cell);
    remainingFlags--;
  } else if (move.action === 'unflag' && cell.isFlagged) {
    cell.isFlagged = false;
    confirmedBombs = confirmedBombs.filter(flagged => flagged !== cell);
    remainingFlags++;
  } else throw new Error('Jev returned an invalid move.');
  flagDiv.elt.textContent = 'No of flags left : ' + remainingFlags;
  return null;
}
async function solveWithJev() {
  if (jevRunning || isAISolving) return;
  try {
    const response = await fetch('/api/status');
    const status = await response.json();
    if (!status.configured) { jevStatus.textContent = 'Set JEV_API_KEY in the local .env file, then click Solve again.'; return; }
  } catch { jevStatus.textContent = 'Local server unavailable.'; return; }
  // Lock before the first move; normal game handlers must not alter this attempt.
  if (jevRunning || isAISolving) return;
  jevRunning = true;
  restoreJevBoard();
  document.getElementById('jev-move').textContent = '';
  jevButton.disabled = true;
  activateAI.elt.disabled = true;
  activateContinuousAI.elt.disabled = true;
  const stop = document.getElementById('jev-stop');
  stop.disabled = false;
  const controller = new AbortController();
  stop.onclick = () => controller.abort();
  const attempt = ++jevAttempt;
  const start = performance.now();
  let rounds = 0, moves = 0, outcome = 'Stopped';
  let apiTotal = 0, apiLast = 0, clientTotal = 0;
  const latencies = [];
  jevTrace = [];
  document.getElementById('jev-quality').textContent = '';
  document.getElementById('jev-metrics').textContent = 'API: waiting';
  document.getElementById('jev-diagnostics').textContent = '';
  document.getElementById('jev-move-detail').textContent = '';
  document.getElementById('jev-raw').textContent = 'Waiting for Jev.';
  document.getElementById('jev-export').disabled = true;
  const update = () => { jevStatus.textContent = `Attempt ${attempt} · ${((performance.now() - start) / 1000).toFixed(1)}s · ${rounds} rounds · ${moves} moves`; };
  const timer = setInterval(update, 100);
  const updateMetrics = batch => {
    const sorted = [...latencies].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    const tokens = batch.raw.usage;
    document.getElementById('jev-metrics').textContent = `API ${Math.round(apiLast)}ms · ${batch.apiCalls ?? 1} calls · median call ${Math.round(median)}ms`;
    document.getElementById('jev-diagnostics').textContent = `${batch.raw.model} · API batch wall time: last ${Math.round(apiLast)}ms / median ${Math.round(median)}ms / total ${(apiTotal / 1000).toFixed(2)}s. Local HTTP + processing ${(clientTotal - apiTotal).toFixed(0)}ms total. Last batch: ${batch.apiCalls ?? 1} API calls, ${batch.questionCount} questions, ${batch.cellCount} cells, ${(batch.requestBytes / 1024).toFixed(1)} KB. Tokens: ${tokens?.input_tokens ?? '?'} in / ${tokens?.output_tokens ?? '?'} out. Network included; inference-only time unavailable.`;
  };
  update();
  try {
    while (!isGameOver) {
      const board = visibleJevBoard();
      const requestStart = performance.now();
      const batch = await jevPost('/api/move', { board, mines: Math.floor(noOfBombs) }, controller.signal);
      const clientMs = performance.now() - requestStart;
      if (controller.signal.aborted) break;
      rounds++;
      apiLast = batch.apiMs; apiTotal += apiLast; clientTotal += clientMs; latencies.push(...(batch.calls?.map(call => call.apiMs) ?? [apiLast]));
      const record = { round: rounds, board, ...batch, clientMs, applied: [] };
      jevTrace.push(record);
      document.getElementById('jev-export').disabled = false;
      document.getElementById('jev-raw').textContent = JSON.stringify(batch.calls?.length > 1 ? batch.calls : batch.raw, null, 2);
      updateMetrics(batch);
      jevEstimates = new Map(batch.estimates.map(cell => [`${cell.x},${cell.y}`, cell]));
      for (const move of batch.moves) {
        if (controller.signal.aborted || isGameOver) break;
        // Earlier opens may flood-reveal other cells in the same response.
        if (grid[move.x]?.[move.y]?.isRevealed) continue;
        jevSelected = move;
        const result = applyJevMove(move);
        record.applied.push(move);
        moves++;
        document.getElementById('jev-move-detail').textContent = `Round ${rounds}, move ${moves}: ${move.action} (${move.x}, ${move.y}). ${move.reason} Confidence ${(move.confidence * 100).toFixed(1)}%; estimated mine risk ${(move.mineProbability * 100).toFixed(1)}%.`;
        if (result) {
          outcome = result;
          if (result === 'Win') record.completionFlags = grid.flat()
            .filter(cell => cell.isCompletionFlag).map(cell => ({ x: cell.i, y: cell.j }));
          break;
        }
      }
      const flagged = record.applied.filter(move => move.action === 'flag').length;
      const opened = record.applied.filter(move => move.action === 'open').length;
      const guessed = record.applied.some(move => move.reason.startsWith('Guess:'));
      document.getElementById('jev-move').textContent = `Round ${rounds}: ${flagged} flagged · ${opened} opened${guessed ? ' · guess' : ''}`;
      draw();
      update();
    }
  } catch (error) { outcome = error.name === 'AbortError' ? 'Stopped' : `Error: ${error.message}`; }
  finally {
    clearInterval(timer);
    jevSelected = null;
    // Ground truth is used only for the post-attempt score, never requests or moves.
    let correct = 0, claims = 0, guesses = 0, survived = 0;
    for (const record of jevTrace) {
      for (const cell of record.estimates) {
        if (cell.deduction === 'uncertain') continue;
        claims++;
        if ((cell.deduction === 'mine') === grid[cell.x][cell.y].isMine) correct++;
      }
      for (const move of record.applied) if (move.action === 'open' && move.reason.startsWith('Guess:')) {
        guesses++; if (!grid[move.x][move.y].isMine) survived++;
      }
    }
    const flags = grid.flat().filter(cell => cell.isFlagged && !cell.isCompletionFlag);
    const completionFlags = grid.flat().filter(cell => cell.isCompletionFlag).length;
    document.getElementById('jev-quality').textContent = `Predictions ${correct}/${claims} · Flags ${flags.filter(cell => cell.isMine).length}/${flags.length} · Guesses ${survived}/${guesses}${completionFlags ? ` · Completion flags ${completionFlags}` : ''}`;
    const summary = `Attempt ${attempt}: ${outcome} · ${((performance.now() - start) / 1000).toFixed(2)}s · ${rounds} rounds · ${moves} moves`;
    jevStatus.textContent = summary;
    const item = document.createElement('li'); item.textContent = summary; jevHistory.prepend(item);
    jevRunning = false; jevButton.disabled = false; stop.disabled = true;
    activateAI.elt.disabled = false; activateContinuousAI.elt.disabled = false;
    redraw();
  }
}
