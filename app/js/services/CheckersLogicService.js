'use strict';

/**
 * This is the logic service for the game Checkers.
 *
 * TO be clear, the state has two different format in the logic service:
 * 1. CheckersState is the game logic state represented as an array.
 *    Each element is a piece whether exist or not and the element's index is
 *    the square index.
 *    e.g. ["EMPTY", "WMAN"]
 * 2. GameApiState is the game API state represented as an object.
 *    A key and value pair represents the square index and the piece itself.
 *    e.g. {"0": "EMPTY, "1": "WMAN"}
 *
 * The move also has two different format:
 * 1. checkersMove is the game logic move represented as an array of Numbers.
 *    If it's a simple move, it will only contains the destination square index.
 *    If it's a jump move, it will contains the jumped (opponent) piece's square
 *    index and the destination square index.
 *    e.g. [13], [05, 10]
 * 2. gameApiMove is the game API move represented as an array of Objects.
 *    Each object is an operation which maybe set, setTurn, endMatchScore, etc.
 *    e.g. [{setTurn: {turnIndex: 1}}, {set: {key: 0, value: "EMPTY"}}]
 */

// Constant. Do not touch!!!
var CONSTANT = (function () {
  var constant = {
    ROW: 8,
    // Since for checkersState I only concern the light squares, therefore
    // I only count the column to 4.
    COLUMN: 4
  };

  return {
    get: function (key) {
      return constant[key];
    }
  };
}());

/**
 * 8x8 game board for reference.
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
 * Clone a object.
 *
 * @param obj
 * @returns {*} the copy
 */
var cloneObj = function (obj) {
  var str = JSON.stringify(obj),
    copy = JSON.parse(str);
  return copy;
};

/**
 * Convert the game API state to game logic state.
 *
 * @param gameApiState the game API state.
 */
var convertGameApiStateToCheckersState = function (gameApiState) {
  var checkersState = [],
    key,
    index;
  for (key in gameApiState) {
    if (gameApiState.hasOwnProperty(key)) {
      index = key;
      checkersState[index] = gameApiState[key];
    }
  }

  return checkersState;
};

/**
 * Calculate the next game api state after the move. If the game is ended, then
 * add the end match score.
 *
 * @param gameApiState the game API state.
 * @param move the game API move.
 * @param turnIndex the turn index which 0 represents the white player and 1
 *        represents the black player.
 * @returns {nextState: {*}} if the game is not ended,
 *          otherwise {nextState: {*}, endMatchScore: [*]}
 */
var getNextState = function (gameApiState, move, turnIndex) {
  var nextState = cloneObj(gameApiState),
    hasWhite = false,
    hasBlack = false,
    index,
    set;

  // Alter the game state according to the moves
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

  // White won
  if (hasWhite && !hasBlack) {
    return {nextState: nextState, endMatchScore: [1, 0]};
  }

  // Black won
  if (!hasWhite && hasBlack) {
    return {nextState: nextState, endMatchScore: [0, 1]};
  }

  // No winner
  return {nextState: nextState};
};

/**
 * Retrieve the detail information of the game API move. Which includes the
 * game logic moves, the operated square's index, the next turn index and the
 * winner if it has one.
 *
 * @param gameApiMove the game API move
 * @returns {
 *    checkersMove: Array,
 *    pieceIndex: number,
 *    setTurnIndex: number,
 *    winner: string
 *  }
 */
