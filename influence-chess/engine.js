// engine.js

const PIECES = {
  'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
  'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔',
  'p': '♟', 'P': '♙'
};

function isWhitePiece(p) {
  return p && p === p.toUpperCase();
}

function isBlackPiece(p) {
  return p && p === p.toLowerCase();
}

function generateChess960BackRank() {
  const pieces = Array(8).fill(null);
  const dark = [0, 2, 4, 6], light = [1, 3, 5, 7];
  
  pieces[dark[Math.floor(Math.random() * dark.length)]] = 'b';
  pieces[light[Math.floor(Math.random() * light.length)]] = 'b';

  while (true) {
    const i = Math.floor(Math.random() * 8);
    if (!pieces[i]) {
      pieces[i] = 'q';
      break;
    }
  }

  let knightsPlaced = 0;
  while (knightsPlaced < 2) {
    const i = Math.floor(Math.random() * 8);
    if (!pieces[i]) {
      pieces[i] = 'n';
      knightsPlaced++;
    }
  }

  const empty = pieces.map((p, i) => p === null ? i : -1).filter(i => i !== -1).sort();
  const [r1, k, r2] = [empty[0], empty[1], empty[2]];
  pieces[r1] = 'r';
  pieces[k] = 'k';
  pieces[r2] = 'r';

  return pieces;
}

function createInitialBoard() {
  const whiteBack = generateChess960BackRank().map(p => p.toUpperCase());
  const blackBack = whiteBack.map(p => p.toLowerCase());
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));

  for (let col = 0; col < 8; col++) {
    board[0][col] = blackBack[col];
    board[1][col] = 'p';
    board[6][col] = 'P';
    board[7][col] = whiteBack[col];
  }

  // Get start positions
  const whiteKingCol = whiteBack.findIndex(p => p === 'K');
  const whiteRookCols = whiteBack.map((p, i) => (p === 'R' ? i : null)).filter(i => i !== null);

  const blackKingCol = blackBack.findIndex(p => p === 'k');
  const blackRookCols = blackBack.map((p, i) => (p === 'r' ? i : null)).filter(i => i !== null);

  const castlingInfo = {
    white: {
      kingStartCol: whiteKingCol,
      rookCols: whiteRookCols,
      kingSideTarget: 6, // g1
      queenSideTarget: 2 // c1
    },
    black: {
      kingStartCol: blackKingCol,
      rookCols: blackRookCols,
      kingSideTarget: 6, // g8
      queenSideTarget: 2 // c8
    }
  };

  return { board, whiteBack, blackBack, castlingInfo };
}


function isPathClear(from, to, board) {
  const stepRow = Math.sign(to.row - from.row);
  const stepCol = Math.sign(to.col - from.col);
  let r = from.row + stepRow;
  let c = from.col + stepCol;
  while (r !== to.row || c !== to.col) {
    if (board[r][c]) return false;
    r += stepRow;
    c += stepCol;
  }
  return true;
}

function isSquareAttacked(board, row, col, attackerIsWhite, lastMove = null) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && (attackerIsWhite ? isWhitePiece(piece) : isBlackPiece(piece))) {
        if (isLegalMove(piece, { row: r, col: c }, { row, col }, board, true)) {
          return true;
        }
      }
    }
  }
  return false;
}

function findKingPosition(board, isWhite) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (
        piece &&
        piece.toLowerCase() === 'k' &&
        (isWhite ? isWhitePiece(piece) : isBlackPiece(piece))
      ) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

function isLegalMove(piece, from, to, board, skipCheckTest = false, lastMove = null) {
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  const pieceType = piece.toLowerCase();
  const isWhite = isWhitePiece(piece);
  const target = board[to.row][to.col];

  if (target && isWhitePiece(target) === isWhite) return false;

  let valid = false;
  let enPassantCapture = false;

  switch (pieceType) {
    case 'p': {
      const dir = isWhite ? -1 : 1;
      const startRow = isWhite ? 6 : 1;

      // Standard move
      if (dc === 0 && dr === dir && !target) valid = true;

      // Double-step move
      else if (
        dc === 0 &&
        dr === 2 * dir &&
        from.row === startRow &&
        !target &&
        !board[from.row + dir][from.col]
      ) valid = true;

      // Normal diagonal capture
      else if (Math.abs(dc) === 1 && dr === dir && target && isWhitePiece(target) !== isWhite) {
        valid = true;

      // En passant capture
      } else if (
        Math.abs(dc) === 1 &&
        dr === dir &&
        lastMove &&
        lastMove.piece.toLowerCase() === 'p' &&
        Math.abs(lastMove.to.row - lastMove.from.row) === 2 &&
        lastMove.to.row === from.row &&
        lastMove.to.col === to.col
      ) {
        valid = true;
        enPassantCapture = true;
      }

      break;
    }

    case 'n':
      valid = (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
      break;

    case 'b':
      valid = Math.abs(dr) === Math.abs(dc) && isPathClear(from, to, board);
      break;

    case 'r':
      valid = (dr === 0 || dc === 0) && isPathClear(from, to, board);
      break;

    case 'q':
      valid = (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) && isPathClear(from, to, board);
      break;

    case 'k':
      valid = Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
      break;

    default:
      return false;
  }

  if (!valid) return false;

  if (skipCheckTest) {
    return true;
  }

  // Simulate the move on a temp board to check for checks
  const temp = board.map(row => row.slice());

  // Handle en passant capture on temp board
  if (enPassantCapture) {
    const capturedRow = from.row; // pawn captured is on from.row for en passant
    temp[capturedRow][to.col] = null;
  }

  temp[to.row][to.col] = piece;
  temp[from.row][from.col] = null;

  const kingPos = pieceType === 'k' ? to : findKingPosition(temp, isWhite);

  return !isSquareAttacked(temp, kingPos.row, kingPos.col, !isWhite);
}


function isInCheck(board, currentPlayer, lastMove = null) {
  const isWhite = currentPlayer === 'white';
  const kingPos = findKingPosition(board, isWhite);
  if (!kingPos) return false;
  return isSquareAttacked(board, kingPos.row, kingPos.col, !isWhite);
}

function hasAnyLegalMoves(board, currentPlayer) {
  const isWhite = currentPlayer === 'white';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && isWhitePiece(piece) === isWhite) {
        for (let tr = 0; tr < 8; tr++) {
          for (let tc = 0; tc < 8; tc++) {
            if (isLegalMove(piece, { row: r, col: c }, { row: tr, col: tc }, board)) {
              return true;
            }
          }
        }
      }
    }
  }
  return false;
}

function isCheckmate(board, currentPlayer) {
  return isInCheck(board, currentPlayer) && !hasAnyLegalMoves(board, currentPlayer);
}

export {
  PIECES,
  isWhitePiece,
  isBlackPiece,
  generateChess960BackRank,
  createInitialBoard,
  isLegalMove,
  isInCheck,
  isCheckmate,
  hasAnyLegalMoves,
  findKingPosition,
  isSquareAttacked,
  isPathClear
};
