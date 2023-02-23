export function newBoard() {
  let board = Array(14).fill(4);
  board[0] = 0;
  board[7] = 0;
  return board;

  // +++++++++++++++++++++++++++++++++++++++
  // |   | 13 | 12 | 11 | 10 |  9 |  8 |   |
  // | 0 |++++|++++|++++|++++|++++|++++| 7 |
  // |   |  1 |  2 |  3 |  4 |  5 |  6 |   |
  // +++++++++++++++++++++++++++++++++++++++
}

export function makeMove(board, move) {
  if (move == 0 || move == 7) throw new Error('can\'t move from mancala');

  let firstPlayer = move < 7;
  let skippedCell = firstPlayer ? 0 : 7;
  let mancala = firstPlayer ? 7 : 0;
  let hand = board[move];
  board[move] = 0;

  while (hand > 0) {
    move = (move + 1) % 14;
    move == skippedCell ? move++ : undefined;
    board[move]++;
    hand--;
  }

  let opp = 14 - move;
  if ((move < 7 == firstPlayer) && board[move] == 1 && board[opp] > 0) {
    board[mancala] += board[move] + board[opp];
    board[move] = 0;
    board[opp] = 0;
  }

  // check for game over
  if (board.slice(1, 7).every(n => n == 0)) {
    for (let i = 8; i < 14; i++) {
      board[0] += board[i];
      board[i] = 0;
    }
  }

  if (board.slice(8, 14).every(n => n == 0)) {
    for (let i = 1; i < 7; i++) {
      board[7] += board[i];
      board[i] = 0;
    }
  }

  return move == mancala; // returns true if free turn
}

export function makeMoves(board, moves) {
  let firstPlayer = !(moves[0] > 7);
  moves.forEach((move) => {
    firstPlayer = firstPlayer == makeMove(board, move);
  });
  return firstPlayer;
}

export function points(board) {
  let me = board[7];
  let op = board[0];
  if (me > 24) return Infinity;
  if (op > 24) return -Infinity;
  if (me + op == 48) return 0;
  return me - op;
}

export function staticEval(board) {
  let me = board[7];
  let op = board[0];
  if (me > 24) return Infinity;
  if (op > 24) return -Infinity;
  if (me + op == 48) return 0;

  let captures = [0, 0]; // me, opp
  let freeTurn = [0, 0];
  for (let i = 1; i < 14; i++) {
    let id = i < 7 ? 0 : 1;
    let n = board[i];
    if (i == 7 || n == 0) continue;
    freeTurn[id] += (n % 13 == 7 - i % 7) ? 1 : 0;

    if (n > 12) continue;
    let final = (n > 13 - i ? i + n + 1 : i + n) % 14;
    captures[id] += (board[final] == 0 && board[14 - final] > 0) ? 1 : 0;
  }

  return (me - op) + 2 * (captures[0] - captures[1]) + (freeTurn[0] - freeTurn[1]);
}

export function drawBoard(board) {
  console.log('+'.repeat(41));

  let line1 = '|    | ';
  for (let i = 13; i > 7; i--) {
    let num = board[i];
    if (num < 10) line1 += ' ';
    line1 += num + ' | ';
  }
  line1 += '   |'
  console.log(line1);

  let line2 = '| ';
  if (board[0] < 10) line2 += ' ';
  line2 += board[0] + ' |' + '++++|'.repeat(6) + ' ';
  if (board[7] < 10) line2 += ' ';
  line2 += board[7] + ' |'
  console.log(line2);

  let line3 = '|    | ';
  for (let i = 1; i < 7; i++) {
    let num = board[i];
    if (num < 10) line3 += ' ';
    line3 += num + ' | ';
  }
  line3 += '   |'
  console.log(line3);

  console.log('+'.repeat(41));
}