var retrieveGameApiMoveDetail = function (gameApiMove) {
  var gameApiMoveDetail = {
      checkersMove: [],
      fromSquareIndex: -1,
      setTurnIndex: -1,
      winner: '',
      checkIsInitialMove: false
    },
    setOperations = [],
    index,
    set;

  for (index in gameApiMove) {
    if (gameApiMove.hasOwnProperty(index)) {
      if (gameApiMove[index].hasOwnProperty('setTurn')) {
        // Get the setTurn value
        gameApiMoveDetail.setTurnIndex =
            gameApiMove[index].setTurn.turnIndex;
      } else if (gameApiMove[index].hasOwnProperty('set')) {
        // Get the set value
        set = gameApiMove[index].set;
        // Store all set operations
        setOperations.push([set.key, set.value]);
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

  // Note the order of operation are important.
  // The first one is the piece the player operates, which is assign to
  // fromSquareIndex.
  gameApiMoveDetail.fromSquareIndex = parseInt(setOperations[0][0], 10);

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
    gameApiMoveDetail.checkIsInitialMove = true;
  }

  return gameApiMoveDetail;
};

/**
 * Check if the possible jump moves array contains the specific jump move.
 *
 * @param possibleJumpMoves an array contains all possible jump moves
 * @param checkerMove the move need to be checked
 * @returns {boolean}
 */
var containJumpMove = function (possibleJumpMoves, checkerMove) {
  var index;

  for (index in possibleJumpMoves) {
    if (possibleJumpMoves.hasOwnProperty(index)) {
      if (possibleJumpMoves[index][0] === checkerMove[0]
          && possibleJumpMoves[index][1] === checkerMove[1]) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Check if the square index is legal
 * @param squareIndex the squareIndex need to be check
 * @returns true if legal, otherwise false
 */
var isLegalIndex = function (squareIndex) {
  return squareIndex >= 0 &&
      squareIndex < CONSTANT.get('ROW') * CONSTANT.get('COLUMN') &&
      squareIndex % 1 === 0;
};

/**
 * Check if the object is empty
 *
 * @param obj the object to be checked
 * @returns true if is empty, otherwise false.
 */
var isEmptyObj = function (obj) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop))
      return false;
  }

  return true;
};

/**
 * Check if the api move is the initial (initialize the game state) move.
 *
 * @param move the game API initialMove
 * @returns true if the move is initial move, otherwise false
 */
var isInitialMove = function (move) {
  var i,
      set;

  if (move === null || move === undefined) return false;
  if (move.length !== move.length) return false;

  // Check setTurn operation is legal, it should be 0 which is still the white
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
 * Check if the square is legally crowned
 *
 * @param square the index of the square holds the piece
 * @param toIndex the index of the square moving to or jumping to
 * @param playerTurnIndex the player's turn index
 * @returns true if the crowned is legal, otherwise false.
 */
var isCrownOk = function (square, toIndex, playerTurnIndex) {
  // Check if the square can be crowned
  if (// For white square, it's moving or jumping to the first row
      (playerTurnIndex === 0 &&
          toIndex >= 0 && toIndex < CONSTANT.get('COLUMN')
          ) ||
    // For black square, it's moving or jumping to the last row
      (playerTurnIndex === 1 &&
          toIndex >= (CONSTANT.get('ROW') - 1) * CONSTANT.get('COLUMN') &&
          toIndex < CONSTANT.get('ROW') * CONSTANT.get('COLUMN'))
      ) {

    if (square.substr(1) === 'MAN') {
      // If the square is still MAN, then it shall be crowned!
      return true;
    }
  }

  return false;
};

/**
 * Check if the move is OK.
 *
 * @param match the match info which contains stateBeforeMove, stateAfterMove,
 *              turnIndexBeforeMove, turnIndexAfterMove, move.
 * @returns return true if the move is ok, otherwise false.
 */
var isMoveOk = function (match) {
  var gameApiStateBeforeMove = match.stateBeforeMove,
      gameApiStateAfterMove = match.stateAfterMove,
      turnIndexBeforeMove = match.turnIndexBeforeMove,
//      turnIndexAfterMove = match.turnIndexAfterMove,
      move = match.move,
      checkersStateBeforeMove =
          convertGameApiStateToCheckersState(gameApiStateBeforeMove),
      nextStateObj =
          getNextState(gameApiStateBeforeMove, move, turnIndexBeforeMove),
      nextGameApiState = nextStateObj.nextState,
      nextCheckersState = convertGameApiStateToCheckersState(nextGameApiState),
      gameApiMoveDetail,
      checkersMove,
      squareIndex,
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
    squareIndex = gameApiMoveDetail.fromSquareIndex;
    setTurnIndex = gameApiMoveDetail.setTurnIndex;
    winner = gameApiMoveDetail.winner;
  }

  //////////////////////////////////////////////////////////////////////////////
  // 2. Check if the move is an initialize move first, only if the moves are
  // different from the simple move or jump move.
  //////////////////////////////////////////////////////////////////////////////
  if (gameApiMoveDetail.checkIsInitialMove) {
    // The initial move must be send by the white player with turn index 0
    if (turnIndexBeforeMove !== 0) {
      return {email: 'x@x.x', emailSubject: 'hacker!',
        emailBody: 'Illegal move!!!'};
    }

    // Check if the game state is empty
    if (!isEmptyObj(gameApiStateBeforeMove)) {
      return {email: 'x@x.x', emailSubject: 'hacker!',
        emailBody: 'Illegal move!!!'};
    }

    // Check if the initial move is legal
    if (isInitialMove(getInitialMove(), move)) {
      return true;
    } else {
      return {email: 'x@x.x', emailSubject: 'hacker!',
        emailBody: 'Illegal move!!!'};
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // 3. Check if the square index and the move's indexes is legal
  //////////////////////////////////////////////////////////////////////////////
  if (!isLegalIndex(squareIndex)) {
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
  // 4. Check if the piece remains the same or is legally crowned.
  //////////////////////////////////////////////////////////////////////////////
  var pieceBeforeMove = gameApiStateBeforeMove[squareIndex];
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
    possibleMoves = getSimpleMoves(checkersStateBeforeMove, squareIndex,
        turnIndexBeforeMove);

    // If the move is among the possible moves, then it's valid
    if (possibleMoves.indexOf(checkersMove[0]) === -1) {
      return {email: 'x@x.x', emailSubject: 'hacker!',
        emailBody: 'Illegal simple moves!!!'};
    }

  } else if (checkersMove.length === 2) {
    // Jump move

    possibleMoves =
        getJumpMoves(checkersStateBeforeMove, squareIndex, turnIndexBeforeMove);

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
 *
 * @param gameApiState the current game API state
 * @param move the move the player made
 * @param yourPlayerIndex the player's turn index
 * @returns {boolean}
 */
var hasWon = function (gameApiState, move, yourPlayerIndex) {

  var nextGameApiState =
          getNextState(cloneObj(gameApiState), move, yourPlayerIndex).nextState,
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
    moves =
        moves.concat(getSimpleMoves(nextCheckersState, i, opponentTurnIndex));
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
var checkMandatoryJump = function (state, yourPlayerIndex) {
  var possibleMoves = [];
  for (var i = 0; i < CONSTANT.get('ROW') * CONSTANT.get('COLUMN'); i += 1) {
    possibleMoves =
        possibleMoves.concat(getJumpMoves(state, i, yourPlayerIndex));
  }

  return possibleMoves.length > 0;
};

/**
 * Get all possible upwards simple moves for a specific piece by its square
 * index.
 *
 * @param checkersState the game logic state
 * @param squareIndex the index of the square holds the piece
 * @return an array of all possible moves
 */
var getSimpleMoveUpMoves = function (checkersState, squareIndex) {
  var moves = [],
    leftUpSquareIndex,
    rightUpSquareIndex;

  // If the piece is in the first row, then there's no way to move upwards.
  if (Math.floor(squareIndex / CONSTANT.get('COLUMN')) === 0) {
    return moves;
  }

  // Since for the even row, the dark square starts first but for the odd row,
  // the light square starts first, so the difference of the indexes between two
  // adjacent rows is not always the same.
  if (Math.floor(squareIndex / CONSTANT.get('COLUMN')) % 2 === 0) {
    // EVEN ROW

    // Check left first
    leftUpSquareIndex = squareIndex - CONSTANT.get('COLUMN') - 1;
    // For the leftmost one, it can only move to the right up side.
    if (squareIndex % CONSTANT.get('COLUMN') !== 0
        && checkersState[leftUpSquareIndex] === 'EMPTY') {
      moves.push(leftUpSquareIndex);
    }

    // Check right
    rightUpSquareIndex = squareIndex - CONSTANT.get('COLUMN');
    if (checkersState[rightUpSquareIndex] === 'EMPTY') {
      moves.push(rightUpSquareIndex);
    }
  } else {
    // ODD ROW

    // Check left first
    leftUpSquareIndex = squareIndex - CONSTANT.get('COLUMN');
    if (checkersState[leftUpSquareIndex] === 'EMPTY') {
      moves.push(leftUpSquareIndex);
    }

    // Check right
    rightUpSquareIndex = squareIndex - CONSTANT.get('COLUMN') + 1;
    // for the rightmost one, it can only move to the left up side.
    if (squareIndex % CONSTANT.get('COLUMN') !== CONSTANT.get('COLUMN') - 1
        && checkersState[rightUpSquareIndex] === 'EMPTY') {
      moves.push(rightUpSquareIndex);
    }
  }

  return moves;
};

/**
 * Get all possible downwards simple moves for a specific piece by its square
 * index.
 *
 * @param checkersState the game logic state
 * @param squareIndex the index of the square holds the piece
 * @return an array of all possible moves
 */
var getSimpleMoveDownMoves = function (checkersState, squareIndex) {
  var moves = [],
    leftUpSquareIndex,
    rightUpSquareIndex;

  // If the piece is in the last row, then there's no way to move downwards.
  if (Math.floor(squareIndex / CONSTANT.get('COLUMN'))
      === (CONSTANT.get('ROW') - 1)) {
    return moves;
  }

  // Since for the even row, the dark square starts first but for the odd row,
  // the light square starts first, so the difference of the indexes between two
  // adjacent rows is not always the same.
  if (Math.floor(squareIndex / CONSTANT.get('COLUMN')) % 2 === 0) {
    // EVEN ROW

    // Check left first
    leftUpSquareIndex = squareIndex + CONSTANT.get('COLUMN') - 1;
    // For the leftmost one, it can only move to the right down side.
    if (squareIndex % CONSTANT.get('COLUMN') !== 0
        && checkersState[leftUpSquareIndex] === 'EMPTY') {
      moves.push(leftUpSquareIndex);
    }

    // Check right
    rightUpSquareIndex = squareIndex + CONSTANT.get('COLUMN');
    if (checkersState[rightUpSquareIndex] === 'EMPTY') {
      moves.push(rightUpSquareIndex);
    }
  } else {
    // ODD ROW

    // Check left first
    leftUpSquareIndex = squareIndex + CONSTANT.get('COLUMN');
    if (checkersState[leftUpSquareIndex] === 'EMPTY') {
      moves.push(leftUpSquareIndex);
    }

    // Check right
    rightUpSquareIndex = squareIndex + CONSTANT.get('COLUMN') + 1;
    // for the rightmost one, it can only move to the left down side.
    if (squareIndex % CONSTANT.get('COLUMN') !== CONSTANT.get('COLUMN') - 1
        && checkersState[rightUpSquareIndex] === 'EMPTY') {
      moves.push(rightUpSquareIndex);
    }
  }

  return moves;
};

/**
 * Check if the jump is valid. The piece can only jump over an opponent piece
 * and the destination square must be empty.
 *
 * @param fromSquare the player's piece which jumps
 * @param jumpedSquare the jumped (opponent) piece which is being jumped over
 * @param toSquare the destination square
 * @returns true if the jump is valid, otherwise false
 */
var isValidJump = function (fromSquare, jumpedSquare, toSquare) {
  return jumpedSquare !== 'EMPTY' &&
    fromSquare.substr(0, 1) !== jumpedSquare.substr(0, 1) &&
    toSquare === 'EMPTY';
};

/**
 * Get all possible upwards jump moves for a specific piece by its square
 * index.
 *
 * @param checkersState the game logic state
 * @param squareIndex the index of the square holds the piece
 * @return an array of all possible moves
 */
var getJumpUpMoves = function (checkersState, squareIndex) {
  var fromSquareIndex = squareIndex,
    fromSquare = checkersState[squareIndex],
    jumpedSquareIndex,
    jumpedSquare,
    toSquareIndex,
    toSquare,
    moves = [];

  // If the piece is in either the first or the second row, then there's no way
  // to jump upwards.
  if (Math.floor(fromSquareIndex / CONSTANT.get('COLUMN')) < 2) {
    return moves;
  }

  // Since for the even row, the dark square starts first but for the odd row,
  // the light square starts first, so the difference of the indexes between two
  // adjacent rows is not always the same.
  if (Math.floor(fromSquareIndex / CONSTANT.get('COLUMN')) % 2 === 0) {
    // Even row

    // Check left first, for the leftmost one, it can only jump right upwards.
    if (fromSquareIndex % CONSTANT.get('COLUMN') !== 0) {
      jumpedSquareIndex = fromSquareIndex - CONSTANT.get('COLUMN') - 1;
      toSquareIndex = fromSquareIndex - 2 * CONSTANT.get('COLUMN') - 1;
      jumpedSquare = checkersState[jumpedSquareIndex];
      toSquare = checkersState[toSquareIndex];

      if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
        moves.push([jumpedSquareIndex, toSquareIndex]);
      }
    }

    // Check right, for the rightmost one, it can only jump left upwards.
    if (fromSquareIndex % CONSTANT.get('COLUMN') !==
        CONSTANT.get('COLUMN') - 1) {
      jumpedSquareIndex = fromSquareIndex - CONSTANT.get('COLUMN');
      toSquareIndex = fromSquareIndex - 2 * CONSTANT.get('COLUMN') + 1;
      jumpedSquare = checkersState[jumpedSquareIndex];
      toSquare = checkersState[toSquareIndex];

      if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
        moves.push([jumpedSquareIndex, toSquareIndex]);
      }
    }
  } else {
    // Odd row

    // Check left first, for the leftmost one, it can only jump right upwards.
    if (fromSquareIndex % CONSTANT.get('COLUMN') !== 0) {
      jumpedSquareIndex = fromSquareIndex - CONSTANT.get('COLUMN');
      toSquareIndex = fromSquareIndex - 2 * CONSTANT.get('COLUMN') - 1;
      jumpedSquare = checkersState[jumpedSquareIndex];
      toSquare = checkersState[toSquareIndex];

      if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
        moves.push([jumpedSquareIndex, toSquareIndex]);
      }
    }

    // Check right, for the rightmost one, it can only jump left upwards.
    if (fromSquareIndex % CONSTANT.get('COLUMN') !== CONSTANT.get('COLUMN') - 1) {
      jumpedSquareIndex = fromSquareIndex - CONSTANT.get('COLUMN') + 1;
      toSquareIndex = fromSquareIndex - 2 * CONSTANT.get('COLUMN') + 1;
      jumpedSquare = checkersState[jumpedSquareIndex];
      toSquare = checkersState[toSquareIndex];

      if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
        moves.push([jumpedSquareIndex, toSquareIndex]);
      }
    }
  }

  return moves;
};

/**
 * Get all possible downwards jump moves for a specific piece by its square
 * index.
 *
 * @param checkersState the game logic state
 * @param squareIndex the index of the square holds the piece
 * @return an array of all possible moves
 */
var getJumpDownMoves = function (checkersState, squareIndex) {
  var fromSquareIndex = squareIndex,
    fromSquare = checkersState[fromSquareIndex],
    jumpedSquareIndex,
    jumpedSquare,
    toSquareIndex,
    toSquare,
    moves = [];

  squareIndex = parseInt(squareIndex, 10);

  // If the piece is in either the last or the second to the last row, then
  // there's no way to jump downwards.
  if (Math.floor(fromSquareIndex / CONSTANT.get('COLUMN')) >=
    CONSTANT.get('ROW') - 2) {
    return moves;
  }

  // Since for the even row, the dark square starts first but for the odd row,
  // the light square starts first, so the difference of the indexes between two
  // adjacent rows is not always the same.
  if (Math.floor(fromSquareIndex / CONSTANT.get('COLUMN')) % 2 === 0) {
    // Even row

    // Check left first, for the leftmost one, it can only jump right downwards.
    if (fromSquareIndex % CONSTANT.get('COLUMN') !== 0) {
      jumpedSquareIndex = fromSquareIndex + CONSTANT.get('COLUMN') - 1;
      toSquareIndex = fromSquareIndex + 2 * CONSTANT.get('COLUMN') - 1;
      jumpedSquare = checkersState[jumpedSquareIndex];
      toSquare = checkersState[toSquareIndex];

      if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
        moves.push([jumpedSquareIndex, toSquareIndex]);
      }
    }

    // Check right, for the rightmost one, it can only jump left downwards.
    if (fromSquareIndex % CONSTANT.get('COLUMN') !== CONSTANT.get('COLUMN') - 1) {
      jumpedSquareIndex = fromSquareIndex + CONSTANT.get('COLUMN');
      toSquareIndex = fromSquareIndex + 2 * CONSTANT.get('COLUMN') + 1;
      jumpedSquare = checkersState[jumpedSquareIndex];
      toSquare = checkersState[toSquareIndex];

      if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
        moves.push([jumpedSquareIndex, toSquareIndex]);
      }
    }
  } else {
    // Odd row

    // Check left first, for the leftmost one, it can only jump right downwards.
    if (fromSquareIndex % CONSTANT.get('COLUMN') !== 0) {
      jumpedSquareIndex = fromSquareIndex + CONSTANT.get('COLUMN');
      toSquareIndex = fromSquareIndex + 2 * CONSTANT.get('COLUMN') - 1;
      jumpedSquare = checkersState[jumpedSquareIndex];
      toSquare = checkersState[toSquareIndex];

      if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
        moves.push([jumpedSquareIndex, toSquareIndex]);
      }
    }

    // Check right, for the rightmost one, it can only jump left downwards.
    if (fromSquareIndex % CONSTANT.get('COLUMN') !== CONSTANT.get('COLUMN') - 1) {
      jumpedSquareIndex = fromSquareIndex + CONSTANT.get('COLUMN') + 1;
      toSquareIndex = fromSquareIndex + 2 * CONSTANT.get('COLUMN') + 1;
      jumpedSquare = checkersState[jumpedSquareIndex];
      toSquare = checkersState[toSquareIndex];

      if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
        moves.push([jumpedSquareIndex, toSquareIndex]);
      }
    }
  }

  return moves;
};

