'use strict';

/**
 * This is the logic service for Checkers.
 *
 * TO be clear in case of confusion, the state has two different format in the
 * logic service:
 *
 * 1. LogicState: It's represented as an array with length equals to 32. Each
 *                element represents a dark square content and each index
 *                represents a dark square's index (0 - 31).
 *    e.g. ["BMAN", ..., "EMPTY", ... "WMEN"]
 *
 * 2. GameApiState: It's represented as an object with size equals to 32. Each
 *                  key and value pair represents a dark square index (0 - 31)
 *                  and the content within it.
 *    e.g. {0: "BMAN, ..., 12: "EMPTY", 20: "WMAN", ...}
 *
 * The move also has two different format in the logic service:
 *
 * 1. LogicMove: It's represented as an array of the move path, which is the
 *               dark square's index. If it's a simple move, it will only
 *               contains 1 index. If it's a jump move, it will contains two
 *               indexes which are the jumped (opponent) piece's square index
 *               and the destination empty square index.
 *    e.g. [13], [05, 10]
 *
 * 2. GameApiMove: It's represented as an array of Objects. Each object is an
 *                 operation which maybe set, setTurn, endMatchScore and etc...
 *    e.g. [{setTurn: {turnIndex: 1}}, {set: {key: 0, value: "EMPTY"}}]
 */



/**
 * Checkers logic service.
 */
