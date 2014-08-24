'use strict';

/**
 * This is the logic for the game "Checkers".
 *
 * TO be clear, the state has two different format:
 * 1. CheckersState is represented as an array. Each element's index is the
 * piece's square index. e.g. ["EMPTY", "WMAN"]
 * 2. GameApiState is represented as an object. Each piece is a key and value
 * pair. e.g. {"0": "EMPTY, "1": "WMAN"}
 *
 * Also the move has two different format:
 * 1. checkersMove is represented as an array of Numbers. If it's a simple move,
 * it will only contains the destination square index. If it's a jump move, it
 * will contains the opponent (jumped) piece's index and the destination square
 * index. e.g. [13]
 * 2. gameApiMove is represented as an array of Objects, which includes all
 * operations such as set, setTurn, endMatchScore.
 * e.g. [{setTurn: {turnIndex: 1}}, {set: {key: 0, value: "EMPTY"}}]
 */

// Constant. Do not touch!!!
var CONSTANT = (function () {
  var constant = {
    ROW: 8,
    COLUMN: 4
  };

  return {
    get: function (key) {
      return constant[key];
    }
  };
}());

/**
 * Game board for reference.
 *
 * EVEN | 00 | ** | 01 | ** | 02 | ** | 03 | ** |
 * ODD  | ** | 04 | ** | 05 | ** | 06 | ** | 07 |
 * EVEN | 08 | ** | 09 | ** | 10 | ** | 11 | ** |
 * ODD  | ** | 12 | ** | 13 | ** | 14 | ** | 15 |
 * EVEN | 16 | ** | 17 | ** | 18 | ** | 19 | ** |
 * ODD  | ** | 20 | ** | 21 | ** | 22 | ** | 23 |
 * EVEN | 24 | ** | 25 | ** | 26 | ** | 27 | ** |
 * ODD  | ** | 28 | ** | 29 | ** | 30 | ** | 31 |
 */

/**
 * Get all possible upwards simple moves  or a specific piece.
 *
 * @param checkersState the game state
 * @param pieceIndex the piece's pieceIndex
 * @return an array of all possible move destinations
 */
var getMoveUpMoves = function (checkersState, pieceIndex) {
  var moves = [],
      leftUpIndex,
      rightUpIndex;

  // If the piece is in the first row, then there's no way to move up.
  if (Math.floor(pieceIndex / CONSTANT.get('COLUMN')) === 0) {
    return moves;
  }

  if (Math.floor(pieceIndex / CONSTANT.get('COLUMN')) % 2 === 0) {
    // EVEN ROW

    // Check left first
    leftUpIndex = pieceIndex - CONSTANT.get('COLUMN') - 1;
    // For the leftmost one, it can only move to the right up side.
    if (pieceIndex % CONSTANT.get('COLUMN') !== 0
        && checkersState[leftUpIndex] === 'EMPTY') {
      moves.push(leftUpIndex);
    }

    // Check right
    rightUpIndex = pieceIndex - CONSTANT.get('COLUMN');
    if (checkersState[rightUpIndex] === 'EMPTY') {
      moves.push(rightUpIndex);
    }

  } else {
    // ODD ROW

    // Check left first
    leftUpIndex = pieceIndex - CONSTANT.get('COLUMN');
    if (checkersState[leftUpIndex] === 'EMPTY') {
      moves.push(leftUpIndex);
    }

    // Check right, for the rightmost one, it can only move to the left up side.
    rightUpIndex = pieceIndex - CONSTANT.get('COLUMN') + 1;
    if (pieceIndex % CONSTANT.get('COLUMN') !== CONSTANT.get('COLUMN') - 1
        && checkersState[rightUpIndex] === 'EMPTY') {
      moves.push(rightUpIndex);
    }
  }
  return moves;
};

/**
 * Get all possible downwards simple moves for a specific piece.
 *
 * @param checkersState the game state
 * @param pieceIndex the piece's pieceIndex
 * @return an array of all possible move destinations
 */
var getMoveDownMoves = function (checkersState, pieceIndex) {
  var moves = [],
      leftUpIndex,
      rightUpIndex;

  // If the piece is in the last row, then there's no way to move down.
  if (Math.floor(pieceIndex / CONSTANT.get('COLUMN')) === (CONSTANT.get('ROW') - 1)) {
    return moves;
  }

  if (Math.floor(pieceIndex / CONSTANT.get('COLUMN')) % 2 === 0) {
    // EVEN ROW

    // Check left first, for the leftmost one,
    // it can only move to the right up side
    leftUpIndex = pieceIndex + CONSTANT.get('COLUMN') - 1;
    if (pieceIndex % CONSTANT.get('COLUMN') !== 0
        && checkersState[leftUpIndex] === 'EMPTY') {
      moves.push(leftUpIndex);
    }

    // Check right
    rightUpIndex = pieceIndex + CONSTANT.get('COLUMN');
    if (checkersState[rightUpIndex] === 'EMPTY') {
      moves.push(rightUpIndex);
    }

  } else {
    // ODD ROW

    // Check left first
    leftUpIndex = pieceIndex + CONSTANT.get('COLUMN');
    if (checkersState[leftUpIndex] === 'EMPTY') {
      moves.push(leftUpIndex);
    }

    // Check right, for the rightmost one, it can only move to the left up side.
    rightUpIndex = pieceIndex + CONSTANT.get('COLUMN') + 1;
    if (pieceIndex % CONSTANT.get('COLUMN') !== CONSTANT.get('COLUMN') - 1
        && checkersState[rightUpIndex] === 'EMPTY') {
      moves.push(rightUpIndex);
    }
  }
  return moves;
};

