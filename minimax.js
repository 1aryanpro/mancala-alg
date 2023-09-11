import { newBoard, makeMove, staticEval, points, drawBoard, makeMoves } from './capture.js';
import * as fs from 'fs';
import { Readable } from 'stream';
import MegaHash from 'megahash';

let savedEvals = new MegaHash();

// +++++++++++++++++++++++++++++++++++++++
// |   | 13 | 12 | 11 | 10 |  9 |  8 |   |
// | 0 |++++|++++|++++|++++|++++|++++| 7 |
// |   |  1 |  2 |  3 |  4 |  5 |  6 |   |
// +++++++++++++++++++++++++++++++++++++++
function main() {
  // console.log(savedEvals.stats())
  let board = [1, 2, 4, 6, 2, 1, 4, 0, 1, 3, 5, 2, 1, 0];
  let nextPlayer = makeMoves(board, [6, 10, 4, 13, 12, 13, 11, 13, 12, 5, 6, ]);

  // pick even numbers for depth
  let start = Date.now();
  let evals = bestMove(board, nextPlayer, 10);
  let end = Date.now();
  console.log((end - start) / 1000, 'Seconds Calculating');
  saveEvals();

  drawBoard(board);
  console.log(`${nextPlayer ? 'Your' : 'Opponent\'s'} move`);
  evals.forEach(([m, s]) => {
    // s = isFinite(s) ? s : (s > 0 ? 'You win' : 'Opp win')
    console.log(`${('   ' + m).slice(-2)}  =>  ${s}`);
  });
}

function saveEvals() {
  fs.writeFileSync('savedEvals.txt', '');
  let key = savedEvals.nextKey();

  function* generator() {
    while (key) {
      let [depth, ev] = savedEvals.get(key);

      yield `${key} ${depth} ${ev}\n`;
      key = savedEvals.nextKey(key);
    }
  }

  const writeStream = fs.createWriteStream('savedEvals.txt');
  const readable = Readable.from(generator());

  readable.pipe(writeStream);
}

function moveList(board, maxingPlayer) {
  let moves = new Array(6).fill(0);
  moves = moves
    .map((_, i) => i + (maxingPlayer ? 1 : 8))
    .filter((m) => board[m] != 0);
  return moves;
}

function minimax(board, maxingPlayer, depth, alpha = -Infinity, beta = Infinity) {
  if (depth == 0) return staticEval(board);
  
  let save = savedEvals.get(boardId(board));
  if (save != undefined && save[0] >= depth && save[1] != null) save[1];

  let moves = moveList(board, maxingPlayer);
  if (moves.length == 0) return staticEval(board);

  let nexts = [];
  moves.forEach(m => {
    let next = [...board];
    let free = makeMove(next, m);
    nexts.push({ next, free });
  });

  nexts = nexts.sort((a, b) => (points[a.next] - points[b.next]) * maxingPlayer ? -1 : 1);

  let mScore = maxingPlayer ? -Infinity : Infinity;

  nexts.every(({ next, free }) => {
    let score = minimax(next, maxingPlayer == free, depth - (free ? 0 : 1), alpha, beta);

    let cond = maxingPlayer ? (score > mScore) : (score < mScore);
    mScore = cond ? score : mScore;

    if (mScore == (maxingPlayer ? Infinity : -Infinity)) return false;

    if (maxingPlayer) alpha = Math.max(score, alpha);
    else beta = Math.min(score, beta);

    return beta > alpha;
  });

  if (depth >= 8) savedEvals.set(boardId(board), [depth, mScore]);
  return mScore;
}

function bestMove(board, maxingPlayer, depth) {
  let moves = moveList(board, maxingPlayer);

  let start = Date.now();
  moves = moves.map(m => {
    let next = [...board];
    let p = makeMove(next, m);
    let ev = minimax(next, maxingPlayer == p, p ? depth : depth - 1);
    console.log(`Calculated Move ${( ' ' + m ).slice(-2)} =>`, (Date.now() - start) / 1000);
    start = Date.now();
    return [m, ev];
  });
  console.log('');
  return moves;
}

function boardId(board) {
  let bin = board.map(n => String.fromCharCode(n + 65)).join('');
  return bin;
}

let input = fs.createReadStream('savedEvals.txt');
let remaining = '';
input.on('data', function(data) {
  remaining += data;
  let index = remaining.indexOf('\n');
  let last = 0;
  while (index > -1) {
    let line = remaining.substring(last, index);
    last = index + 1;

    let vals = line.split(' ');
    savedEvals.set(vals[0], [vals[1], parseInt(vals[2])]);

    index = remaining.indexOf('\n', last);
  }

  remaining = remaining.substring(last);
});

input.on('end', function() {
  main();
});