/**
 * Get all possible simple moves for a specific piece by its square index. If it
 * is crowned, also check if it can move one step backward.
 *
 * @param checkersState the game logic state
 * @param squareIndex the index of the square holds the piece
 * @param turnIndex the turn index which 0 represents the white player and 1
 *        represents the black player.
 * @return an array of all possible moves.
 */
var getSimpleMoves = function (checkersState, squareIndex, turnIndex) {
  var moves = [],
    tmpMoves = [],
    fromSquare = checkersState[squareIndex],
    color = fromSquare.substr(0, 1),
    kind = fromSquare.substr(1);

  // Check whether it's the current player's piece first, if not, since the
  // player can not operate it, then no move will be available.
  if (color === "B" && turnIndex === 1) {
    if (kind === 'CRO') {
      // Check backwards move
      tmpMoves = getSimpleMoveUpMoves(checkersState, squareIndex);
      moves = moves.concat(tmpMoves);
    }
    tmpMoves = getSimpleMoveDownMoves(checkersState, squareIndex);
    moves = moves.concat(tmpMoves);
  } else if (color === "W" && turnIndex === 0) {
    if (kind === 'CRO') {
      // Check backwards move
      tmpMoves = getSimpleMoveDownMoves(checkersState, squareIndex);
      moves = moves.concat(tmpMoves);
    }

    tmpMoves = getSimpleMoveUpMoves(checkersState, squareIndex);
    moves = moves.concat(tmpMoves);
  }

  return moves;
};