/**
 * Check if the jump is valid.
 *
 * @param ownPiece the player's own piece
 * @param opponentPiece the opponent's (jumped) piece
 * @param targetCell the target cell
 * @returns true if the jump is valid, otherwise false
 */
var validateJump = function (ownPiece, opponentPiece, targetCell) {
  return opponentPiece !== 'EMPTY'
    // Can only jump over an opponent piece
      && ownPiece.substr(0, 1) !== opponentPiece.substr(0, 1)
    // Can not jump over an already jumped (captured) piece
      && opponentPiece.length === 4
      && targetCell === 'EMPTY';
};

/**
 * Get all possible upwards jump moves for a specific piece.
 *
 * @param checkersState the game state.
 * @param pieceIndex the piece's pieceIndex.
 * @return an array of all possible move paths. Including the jumped piece index
 *  and target cell index.
 */
var getJumpUpMoves = function (checkersState, pieceIndex) {
  var ownPiece = checkersState[pieceIndex],
      opponentPieceIndex,
      opponentPiece,
      targetCellIndex,
      targetCell,
      moves = [];

  if (Math.floor(pieceIndex / CONSTANT.get('COLUMN')) < 2) {
    return moves;
  }

  if (Math.floor(pieceIndex / CONSTANT.get('COLUMN')) % 2 === 0) {
    // Even row

    // Check left
    if (pieceIndex % CONSTANT.get('COLUMN') !== 0) {
      opponentPieceIndex = pieceIndex - CONSTANT.get('COLUMN') - 1;
      targetCellIndex = pieceIndex - 2 * CONSTANT.get('COLUMN') - 1;
      opponentPiece = checkersState[opponentPieceIndex];
      targetCell = checkersState[targetCellIndex];

      if (validateJump(ownPiece, opponentPiece, targetCell)) {
        moves.push([opponentPieceIndex, targetCellIndex]);
      }
    }

    // Check right
    if (pieceIndex % CONSTANT.get('COLUMN') !== CONSTANT.get('COLUMN') - 1) {
      opponentPieceIndex = pieceIndex - CONSTANT.get('COLUMN');
      targetCellIndex = pieceIndex - 2 * CONSTANT.get('COLUMN') + 1;
      opponentPiece = checkersState[opponentPieceIndex];
      targetCell = checkersState[targetCellIndex];

      if (validateJump(ownPiece, opponentPiece, targetCell)) {
        moves.push([opponentPieceIndex, targetCellIndex]);
      }
    }
  } else {
    // Odd row

    // Check left
    if (pieceIndex % CONSTANT.get('COLUMN') !== 0) {
      opponentPieceIndex = pieceIndex - CONSTANT.get('COLUMN');
      targetCellIndex = pieceIndex - 2 * CONSTANT.get('COLUMN') - 1;
      opponentPiece = checkersState[opponentPieceIndex];
      targetCell = checkersState[targetCellIndex];

      if (validateJump(ownPiece, opponentPiece, targetCell)) {
        moves.push([opponentPieceIndex, targetCellIndex]);
      }
    }

    // Check right
    if (pieceIndex % CONSTANT.get('COLUMN') !== CONSTANT.get('COLUMN') - 1) {
      opponentPieceIndex = pieceIndex - CONSTANT.get('COLUMN') + 1;
      targetCellIndex = pieceIndex - 2 * CONSTANT.get('COLUMN') + 1;
      opponentPiece = checkersState[opponentPieceIndex];
      targetCell = checkersState[targetCellIndex];

      if (validateJump(ownPiece, opponentPiece, targetCell)) {
        moves.push([opponentPieceIndex, targetCellIndex]);
      }
    }
  }

  return moves;
};

/**
 * Get all possible downwards jump moves for a specific piece.
 *
 * @param checkersState the game state.
 * @param pieceIndex the piece's pieceIndex.
 * @return an array of all possible move paths. Including the jumped piece index
 *  and target cell index.
 */
