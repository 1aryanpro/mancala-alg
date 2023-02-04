function main() {
  let board = Array(14).fill(4);
  board[0] = 0;
  board[7] = 0;

  // board = makeMoves([2,2,1,4,6]); // gets you to 15
  board = makeMoves(board, [2, 2, 3, 6, 5, 6, 1, 3, 5, 6, 5, 6, 3, 4, 1]); // get you to 32

  for (let i = 1; i < 7; i++) {
    let [newBoard, last] = makeMove(board, i, true);

    console.log('\n')
    console.log(`move: ${i}; last: ${last}`)
    print(newBoard);
  }
}

function makeMoves(board, moves, firstPlayer = true) {
  moves.forEach((move) => {
  [board, _] = makeMove(board, move, firstPlayer);
  });
  return board;
}

function makeMove(board, move, firstPlayer) {
  board = [...board];
  let skippedCell = firstPlayer ? 0 : 7;
  let hand = board[move];
  board[move] = 0;

  while (hand > 0) {
    move = (move + 1) % 14;
    move == skippedCell ? move++ : undefined;
    board[move]++;
    hand--;
  }

  let last = move;
  if (move != (firstPlayer ? 7 : 0) && board[move] > 1) [board, last] = makeMove(board, move, firstPlayer);

  return [board, last];
}

function print(board) {
  console.log('+'.repeat(41));

  let line1 = '|    | ';
  for (let i = 6; i > 0; i--) {
    let num = board[i];
    if (num < 10) line1 += ' ';
    line1 += num + ' | ';
  }
  line1 += '   |'
  console.log(line1);

  let line2 = '| ';
  if (board[7] < 10) line2 += ' ';
  line2 += board[7] + ' |' + '++++|'.repeat(6) + ' ';
  if (board[0] < 10) line2 += ' ';
  line2 += board[0] + ' |'
  console.log(line2);

  let line3 = '|    | ';
  for (let i = 8; i < 14; i++) {
    let num = board[i];
    if (num < 10) line3 += ' ';
    line3 += num + ' | ';
  }
  line3 += '   |'
  console.log(line3);

  console.log('+'.repeat(41));
}

main();
