(function () {
  "use strict";
  /*global angular */

  /**
   * This is the logic service for Checkers. The game board is represented as a
   * two dimensional array (8*8). All elements are listed below:
   *
   * For empty squares of the board:
   * --: Light square (Can not hold any piece)
   * DS: Dark square (Can hold a piece)
   *
   * For 4 kinds of piece of the game:
   * BM: Black MAN
   * BK: Black KING
   * WM: White MAN
   * WK: White KING
   *
   * Example - The initial state:
   *
   *             0     1     2     3     4     5     6     7
   * 0:even  [['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
   * 1:odd    ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
   * 2:even   ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
   * 3:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
   * 4:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
   * 5:odd    ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
   * 6:even   ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
   * 7:odd    ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']]
   *
   * Note: The number of row and col are both zero based, so the first row
   *       and column are both even.
   *
   * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   *
   * The move operation is an array consist of several parts:
   *
   * 0 - setTurn: {setTurn: {turnIndex: 0}}
   * 0 - endMatch: {endMatch: {endMatchScores: [1, 0]}}
   * 1 - setBoard: {set: {key: 'board', value: [[...], ..., [...]]}}
   * 2 - setDeltaFrom: {set: {key: 'deltaFrom', value: {row: row, col: col}}}
   * 3 - setDeltaTo: {set: {key: 'deltaTo', value: {row: row, col: col}}}
   *
   * Notes: move[0] can be either setTurn or endMatch
   *
   * e.g. [
   *       {setTurn: {turnIndex: 1}},
   *       {set: {key: 'board', value:
   *         [
   *          ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
   *          ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
   *          ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'BM'],
   *          ['BM', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
   *          ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
   *          ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
   *          ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
   *          ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
   *         ]
   *       }},
   *       {set: {key: 'fromDelta', value: {row: 2, col: 1}}},
   *       {set: {key: 'toDelta', value: {row: 3, col: 0}}}
   *      ]
   */
  angular.module('myApp', ['ngTouch', 'ui.bootstrap']).factory('checkersLogicService',
      [function () {

          // This is a simple implementation for constant and enum, so the value
          // can be changed. Since this is a small personal project, all caps
          // naming convention should be enough.
        var ENUM = {
            ILLEGAL_CODE: {
              ILLEGAL_MOVE: 'ILLEGAL_MOVE',
              ILLEGAL_SIMPLE_MOVE: 'ILLEGAL_SIMPLE_MOVE',
              ILLEGAL_JUMP_MOVE: 'ILLEGAL_JUMP_MOVE',
              ILLEGAL_DELTA: 'ILLEGAL_DELTA',
              ILLEGAL_COLOR_CHANGED: 'ILLEGAL_COLOR_CHANGED',
              ILLEGAL_CROWNED: 'ILLEGAL_CROWNED',
              ILLEGAL_UNCROWNED: 'ILLEGAL_UNCROWNED',
              ILLEGAL_IGNORE_MANDATORY_JUMP: 'ILLEGAL_IGNORE_MANDATORY_JUMP',
              ILLEGAL_SET_TURN: 'ILLEGAL_SET_TURN',
              ILLEGAL_END_MATCH_SCORE: 'ILLEGAL_END_MATCH_SCORE',
              ILLEGAL_CODE: 'ILLEGAL_CODE'
            },
            DIRECTION: {
              UP_LEFT: 'UP_LEFT',
              UP_RIGHT: 'UP_RIGHT',
              DOWN_LEFT: 'DOWN_LEFT',
              DOWN_RIGHT: 'DOWN_RIGHT'
            },
            MOVE_TYPE: {
              SIMPLE_MOVE: 'SIMPLE_MOVE',
              JUMP_MOVE: 'JUMP_MOVE'
            }
          };

        var ILLEGAL_CODE = ENUM.ILLEGAL_CODE,
            DIRECTION = ENUM.DIRECTION,
            MOVE_TYPE = ENUM.MOVE_TYPE;

          var CONSTANTS = {
                ROW: 8,
                // Since only the dark square may contain pieces, for both the
                // gameApiState and logicState, I only concern the dark squares.
                // Therefore the column is count to only 4.
                COLUMN: 8,
                LIGHT_SQUARE: '--',
                DARK_SQUARE: 'DS',
                BLACK_MAN: 'BM',
                BLACK_KING: 'BK',
                WHITE_MAN: 'WM',
                WHITE_KING: 'WK',
                BLACK: 'B',
                WHITE: 'W',
                MAN: 'M',
                KING: 'K',
                WHITE_INDEX: 0,
                BLACK_INDEX: 1
              };

          /**
           * Check if the object is empty
           *
           * @param obj the object to be checked
           * @returns true if is empty, otherwise false.
           */
          function isEmptyObj(obj) {
            var prop;

            for (prop in obj) {
              if (obj.hasOwnProperty(prop)) {
                return false;
              }
            }

            return true;
          }

          /**
           * Get the color of the piece within the square.
           *
           * @param square the square of the board.
           * @returns string "B" if the piece is black, "W" if the piece is white,
           *          otherwise the square is empty.
           */
          function getColor(square) {
            return square.substr(0, 1);
          }

          /**
           * Get the kind of the piece within the square.
           *
           * @param square the square of the board.
           * @returns string "M" if the piece is man, "K" if the piece is king or
           *                 crowned
           */
          function getKind(square) {
            return square.substr(1);
          }

          /**
           * Check if the two deltas are the same.
           *
           * @param delta1
           * @param delta2
           * @returns {boolean}
           */
          function isDeltaEqual(delta1, delta2) {
            if (delta1.row !== delta2.row) {
              return false;
            }

            if (delta1.col !== delta2.col) {
              return false;
            }

            return true;
          }

          /**
           * Check if the move exists in the moves array
           *
           * @param moves all possible moves
           * @param move the move need to be checked
           * @returns {boolean} true if the move exists, otherwise false
           */
          function doesContainMove(moves, move) {
            var i;
            for (i = 0; i < moves.length; i += 1) {
              if (isDeltaEqual(moves[i], move)) {
                return true;
              }
            }

            return false;
          }

          /**
           * Check whether the turn index matches the color of the moving or
           * jumping piece. In another word, check whether the player is operating
           * his/her own piece.
           *
           * @param turnIndex 0 represents the black player and 1
           *        represents the white player.
           * @param color the color of the moving or jumping piece.
           * @returns true if the index matches the color, otherwise false.
           */
          function isOwnColor(turnIndex, color) {
            if ((turnIndex === CONSTANTS.BLACK_INDEX &&
                color === CONSTANTS.BLACK) ||
                (turnIndex === CONSTANTS.WHITE_INDEX &&
                color === CONSTANTS.WHITE)) {
              return true;
            }
            return false;
          }

          /**
           * Check if the square index is legal
           * @param squareIndex the squareIndex need to be check
           * @returns true if legal, otherwise false
           */
          function isDarkSquare(delta) {
            var row = delta.row,
                col = delta.col,
                isEvenRow,
                isEvenCol;

            // Make sure the delta has the row and col property
            if (!(delta.hasOwnProperty('row') && delta.hasOwnProperty('col'))) {
              return false;
            }

            // The game board is 8*8 and the index of row and column start at 0
            // and end at 7
            if (row < 0 || row >= CONSTANTS.ROW ||
                col < 0 || col >= CONSTANTS.COLUMN) {
              return false;
            }

            isEvenRow = row % 2 === 0;
            isEvenCol = col % 2 === 0;

            // Only dark square is able to hold a piece
            if ((!isEvenRow && isEvenCol) || (isEvenRow && !isEvenCol)) {
              return true;
            }

            return false;
          }

          /**
           * Check if it's a simple move according to the from and to delta.
           *
           * @param fromDelta from delta
           * @param toDelta to delta
           * @returns {boolean} true if it's simple move, otherwise false
           */
          function isSimpleMove(board, fromDelta, toDelta) {
            var square = board[fromDelta.row][fromDelta.col];

            if (getKind(square) === CONSTANTS.KING) {
              // If it's a king, it can move both forward and backward
              if ((Math.abs(fromDelta.row - toDelta.row) === 1) &&
                  (Math.abs(fromDelta.col - toDelta.col) === 1)) {
                return true;
              }
            } else if (getColor(square) === CONSTANTS.BLACK) {
              // If it's not a black king, it can only move downwards.
              if ((fromDelta.row - toDelta.row === -1) &&
                  (Math.abs(fromDelta.col - toDelta.col) === 1)) {
                return true;
              }
            } else if (getColor(square) === CONSTANTS.WHITE) {
              // If it's not a white king, it can only move upwards.
              if ((fromDelta.row - toDelta.row === 1) &&
                  (Math.abs(fromDelta.col - toDelta.col) === 1)) {
                return true;
              }
            }

            return false;
          }

          /**
           * Check if it's a jump move according to the from and to coordinate.
           *
           * @param fromDelta from delta
           * @param toDelta to delta
           * @returns {boolean} true if it's jump move, otherwise false
           */
          function isJumpMove(board, fromDelta, toDelta) {
            var square = board[fromDelta.row][fromDelta.col];

            if (getKind(square) === CONSTANTS.KING) {
              // If it's a king, it can jump both forward and backward
              if ((Math.abs(fromDelta.row - toDelta.row) === 2) &&
                  (Math.abs(fromDelta.col - toDelta.col) === 2)) {
                return true;
              }
            } else if (getColor(square) === CONSTANTS.BLACK) {
              // If it's not a black king, it can only jump downwards.
              if ((fromDelta.row - toDelta.row === -2) &&
                  (Math.abs(fromDelta.col - toDelta.col) === 2)) {
                return true;
              }
            } else if (getColor(square) === CONSTANTS.WHITE) {
              // If it's not a white king, it can only jump upwards.
              if ((fromDelta.row - toDelta.row === 2) &&
                  (Math.abs(fromDelta.col - toDelta.col) === 2)) {
                return true;
              }
            }

            return false;
          }

          /**
           * Check if the jump is valid. The piece can only jump over an
           * opponent piece and the destination square must be empty.
           *
           * @param fromSquare the player's piece which jumps
           * @param jumpedSquare the jumped (opponent) piece which is being
           *                     jumped over
           * @param toSquare the destination square
           * @returns true if the jump is valid, otherwise false
           */
          function isValidJump(fromSquare, jumpedSquare, toSquare) {
            return jumpedSquare !== CONSTANTS.DARK_SQUARE &&
                fromSquare.substr(0, 1) !== jumpedSquare.substr(0, 1) &&
                toSquare === CONSTANTS.DARK_SQUARE;
          }

          /**
           * Check if the square is moving or jumping to the kings row
           *
           * @param toDelta the delta of the square moving to or jumping to
           * @param playerTurnIndex the player's turn index
           * @returns true if it enters the kings row, otherwise false.
           */
          function hasMoveOrJumpToKingsRow(toDelta, playerTurnIndex) {
            // Check if the square can be crowned
            if (
              // For white square, it's moving or jumping to the first row
              (playerTurnIndex === CONSTANTS.WHITE_INDEX && toDelta.row === 0) ||
              // For black square, it's moving or jumping to the last row
              (playerTurnIndex === CONSTANTS.BLACK_INDEX && toDelta.row === CONSTANTS.ROW - 1)
            ) {
              return true;
            }

            return false;
          }

          /**
           * Get the email body according to the specific illegal code.
           *
           * @param illegalCode
           * @returns {string} the email body
           */
          function getIllegalEmailBody(illegalCode) {
            var emailBody = '';

            switch (illegalCode) {
              case ILLEGAL_CODE.ILLEGAL_MOVE:
                emailBody = 'ILLEGAL_MOVE';
                break;
              case ILLEGAL_CODE.ILLEGAL_SIMPLE_MOVE:
                emailBody = 'ILLEGAL_SIMPLE_MOVE';
                break;
              case ILLEGAL_CODE.ILLEGAL_JUMP_MOVE:
                emailBody = 'ILLEGAL_JUMP_MOVE';
                break;
              case ILLEGAL_CODE.ILLEGAL_DELTA:
                emailBody = 'ILLEGAL_DELTA';
                break;
              case ILLEGAL_CODE.ILLEGAL_COLOR_CHANGED:
                emailBody = 'ILLEGAL_COLOR_CHANGED';
                break;
              case ILLEGAL_CODE.ILLEGAL_CROWNED:
                emailBody = 'ILLEGAL_CROWNED';
                break;
              case ILLEGAL_CODE.ILLEGAL_UNCROWNED:
                emailBody = 'ILLEGAL_UNCROWNED';
                break;
              case ILLEGAL_CODE.ILLEGAL_IGNORE_MANDATORY_JUMP:
                emailBody = 'ILLEGAL_IGNORE_MANDATORY_JUMP';
                break;
              case ILLEGAL_CODE.ILLEGAL_SET_TURN:
                emailBody = 'ILLEGAL_SET_TURN';
                break;
              case ILLEGAL_CODE.ILLEGAL_END_MATCH_SCORE:
                emailBody = 'ILLEGAL_END_MATCH_SCORE';
                break;
              default:
                throw new Error('Illegal code!!!');
            }

            return emailBody;
          }

          /**
           * Get the email object according to the illegal code.
           *
           * @param illegalCode
           * @returns {{email: string, emailSubject: string, emailBody: string}}
           */
          function getIllegalEmailObj(illegalCode) {
            return {
              email: 'yl1949@nyu.edu',
              emailSubject: 'hacker!',
              emailBody: getIllegalEmailBody(illegalCode)
            };
          }

          /**
           * Get the to square delta (the destination of the move) according to
           * the move type and direction.
           *
           * @param fromDelta the from square (the square contains the piece
           *                        moved or jumped) delta.
           * @param moveType the move type of the move, either simple move or jump
           *                 move
           * @param direction the direction of the move, up-left, up-right,
           *                  down-left and down-right.
           * @returns {number} the to square delta.
           */
          function getToDelta(fromDelta, moveType, direction) {
            var toDelta = {row: -1, col: -1};

            if (!isDarkSquare(fromDelta)) {
              throw new Error("Illegal from coordinate!!!");
            }

            switch (moveType) {
              case MOVE_TYPE.SIMPLE_MOVE:
                switch (direction) {
                  case DIRECTION.UP_LEFT:
                    toDelta.row = fromDelta.row - 1;
                    toDelta.col = fromDelta.col - 1;
                    break;
                  case DIRECTION.UP_RIGHT:
                    toDelta.row = fromDelta.row - 1;
                    toDelta.col = fromDelta.col + 1;
                    break;
                  case DIRECTION.DOWN_LEFT:
                    toDelta.row = fromDelta.row + 1;
                    toDelta.col = fromDelta.col - 1;
                    break;
                  case DIRECTION.DOWN_RIGHT:
                    toDelta.row = fromDelta.row + 1;
                    toDelta.col = fromDelta.col + 1;
                    break;
                  default:
                    throw new Error("Illegal direction!");
                }
                break;
              case MOVE_TYPE.JUMP_MOVE:
                switch (direction) {
                  case DIRECTION.UP_LEFT:
                    toDelta.row = fromDelta.row - 2;
                    toDelta.col = fromDelta.col - 2;
                    break;
                  case DIRECTION.UP_RIGHT:
                    toDelta.row = fromDelta.row - 2;
                    toDelta.col = fromDelta.col + 2;
                    break;
                  case DIRECTION.DOWN_LEFT:
                    toDelta.row = fromDelta.row + 2;
                    toDelta.col = fromDelta.col - 2;
                    break;
                  case DIRECTION.DOWN_RIGHT:
                    toDelta.row = fromDelta.row + 2;
                    toDelta.col = fromDelta.col + 2;
                    break;
                  default:
                    throw new Error(ILLEGAL_CODE.ILLEGAL_MOVE);
                }
                break;
              default:
                throw new Error(ILLEGAL_CODE.ILLEGAL_MOVE);
            }

            if (!isDarkSquare(toDelta)) {
              throw new Error(ILLEGAL_CODE.ILLEGAL_DELTA);
            }

            return toDelta;
          }

          /**
           * Get the first move to initialize the game.
           *
           * @returns {Array}
           */
          function getFirstMove() {
            var operations = [],
                board;

            operations.push({setTurn: {turnIndex: 0}});

            board =  [['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
              ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
              ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
              ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']];

            operations.push({set: {key: 'board', value: board}});

            return operations;
          }

          /**
           * Get all possible upwards simple moves for a specific piece by its
           * square delta.
           *
           * @param board the game board
           * @param delta the delta of the square holds the piece
           * @return an array of all possible moves
           */
          function getSimpleUpMoves(board, delta) {
            var moves = [],
                leftUpDelta,
                rightUpDelta;

            // If the piece is in the first row, then there's no way to move
            // upwards.
            if (delta.row === 0) {
              return moves;
            }

            if (delta.row % 2 === 0) {
              // Even row

              // Check left up
              leftUpDelta = getToDelta(delta,
                  MOVE_TYPE.SIMPLE_MOVE, DIRECTION.UP_LEFT);

              if (board[leftUpDelta.row][leftUpDelta.col] ===
                  CONSTANTS.DARK_SQUARE) {
                moves.push(leftUpDelta);
              }

              // Check right up
              // for the rightmost one, it can only move to the left up side.
              if (delta.col !== CONSTANTS.COLUMN - 1) {
                rightUpDelta = getToDelta(delta,
                    MOVE_TYPE.SIMPLE_MOVE, DIRECTION.UP_RIGHT);
                if (board[rightUpDelta.row][rightUpDelta.col] ===
                    CONSTANTS.DARK_SQUARE) {
                  moves.push(rightUpDelta);
                }
              }
            } else {
              // Odd row

              // Check left up
              // For the leftmost one, it can only move to the right up side
              if (delta.col !== 0) {
                leftUpDelta = getToDelta(delta,
                    MOVE_TYPE.SIMPLE_MOVE, DIRECTION.UP_LEFT);
                if (board[leftUpDelta.row][leftUpDelta.col] ===
                    CONSTANTS.DARK_SQUARE) {
                  moves.push(leftUpDelta);
                }
              }

              // Check right up
              rightUpDelta = getToDelta(delta,
                  MOVE_TYPE.SIMPLE_MOVE, DIRECTION.UP_RIGHT);

              if (board[rightUpDelta.row][rightUpDelta.col] ===
                  CONSTANTS.DARK_SQUARE) {
                moves.push(rightUpDelta);
              }
            }

            return moves;
          }

          /**
           * Get all possible downwards simple moves for a specific piece by its
           * square delta.
           *
           * @param board the game board
           * @param delta the delta of the square holds the piece
           * @return an array of all possible moves
           */
          function getSimpleDownMoves(board, delta) {
            var moves = [],
                leftDownDelta,
                rightDownDelta;

            // If the piece is in the last row, then there's no way to move
            // downwards.
            if (delta.row === CONSTANTS.ROW - 1) {
              return moves;
            }

            if (delta.row % 2 === 0) {
              // Even row

              // Check left down
              leftDownDelta = getToDelta(delta,
                  MOVE_TYPE.SIMPLE_MOVE, DIRECTION.DOWN_LEFT);

              if (board[leftDownDelta.row][leftDownDelta.col] ===
                  CONSTANTS.DARK_SQUARE) {
                moves.push(leftDownDelta);
              }

              // Check right down
              // for the rightmost one, it can only move to the left down side.
              if (delta.col !== CONSTANTS.COLUMN - 1) {
                rightDownDelta = getToDelta(delta,
                    MOVE_TYPE.SIMPLE_MOVE, DIRECTION.DOWN_RIGHT);
                if (board[rightDownDelta.row][rightDownDelta.col] ===
                    CONSTANTS.DARK_SQUARE) {
                  moves.push(rightDownDelta);
                }
              }
            } else {
              // Odd row

              // Check left down
              // For the leftmost one, it can only move to the right down side
              if (delta.col !== 0) {
                leftDownDelta = getToDelta(delta,
                    MOVE_TYPE.SIMPLE_MOVE, DIRECTION.DOWN_LEFT);
                if (board[leftDownDelta.row][leftDownDelta.col] ===
                    CONSTANTS.DARK_SQUARE) {
                  moves.push(leftDownDelta);
                }
              }

              // Check right down
              rightDownDelta = getToDelta(delta,
                  MOVE_TYPE.SIMPLE_MOVE, DIRECTION.DOWN_RIGHT);

              if (board[rightDownDelta.row][rightDownDelta.col] ===
                  CONSTANTS.DARK_SQUARE) {
                moves.push(rightDownDelta);
              }
            }

            return moves;
          }

          /**
           * Calculate the jumped (opponent) square delta
           * @param fromDelta the first selected square delta.
           *                      (The one moving or jumping)
           * @param toDelta the second selected square delta.
           *                     (The destination)
           * @returns {row: row, col: col} the jumped (opponent) square delta
           */
          function getJumpedDelta(fromDelta, toDelta) {
            var jumpedDelta = {row: -1, col: -1};

            if (!isDarkSquare(fromDelta) || !isDarkSquare(toDelta)) {
              throw new Error("Illegal coordinate!!!");
            }

            if ((Math.abs(fromDelta.row - toDelta.row) === 2) &&
                (Math.abs(fromDelta.col - toDelta.col) === 2)) {
              jumpedDelta.row = (fromDelta.row + toDelta.row) / 2;
              jumpedDelta.col = (fromDelta.col + toDelta.col) / 2;
            }

            return jumpedDelta;
          }


          /**
           * Get all possible upwards jump moves for a specific piece by its
           * square delta.
           *
           * @param board the game board
           * @param delta the delta of the square holds the piece
           * @return an array of all possible moves
           */
          function getJumpUpMoves(board, delta) {
            var moves = [],
                fromDelta = delta,
                fromSquare = board[delta.row][delta.col],
                jumpedDelta,
                jumpedSquare,
                toDelta,
                toSquare;

            // If the piece is in either the first or the second row, then there's
            // no way to jump upwards.
            if (fromDelta.row < 2) {
              return moves;
            }

            // Check left first, for the leftmost one, it can only jump right
            // upwards.
            if (fromDelta.col > 1) {
              toDelta = getToDelta(delta, MOVE_TYPE.JUMP_MOVE, DIRECTION.UP_LEFT);
              jumpedDelta = getJumpedDelta(fromDelta, toDelta);

              toSquare = board[toDelta.row][toDelta.col];
              jumpedSquare = board[jumpedDelta.row][jumpedDelta.col];

              if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
                moves.push(toDelta);
              }
            }

            // Check right, for the rightmost one, it can only jump left upwards.
            if (fromDelta.col < CONSTANTS.COLUMN - 2) {
              toDelta =
                  getToDelta(delta, MOVE_TYPE.JUMP_MOVE, DIRECTION.UP_RIGHT);
              jumpedDelta = getJumpedDelta(fromDelta, toDelta);

              toSquare = board[toDelta.row][toDelta.col];
              jumpedSquare = board[jumpedDelta.row][jumpedDelta.col];

              if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
                moves.push(toDelta);
              }
            }

            return moves;
          }

          /**
           * Get all possible downwards jump moves for a specific piece by its
           * square delta.
           *
           * @param board the game board
           * @param delta the delta of the square holds the piece
           * @return an array of all possible moves
           */
          function getJumpDownMoves(board, delta) {
            var fromCoordinate = delta,
                fromSquare = board[delta.row][delta.col],
                jumpedCoordinate,
                jumpedSquare,
                toCoordinate,
                toSquare,
                moves = [];

            // If the piece is in the last two rows, then there's no way to jump
            // downwards.
            if (fromCoordinate.row > CONSTANTS.ROW - 3) {
              return moves;
            }

            // Check left first, for the leftmost one, it can only jump right
            // downwards.
            if (fromCoordinate.col > 1) {
              toCoordinate = getToDelta(delta, MOVE_TYPE.JUMP_MOVE,
                  DIRECTION.DOWN_LEFT);
              jumpedCoordinate = getJumpedDelta(fromCoordinate, toCoordinate);

              toSquare = board[toCoordinate.row][toCoordinate.col];
              jumpedSquare = board[jumpedCoordinate.row][jumpedCoordinate.col];

              if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
                moves.push(toCoordinate);
              }
            }


            // Check right, for the rightmost one, it can only jump left
            // downwards.
            if (fromCoordinate.col < CONSTANTS.COLUMN - 2) {
              toCoordinate = getToDelta(delta, MOVE_TYPE.JUMP_MOVE,
                  DIRECTION.DOWN_RIGHT);
              jumpedCoordinate = getJumpedDelta(fromCoordinate, toCoordinate);

              toSquare = board[toCoordinate.row][toCoordinate.col];
              jumpedSquare = board[jumpedCoordinate.row][jumpedCoordinate.col];

              if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
                moves.push(toCoordinate);
              }
            }

            return moves;
          }

          /**
           * Get all possible simple moves for a specific piece by its square
           * delta. If it is crowned, also check if it can move one step backward.
           *
           * @param board the game board
           * @param delta the delta of the square holds the piece
           * @param turnIndex 0 represents the black player and 1
           *        represents the white player.
           * @return an array of all possible moves.
           */
          function getSimpleMoves(board, delta, turnIndex) {
            var moves = [],
                tmpMoves = [],
                fromSquare = board[delta.row][delta.col],
                color = fromSquare.substr(0, 1),
                kind = fromSquare.substr(1);

            // Check whether it's the current player's piece first, if not, since
            // the player can not operate it, then no move will be available.
            if (isOwnColor(turnIndex, color)) {
              if (kind === CONSTANTS.KING) {
                // Check both direction moves
                tmpMoves = getSimpleUpMoves(board, delta);
                moves = moves.concat(tmpMoves);
                tmpMoves = getSimpleDownMoves(board, delta);
                moves = moves.concat(tmpMoves);
              } else if (color === CONSTANTS.WHITE) {
                tmpMoves = getSimpleUpMoves(board, delta);
                moves = moves.concat(tmpMoves);
              } else if (color === CONSTANTS.BLACK) {
                tmpMoves = getSimpleDownMoves(board, delta);
                moves = moves.concat(tmpMoves);
              }
            }

            return moves;
          }

          /**
           * Get all possible jump moves for a specific piece by its square delta.
           * If it is crowned, also check if it can jump one step backward.
           *
           * @param board the game board
           * @param delta the delta of the square holds the piece
           * @param turnIndex 0 represents the black player and 1
           *        represents the white player.
           * @return an array of all possible moves
           */
          function getJumpMoves(board, delta, turnIndex) {
            var moves = [],
                tmpMoves = [],
                fromSquare = board[delta.row][delta.col],
                color = fromSquare.substr(0, 1),
                kind = fromSquare.substr(1);
            // Check whether it's the current player's piece first, if not, since
            // the player can not operate it, then no move will be available.
            if (isOwnColor(turnIndex, color)) {
              if (kind === CONSTANTS.KING) {
                // Check both direction moves
                tmpMoves = getJumpUpMoves(board, delta);
                moves = moves.concat(tmpMoves);

                tmpMoves = getJumpDownMoves(board, delta);
                moves = moves.concat(tmpMoves);
              } else if (color === CONSTANTS.WHITE) {
                tmpMoves = getJumpUpMoves(board, delta);
                moves = moves.concat(tmpMoves);
              } else if (color === CONSTANTS.BLACK) {
                tmpMoves = getJumpDownMoves(board, delta);
                moves = moves.concat(tmpMoves);
              }
            }

            return moves;
          }

          /**
           * Get all possible moves for a specific piece by its square delta.
           *
           * @param board the game board.
           * @param delta the delta of the square holds the piece
           * @param turnIndex 0 represents the black player and 1
           *        represents the white player.
           * @return an array of all possible move.
           */
          function getAllPossibleMoves(board, delta, turnIndex) {
            var possibleMoves;

            // First get all possible jump moves.
            possibleMoves = getJumpMoves(board, delta, turnIndex);
            // If there's at least one jump move, then no need to check the simple
            // moves since jump move is mandatory.
            if (possibleMoves.length === 0) {
              possibleMoves = getSimpleMoves(board, delta, turnIndex);
            }

            return possibleMoves;
          }

          /**
           * Get the winner based on the current board.
           *
           * @param board the game board
           * @param turnIndex 0 represents the black player and 1
           *        represents the white player.
           * @returns string "B" if the piece is black, "W" if the piece is
           *                white, otherwise it's empty.
           */
          function getWinner(board, turnIndex) {
            var allPossibleMoves = [],
                hasWhite,
                hasBlack,
                square,
                coordinate = {row: -1, col: -1},
                row,
                col;

            // Check whether there's any piece for both of the player
            for (row = 0; row < CONSTANTS.ROW; row += 1) {
              for (col = 0; col < CONSTANTS.COLUMN; col += 1) {
                if (getColor(board[row][col]) === CONSTANTS.WHITE) {
                  hasWhite = true;
                } else if (getColor(board[row][col]) === CONSTANTS.BLACK) {
                  hasBlack = true;
                }

                if (hasWhite === true && hasBlack === true) {
                  // No need to check the rest
                  break;
                }
              }
            }

            // White won because white player has no pieces
            if (hasWhite && !hasBlack) {
              return CONSTANTS.WHITE;
            }

            // Black won because black player has no pieces
            if (!hasWhite && hasBlack) {
              return CONSTANTS.BLACK;
            }

            // Get all the moves for the current turn player
            for (row = 0; row < CONSTANTS.ROW; row += 1) {
              for (col = 0; col < CONSTANTS.COLUMN; col += 1) {
                coordinate.row = row;
                coordinate.col = col;
                square = board[row][col];

                if (turnIndex === CONSTANTS.BLACK_INDEX) {
                  allPossibleMoves = allPossibleMoves.concat(
                      getAllPossibleMoves(board, coordinate, 1 - turnIndex)
                  );
                } else {
                  // Get all white's moves
                  allPossibleMoves = allPossibleMoves.concat(
                      getAllPossibleMoves(board, coordinate, 1 - turnIndex)
                  );
                }
              }
            }

            if (allPossibleMoves.length === 0) {
              if (turnIndex === CONSTANTS.BLACK_INDEX) {
                // Black has no moves, so white wins!
                return CONSTANTS.BLACK;
              }
              return CONSTANTS.WHITE;
            }

            // No winner, the game is not ended.
            return '';
          }

          /**
           * Check if there's any mandatory jumps for the player.
           *
           * @returns true if there has, otherwise false.
           */
          function hasMandatoryJumps(board, yourPlayerIndex) {
            var possibleMoves = [],
                delta = {row: -1, col: -1},
                row,
                col;

            for (row = 0; row < CONSTANTS.ROW; row += 1) {
              for (col = 0; col < CONSTANTS.COLUMN; col += 1) {
                delta.row = row;
                delta.col = col;
                possibleMoves = possibleMoves.concat(
                    getJumpMoves(board, delta, yourPlayerIndex)
                );
              }
            }
            return possibleMoves.length > 0;
          }

          /**
           * Get the expected operations for the selected squares (from and to
           * square deltas).
           *
           * @param board the game API state.
           * @param fromDelta the first selected square delta. (The one moving or
           *                  jumping)
           * @param toDelta the second selected square delta. (The destination)
           * @param turnIndexBeforeMove 0 represents the black player and 1
           *        represents the white player.
           * @returns {Array} operations
           */
          function createMove(board, fromDelta, toDelta, turnIndexBeforeMove) {
            var firstOperation,
                isAJumpMove = false,
                isASimpleMove = false,
                possibleSimpleMoves,
                possibleJumpMoves,
                winner,
                jumpedCoord;

            /*********************************************************************
             * 1. Check the coordinates first.
             ********************************************************************/

            if (!isDarkSquare(fromDelta) ||
                !isDarkSquare(toDelta)) {
              throw new Error(ILLEGAL_CODE.ILLEGAL_DELTA);
            }

            if (isSimpleMove(board, fromDelta, toDelta)) {
              isASimpleMove = true;
            } else if (isJumpMove(board, fromDelta, toDelta)) {
              isAJumpMove = true;
            }

            /*********************************************************************
             * 2a. Check if the move is legal
             ********************************************************************/
            if (isASimpleMove) {
              // Simple move
              // Check if there are any mandatory jumps.
              if (hasMandatoryJumps(board, turnIndexBeforeMove)) {
                // At least one jump move exists for the player, since jump move
                // is mandatory, the move is illegal.
                throw new Error(ILLEGAL_CODE.ILLEGAL_IGNORE_MANDATORY_JUMP);
              }

              // No mandatory jumps, then get all simple moves.
              possibleSimpleMoves = getSimpleMoves(board, fromDelta,
                  turnIndexBeforeMove);

              // The move should exist in the possible simple moves.
              if (!doesContainMove(possibleSimpleMoves, toDelta)) {
                throw new Error(ILLEGAL_CODE.ILLEGAL_SIMPLE_MOVE);
              }
            } else if (isAJumpMove) {
              // Jump move
              possibleJumpMoves = getJumpMoves(board, fromDelta,
                  turnIndexBeforeMove);
              // The move should exist in the possible jump moves.
              if (!doesContainMove(possibleJumpMoves, toDelta)) {
                throw new Error(ILLEGAL_CODE.ILLEGAL_JUMP_MOVE);
              }
            } else {
              // Illegal move since it's not simple move nor jump move.
              throw new Error(ILLEGAL_CODE.ILLEGAL_MOVE);
            }

            /*********************************************************************
             * 2b. Set the board.
             ********************************************************************/

            if (isASimpleMove) {
              board[toDelta.row][toDelta.col] =
                  board[fromDelta.row][fromDelta.col];
              board[fromDelta.row][fromDelta.col] = CONSTANTS.DARK_SQUARE;
            } else if (isAJumpMove) {
              jumpedCoord = getJumpedDelta(fromDelta, toDelta);
              board[toDelta.row][toDelta.col] =
                  board[fromDelta.row][fromDelta.col];
              board[fromDelta.row][fromDelta.col] = CONSTANTS.DARK_SQUARE;
              board[jumpedCoord.row][jumpedCoord.col] = CONSTANTS.DARK_SQUARE;
            }

            /*********************************************************************
             * 3. Check if the piece remains the same or is legally crowned.
             ********************************************************************/

            var isToKingsRow =
                hasMoveOrJumpToKingsRow(toDelta, turnIndexBeforeMove);
            if (isToKingsRow) {
              if (getColor(board[toDelta.row][toDelta.col]) ===
                  CONSTANTS.BLACK) {
                board[toDelta.row][toDelta.col] = CONSTANTS.BLACK_KING;
              } else if (getColor(board[toDelta.row][toDelta.col]) ===
                  CONSTANTS.WHITE) {
                board[toDelta.row][toDelta.col] = CONSTANTS.WHITE_KING;
              }
            }

            /*********************************************************************
             * 4. Check the set turn index or end match operation.
             ********************************************************************/

            winner = getWinner(board, turnIndexBeforeMove);

            if (winner !== '') {
              // Has a winner
              firstOperation = {endMatch: {endMatchScores:
                  winner === CONSTANTS.WHITE ? [1, 0] :  [0, 1]}};
            } else {
              possibleJumpMoves = getJumpMoves(board, toDelta,
                  turnIndexBeforeMove);
              if (isAJumpMove && possibleJumpMoves.length > 0) {
                if (!isToKingsRow) {
                  // If the same piece can make any more jump moves and it does
                  // not enter the kings row, then the next turn remains
                  // unchanged.
                  firstOperation = {setTurn: {turnIndex: turnIndexBeforeMove}};
                } else {
                  // The piece can not make any more jump moves or it enters the
                  // kings row
                  firstOperation =
                  {setTurn: {turnIndex: 1 - turnIndexBeforeMove}};
                }
              } else {
                // The next turn will be the next player's if it's a simple move.
                firstOperation = {setTurn: {turnIndex: 1 - turnIndexBeforeMove}};
              }
            }

            return [firstOperation,
              {set: {key: 'board', value: board}},
              {set: {key: 'fromDelta', value: fromDelta}},
              {set: {key: 'toDelta', value: toDelta}}];
          }

          /**
           * Check if the move is OK.
           *
           * @param params the match info which contains stateBeforeMove,
           *              stateAfterMove, turnIndexBeforeMove, turnIndexAfterMove,
           *              move.
           * @returns return true if the move is ok, otherwise false.
           */
          function isMoveOk(params, debug) {
            var stateBeforeMove = params.stateBeforeMove,
                turnIndexBeforeMove = params.turnIndexBeforeMove,
                move = params.move,
                board,
                fromDelta,
                toDelta,
                expectedMove;

            /*********************************************************************
             * 1. If the stateBeforeMove is empty, then it should be the first
             *    move, set the board of stateBeforeMove to be the initial board.
             *    If the stateBeforeMove is not empty, then the move operations
             *    array should have a length of 4.
             ********************************************************************/


            if (isEmptyObj(stateBeforeMove)) {
              return angular.equals(move, getFirstMove());
            }

            // If the move length is not 4, it's illegal
            if (move.length !== 4) {
              return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_MOVE);
            }

            /*********************************************************************
             * 2. Compare the expected move and the player's move.
             ********************************************************************/
            try {
              /*
               * Example move:
               * [
               *   {setTurn: {turnIndex: 1}},
               *   {set: {key: 'board', value: [
               *     ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
               *     ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
               *     ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'BM'],
               *     ['BM', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
               *     ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
               *     ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
               *     ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
               *     ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']]
               *   }}
               *   {set: {key: 'fromDelta', value: {row: 2, col: 1}}}
               *   {set: {key: 'toDelta', value: {row: 3, col: 0}}}
               * ]
               */

              board = stateBeforeMove.board;
              fromDelta = move[2].set.value;
              toDelta = move[3].set.value;
              expectedMove =
                  createMove(board, fromDelta, toDelta, turnIndexBeforeMove);
              if (debug) {
                console.log("Debug");
                console.log(JSON.stringify(move));
                console.log(JSON.stringify(expectedMove));
                console.log(angular.equals(move, expectedMove));
              }

              if (!angular.equals(move, expectedMove)) {
                return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_MOVE);
              }
            } catch (e) {
              // if there are any exceptions then the move is illegal
//            console.log('Erorr: ' + e.message);
              switch (e.message) {
                case ILLEGAL_CODE.ILLEGAL_MOVE:
                  return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_MOVE);
                case ILLEGAL_CODE.ILLEGAL_SIMPLE_MOVE:
                  return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_SIMPLE_MOVE);
                case ILLEGAL_CODE.ILLEGAL_JUMP_MOVE:
                  return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_JUMP_MOVE);
                case ILLEGAL_CODE.ILLEGAL_DELTA:
                  return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_DELTA);
                case ILLEGAL_CODE.ILLEGAL_COLOR_CHANGED:
                  return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_COLOR_CHANGED);
                case ILLEGAL_CODE.ILLEGAL_CROWNED:
                  return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_CROWNED);
                case ILLEGAL_CODE.ILLEGAL_UNCROWNED:
                  return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_UNCROWNED);
                case ILLEGAL_CODE.ILLEGAL_IGNORE_MANDATORY_JUMP:
                  return getIllegalEmailObj(ILLEGAL_CODE
                      .ILLEGAL_IGNORE_MANDATORY_JUMP);
                case ILLEGAL_CODE.ILLEGAL_SET_TURN:
                  return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_SET_TURN);
                case ILLEGAL_CODE.ILLEGAL_END_MATCH_SCORE:
                  return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_END_MATCH_SCORE);
                default:
                  return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_CODE);
              }
            }

            return true;
          }

          /**
           * Return the initial board
           */
          function getInitialBoard() {
            return [['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
              ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
              ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
              ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']];
          }

          return {
            isMoveOk: isMoveOk,
            getFirstMove: getFirstMove,
            createMove: createMove,
            getJumpMoves: getJumpMoves,
            getSimpleMoves: getSimpleMoves,
            getAllPossibleMoves: getAllPossibleMoves,
            hasMandatoryJumps: hasMandatoryJumps,
            getJumpedDelta: getJumpedDelta,
            isOwnColor: isOwnColor,
            getIllegalEmailObj: getIllegalEmailObj,
            getWinner: getWinner,
            getColor: getColor,
            getKind: getKind,
            isEmptyObj: isEmptyObj,
            isSimpleMove: isSimpleMove,
            isJumpMove: isJumpMove,
            getInitialBoard: getInitialBoard,
            CONSTANTS: CONSTANTS
          };
        }]);
}());;/**
 * This is the controller for Checkers.
 */