var getJumpDownMoves = function (checkersState, pieceIndex) {
  var ownPiece = checkersState[pieceIndex],
      opponentPieceIndex,
      opponentPiece,
      targetCellIndex,
      targetCell,
      moves = [];

  if (Math.floor(pieceIndex / CONSTANT.get('COLUMN')) >= CONSTANT.get('ROW') - 2) {
    return moves;
  }

  if (Math.floor(pieceIndex / CONSTANT.get('COLUMN')) % 2 === 0) {
    // Even row

    // Check left
    if (pieceIndex % CONSTANT.get('COLUMN') !== 0) {
      opponentPieceIndex = pieceIndex + CONSTANT.get('COLUMN') - 1;
      targetCellIndex = pieceIndex + 2 * CONSTANT.get('COLUMN') - 1;
      opponentPiece = checkersState[opponentPieceIndex];
      targetCell = checkersState[targetCellIndex];

      if (validateJump(ownPiece, opponentPiece, targetCell)) {
        moves.push([opponentPieceIndex, targetCellIndex]);
      }
    }

    // Check right
    if (pieceIndex % CONSTANT.get('COLUMN') !== CONSTANT.get('COLUMN') - 1) {
      opponentPieceIndex = pieceIndex + CONSTANT.get('COLUMN');
      targetCellIndex = pieceIndex + 2 * CONSTANT.get('COLUMN') + 1;
      opponentPiece = checkersState[opponentPieceIndex];
      targetCell = checkersState[targetCellIndex];

      if (validateJump(ownPiece, opponentPiece, targetCell)) {
        moves.push([opponentPieceIndex, targetCellIndex]);
      }
    }
  } else {
    // Odd row

    // Check left
    if (pieceIndex % CONSTANT.get('COLUMN') !== 0) {
      opponentPieceIndex = pieceIndex + CONSTANT.get('COLUMN');
      targetCellIndex = pieceIndex + 2 * CONSTANT.get('COLUMN') - 1;
      opponentPiece = checkersState[opponentPieceIndex];
      targetCell = checkersState[targetCellIndex];

      if (validateJump(ownPiece, opponentPiece, targetCell)) {
        moves.push([opponentPieceIndex, targetCellIndex]);
      }
    }

    // Check right
    if (pieceIndex % CONSTANT.get('COLUMN') !== CONSTANT.get('COLUMN') - 1) {
      opponentPieceIndex = pieceIndex + CONSTANT.get('COLUMN') + 1;
      targetCellIndex = pieceIndex + 2 * CONSTANT.get('COLUMN') + 1;
      opponentPiece = checkersState[opponentPieceIndex];
      targetCell = checkersState[targetCellIndex];

      if (validateJump(ownPiece, opponentPiece, targetCell)) {
        moves.push([opponentPieceIndex, targetCellIndex]);
      }
    }
  }

  return moves;
};

/**
 * Get all possible simple moves for a specific piece. If it is crown,
 * also check if it can move one step backward.
 *
 * @param checkersState the game state.
 * @param pieceIndex the piece pieceIndex.
 * @return an array of all possible move destinations.
 */
var getSimpleMoves = function (checkersState, pieceIndex, turnIndex) {
  var moves = [],
      tmpMoves = [],
      piece = checkersState[pieceIndex],
      color = piece.substr(0, 1),
      kind = piece.substr(1);

  if (color === "B" && turnIndex === 1) {
    if (kind === 'CRO') {
      tmpMoves = getMoveUpMoves(checkersState, pieceIndex);
      moves = moves.concat(tmpMoves);
    }

    tmpMoves = getMoveDownMoves(checkersState, pieceIndex);
    moves = moves.concat(tmpMoves);
  } else if (color === "W" && turnIndex === 0) {
    if (kind === 'CRO') {
      tmpMoves = getMoveDownMoves(checkersState, pieceIndex);
      moves = moves.concat(tmpMoves);
    }

    tmpMoves = getMoveUpMoves(checkersState, pieceIndex);
    moves = moves.concat(tmpMoves);
  }

  return moves;
};

/**
 * Get all possible jump moves for a specific piece. If it is crown,
 * also check if it can jump backward.
 *
 * @param checkersState the game state.
 * @param pieceIndex the piece pieceIndex.
 * @param turnIndex the turn index.
 * @return an array of all possible move paths. Including the jumped piece index
 *  and target cell index.
 */
var getJumpMoves = function (checkersState, pieceIndex, turnIndex) {
  var moves = [],
      tmpMoves = [],
      piece = checkersState[pieceIndex],
      color = piece.substr(0, 1),
      kind = piece.substr(1);

  if (color === "B" && turnIndex === 1) {
    if (kind === 'CRO') {
      tmpMoves = getJumpUpMoves(checkersState, pieceIndex);
      moves = moves.concat(tmpMoves);
    }
    tmpMoves = getJumpDownMoves(checkersState, pieceIndex);
    moves = moves.concat(tmpMoves);
  } else if (color === "W" && turnIndex === 0) {
    if (kind === 'CRO') {
      tmpMoves = getJumpDownMoves(checkersState, pieceIndex);
      moves = moves.concat(tmpMoves);
    }

    tmpMoves = getJumpUpMoves(checkersState, pieceIndex);
    moves = moves.concat(tmpMoves);
  }

  return moves;
};

