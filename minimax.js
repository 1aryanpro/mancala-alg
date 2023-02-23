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
  let board = newBoard();
  let nextPlayer = makeMoves(board, []);

  // pick even numbers for depth
  let start = Date.now();
  let evals = bestMove(board, nextPlayer, 8);
  let end = Date.now();
  console.log((end - start) / 1000, 'Seconds Calculating');
  saveEvals();

  drawBoard(board);
  console.log(`${nextPlayer ? 'Your' : 'Opponent\'s'} move`);
  evals.forEach(([m, s]) => {
    console.log(`${('   ' + m).slice(-2)}  =>  ${s}`);
  });
}

function saveEvals() {
  fs.writeFileSync('savedEvals.txt', '');
  let key = savedEvals.nextKey();
  let total = savedEvals.stats()['numKeys'];
  let tsize = total.toString().length;
  let count = 0;
  let start = Date.now();

  function* generator() {
    while (key) {
      let [depth, ev] = savedEvals.get(key);

      count++;
      if (count % Math.round(total / 20) == 0) {
        let prop = Math.round(count / total * 100);
        process.stdout.write(`${prop}% ${(' '.repeat(tsize) + count).slice(-tsize)}/${total}\r`);
      }

      yield `${key} ${depth} ${ev}\n`;
      key = savedEvals.nextKey(key);
    }

    process.stdout.write(`100% ${total}/${total}\r`);
    console.log('\n', (Date.now() - start) / 1000, `Saved Data`);
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
  let save = savedEvals.get(boardId(board));
  if (save && save[0] >= depth) return save[1] == null ? staticEval(board) : save[1];
  if (depth == 0) return staticEval(board);

  let moves = moveList(board, maxingPlayer);
  if (moves == []) return staticEval(board);

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
    let ev = minimax(next, maxingPlayer == p, depth);
    console.log(`Calculated Move ${m} => ${(Date.now() - start) / 1000}s`);
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