angular.module('myApp')
    .controller('CheckersCtrl',
    ['$scope', '$log', '$timeout', '$translate',
      'gameService', 'stateService',
      'checkersLogicService', 'checkersAiService',
      'resizeGameAreaService', 'dragAndDropService',
      function ($scope, $log, $timeout, $translate,
                gameService, stateService,
                checkersLogicService, checkersAiService,
                resizeGameAreaService, dragAndDropService) {

        'use strict';

        console.log("Translation of 'RULES_OF_TICTACTOE' is " + $translate('RULES_OF_CHECKERS'));

        var CONSTANTS = checkersLogicService.CONSTANTS;
        var gameArea = document.getElementById("gameArea");
        var hasMadeMove = false;

        // Global variables for drag-n-drop and ai move animations
        var dndStartPos = null;
        var dndElem = null;
        var aiMoveDeltas = null;

        var isUndefinedOrNull = function (val) {
          return angular.isUndefined(val) || val === null;
        };

        /**
         * Check if it is a dark cell.
         */
        $scope.isDarkCell = function (row, col) {
          var isEvenRow = row % 2 === 0;
          var isEvenCol = col % 2 === 0;

          return ((!isEvenRow && isEvenCol) || (isEvenRow && !isEvenCol));
        };

        /**
         * Check if there's a piece within the cell.
         */
        $scope.hasPiece = function (row, col) {
          var delta = {row: row, col: col};
          var rotatedDelta = rotate(delta);

          return $scope.isDarkCell(rotatedDelta.row, rotatedDelta.col) &&
              !isUndefinedOrNull($scope.board) &&
              $scope.board[rotatedDelta.row][rotatedDelta.col] !== 'DS';
        };

        /**
         * Get the piece image path
         */
        $scope.getPieceSrc = function (row, col) {
          var delta = {row: row, col: col};
          var rotatedDelta = rotate(delta);
          var dir = 'images/';
          var ext = '.png';

          if ($scope.hasPiece(row, col)) {
            switch ($scope.board[rotatedDelta.row][rotatedDelta.col]) {
              case 'BM':
                return dir + 'black_man' + ext;
              case 'BK':
                return dir + 'black_cro' + ext;
              case 'WM':
                return dir + 'white_man' + ext;
              case 'WK':
                return dir + 'white_cro' + ext;
            }
          }

          return dir + 'empty' + ext;
        };

        function handleDragEvent(type, cx, cy) {
          var cellSize = getCellSize();

          // Make sure the player can not drag the piece outside of the board
          var x = Math.min(Math.max(cx - gameArea.offsetLeft, cellSize.width / 2), gameArea.clientWidth - cellSize.width / 2);
          var y = Math.min(Math.max(cy - gameArea.offsetTop, cellSize.height / 2), gameArea.clientHeight - cellSize.height / 2);

          var delta = {
            row: Math.floor(CONSTANTS.ROW * y / gameArea.clientHeight),
            col: Math.floor(CONSTANTS.COLUMN * x / gameArea.clientWidth)
          };
          var rotatedDelta = rotate(delta);

          if (type === "touchstart" && canDrag(delta.row, delta.col) && isUndefinedOrNull(dndStartPos)) {
            // Start to drag a piece
            dndStartPos = angular.copy(delta);

            // If a piece is dragged, store the piece element
            if ($scope.hasPiece(delta.row, delta.col) &&
                $scope.isYourTurn &&
                isOwnColor(rotatedDelta)) {
              dndElem = document.getElementById("img_" + dndStartPos.row + "_" + dndStartPos.col);
            }
          } else if (type === "touchend" && !isUndefinedOrNull(dndStartPos)) {
            // Drop a piece
            var from = {row: dndStartPos.row, col: dndStartPos.col};
            var to = {row: delta.row, col: delta.col};

            makeMove(rotate(from), rotate(to));

            setDndElemPos(getCellPos(dndStartPos.row, dndStartPos.col));

            dndStartPos = null;
            if (!isUndefinedOrNull(dndElem)) {
              dndElem.removeAttribute("style");
              dndElem = null;
            }
          } else if (type === 'touchmove' && !isUndefinedOrNull(dndStartPos)) {
            // Dragging around

            setDndElemPos({
              top: y - cellSize.height * 0.605,
              left: x - cellSize.width * 0.605
            });
          }

          // Clean up
          if (type === "touchend" || type === "touchcancel" || type === "touchleave") {
            dndStartPos = null;
            dndElem = null;
          }
        }

        /**
         * Check if the piece in the delta position has the own color.
         */
        function isOwnColor(delta) {
          return checkersLogicService.isOwnColor($scope.yourPlayerIndex, $scope.board[delta.row][delta.col].substring(0, 1));
        }

        /**
         * Set the position of the element.
         */
        function setDndElemPos(pos) {
          var size = getCellSize();
          var top = size.height / 10;
          var left = size.width / 10;

          var originalSize = getCellPos(dndStartPos.row, dndStartPos.col);
          if (dndElem !== null) {
            dndElem.style.left = (pos.left - originalSize.left + left) + "px";
            dndElem.style.top = (pos.top - originalSize.top + top) + "px";
          }
        }

        /**
         * Get the size of the cell.
         */
        function getCellSize() {
          return {
            width: gameArea.clientWidth / CONSTANTS.COLUMN,
            height: gameArea.clientHeight / CONSTANTS.ROW
          };
        }

        /**
         * Get the position of the cell.
         */
        function getCellPos(row, col) {
          var size = getCellSize();
          return {top: row * size.height, left: col * size.width};
        }

        /**
         * Rotate 180 degrees by simply convert the row and col number for UI.
         */
        function rotate(delta) {
          if ($scope.rotate) {
            // Zero based
            return {
              row: CONSTANTS.ROW - delta.row - 1,
              col: CONSTANTS.COLUMN - delta.col - 1
            };
          }

          return delta;
        }

        /**
         * Check if the piece can be dragged.
         */
        function canDrag(row, col) {
          var delta = {row: row, col: col};
          var rotatedDelta = rotate(delta);

          if (!$scope.isDarkCell(row, col) || !checkersLogicService.isOwnColor($scope.yourPlayerIndex, $scope.board[rotatedDelta.row][rotatedDelta.col].substr(0, 1))) {
            return false;
          }

          var hasMandatoryJump = checkersLogicService.hasMandatoryJumps($scope.board, $scope.yourPlayerIndex);
          var possibleMoves;

          if (hasMandatoryJump) {
            possibleMoves = checkersLogicService
                .getJumpMoves($scope.board, rotatedDelta, $scope.yourPlayerIndex);
          } else {
            possibleMoves = checkersLogicService
                .getSimpleMoves($scope.board, rotatedDelta, $scope.yourPlayerIndex);
          }

          return possibleMoves.length > 0;
        }

        /**
         * Convert the delta to UI state index
         */
        function toIndex(row, col) {
          return row * CONSTANTS.COLUMN + col;
        }

        /**
         * Add animation class so the animation may be performed accordingly
         *
         * @param callback makeMove function which will be called after the
         *                 animation is completed.
         */
        function playAnimation(fromDelta, toDelta, addClass, cb) {
          var fromIdx = toIndex(fromDelta.row, fromDelta.col);
          var toIdx = toIndex(toDelta.row, toDelta.col);
          var elem = document.getElementById("img_" + fromDelta.row + "_" + fromDelta.col);

          // Add the corresponding animation class
          switch (toIdx - fromIdx) {
            case CONSTANTS.COLUMN + 1:
              // Simple move up left
              processAnimationClass(elem, addClass, 'move_down_right', 'move_up_left');
              break;
            case CONSTANTS.COLUMN - 1:
              // Simple move up right
              processAnimationClass(elem, addClass, 'move_down_left', 'move_up_right');
              break;
            case -CONSTANTS.COLUMN + 1:
              // Simple move down left
              processAnimationClass(elem, addClass, 'move_up_right', 'move_down_left');
              break;
            case -CONSTANTS.COLUMN - 1:
              // Simple move down right
              processAnimationClass(elem, addClass, 'move_up_left', 'move_down_right');
              break;
            case (2 * CONSTANTS.COLUMN) + 2:
              // Jump move up left
              processAnimationClass(elem, addClass, 'jump_down_right', 'jump_up_left');
              break;
            case (2 * CONSTANTS.COLUMN) - 2:
              // Jump move up right
              processAnimationClass(elem, addClass, 'jump_down_left', 'jump_up_right');
              break;
            case -(2 * CONSTANTS.COLUMN) + 2:
              // Jump move down left
              processAnimationClass(elem, addClass, 'jump_up_right', 'jump_down_left');
              break;
            case -(2 * CONSTANTS.COLUMN) - 2:
              // Jump move down right
              processAnimationClass(elem, addClass, 'jump_up_left', 'jump_down_right');
              break;
          }

          if (addClass) {
            elem.addEventListener("animationend", cb, false);
            elem.addEventListener("webkitAnimationEnd", cb, false);
          } else {
            //todo
            elem.removeEventListener("animationend");
            elem.removeEventListener("webkitAnimationEnd");
            cb();
          }


        }

        function processAnimationClass(elem, addClass, normalClassName, rotatedClassName) {
          if (addClass) {
            if ($scope.rotate) {
              elem.className += ' ' + rotatedClassName;
            } else {
              elem.className += ' ' + normalClassName;
            }
          } else {
            elem.className = 'piece';
          }
        }

        /**
         * Make the move by using gameService.
         */
        function makeMove(fromDelta, toDelta) {
          var operations;

          try {
            operations = checkersLogicService.createMove(angular.copy($scope.board),
                fromDelta, toDelta, $scope.yourPlayerIndex);
          } catch (e) {
            return;
          }

          if (!hasMadeMove) {
            hasMadeMove = true;
            gameService.makeMove(operations);
          }
        }

        /**
         * This function use the alpha beta pruning algorithm to calculate a
         * best move for the ai, then play the animation and after the animation
         * ends, make the move.
         */
        function aiMakeMove() {
          var bestMove,
              timeLimit = 1000;

          bestMove = checkersAiService.
              createComputerMove($scope.board, $scope.yourPlayerIndex,
              // 1 seconds for the AI to choose a move
              {millisecondsLimit: timeLimit});

          // Instead of making the move directly, use makeMove function instead.
          var from = bestMove[bestMove.length - 2];
          var to = bestMove[bestMove.length - 1];
          var fromDelta = {
            row: from.set.value.row,
            col: from.set.value.col
          };
          var toDelta = {
            row: to.set.value.row,
            col: to.set.value.col
          };

          aiMoveDeltas = {from: fromDelta, to: toDelta};

          playAnimation(fromDelta, toDelta, true, function () {
            // Make the move after playing the animaiton.
            makeMove(fromDelta, toDelta);
          });
        }

        /**
         * This method update the game's UI.
         * @param params
         */
        function updateUI(params) {
          hasMadeMove = false;

          //Rotate the board 180 degrees, hence in the point of current
          //player's view, the board always face towards him/her;
          if (params.playMode === "playBlack") {
            $scope.rotate = true;
          } else {
            $scope.rotate = false;
          }

          // Get the new state
          $scope.yourPlayerIndex = params.yourPlayerIndex;
          $scope.playersInfo = params.playersInfo;
          $scope.board = params.stateAfterMove.board;

          // White player initialize the game if the board is empty.
          if (isUndefinedOrNull($scope.board) && params.yourPlayerIndex === 0) {
            initial();
            return;
          }

          // It's your move. (For the current browser...)
          $scope.isYourTurn = params.turnIndexAfterMove >= 0 &&
              params.yourPlayerIndex === params.turnIndexAfterMove;

          // You're a human player
          $scope.isPlayerMove = $scope.isYourTurn &&
              params.playersInfo[params.yourPlayerIndex].playerId !== '';

          // You're an AI player
          $scope.isAiMove = $scope.isYourTurn &&
              params.playersInfo[params.yourPlayerIndex].playerId === '';

          if (!isUndefinedOrNull(aiMoveDeltas)) {
            playAnimation(aiMoveDeltas.from, aiMoveDeltas.to, false, function () {
              aiMoveDeltas = null;
            });
          }

          // The game is properly initialized, let's make a move :)
          // But first update the graphics (isAiMove: true)
          if ($scope.isAiMove) {
            $timeout(aiMakeMove, 500);
          }
        }

        /**
         * Send initial move
         */
        var initial = function () {
          try {
            var move = checkersLogicService.getFirstMove();
            gameService.makeMove(move);
          } catch (e) {
            $log.info(e);
            $log.info("initialGame() failed");
          }
        };

        resizeGameAreaService.setWidthToHeight(1);

        dragAndDropService.addDragListener("gameArea", handleDragEvent);

        /**
         * Set the game!
         */
        gameService.setGame({
          gameDeveloperEmail: "yl1949@nyu.edu",
          minNumberOfPlayers: 2,
          maxNumberOfPlayers: 2,
          isMoveOk: checkersLogicService.isMoveOk,
          updateUI: updateUI
        });
      }]);;(function () {
  'use strict';
  /*global angular */

  /**
   * Checkers new AI service.
   *
   * This is based on the alphaBetaService:
   * http://yoav-zibin.github.io/emulator/alphaBetaService.js
   *
   * The evaluation function is copied from chinese website http://bit.ly/XTUy5g
   */
  angular.module('myApp').factory('checkersAiService',
      ['checkersLogicService', 'alphaBetaService',
        function (checkersLogicService, alphaBetaService) {

          var CONSTANTS = checkersLogicService.CONSTANTS;

          /***********************************************************************
           * Heuristic part
           **********************************************************************/

          /**
           * Get the square value.
           * For man, the value is 5.
           * For man which close to be crowned (1 simple move), the value is 7.
           * For crown, the value is 10.
           *
           * @param square the square info. e.g. 'WMAN', 'BCRO'.
           * @param squareIndex the square index.
           * @returns {number} the square value.
           */
          function getSquareValue(square, row, col) {
            if (checkersLogicService.getKind(square) === CONSTANTS.MAN) {
              if (checkersLogicService.getColor(square) === CONSTANTS.WHITE) {
                // White
                if (row === 1) {
                  // Closed to be crowned
                  return 7;
                }
                return 5;
              }

              // Black
              if (col === CONSTANTS.ROW - 2) {
                // Closed to be crowned
                return 7;
              }
              return 5;
            }

            if (checkersLogicService.getKind(square) === CONSTANTS.KING) {
              // It's a crown
              return 10;
            }

            // Empty square
            return 0;
          }

          /**
           * Get the board value.
           *
           * @param board the game API board.
           * @param turnIndex 0 represents the black player and 1
           *        represents the white player.
           * @returns {*} the board value.
           */
          function getStateValue(board, turnIndex) {
            var stateValue = 0,
                winner,
            // For different position of the board, there's a different weight.
                boardWeight = [
                  [0, 4, 0, 4, 0, 4, 0, 4],
                  [4, 0, 3, 0, 3, 0, 3, 0],
                  [0, 3, 0, 2, 0, 2, 0, 4],
                  [4, 0, 2, 0, 1, 0, 3, 0],
                  [0, 3, 0, 1, 0, 2, 0, 4],
                  [4, 0, 2, 0, 2, 0, 3, 0],
                  [0, 3, 0, 3, 0, 3, 0, 4],
                  [4, 0, 4, 0, 4, 0, 4, 0]
                ],
                cell,
                squareValue,
                row,
                col;

            winner = checkersLogicService.getWinner(board, turnIndex);

            if (winner === CONSTANTS.WHITE) {
              return Number.MIN_VALUE;
            }

            if (winner === CONSTANTS.BLACK) {
              return Number.MAX_VALUE;
            }

            for (row = 0; row < CONSTANTS.ROW; row += 1) {
              for (col = 0; col < CONSTANTS.COLUMN; col += 1) {
                cell = board[row][col];

                if (cell !== CONSTANTS.LIGHT_SQUARE &&
                    cell !== CONSTANTS.DARK_SQUARE) {
                  // Get the square value which equals to the square value
                  // multiply the board weight.
                  squareValue = getSquareValue(cell, row, col) *
                      boardWeight[row][col];

                  if (checkersLogicService.getColor(cell) ===
                      CONSTANTS.BLACK) {
                    // BLACK
                    stateValue += squareValue;
                  } else {
                    // WHITE
                    stateValue -= squareValue;
                  }
                }
              }
            }

            return stateValue;
          }

          /**
           * Get the state score for player 0, a simple wrapper function
           */
          function getStateScoreForIndex0(move, turnIndex) {
            // getStateValue return the score for player 1.
            return -getStateValue(move[1].set.value, turnIndex);
          }

          /**
           * Get all possible moves.
           *
           * @param board the game API board
           * @param turnIndex 0 represents the black player and 1
           *        represents the white player.
           * @returns {
         *            fromIndex: number,
         *            toIndex: number
         *          }
           */
          function getAllMoves(board, turnIndex) {
            var allPossibleMoves = [],
                hasMandatoryJump,
                possibleMoves,
                delta,
                row,
                col,
                i;

            hasMandatoryJump =
                checkersLogicService.hasMandatoryJumps(board, turnIndex);

            // Check each square of the board
            for (row = 0; row < CONSTANTS.ROW; row += 1) {
              for (col = 0; col < CONSTANTS.COLUMN; col += 1) {
                if (checkersLogicService.isOwnColor(turnIndex,
                        board[row][col].substr(0, 1))) {
                  delta = {row: row, col: col};
//                squareIndex = parseInt(squareIndex, 10);

                  if (hasMandatoryJump) {
                    // If there's any mandatory jumps
                    possibleMoves = checkersLogicService
                        .getJumpMoves(board, delta, turnIndex);
                  } else {
                    // If there's no mandatory jump,
                    // then check the possible simple move
                    possibleMoves = checkersLogicService
                        .getSimpleMoves(board, delta, turnIndex);
                  }

                  for (i = 0; i < possibleMoves.length; i += 1) {
                    allPossibleMoves.push([delta, possibleMoves[i]]);
                  }
                }
              }
            }

            return allPossibleMoves;
          }

          /**
           * Get the next state which is extracted from the move operations.
           */
          function getNextStates(move, playerIndex) {
            var board = move[1].set.value;
            var allPossibleMoveDeltas = getAllMoves(board, playerIndex);
            var allPossibleMoves = [];

            for (var i = 0; i < allPossibleMoveDeltas.length; i++) {
              allPossibleMoves[i] = checkersLogicService.createMove(angular.copy(board),
                  allPossibleMoveDeltas[i][0], allPossibleMoveDeltas[i][1],
                  playerIndex);
            }

            return allPossibleMoves;
          }

          /***********************************************************************
           * Service part...
           **********************************************************************/

          /**
           * Returns the move that the computer player should do for the given board.
           * alphaBetaLimits is an object that sets a limit on the alpha-beta search,
           * and it has either a millisecondsLimit or maxDepth field:
           * millisecondsLimit is a time limit, and maxDepth is a depth limit.
           */
          function createComputerMove(board, playerIndex, alphaBetaLimits) {
            // We use alpha-beta search, where the search states are TicTacToe moves.
            // Recal that a TicTacToe move has 3 operations:
            // 1) endMatch or setTurn
            // 2) {set: {key: 'board', value: ...}}
            // 3) {set: {key: 'delta', value: ...}}]
            return alphaBetaService.alphaBetaDecision(
                [null, {set: {key: 'board', value: board}}],
                playerIndex, getNextStates, getStateScoreForIndex0,
                // If you want to see debugging output in the console, then pass
                // getDebugStateToString instead of null
                null,
                //getDebugStateToString,
                alphaBetaLimits);
          }

          return {createComputerMove: createComputerMove};
        }]);
}());