/**
 * Get all possible moves for a specific piece.
 * @param checkersState the game API state.
 * @param pieceIndex the piece pieceIndex.
 * @param turnIndex the turnIndex.
 * @return an array of all possible move paths.
 */
var getAllPossibleMoves = function (gameApiState, pieceIndex, turnIndex) {
  var checkersState = convertGameApiStateToCheckersState(gameApiState),
      possibleMoves = [];

  possibleMoves = possibleMoves.concat(getJumpMoves(checkersState, pieceIndex, turnIndex));

  if (possibleMoves.length === 0) {
    possibleMoves = possibleMoves.concat(getSimpleMoves(checkersState, pieceIndex, turnIndex));
  }

  return possibleMoves;
};

/**
 * Clone a object.
 *
 * @param obj
 * @returns {*}
 */
var cloneObj = function (obj) {
  var str = JSON.stringify(obj),
      copy = JSON.parse(str);
  return copy;
};

/**
 * A function takes the state in game API format and convert it to a
 * array format for later calculation convenience.
 * @param gameApiState the game state in game API format.
 */
var convertGameApiStateToCheckersState = function (gameApiState) {
  var key,
      index,
      checkersState = [];
  for (key in gameApiState) {
    if (gameApiState.hasOwnProperty(key)) {
      index = key;
      checkersState[index] = gameApiState[key];
    }
  }

  return checkersState;
};

/**
 * Takes the game API state, the player's move, turn index and return a
 * calculated new game API state after the move is made.
 *
 * @param gameApiState the game state in game API format.
 * @param move array which contains the piece's original position and new
 *  target position.
 * @param turnIndex the current player's index.
 */
var getNextState = function (gameApiState, move, turnIndex) {
  var nextState = cloneObj(gameApiState),
      hasWhite = false,
      hasBlack = false,
      index,
      set;
  for (index in move) {
    if (move.hasOwnProperty(index) && move[index].hasOwnProperty('set')) {
      set = move[index].set;
      nextState[set.key] = set.value;
    }
  }

  // Check if the game ends
  for (index in nextState) {
    if (nextState.hasOwnProperty(index)) {
      if (nextState[index].substr(0, 1) === 'W') {
        hasWhite = true;
      } else if (nextState[index].substr(0, 1) === 'B') {
        hasBlack = true;
      }
    }
  }

  if (hasWhite && !hasBlack) {
    // White won
    return {nextState: nextState, endMatchScore: [1, 0]};
  }

  if (!hasWhite && hasBlack) {
    // Black won
    return {nextState: nextState, endMatchScore: [0, 1]};
  }

  // No winner
  return {nextState: nextState};
};

/**
 * Retrieve the detail information from the game API move. Which includes the
 * moving path array, the operated piece's index, the next turn index and the
 * winner if it has one.
 *
 * @param gameApiMove the game API move
 * @returns {{
 *    checkersMove: Array,
 *    pieceIndex: number,
 *    setTurnIndex: number,
 *    winner: string
 *  }}
 */
var retrieveGameApiMoveDetail = function (gameApiMove) {
  var gameApiMoveDetail = {
        checkersMove: [],
        pieceIndex: -1,
        setTurnIndex: -1,
        winner: ' ',
        checkInitialMove: false,
        checkIsCrownedLegal: false
      },
      setOperations = [],
      index,
      set;
  for (index in gameApiMove) {
    if (gameApiMove.hasOwnProperty(index)) {
      if (gameApiMove[index].hasOwnProperty('setTurn')) {
        // Get the setTurn value
        gameApiMoveDetail.setTurnIndex = gameApiMove[index].setTurn['turnIndex'];
      } else if (gameApiMove[index].hasOwnProperty('set')) {
        // Store all set operations
        set = gameApiMove[index].set;
        setOperations.push([set.key, set.value]);
        // It could be crowned.
        if (set.value.substr(1) === 'CRO') {
          gameApiMoveDetail.checkIsCrownedLegal = true;
        }
      } else if (gameApiMove[index].hasOwnProperty('endMatch')) {
        // Get the endMatch if it exist and calculate the winner
        if (gameApiMove[index].endMatch.endMatchScores[0] === 0) {
          gameApiMoveDetail.winner = 'B';
        } else {
          gameApiMoveDetail.winner = 'W';
        }
      }
    }
  }

  // Note the order of operation are important, the first one is the piece the
  // player operates, which is assign to pieceIndex.
  gameApiMoveDetail.pieceIndex = parseInt(setOperations[0][0], 10);

  if (setOperations.length === 2) {
    // If there's 2 set operations, then it's a simple move and the second set
    // operation is for the destination square.
    gameApiMoveDetail.checkersMove.push(parseInt(setOperations[1][0], 10));
  } else if (setOperations.length === 3) {
    // If there's 3 set operations, then it's a jump move and the second set
    // operation is for the opponent (jumped) piece and the third set operation
    // is for the destination square.
    gameApiMoveDetail.checkersMove.push(parseInt(setOperations[1][0], 10));
    gameApiMoveDetail.checkersMove.push(parseInt(setOperations[2][0], 10));
  } else {
    // If the set operations are more than 3, than it may be a initial move,
    // mark it here and check it later in isMoveOk.
    gameApiMoveDetail.checkInitialMove = true;
  }

  return gameApiMoveDetail;
};