/**
 * Get all possible jump moves for a specific piece by its square index. If it
 * is crowned, also check if it can jump one step backward.
 *
 * @param checkersState the game logic state
 * @param squareIndex the index of the square holds the piece
 * @param turnIndex the turn index which 0 represents the white player and 1
 *        represents the black player.
 * @return an array of all possible moves
 */
var getJumpMoves = function (checkersState, squareIndex, turnIndex) {
  var moves = [],
    tmpMoves = [],
    fromSquare = checkersState[squareIndex],
    color = fromSquare.substr(0, 1),
    kind = fromSquare.substr(1);

  // Check whether it's the current player's piece first, if not, since the
  // player can not operate it, then no move will be available.
  if (color === "B" && turnIndex === 1) {
    if (kind === 'CRO') {
      // Check backwards jump
      tmpMoves = getJumpUpMoves(checkersState, squareIndex);
      moves = moves.concat(tmpMoves);
    }
    tmpMoves = getJumpDownMoves(checkersState, squareIndex);
    moves = moves.concat(tmpMoves);
  } else if (color === "W" && turnIndex === 0) {
    if (kind === 'CRO') {
      // Check backwards jump
      tmpMoves = getJumpDownMoves(checkersState, squareIndex);
      moves = moves.concat(tmpMoves);
    }

    tmpMoves = getJumpUpMoves(checkersState, squareIndex);
    moves = moves.concat(tmpMoves);
  }

  return moves;
};