checkers.factory('checkersLogicService',
    ['constantService', 'enumService', function (constantService, enumService) {

  // This is a simple implementation for constant and enum, so the value can be
  // changed. Since this is a small personal project, all caps naming convention
  // should be enough.
  var ILLEGAL_CODE = enumService.ILLEGAL_CODE,
      DIRECTION = enumService.DIRECTION,
      MOVE_TYPE = enumService.MOVE_TYPE,
      CONSTANT = constantService;

  /**
   * 8x8 board for reference. (Logic and game API state)
   * The row number is zero based, so the first row is considered even row.
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
   * @param obj the object need to be clones.
   * @returns {*} the cloned object.
   */
  var cloneObj = function (obj) {
    var str = JSON.stringify(obj),
        copy = JSON.parse(str);
    return copy;
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
   * Check whether the turn index matches the color of the moving or jumping
   * piece. In another word, check whether the player is operating his/her own
   * piece.
   *
   * @param turnIndex 0 represents the black player and 1
   *        represents the white player.
   * @param color the color of the moving or jumping piece.
   * @returns true if the index matches the color, otherwise false.
   */
  var isOwnColor = function (turnIndex, color) {
    if ((turnIndex === CONSTANT.BLACK_INDEX
        && color === CONSTANT.BLACK)
        || (turnIndex === CONSTANT.WHITE_INDEX
            && color === CONSTANT.WHITE)) {
      return true;
    }
    return false;
  };

  /**
   * Check if the square index is legal
   * @param squareIndex the squareIndex need to be check
   * @returns true if legal, otherwise false
   */
  var isLegalIndex = function (squareIndex) {
    return squareIndex >= 0
        && squareIndex < CONSTANT.ROW * CONSTANT.COLUMN
        && squareIndex % 1 === 0;
  };

  /**
   * Check if the game api move is the first move. (initialize the game state)
   *
   * @param move the game API move.
   * @returns true if the move is the first move, otherwise false.
   */
  var isFirstMove = function (move) {
    var set;

    if (move === null || move === undefined) {
      return false;
    }
    // The move should has set operations for each dark square and 1 setTurn
    // operation.
    if (move.length !== CONSTANT.ROW * CONSTANT.COLUMN + 1) {
      return false;
    }


    // Warning: SetTurn operation should be the first in the game API moves.

    // Check setTurn operation is legal, it should be 0 which is still black
    if (!move[0].hasOwnProperty('setTurn')
        || move[0].setTurn['turnIndex'] !== CONSTANT.BLACK_INDEX) {
      return false;
    }

    // Check all set operations
    for (var i = 0; i < CONSTANT.ROW * CONSTANT.COLUMN; i += 1) {
      if (move[i + 1].hasOwnProperty('set')) {
        set = move[i + 1].set;
        // If the set operation does not has the correct value, return false
        // The index is in hardcode here...
        if ((i < 12 && (set.key !== i || set.value !== 'BMAN'))
            || (i >= 12 && i < 20) && (set.key !== i || set.value !== 'EMPTY')
            || (i >= 20 && i < 32) && (set.key !== i || set.value !== 'WMAN')) {
          return false;
        }
      } else {
        // If the operation is not set operation, return false
        return false;
      }
    }

    return true;
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
   * Check if the square is moving or jumping to the kings row
   *
   * @param toIndex the index of the square moving to or jumping to
   * @param playerTurnIndex the player's turn index
   * @returns true if it enters the kings row, otherwise false.
   */
  var hasMoveOrJumpToKingsRow = function (toIndex, playerTurnIndex) {
    // Check if the square can be crowned
    if (// For white square, it's moving or jumping to the first row
        (playerTurnIndex === 1 &&
            toIndex >= 0 && toIndex < CONSTANT.COLUMN
            ) ||
      // For black square, it's moving or jumping to the last row
        (playerTurnIndex === 0 &&
            toIndex >= (CONSTANT.ROW - 1) * CONSTANT.COLUMN &&
            toIndex < CONSTANT.ROW * CONSTANT.COLUMN)
        ) {

      return true;
    }

    return false;
  };

  /**
   * Check if there's any mandatory jumps for the player.
   *
   * @returns true if there has, otherwise false.
   */
  var hasMandatoryJumps = function (state, yourPlayerIndex) {
    var possibleMoves = [];
    for (var i = 0; i < CONSTANT.ROW * CONSTANT.COLUMN; i += 1) {
      possibleMoves =
          possibleMoves.concat(getJumpMoves(state, i, yourPlayerIndex));
    }

    return possibleMoves.length > 0;
  };

  /**
   * Convert the game API state to logic state.
   *
   * @param gameApiState the game API state.
   * @param [*] the logic state.
   */
  var convertGameApiStateToLogicState = function (gameApiState) {
    var logicState = [],
        key;

    for (key in gameApiState) {
      if (gameApiState.hasOwnProperty(key)) {
        logicState[key] = gameApiState[key];
      }
    }

    return logicState;
  };

  /**
   * Get the email body according to the specific illegal code.
   *
   * @param illegalCode
   * @returns {string} the email body
   */
  var getIllegalEmailBody = function (illegalCode) {
    var emailBody = '';

    switch (illegalCode) {
      case ILLEGAL_CODE.ILLEGAL_MOVE:
        emailBody = 'ILLEGAL_MOVE'; break;
      case ILLEGAL_CODE.ILLEGAL_SIMPLE_MOVE:
        emailBody = 'ILLEGAL_SIMPLE_MOVE'; break;
      case ILLEGAL_CODE.ILLEGAL_JUMP_MOVE:
        emailBody = 'ILLEGAL_JUMP_MOVE'; break;
      case ILLEGAL_CODE.ILLEGAL_INDEX:
        emailBody = 'ILLEGAL_INDEX'; break;
      case ILLEGAL_CODE.ILLEGAL_COLOR_CHANGED:
        emailBody = 'ILLEGAL_COLOR_CHANGED'; break;
      case ILLEGAL_CODE.ILLEGAL_CROWNED:
        emailBody = 'ILLEGAL_CROWNED'; break;
      case ILLEGAL_CODE.ILLEGAL_UNCROWNED:
        emailBody = 'ILLEGAL_UNCROWNED'; break;
      case ILLEGAL_CODE.ILLEGAL_IGNORE_MANDATORY_JUMP:
        emailBody = 'ILLEGAL_IGNORE_MANDATORY_JUMP'; break;
      case ILLEGAL_CODE.ILLEGAL_SET_TURN:
        emailBody = 'ILLEGAL_SET_TURN'; break;
      case ILLEGAL_CODE.ILLEGAL_END_MATCH_SCORE:
        emailBody = 'ILLEGAL_END_MATCH_SCORE'; break;
      default:
        throw new error('Illegal code!!!');
    }

    return emailBody;
  };

  /**
   * Get the email object according to the illegal code.
   *
   * @param illegalCode
   * @returns {{email: string, emailSubject: string, emailBody: string}}
   */
  var getIllegalEmailObj = function (illegalCode) {
    return {
      email: 'yl1949@nyu.edu',
      emailSubject: 'hacker!',
      emailBody: getIllegalEmailBody(illegalCode)
    }
  };

  /**
   * Get the color of the piece within the square.
   *
   * @param square the square of the board.
   * @returns string "B" if the piece is black, "W" if the piece is white,
   *          otherwise it's empty.
   */
  var getColor = function (square) {
    return square.substr(0, 1);
  };

  /**
   * Get the kind of the piece within the square.
   *
   * @param square the square of the board.
   * @returns string "MAN" if the piece is man, "CRO" if the piece king or
   *                 crowned
   */
  var getKind = function (square) {
    return square.substr(1);
  };

  /**
   * Get the to square index (the destination of the move) according to the move
   * type and direction.
   *
   * @param fromSquareIndex the from square (the square contains the piece moved
   *                        or jumped) index.
   * @param isEven true if the square is in even row, otherwise false
   * @param moveType the move type of the move, either simple move or jump move
   * @param direction the direction of the move, up-left, up-right, down-left
   *                  and down-right.
   * @returns {number} the to square index.
   */
  var getToSquareIndex =
      function (fromSquareIndex, isEven, moveType, direction) {
    var toSquareIndex = -1;

    switch(moveType) {
      case MOVE_TYPE.SIMPLE_MOVE:
        switch(direction) {
          case DIRECTION.UP_LEFT:
            toSquareIndex = isEven ?
                fromSquareIndex - CONSTANT.COLUMN :
                fromSquareIndex - CONSTANT.COLUMN - 1;
            break;
          case DIRECTION.UP_RIGHT:
            toSquareIndex = isEven ?
                fromSquareIndex - CONSTANT.COLUMN + 1 :
                fromSquareIndex - CONSTANT.COLUMN ;
            break;
          case DIRECTION.DOWN_LEFT:
            toSquareIndex = isEven ?
                fromSquareIndex + CONSTANT.COLUMN :
                fromSquareIndex + CONSTANT.COLUMN - 1;
            break;
          case DIRECTION.DOWN_RIGHT:
            toSquareIndex = isEven ?
                fromSquareIndex + CONSTANT.COLUMN + 1 :
                fromSquareIndex + CONSTANT.COLUMN;
            break;
          default:
            throw new error("Illegal direction!")
        }
        return toSquareIndex;

      case MOVE_TYPE.JUMP_MOVE:
        switch(direction) {
          case DIRECTION.UP_LEFT:
            toSquareIndex = isEven ?
                fromSquareIndex - 2 * CONSTANT.COLUMN - 1 :
                fromSquareIndex - 2 * CONSTANT.COLUMN - 1;
            break;
          case DIRECTION.UP_RIGHT:
            toSquareIndex = isEven ?
                fromSquareIndex - 2 * CONSTANT.COLUMN + 1 :
                fromSquareIndex - 2 * CONSTANT.COLUMN + 1;
            break;
          case DIRECTION.DOWN_LEFT:
            toSquareIndex = isEven ?
                fromSquareIndex + 2 * CONSTANT.COLUMN - 1 :
                fromSquareIndex + 2 * CONSTANT.COLUMN - 1;
            break;
          case DIRECTION.DOWN_RIGHT:
            toSquareIndex = isEven ?
                fromSquareIndex + 2 * CONSTANT.COLUMN + 1 :
                fromSquareIndex + 2 * CONSTANT.COLUMN + 1;;
            break;
          default:
            throw new error("Illegal direction!")
        }
        return toSquareIndex;

      default:
        throw new error("Illegal move type!")
    }

    return toSquareIndex;
  };



      /**
   * Get the winner based on the current state.
   *
   * @param gameApiState the current game API state
   * @param turnIndex 0 represents the black player and 1
   *        represents the white player.
   * @returns string "B" if the piece is black, "W" if the piece is white,
   *          otherwise it's empty.
   */
  var getWinner = function (logicState, turnIndex) {
    var allPossibleMoves = [],
        hasWhite,
        hasBlack,
        square;

    // Check whether there's any piece for both of the player
    for (var index in logicState) {
      if (getColor(logicState[index]) === CONSTANT.WHITE) {
        hasWhite = true;
      } else if (getColor(logicState[index]) === CONSTANT.BLACK) {
        hasBlack = true;
      }

      if (hasWhite === true && hasBlack === true) {
        // No need to check the rest
        break;
      }
    }

    // White won because white player has no pieces
    if (hasWhite && !hasBlack) {
      return CONSTANT.WHITE;
    }

    // Black won because black player has no pieces
    if (!hasWhite && hasBlack) {
      return CONSTANT.BLACK;
    }

    // Get all the moves for the current turn player
    for (index in logicState) {
      square = logicState[index];

      if (turnIndex === CONSTANT.BLACK_INDEX) {
        // Get all black's moves
        if (getColor(square) === CONSTANT.BLACK) {
          allPossibleMoves = allPossibleMoves.concat(
              getAllPossibleMoves(logicState, index, turnIndex));
        }
      } else {
        // Get all white's moves
        if (getColor(square) === CONSTANT.WHITE) {
          allPossibleMoves = allPossibleMoves.concat(
              getAllPossibleMoves(logicState, index, turnIndex));
        }
      }
    }

    if (allPossibleMoves.length === 0) {
      if (turnIndex === CONSTANT.BLACK_INDEX) {
        // Black has no moves, so white wins!
        return CONSTANT.WHITE;
      } else {
        // White has no moves, so black wins!
        return CONSTANT.BLACK;
      }
    }

    // No winner, the game is not ended.
    return '';
  };

  /**
   * Get the first move.
   *
   * @returns {Array}
   */
  var getFirstMove = function () {
    var operations = [],
        i;

    operations.push({setTurn: {turnIndex: 0}});

    for (i = 0; i < (CONSTANT.ROW - 2)
        / 2 * CONSTANT.COLUMN;
         i += 1) {
      operations.push({set: {key: i, value: 'BMAN'}});
    }

    for (i = (CONSTANT.ROW / 2 - 1) * CONSTANT.COLUMN;
         i < (CONSTANT.ROW / 2 + 1) * CONSTANT.COLUMN; i += 1) {
      operations.push({set: {key: i, value: 'EMPTY'}});
    }

    for (i = (CONSTANT.ROW / 2 + 1) * CONSTANT.COLUMN;
         i < CONSTANT.ROW * CONSTANT.COLUMN; i += 1) {
      operations.push({set: {key: i, value: 'WMAN'}});
    }

    return operations;
  };

  /**
   * Get all possible upwards simple moves for a specific piece by its square
   * index.
   *
   * @param logicState the logic state
   * @param squareIndex the index of the square holds the piece
   * @return an array of all possible moves
   */
  var getSimpleUpMoves = function (logicState, squareIndex) {
    var moves = [],
        isEven,
        leftUpSquareIndex,
        rightUpSquareIndex;

    // If the piece is in the first row, then there's no way to move upwards.
    if (Math.floor(squareIndex / CONSTANT.COLUMN) === 0) {
      return moves;
    }

    // Since for the even row, the dark square starts first but for the odd row,
    // the light square starts first, so the difference of the indexes between
    // two adjacent rows is not always the same.
    if (Math.floor(squareIndex / CONSTANT.COLUMN) % 2 === 0) {
      // EVEN ROW

      isEven = true;
      // Check left first

      leftUpSquareIndex =
          getToSquareIndex(squareIndex, isEven,
              MOVE_TYPE.SIMPLE_MOVE, DIRECTION.UP_LEFT);
      if (logicState[leftUpSquareIndex] === 'EMPTY') {
        moves.push(leftUpSquareIndex);
      }

      // Check right
      rightUpSquareIndex =
          getToSquareIndex(squareIndex, isEven,
              MOVE_TYPE.SIMPLE_MOVE, DIRECTION.UP_RIGHT);
      // for the rightmost one, it can only move to the left up side.
      if (squareIndex % CONSTANT.COLUMN !== CONSTANT.COLUMN - 1
          && logicState[rightUpSquareIndex] === 'EMPTY') {
        moves.push(rightUpSquareIndex);
      }
    } else {
      // ODD ROW

      isEven = false;
      // Check left first
      leftUpSquareIndex =
          getToSquareIndex(squareIndex, isEven,
              MOVE_TYPE.SIMPLE_MOVE, DIRECTION.UP_LEFT);
      // For the leftmost one, it can only move to the right up side.
      if (squareIndex % CONSTANT.COLUMN !== 0
          && logicState[leftUpSquareIndex] === 'EMPTY') {
        moves.push(leftUpSquareIndex);
      }

      // Check right
      rightUpSquareIndex =
          getToSquareIndex(squareIndex, isEven,
              MOVE_TYPE.SIMPLE_MOVE, DIRECTION.UP_RIGHT);
      if (logicState[rightUpSquareIndex] === 'EMPTY') {
        moves.push(rightUpSquareIndex);
      }
    }

    return moves;
  };

  /**
   * Get all possible downwards simple moves for a specific piece by its square
   * index.
   *
   * @param logicState the logic state
   * @param squareIndex the index of the square holds the piece
   * @return an array of all possible moves
   */
  var getSimpleDownMoves = function (logicState, squareIndex) {
    var moves = [],
        isEven,
        leftUpSquareIndex,
        rightUpSquareIndex;

    // If the piece is in the last row, then there's no way to move downwards.
    if (Math.floor(squareIndex / CONSTANT.COLUMN)
        === (CONSTANT.ROW - 1)) {
      return moves;
    }

    // Since for the even row, the dark square starts first but for the odd row,
    // the light square starts first, so the difference of the indexes between
    // two adjacent rows is not always the same.
    if (Math.floor(squareIndex / CONSTANT.COLUMN) % 2 === 0) {
      // EVEN ROW

      isEven = true;
      // Check left first
      leftUpSquareIndex =
          getToSquareIndex(squareIndex, isEven,
              MOVE_TYPE.SIMPLE_MOVE, DIRECTION.DOWN_LEFT);
      if (logicState[leftUpSquareIndex] === 'EMPTY') {
        moves.push(leftUpSquareIndex);
      }

      // Check right
      rightUpSquareIndex =
          getToSquareIndex(squareIndex, isEven,
              MOVE_TYPE.SIMPLE_MOVE, DIRECTION.DOWN_RIGHT);
      // for the rightmost one, it can only move to the left down side.
      if (squareIndex % CONSTANT.COLUMN !== CONSTANT.COLUMN - 1
          && logicState[rightUpSquareIndex] === 'EMPTY') {
        moves.push(rightUpSquareIndex);
      }
    } else {
      // ODD ROW

      isEven = false;
      // Check left first
      leftUpSquareIndex =
          getToSquareIndex(squareIndex, isEven,
              MOVE_TYPE.SIMPLE_MOVE, DIRECTION.DOWN_LEFT);
      // For the leftmost one, it can only move to the right down side.
      if (squareIndex % CONSTANT.COLUMN !== 0
          && logicState[leftUpSquareIndex] === 'EMPTY') {
        moves.push(leftUpSquareIndex);
      }

      // Check right
      rightUpSquareIndex =
          getToSquareIndex(squareIndex, isEven,
              MOVE_TYPE.SIMPLE_MOVE, DIRECTION.DOWN_RIGHT);
      if (logicState[rightUpSquareIndex] === 'EMPTY') {
        moves.push(rightUpSquareIndex);
      }
    }

    return moves;
  };

  /**
   * Get all possible upwards jump moves for a specific piece by its square
   * index.
   *
   * @param logicState the logic state
   * @param squareIndex the index of the square holds the piece
   * @return an array of all possible moves
   */
  var getJumpUpMoves = function (logicState, squareIndex) {
    var fromSquareIndex = squareIndex,
        fromSquare = logicState[squareIndex],
        jumpedSquareIndex,
        jumpedSquare,
        toSquareIndex,
        toSquare,
        isEven,
        moves = [];

    // If the piece is in either the first or the second row, then there's no
    // way to jump upwards.
    if (Math.floor(fromSquareIndex / CONSTANT.COLUMN) < 2) {
      return moves;
    }

    // Since for the even row, the dark square starts first but for the odd row,
    // the light square starts first, so the difference of the indexes between
    // two adjacent rows is not always the same.
    if (Math.floor(fromSquareIndex / CONSTANT.COLUMN) % 2 === 0) {
      // Even row

      isEven = true;
      // Check left first, for the leftmost one, it can only jump right upwards.
      if (fromSquareIndex % CONSTANT.COLUMN !== 0) {
        toSquareIndex =
            getToSquareIndex(squareIndex, isEven,
                MOVE_TYPE.JUMP_MOVE, DIRECTION.UP_LEFT);
        jumpedSquareIndex = getJumpedIndex(squareIndex, toSquareIndex);
        toSquare = logicState[toSquareIndex];
        jumpedSquare = logicState[jumpedSquareIndex];

        if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
          moves.push([jumpedSquareIndex, toSquareIndex]);
        }
      }

      // Check right, for the rightmost one, it can only jump left upwards.
      if (fromSquareIndex % CONSTANT.COLUMN !== CONSTANT.COLUMN - 1)
      {
        toSquareIndex =
            getToSquareIndex(squareIndex, isEven,
                MOVE_TYPE.JUMP_MOVE, DIRECTION.UP_RIGHT);
        jumpedSquareIndex = getJumpedIndex(squareIndex, toSquareIndex);
        toSquare = logicState[toSquareIndex];
        jumpedSquare = logicState[jumpedSquareIndex];

        if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
          moves.push([jumpedSquareIndex, toSquareIndex]);
        }
      }
    } else {
      // Odd row

      isEven = false;
      // Check left first, for the leftmost one, it can only jump right upwards.
      if (fromSquareIndex % CONSTANT.COLUMN !== 0) {
        toSquareIndex =
            getToSquareIndex(squareIndex, isEven,
                MOVE_TYPE.JUMP_MOVE, DIRECTION.UP_LEFT);
        jumpedSquareIndex = getJumpedIndex(squareIndex, toSquareIndex);
        toSquare = logicState[toSquareIndex];
        jumpedSquare = logicState[jumpedSquareIndex];

        if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
          moves.push([jumpedSquareIndex, toSquareIndex]);
        }
      }

      // Check right, for the rightmost one, it can only jump left upwards.
      if (fromSquareIndex % CONSTANT.COLUMN !== CONSTANT.COLUMN - 1)
      {
        toSquareIndex =
            getToSquareIndex(squareIndex, isEven,
                MOVE_TYPE.JUMP_MOVE, DIRECTION.UP_RIGHT);
        jumpedSquareIndex = getJumpedIndex(squareIndex, toSquareIndex);
        toSquare = logicState[toSquareIndex];
        jumpedSquare = logicState[jumpedSquareIndex];

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
   * @param logicState the logic state
   * @param squareIndex the index of the square holds the piece
   * @return an array of all possible moves
   */
  var getJumpDownMoves = function (logicState, squareIndex) {
    var fromSquareIndex = squareIndex,
        fromSquare = logicState[fromSquareIndex],
        jumpedSquareIndex,
        jumpedSquare,
        toSquareIndex,
        toSquare,
        isEven,
        moves = [];

    squareIndex = parseInt(squareIndex, 10);

    // If the piece is in either the last or the second to the last row, then
    // there's no way to jump downwards.
    if (Math.floor(fromSquareIndex / CONSTANT.COLUMN) >=
        CONSTANT.ROW - 2) {
      return moves;
    }

    // Since for the even row, the dark square starts first but for the odd row,
    // the light square starts first, so the difference of the indexes between
    // two adjacent rows is not always the same.
    if (Math.floor(fromSquareIndex / CONSTANT.COLUMN) % 2 === 0) {
      // Even row

      isEven = true;
      // Check left first, for the leftmost one, it can only jump right
      // downwards.
      if (fromSquareIndex % CONSTANT.COLUMN !== 0) {
        toSquareIndex = getToSquareIndex(squareIndex, isEven,
            MOVE_TYPE.JUMP_MOVE, DIRECTION.DOWN_LEFT);
        jumpedSquareIndex = getJumpedIndex(squareIndex, toSquareIndex);
        toSquare = logicState[toSquareIndex];
        jumpedSquare = logicState[jumpedSquareIndex];

        if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
          moves.push([jumpedSquareIndex, toSquareIndex]);
        }
      }

      // Check right, for the rightmost one, it can only jump left downwards.
      if (fromSquareIndex % CONSTANT.COLUMN !== CONSTANT.COLUMN - 1)
      {
        toSquareIndex = getToSquareIndex(squareIndex, isEven,
            MOVE_TYPE.JUMP_MOVE, DIRECTION.DOWN_RIGHT);
        jumpedSquareIndex = getJumpedIndex(squareIndex, toSquareIndex);
        toSquare = logicState[toSquareIndex];
        jumpedSquare = logicState[jumpedSquareIndex];

        if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
          moves.push([jumpedSquareIndex, toSquareIndex]);
        }
      }
    } else {
      // Odd row

      isEven = false;
      // Check left first, for the leftmost one, it can only jump right
      // downwards.
      if (fromSquareIndex % CONSTANT.COLUMN !== 0) {
        toSquareIndex = getToSquareIndex(squareIndex, isEven,
            MOVE_TYPE.JUMP_MOVE, DIRECTION.DOWN_LEFT);
        jumpedSquareIndex = getJumpedIndex(squareIndex, toSquareIndex);
        toSquare = logicState[toSquareIndex];
        jumpedSquare = logicState[jumpedSquareIndex];

        if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
          moves.push([jumpedSquareIndex, toSquareIndex]);
        }
      }

      // Check right, for the rightmost one, it can only jump left downwards.
      if (fromSquareIndex % CONSTANT.COLUMN !== CONSTANT.COLUMN - 1)
      {
        toSquareIndex = getToSquareIndex(squareIndex, isEven,
            MOVE_TYPE.JUMP_MOVE, DIRECTION.DOWN_RIGHT);
        jumpedSquareIndex = getJumpedIndex(squareIndex, toSquareIndex);
        toSquare = logicState[toSquareIndex];
        jumpedSquare = logicState[jumpedSquareIndex];

        if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
          moves.push([jumpedSquareIndex, toSquareIndex]);
        }
      }
    }

    return moves;
  };

  /**
   * Get all possible simple moves for a specific piece by its square index. If
   * it is crowned, also check if it can move one step backward.
   *
   * @param logicState the logic state
   * @param squareIndex the index of the square holds the piece
   * @param turnIndex 0 represents the black player and 1
   *        represents the white player.
   * @return an array of all possible moves.
   */
  var getSimpleMoves = function (logicState, squareIndex, turnIndex) {
    var moves = [],
        tmpMoves = [],
        fromSquare = logicState[squareIndex],
        color = fromSquare.substr(0, 1),
        kind = fromSquare.substr(1);

    // Check whether it's the current player's piece first, if not, since the
    // player can not operate it, then no move will be available.
    if (isOwnColor(turnIndex, color)) {
      if (kind === 'CRO') {
        // Check both direction moves
        tmpMoves = getSimpleUpMoves(logicState, squareIndex);
        moves = moves.concat(tmpMoves);

        tmpMoves = getSimpleDownMoves(logicState, squareIndex);
        moves = moves.concat(tmpMoves);
      } else if (color === 'W') {
        tmpMoves = getSimpleUpMoves(logicState, squareIndex);
        moves = moves.concat(tmpMoves);
      } else if (color === 'B') {
        tmpMoves = getSimpleDownMoves(logicState, squareIndex);
        moves = moves.concat(tmpMoves);
      }
    }

    return moves;
  };

  /**
   * Get all possible jump moves for a specific piece by its square index. If it
   * is crowned, also check if it can jump one step backward.
   *
   * @param logicState the logic state
   * @param squareIndex the index of the square holds the piece
   * @param turnIndex 0 represents the black player and 1
   *        represents the white player.
   * @return an array of all possible moves
   */
  var getJumpMoves = function (logicState, squareIndex, turnIndex) {
    var moves = [],
        tmpMoves = [],
        fromSquare = logicState[squareIndex],
        color = fromSquare.substr(0, 1),
        kind = fromSquare.substr(1);

    // Check whether it's the current player's piece first, if not, since the
    // player can not operate it, then no move will be available.
    if (isOwnColor(turnIndex, color)) {
      if (kind === 'CRO') {
        // Check both direction moves
        tmpMoves = getJumpUpMoves(logicState, squareIndex);
        moves = moves.concat(tmpMoves);

        tmpMoves = getJumpDownMoves(logicState, squareIndex);
        moves = moves.concat(tmpMoves);
      } else if (color === 'W') {
        tmpMoves = getJumpUpMoves(logicState, squareIndex);
        moves = moves.concat(tmpMoves);
      } else if (color === 'B') {
        tmpMoves = getJumpDownMoves(logicState, squareIndex);
        moves = moves.concat(tmpMoves);
      }
    }

    return moves;
  };

  /**
   * Get all possible moves for a specific piece by its square index.
   *
   * @param logicState the logic state.
   * @param squareIndex the index of the square holds the piece
   * @param turnIndex 0 represents the black player and 1
   *        represents the white player.
   * @return an array of all possible move.
   */
  var getAllPossibleMoves = function (logicState, squareIndex, turnIndex) {
    var possibleMoves = [];

    // Make sure the index is number
    squareIndex = parseInt(squareIndex, 10);

    // First get all possible jump moves.
    possibleMoves =
        possibleMoves.concat(getJumpMoves(logicState, squareIndex, turnIndex));

    // If there's at least one jump move, then no need to check the simple moves
    // since jump move is mandatory.
    if (possibleMoves.length === 0) {
      possibleMoves =possibleMoves
          .concat(getSimpleMoves(logicState, squareIndex, turnIndex));
    }

    return possibleMoves;
  };

  /**
   * Retrieve the detail information from the game API move. Which are logic
   * moves, the from (moving or jumping) square's index, the next turn index and
   * the winner if it has one.
   *
   * Warning: the order of set operation are important.
   *
   * @param gameApiMove the game API move
   * @returns {
 *    logicMove: Array,
 *    fromSquareIndex: number,
 *    toSquare: string,
 *    nextTurnIndex: number,
 *    winner: string
 *    checkIsFirstMove: boolean
 *  }
   */
  var retrieveGameApiMoveDetail = function (gameApiMove) {
    var gameApiMoveDetail = {
          logicMoves: [],
          fromSquareIndex: -1,
          toSquare: '',
          nextTurnIndex: -1,
          winner: '',
          checkIsFirstMove: false
        },
        setOperations = [],
        index,
        set;

    for (index in gameApiMove) {
      if (gameApiMove[index].hasOwnProperty('setTurn')) {
        // Get the next turn index
        gameApiMoveDetail.nextTurnIndex = gameApiMove[index].setTurn.turnIndex;
      } else if (gameApiMove[index].hasOwnProperty('set')) {
        // Get the set operation and store it first
        set = gameApiMove[index].set;
        setOperations.push([set.key, set.value]);
      } else if (gameApiMove[index].hasOwnProperty('endMatch')) {
        // Get the endMatch if it exist and retrieve the winner
        if (gameApiMove[index].endMatch.endMatchScores[0] === 0) {
          gameApiMoveDetail.winner = CONSTANT.WHITE;
        } else {
          gameApiMoveDetail.winner = CONSTANT.BLACK;
        }
      }
    }

    // Warning: the order of set operation are important.

    // The first set operation is the piece the player operates.
    gameApiMoveDetail.fromSquareIndex = parseInt(setOperations[0][0], 10);

    if (setOperations.length === 2) {
      // If there's 2 set operations, then it's a simple move and the second set
      // operation is for the destination square which is empty.
      gameApiMoveDetail.logicMoves.push(parseInt(setOperations[1][0], 10));
      gameApiMoveDetail.toSquare = setOperations[1][1];
    } else if (setOperations.length === 3) {
      // If there's 3 set operations, then it's a jump move and the second set
      // operation is for the jumped (opponent) square and the third set
      // operation is for the destination square which is empty.
      gameApiMoveDetail.logicMoves.push(parseInt(setOperations[1][0], 10));
      gameApiMoveDetail.logicMoves.push(parseInt(setOperations[2][0], 10));
      gameApiMoveDetail.toSquare = setOperations[2][1];
    } else {
      // If there are more than 3 set operations, than it may be the first move
      // which initialize the game, so need to check it later in isMoveOk.
      gameApiMoveDetail.checkIsFirstMove = true;
    }

    return gameApiMoveDetail;
  };

  /**
   * Check if the possible jump moves array contains the specific jump move.
   *
   * @param possibleJumpMoves an array contains all possible jump moves.
   * @param move the move need to be checked.
   * @returns true if the move exists in the possible jump moves, otherwise 
   *          false.
   */
  var containJumpMove = function (possibleJumpMoves, move) {
    var index;

    for (index in possibleJumpMoves) {
      if (possibleJumpMoves[index][0] === move[0]
          && possibleJumpMoves[index][1] === move[1]) {
        return true;
      }
    }
    return false;
  };

  /**
   * Calculate the jumped (opponent) square index
   * @param fromIndex the first selected square game API index. (The one moving
   *                  or jumping)
   * @param toIndex the second selected square game API index. (The destination)
   * @returns {number} the jumped (opponent) square index
   */
  var getJumpedIndex = function (fromIndex, toIndex) {
    var jumpedIndex = -1,
        column = CONSTANT.COLUMN,
        isEven = Math.floor(fromIndex / CONSTANT.COLUMN) % 2 === 0;

    if (isEven) {
      // EVEN
      switch (toIndex - fromIndex) {
        case 2 * column + 1:
          // down right
          jumpedIndex = fromIndex + column + 1;
          break;
        case 2 * column - 1:
          // down left
          jumpedIndex = fromIndex + column;
          break;
        case -(2 * column + 1):
          // up left
          jumpedIndex = fromIndex - column;
          break;
        case -(2 * column - 1):
          // up right
          jumpedIndex = fromIndex - column + 1;
          break;
      }
    } else {
      // ODD
      switch (toIndex - fromIndex) {
        case 2 * column + 1:
          // down right
          jumpedIndex = fromIndex + column;
          break;
        case 2 * column - 1:
          // down left
          jumpedIndex = fromIndex + column - 1;
          break;
        case -(2 * column + 1):
          // up left
          jumpedIndex = fromIndex - column - 1;
          break;
        case -(2 * column - 1):
          // up right
          jumpedIndex = fromIndex - column;
          break;
      }
    }

    return jumpedIndex;
  };

  /**
   * Calculate the next game API state based on the last move. If the game is
   * ended, then adds the end match score.
   *
   * @param gameApiState the game API state.
   * @param move the game API move.
   * @returns {nextState: {*}} if the game is not ended,
   *          otherwise {nextState: {*}, endMatchScore: [*]}
   */
  var getNextState = function (gameApiState, move) {
    var nextGameApiState = cloneObj(gameApiState),
        nextTurnIndex = -1,
        endMatch,
        nextLogicState,
        winner,
        set;

    /***************************************************************************
     * Calculate the next game state.
     **************************************************************************/

    // Alter the game state according to the set operations and retrieve next
    // turn index and the endMatch operation if the game is ended.
    for (var index in move) {
      if (move[index].hasOwnProperty('set')) {
        set = move[index].set;
        nextGameApiState[set.key] = set.value;
      } else if (move[index].hasOwnProperty('setTurn')) {
        nextTurnIndex = move[index].setTurn.turnIndex;
      } else if (move[index].hasOwnProperty('endMatch')) {
        endMatch = move[index].endMatch;
      }
    }

    // If there's no set turn operation in the move, just
    if (nextTurnIndex === -1) {
      return {nextState: nextGameApiState};
    }

    /***************************************************************************
     * Add the end match score if it ends.
     **************************************************************************/

    nextLogicState = convertGameApiStateToLogicState(nextGameApiState);

    winner = getWinner(nextLogicState, nextTurnIndex);

    // Has a winner
    if (winner === CONSTANT.BLACK) {
      return {nextState: nextGameApiState, endMatchScore: [1, 0]};
    } else if  (winner === CONSTANT.WHITE) {
      return {nextState: nextGameApiState, endMatchScore: [0, 1]};
    }

    // No winner
    return {nextState: nextGameApiState};
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
        logicStateBeforeMove =
            convertGameApiStateToLogicState(gameApiStateBeforeMove),
        nextStateObj =
            getNextState(gameApiStateBeforeMove, move, turnIndexBeforeMove),
        nextGameApiState = nextStateObj.nextState,
        nextLogicState = convertGameApiStateToLogicState(nextGameApiState),
        gameApiMoveDetail,
        logicMove,
        fromSquareIndex,
        toSquare,
        setTurnIndex,
        winner,
        checkIsFirstMove,
        squareBeforeMove,
        squareAfterMove,
        isJumpMove,
        possibleMoves = [],
        index,
        i;

    /***************************************************************************
     * 1. Check if the state is empty.
     *    When the player loads the game, the state shall be empty at first and
     *    no move has been done yet.
     **************************************************************************/

    if (isEmptyObj(gameApiStateBeforeMove) && move.length === 0) {
      // If the state is empty and no move has been made,
      return true;
    }

    // Retrieve the move details
    gameApiMoveDetail = retrieveGameApiMoveDetail(move);
    logicMove = gameApiMoveDetail.logicMoves;
    fromSquareIndex = gameApiMoveDetail.fromSquareIndex;
    toSquare = gameApiMoveDetail.toSquare;
    setTurnIndex = gameApiMoveDetail.nextTurnIndex;
    winner = gameApiMoveDetail.winner;
    checkIsFirstMove = gameApiMoveDetail.checkIsFirstMove;

    /***************************************************************************
     * 2. Check if the move is the first move, only if the moves has more than 3
     *    operations.
     **************************************************************************/

    if (checkIsFirstMove) {
      // The first move must be made by the black player
      if (turnIndexBeforeMove !== CONSTANT.BLACK_INDEX) {
        return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_MOVE);
      }

      // The before game state must be empty
      if (!isEmptyObj(gameApiStateBeforeMove)) {
        return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_MOVE);
      }

      // The first move must be legal
      if (isFirstMove(move)) {
        return true;
      } else {
        return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_MOVE);
      }
    }

    /***************************************************************************
     * 3. Check all indexes
     **************************************************************************/

    // The moving or jumping index
    if (!isLegalIndex(fromSquareIndex)) {
      return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_INDEX);
    }

    // the move indexes
    for (i = 0; i < logicMove.length; i += 1) {
      if (!isLegalIndex(logicMove[i])) {
        return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_INDEX);
      }
    }

    /***************************************************************************
     * 4. Check if the piece remains the same or is legally crowned.
     **************************************************************************/

    squareBeforeMove = gameApiStateBeforeMove[fromSquareIndex];
    squareAfterMove = toSquare;

    // The color should never be changed.
    if (getColor(squareBeforeMove) !== getColor(squareAfterMove)) {
      return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_COLOR_CHANGED);
    }

    // A crowned piece should never be uncrowned. (king -> man)
    if (getKind(squareBeforeMove) === 'CRO'
        && getKind(squareBeforeMove) !== getKind(squareAfterMove)) {
      return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_UNCROWNED);
    }

    // Only man can be crowned.
    if (getKind(squareBeforeMove) === 'MAN'
        && getKind(squareBeforeMove) !== getKind(squareAfterMove)) {
      // The piece has to move into the kings row in order to be crowned.
      if (!hasMoveOrJumpToKingsRow(logicMove[logicMove.length - 1],
          turnIndexBeforeMove))
      {
        return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_CROWNED);
      }
    }

    /***************************************************************************
     * 5. Check if the move is legal
     **************************************************************************/
    if (logicMove.length === 1) {
      // Simple move

      // Check all pieces if there are any mandatory jumps.
      for (index in logicStateBeforeMove) {
        if (isOwnColor(turnIndexBeforeMove,
            getColor(logicStateBeforeMove[index])))
        {
          if (getJumpMoves(logicStateBeforeMove, parseInt(index, 10),
              turnIndexBeforeMove).length !== 0) {
            // There has jump moves, since jump move is mandatory
            // we found hacker!!!
            return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_IGNORE_MANDATORY_JUMP);
          }
        }
      }

      // No mandatory jumps.
      possibleMoves = getSimpleMoves(logicStateBeforeMove, fromSquareIndex,
          turnIndexBeforeMove);

      // The move should exist in the possible simple moves.
      if (possibleMoves.indexOf(logicMove[0]) === -1) {
        return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_SIMPLE_MOVE);
      }
    } else if (logicMove.length === 2) {
      // Jump move

      possibleMoves = getJumpMoves(logicStateBeforeMove, fromSquareIndex,
          turnIndexBeforeMove);

      // If the move exists in the possible jump moves, then it's valid
      if (!containJumpMove(possibleMoves, logicMove, turnIndexBeforeMove)) {
        return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_JUMP_MOVE);
      }
    } else {
      return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_MOVE);
    }

    /***************************************************************************
     * 6. Check the set turn, it's only legal to perform another move if there's
     *    more jump moves available for the operated piece. Note if the piece is
     *    entering the kings row, than the turn will be terminate even if it can
     *    jump back.
     **************************************************************************/

    isJumpMove = logicMove.length === 2;

    if (isJumpMove) {
      if (getJumpMoves(nextLogicState, logicMove[1],
          turnIndexBeforeMove).length > 0
          && !hasMoveOrJumpToKingsRow(logicMove[logicMove.length - 1],
              turnIndexBeforeMove))
      {
        // If the same piece can make any more jump moves and it does not enter
        // the kings row, then the next turn remains unchanged.
        if (setTurnIndex !== turnIndexBeforeMove) {
          return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_SET_TURN);
        }
      } else {
        // The piece can not make any more jump moves or it enters the kings row
        if (setTurnIndex === turnIndexBeforeMove) {
          return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_SET_TURN);
        }
      }
    } else {
      // The next turn will be the next player's if it's a simple move.
      if (setTurnIndex === turnIndexBeforeMove) {
        return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_SET_TURN);
      }
    }

    /***************************************************************************
     * 7. Check if the game ends properly
     **************************************************************************/

    if (winner === CONSTANT.BLACK) {
      if (!(nextStateObj.hasOwnProperty('endMatchScore')
          && nextStateObj.endMatchScore[0] === 1)) {
        return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_END_MATCH_SCORE);
      }
    }

    if (winner === CONSTANT.WHITE) {
      if (!(nextStateObj.hasOwnProperty('endMatchScore')
          && nextStateObj.endMatchScore[1] === 1)) {
        return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_END_MATCH_SCORE);
      }
    }

    // The move is ok :)
    return true;
  };

  /**
   * Get the expected operations for the selected squares (from and to square
   * indexes).
   *
   * @param gameApiState the game API state.
   * @param fromIndex the first selected square index. (The one moving or
   *                  jumping)
   * @param toIndex the second selected square index. (The destination)
   * @param turnIndex 0 represents the black player and 1
   *        represents the white player.
   * @returns {Array} operations
   */
  var getExpectedOperations = function (gameApiState, fromIndex,
                                        toIndex, turnIndex)
  {
    var operations = [],
        nextGameApiStateObj,
        nextGameApiState,
        nextTurnIndex,
        fromPiece = gameApiState[fromIndex],
        jumpedIndex,
        winner,
        column = CONSTANT.COLUMN,
        isSimpleMove = [column - 1, column, column + 1]
            .indexOf(Math.abs(toIndex - fromIndex)) !== -1,
        isJumpMove = [2 * column + 1, 2 * column - 1]
            .indexOf(Math.abs(toIndex - fromIndex)) !== -1;

    // First check if the player moves own color piece
    if (!isOwnColor(turnIndex, fromPiece.substr(0, 1))) {
      throw new Error("You can not operator opponent's pieces.");
    }

    /***************************************************************************
     * 1. Get the set operations
     **************************************************************************/

    if (isSimpleMove) {
      // Simple move
      operations.push({set: {key: fromIndex, value: "EMPTY"}});
      operations.push({set: {key: toIndex, value: fromPiece}});
    } else if (isJumpMove) {
      // Jump move
      jumpedIndex = getJumpedIndex(fromIndex, toIndex);

      operations.push({set: {key: fromIndex, value: "EMPTY"}});
      operations.push({set: {key: jumpedIndex, value: "EMPTY"}});
      operations.push({set: {key: toIndex, value: fromPiece}});
    }

    // Check if the piece can be crowned if it's not already crowned
    if (getKind(fromPiece) === 'MAN'
        && hasMoveOrJumpToKingsRow(toIndex, turnIndex)) {
      // Note that the order for the operations are critical, don't change it!
      operations[operations.length - 1] =
      {set: {key: toIndex, value: getColor(fromPiece) + 'CRO'}};
    }

    /***************************************************************************
     * 2. Get the set turn operation
     **************************************************************************/

    nextGameApiStateObj = getNextState(gameApiState, operations);
    nextGameApiState = nextGameApiStateObj.nextState;

    if (isJumpMove) {
      // Check whether the player can make another jump for the same piece
      // Note: If the piece moves to the kings row, then the turn is terminated
      //       no matter it can jump or not.
      if (getJumpMoves(nextGameApiState, toIndex, turnIndex).length > 0
          && !hasMoveOrJumpToKingsRow(toIndex, turnIndex)) {
        nextTurnIndex = turnIndex;
      } else {
        nextTurnIndex = 1 - turnIndex;
      }
    } else if (isSimpleMove) {
      nextTurnIndex = 1 - turnIndex;
    }

    operations.push({setTurn: {turnIndex: nextTurnIndex}});

    /***************************************************************************
     * 3. Get the end match operation
     **************************************************************************/

    winner =
        getWinner(convertGameApiStateToLogicState(nextGameApiState),
            nextTurnIndex);

    // Has a winner
    if (winner === CONSTANT.BLACK) {
      operations.push({endMatch: {endMatchScores: [1, 0]}});
    } else if  (winner === CONSTANT.WHITE) {
      operations.push({endMatch: {endMatchScores: [0, 1]}});
    }

    return operations;
  };

  return {
    isMoveOk: isMoveOk,
    getNextState: getNextState,
    getFirstMove: getFirstMove,
    getExpectedOperations: getExpectedOperations,
    getJumpMoves: getJumpMoves,
    getSimpleMoves: getSimpleMoves,
    getAllPossibleMoves: getAllPossibleMoves,
    hasMandatoryJumps: hasMandatoryJumps,
    getJumpedIndex: getJumpedIndex,
    convertGameApiStateToLogicState: convertGameApiStateToLogicState,
    isOwnColor: isOwnColor,
    getIllegalEmailObj: getIllegalEmailObj,
    getWinner: getWinner,
    getColor: getColor,
    getKind: getKind,
    cloneObj: cloneObj,
    isEmptyObj: isEmptyObj
  };
}]);