/**
 * Check if the jump move path is possible by checking if it exists in the
 * possible moves array.
 *
 * @param possibleMoves an array contains all possible moves
 * @param checkerMove the move need to be checked
 * @returns {boolean}
 */
var containJumpMove = function (possibleMoves, checkerMove) {
  var index;
  for (index in possibleMoves) {
    if (possibleMoves[index][0] === checkerMove[0]
        && possibleMoves[index][1] === checkerMove[1]) {
      return true;
    }
  }
  return false;
};

/**
 * Check if hte index is legal
 * @param index the index need to be check
 * @returns {boolean} true if legal, otherwise false
 */
var isLegalIndex = function (index) {
  return index >= 0 && index < CONSTANT.get('ROW') * CONSTANT.get('COLUMN')
      && index % 1 === 0;
};

/**
 * Check if the object is empty
 *
 * @param obj the object to be checked
 * @returns {boolean}
 */
var isEmptyObj = function (obj) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop))
      return false;
  }

  return true;
};

/**
 * Check if two moves are equal
 * @param initialMove the game API initialMove
 * @param move2 the game API move to be checked
 * @returns {boolean}
 */
var isInitialMove = function (move) {
  var i,
      set,
      piece;

  if (move === null || move === undefined) return false;
  if (move.length !== move.length) return false;

  // Check setTurn operation
  if (!move[0].hasOwnProperty('setTurn') || move[0].setTurn['turnIndex'] !== 0) {
    return false;
  }

  // Check set operations
  for (i = 0; i < CONSTANT.get('ROW') * CONSTANT.get('COLUMN'); i += 1) {
    // If the operation is no set, return false
    if (move[i + 1].hasOwnProperty('set')) {
      set = move[i + 1].set;
      // If the set operation does not set the correct square, return false
      if ((i < 12 && (set.key !== i || set.value !== 'BMAN'))
          || (i >= 12 && i < 20) && (set.key !== i || set.value !== 'EMPTY')
          || (i >= 20 && i < 32) && (set.key !== i || set.value !== 'WMAN')) {
        return false;
      }
    } else {
      return false;
    }
  }

  return true;
};

/**
 * Check if the crown is ok and legal
 * @param piece the piece to be crowned
 * @param toIndex the piece moving to or jumping to
 * @param playerTurnIndex the player's turn index
 * @returns {boolean}
 */
var isCrownOk = function (piece, toIndex, playerTurnIndex) {
  // Check if the piece can be crowned
  if ((playerTurnIndex === 0 &&
      toIndex >= 0 && toIndex < CONSTANT.get('COLUMN')
      ) ||
      (playerTurnIndex === 1 &&
          toIndex >= (CONSTANT.get('ROW') - 1) * CONSTANT.get('COLUMN') &&
          toIndex < CONSTANT.get('ROW') * CONSTANT.get('COLUMN'))
      ) {
    // For white piece, it's moving or jumping to the first row
    // For black piece, it's moving or jumping to the last row
    if (piece.substr(1) === 'MAN') {
      // If the piece is still MAN, then it shall be crowned!
      return true;
    }
  }

  return false;
};

/**
 * Check if the move is OK.
 *
 * @param match
 * @returns {boolean}
 */