/**
 * Get all possible moves for a specific piece by its square index.
 *
 * @param gameApiState the game API state.
 * @param squareIndex the index of the square holds the piece
 * @param turnIndex the turn index which 0 represents the white player and 1
 *        represents the black player.
 * @return an array of all possible move.
 */
var getAllPossibleMoves = function (gameApiState, squareIndex, turnIndex) {
  var checkersState = convertGameApiStateToCheckersState(gameApiState),
    possibleMoves = [];

  // First get all possible jump moves.
  possibleMoves = possibleMoves.concat(getJumpMoves(checkersState, squareIndex, turnIndex));

  // If there's at least one jump move, then no need to check the simple moves
  // since jump move is mandatory.
  if (possibleMoves.length === 0) {
    possibleMoves = possibleMoves.concat(getSimpleMoves(checkersState, squareIndex, turnIndex));
  }

  return possibleMoves;
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
 * Calculate the jumped (opponent) square index
 * @param fromIndex the square index of the piece jumps from
 * @param toIndex the square index of the piece jumps to
 * @returns {number} the jumped (opponent) square index
 */
var calculateJumpedIndex = function (fromIndex, toIndex) {
  var jumpedIndex = -1;
  var column = CONSTANT.get('COLUMN');

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

  return jumpedIndex;
};

/**
 * Get the expected operations for the selectedPieces.
 *
 * @param gameApiState the game API state
 * @param selectedPieces the selected piece indexes in game API format [0 - 31]
 * @param turnIndex the player's turn index
 * @returns {Array} operations
 */
var getExpectedOperations = function (gameApiState, fromIndex, toIndex, turnIndex) {
  var operations = [],
    nextState,
    fromPiece = gameApiState[fromIndex],
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

    jumpedIndex = calculateJumpedIndex(fromIndex, toIndex);

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
    calculateJumpedIndex: calculateJumpedIndex,
    convertGameApiStateToCheckersState: convertGameApiStateToCheckersState,
    hasWon: hasWon,
    cloneObj: cloneObj,
    isEmptyObj: isEmptyObj,
    CONSTANT: CONSTANT
  };
});