var isMoveOk = function (match) {
  var gameApiStateBeforeMove = match.stateBeforeMove,
      gameApiStateAfterMove = match.stateAfterMove,
      turnIndexBeforeMove = match.turnIndexBeforeMove,
      turnIndexAfterMove = match.turnIndexAfterMove,
      move = match.move,
      initialMove,
      checkersStateBeforeMove =
          convertGameApiStateToCheckersState(gameApiStateBeforeMove),
      nextStateObj =
          getNextState(gameApiStateBeforeMove, move, turnIndexBeforeMove),
      nextGameApiState = nextStateObj.nextState,
      nextCheckersState = convertGameApiStateToCheckersState(nextGameApiState),
      gameApiMoveDetail,
      checkersMove,
      pieceIndex,
      setTurnIndex,
      winner,
      isSimpleMove = true,
      possibleMoves = [],
      index,
      i;

  //////////////////////////////////////////////////////////////////////////////
  // 1. Check if the state is empty (need initialize move)
  //////////////////////////////////////////////////////////////////////////////
  if (isEmptyObj(gameApiStateBeforeMove) && move.length === 0) {
    // If the state is empty and no move is made, then it's the initial state
    return true;
  } else {
    // Otherwise retrieve the move details
    gameApiMoveDetail = retrieveGameApiMoveDetail(move);
    checkersMove = gameApiMoveDetail.checkersMove;
    pieceIndex = gameApiMoveDetail.pieceIndex;
    setTurnIndex = gameApiMoveDetail.setTurnIndex;
    winner = gameApiMoveDetail.winner;
  }

  //////////////////////////////////////////////////////////////////////////////
  // 2. Check if the move is an initial move first, only if the moves are
  // different from the simple move or jump move.
  //////////////////////////////////////////////////////////////////////////////
  if (gameApiMoveDetail.checkInitialMove) {
    if (turnIndexBeforeMove !== 0) {
      return {email: 'x@x.x', emailSubject: 'hacker!',
        emailBody: 'Illegal move!!!'};
    }

    // First check if the game state is empty
    if (!isEmptyObj(gameApiStateBeforeMove)) {
      return {email: 'x@x.x', emailSubject: 'hacker!',
        emailBody: 'Illegal move!!!'};
    }

    initialMove = getInitialMove();
    if (isInitialMove(initialMove, move)) {
      return true;
    } else {
      return {email: 'x@x.x', emailSubject: 'hacker!',
        emailBody: 'Illegal move!!!'};
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // 3. Check if the all piece's index is legal
  //////////////////////////////////////////////////////////////////////////////
  if (!isLegalIndex(pieceIndex)) {
    return {email: 'x@x.x', emailSubject: 'hacker!',
      emailBody: 'Illegal index'};
  }
  for (i = 0; i < checkersMove.length; i += 1) {
    if (!isLegalIndex(checkersMove[i])) {
      return {email: 'x@x.x', emailSubject: 'hacker!',
        emailBody: 'Illegal index'};
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // 4. Check if the piece remains the same or be legally crowned.
  //////////////////////////////////////////////////////////////////////////////
  var pieceBeforeMove = gameApiStateBeforeMove[pieceIndex];
  var pieceIndexAfterMove = checkersMove[checkersMove.length - 1];
  var pieceAfterMove = gameApiStateAfterMove[pieceIndexAfterMove];

  // Check if the piece's color is changed which is illegal all time
  if (pieceBeforeMove.substr(0, 1) !== pieceAfterMove.substr(0, 1)) {
    return {email: 'x@x.x', emailSubject: 'hacker!',
      emailBody: 'Illegal change color!!!'};
  }

  // Check if the piece is uncrowned which is illegal all time
  if (pieceBeforeMove.substr(1) === 'CRO' && pieceBeforeMove.substr(1) !== pieceAfterMove.substr(1)) {

    return {email: 'x@x.x', emailSubject: 'hacker!',
      emailBody: 'Illegal uncrowned!!!'};
  }

  // The piece is crowned, check if it is legal
  if (pieceBeforeMove.substr(1) === 'MAN' && pieceBeforeMove.substr(1) !== pieceAfterMove.substr(1)) {
    // Check if the crowned move is legal
    if (pieceBeforeMove.substr(1) === 'MAN' && !isCrownOk(pieceBeforeMove, pieceIndexAfterMove, turnIndexBeforeMove)) {
      // Only if the piece is original a MAN that we should check whether it
      // is legally crowned.
      return {email: 'x@x.x', emailSubject: 'hacker!',
        emailBody: 'Illegal crowned!!!'};
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // 5. Check if the move is legal
  //////////////////////////////////////////////////////////////////////////////
  if (checkersMove.length === 1) {
    // Simple move

    // Check all pieces if there are any mandatory jumps
    for (index in checkersStateBeforeMove) {
      if ((checkersStateBeforeMove[index].substr(0, 1) === 'W'
          && turnIndexBeforeMove === 0)
          || (checkersStateBeforeMove[index].substr(0, 1) === 'B'
              && turnIndexBeforeMove === 1)) {
        if (getJumpMoves(checkersStateBeforeMove, parseInt(index, 10),
            turnIndexBeforeMove).length !== 0) {
          // Mandatory jump is ignored, hacker!!!
          return {email: 'x@x.x', emailSubject: 'hacker!',
            emailBody: 'Illegal ignore mandatory jump!!!'};
        }
      }
    }

    // No mandatory jump
    possibleMoves = getSimpleMoves(checkersStateBeforeMove, pieceIndex,
        turnIndexBeforeMove);

    // If the move is among the possible moves, then it's valid
    if (possibleMoves.indexOf(checkersMove[0]) === -1) {
      return {email: 'x@x.x', emailSubject: 'hacker!',
        emailBody: 'Illegal simple moves!!!'};
    }

  } else if (checkersMove.length === 2) {
    // Jump move

    possibleMoves =
        getJumpMoves(checkersStateBeforeMove, pieceIndex, turnIndexBeforeMove);
    // If the move is among the possible moves, then it's valid
    if (!containJumpMove(possibleMoves, checkersMove, turnIndexBeforeMove)) {
      return {email: 'x@x.x', emailSubject: 'hacker!',
        emailBody: 'Illegal jumps!!!'};
    }

    isSimpleMove = false;
  } else {
    return {email: 'x@x.x', emailSubject: 'hacker!',
      emailBody: 'Illegal moves!!!'};
  }

  //////////////////////////////////////////////////////////////////////////////
  // 6. Check the set turn, it's only legal to perform another move if there
  // more jump moves available for the operated piece.
  //////////////////////////////////////////////////////////////////////////////
  if (!isSimpleMove) {
    // Check if the set turn index is legal
    // For the same piece, check if it can do more jump moves
    if (getJumpMoves(nextCheckersState, checkersMove[1],
        turnIndexBeforeMove).length > 0) {
      // If the same piece can do more jumps, then the turnIndex remains.
      if (setTurnIndex !== turnIndexBeforeMove) {
        return {email: 'x@x.x', emailSubject: 'hacker!',
          emailBody: 'Illegal setTurn'};
      }
    } else {
      // It the same piece can't do more jumps, then the turnIndex will change.
      if (setTurnIndex === turnIndexBeforeMove) {
        return {email: 'x@x.x', emailSubject: 'hacker!',
          emailBody: 'Illegal setTurn!'};
      }
    }
  } else {
    // The turnIndex must change if the move is just a simple move.
    if (setTurnIndex === turnIndexBeforeMove) {
      return {email: 'x@x.x', emailSubject: 'hacker!',
        emailBody: 'Illegal setTurn!'};
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // 6. Check if the game ends properly
  //////////////////////////////////////////////////////////////////////////////
  if (winner === 'B') {
    if (!(nextStateObj.hasOwnProperty('endMatchScore')
        && nextStateObj.endMatchScore[0] === 0)) {
      return {email: 'x@x.x', emailSubject: 'hacker!',
        emailBody: 'Illegal winner'};
    }
  }

  if (winner === 'W') {
    if (!(nextStateObj.hasOwnProperty('endMatchScore')
        && nextStateObj.endMatchScore[1] === 0)) {
      return {email: 'x@x.x', emailSubject: 'hacker!',
        emailBody: 'Illegal winner'};
    }
  }

  return true;
};

/**
 * Each time the player makes a move, check whether the opponent player can make
 * any move in the new state, if he can than the game is not over yet, otherwise
 * the game is ended.
 * @param gameApiState the current game API state
 * @param operations the operations the player made
 * @param yourPlayerIndex the player's turn index
 * @returns {boolean}
 */
var hasWon = function (gameApiState, operations, yourPlayerIndex) {

  var nextGameApiState = getNextState(cloneObj(gameApiState), operations, yourPlayerIndex).nextState,
      nextCheckersState = convertGameApiStateToCheckersState(nextGameApiState),
      opponentTurnIndex = 1 - yourPlayerIndex,
      moves = [];

  for (var i = 0; i < nextCheckersState.length; i += 1) {
    moves = moves.concat(getJumpMoves(nextCheckersState, i, opponentTurnIndex));
    if (moves.length > 0) {
      return false;
    }
  }

  for (var i = 0; i < nextCheckersState.length; i += 1) {
    moves = moves.concat(getSimpleMoves(nextCheckersState, i, opponentTurnIndex));
    if (moves.length > 0) {
      return false;
    }
  }

  // The opponent has no move to made, whether he/she has or has not any pieces
  // left on the board.
  return true;
};

/**
 * Check if there's any mandatory jumps.
 *
 * @returns {boolean}
 */
var checkMandatoryJump = function(state, yourPlayerIndex) {
  var possibleMoves = [];
  for (var i = 0; i < CONSTANT.get('ROW') * CONSTANT.get('COLUMN'); i += 1) {
    possibleMoves = possibleMoves.concat(getJumpMoves(state, i, yourPlayerIndex));
  }

  return possibleMoves.length > 0;
};

/**
 * Get the initial moves (operations).
 *
 * @returns {Array}
 */
var getInitialMove = function () {
  var operations = [],
      i;

  operations.push({setTurn: {turnIndex: 0}});

  for (i = 0; i < (CONSTANT.get('ROW') - 2)
      / 2 * CONSTANT.get('COLUMN');
       i += 1) {
    operations.push({set: {key: i, value: 'BMAN'}});
  }

  for (i = (CONSTANT.get('ROW') / 2 - 1) * CONSTANT.get('COLUMN');
       i < (CONSTANT.get('ROW') / 2 + 1) * CONSTANT.get('COLUMN'); i += 1) {
    operations.push({set: {key: i, value: 'EMPTY'}});
  }

  for (i = (CONSTANT.get('ROW') / 2 + 1) * CONSTANT.get('COLUMN');
       i < CONSTANT.get('ROW') * CONSTANT.get('COLUMN'); i += 1) {
    operations.push({set: {key: i, value: 'WMAN'}});
  }

  return operations;
};

/**
 * Get the expected operations for the selectedPieces.
 *
 * @param gameApiState the game API state
 * @param selectedPieces the selected piece indexes in game API format [0 - 31]
 * @param turnIndex the player's turn index
 * @returns {Array} operations
 */
var getExpectedOperations = function (gameApiState, selectedPieces, turnIndex) {
  var operations = [],
      nextState,
      fromIndex = selectedPieces[0],
      fromPiece = gameApiState[fromIndex],
      toIndex = selectedPieces[1],
      jumpedIndex,
      column = CONSTANT.get('COLUMN'),
      isSimpleMove = [column - 1, column, column + 1].indexOf(Math.abs(toIndex - fromIndex)) !== -1,
      isJumpMove = [2 * column + 1, 2 * column - 1].indexOf(Math.abs(toIndex - fromIndex)) !== -1;

  if (isSimpleMove) {
    // Simple move

    operations.push({set: {key: fromIndex, value: "EMPTY"}});
    operations.push({set: {key: toIndex, value: fromPiece}});
//    operations.push({setTurn: {turnIndex: 1 - turnIndex}});
  } else if (isJumpMove) {
    // Jump move

    if (Math.floor(fromIndex / CONSTANT.get('COLUMN')) % 2 === 0) {
      // EVEN
      switch (toIndex - fromIndex) {
        case 2 * column + 1:
          jumpedIndex = fromIndex + column;
          break;
        case 2 * column - 1:
          jumpedIndex = fromIndex + column - 1;
          break;
        case -(2 * column + 1):
          jumpedIndex = fromIndex - column - 1;
          break;
        case -(2 * column - 1):
          jumpedIndex = fromIndex - column;
          break;
      }
    } else {
      // ODD
      switch (toIndex - fromIndex) {
        case 2 * column + 1:
          jumpedIndex = fromIndex + column + 1;
          break;
        case 2 * column - 1:
          jumpedIndex = fromIndex + column;
          break;
        case -(2 * column + 1):
          jumpedIndex = fromIndex - column;
          break;
        case -(2 * column - 1):
          jumpedIndex = fromIndex - column + 1;
          break;
      }
    }

    operations.push({set: {key: fromIndex, value: "EMPTY"}});
    operations.push({set: {key: jumpedIndex, value: "EMPTY"}});
    operations.push({set: {key: toIndex, value: fromPiece}});
  }



  // Check if the piece can be crowned
  if (isCrownOk(fromPiece, toIndex, turnIndex)) {
    // Note that the order for the operations are critical, don't change it!
    // It'll break this code below...
    operations[operations.length - 1] = {set: {key: toIndex, value: fromPiece.substr(0, 1) + 'CRO'}};
  }

  if (isJumpMove) {
    nextState = getNextState(cloneObj(gameApiState), operations, turnIndex).nextState;

    // Check whether the player can make another jump for the same piece
    if (getJumpMoves(nextState, toIndex, turnIndex).length > 0) {
      operations.push({setTurn: {turnIndex: turnIndex}});
    } else {
      operations.push({setTurn: {turnIndex: 1 - turnIndex}});
    }
  } else if (isSimpleMove) {
    operations.push({setTurn: {turnIndex: 1 - turnIndex}});
  }

  // Check the player has won or not after the move
  if (hasWon(gameApiState, operations, turnIndex)) {
    if (turnIndex === 0) {
      operations.push(({endMatch: {endMatchScores: [1, 0]}}));
    } else {
      operations.push(({endMatch: {endMatchScores: [0, 1]}}));
    }
  }

  return operations;
};

/**
 * Checkers logic service.
 */
checkers.factory('checkersLogicService', function () {
  return {
    isMoveOk: isMoveOk,
    getNextState: getNextState,
    getInitialMove: getInitialMove,
    getExpectedOperations: getExpectedOperations,
    getJumpMoves: getJumpMoves,
    getSimpleMoves: getSimpleMoves,
    getAllPossibleMoves: getAllPossibleMoves,
    checkMandatoryJump: checkMandatoryJump,
    cloneObj: cloneObj,
    isEmptyObj: isEmptyObj,
    CONSTANT: CONSTANT
  };
});