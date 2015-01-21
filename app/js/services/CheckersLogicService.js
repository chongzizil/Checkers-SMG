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
   *       }}
   *       {set: {key: 'fromDelta', value: {row: 2, col: 1}}}
   *       {set: {key: 'toDelta', value: {row: 3, col: 0}}}
   *      ]
   */
  angular.module('myApp').factory('checkersLogicService',
      ['constantService', 'enumService',
        function (constantService, enumService) {

        // This is a simple implementation for constant and enum, so the value
        // can be changed. Since this is a small personal project, all caps
        // naming convention should be enough.
        var ILLEGAL_CODE = enumService.ILLEGAL_CODE,
          DIRECTION = enumService.DIRECTION,
          MOVE_TYPE = enumService.MOVE_TYPE,
          CONSTANT = constantService;

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
          if ((turnIndex === CONSTANT.BLACK_INDEX
              && color === CONSTANT.BLACK)
              || (turnIndex === CONSTANT.WHITE_INDEX
                  && color === CONSTANT.WHITE)) {
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
          if (row < 0 || row >= CONSTANT.ROW
              || col < 0 || col >= CONSTANT.COLUMN) {
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

          if (getKind(square) === CONSTANT.KING) {
            // If it's a king, it can move both forward and backward
            if ((Math.abs(fromDelta.row - toDelta.row) === 1)
                && (Math.abs(fromDelta.col - toDelta.col) === 1)) {
              return true;
            }
          } else if (getColor(square) === CONSTANT.BLACK) {
            // If it's not a black king, it can only move downwards.
            if ((fromDelta.row - toDelta.row === -1)
                && (Math.abs(fromDelta.col - toDelta.col) === 1)) {
              return true;
            }
          } else if (getColor(square) === CONSTANT.WHITE) {
            // If it's not a white king, it can only move upwards.
            if ((fromDelta.row - toDelta.row === 1)
                && (Math.abs(fromDelta.col - toDelta.col) === 1)) {
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

          if (getKind(square) === CONSTANT.KING) {
            // If it's a king, it can jump both forward and backward
            if ((Math.abs(fromDelta.row - toDelta.row) === 2)
                && (Math.abs(fromDelta.col - toDelta.col) === 2)) {
              return true;
            }
          } else if (getColor(square) === CONSTANT.BLACK) {
            // If it's not a black king, it can only jump downwards.
            if ((fromDelta.row - toDelta.row === -2)
                && (Math.abs(fromDelta.col - toDelta.col) === 2)) {
              return true;
            }
          } else if (getColor(square) === CONSTANT.WHITE) {
            // If it's not a white king, it can only jump upwards.
            if ((fromDelta.row - toDelta.row === 2)
                && (Math.abs(fromDelta.col - toDelta.col) === 2)) {
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
          return jumpedSquare !== CONSTANT.DARK_SQUARE
              && fromSquare.substr(0, 1) !== jumpedSquare.substr(0, 1)
              && toSquare === CONSTANT.DARK_SQUARE;
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
            (playerTurnIndex === 1 && toDelta.row === 0)
            // For black square, it's moving or jumping to the last row
              || (playerTurnIndex === 0 && toDelta.row === CONSTANT.ROW - 1)
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

            if (board[leftUpDelta.row][leftUpDelta.col]
                === CONSTANT.DARK_SQUARE) {
              moves.push(leftUpDelta);
            }

            // Check right up
            // for the rightmost one, it can only move to the left up side.
            if (delta.col !== CONSTANT.COLUMN - 1) {
              rightUpDelta = getToDelta(delta,
                  MOVE_TYPE.SIMPLE_MOVE, DIRECTION.UP_RIGHT);
              if (board[rightUpDelta.row][rightUpDelta.col]
                  === CONSTANT.DARK_SQUARE) {
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
              if (board[leftUpDelta.row][leftUpDelta.col]
                  === CONSTANT.DARK_SQUARE) {
                moves.push(leftUpDelta);
              }
            }

            // Check right up
            rightUpDelta = getToDelta(delta,
                MOVE_TYPE.SIMPLE_MOVE, DIRECTION.UP_RIGHT);

            if (board[rightUpDelta.row][rightUpDelta.col]
                === CONSTANT.DARK_SQUARE) {
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
          if (delta.row === CONSTANT.ROW - 1) {
            return moves;
          }

          if (delta.row % 2 === 0) {
            // Even row

            // Check left down
            leftDownDelta = getToDelta(delta,
                MOVE_TYPE.SIMPLE_MOVE, DIRECTION.DOWN_LEFT);

            if (board[leftDownDelta.row][leftDownDelta.col]
                === CONSTANT.DARK_SQUARE) {
              moves.push(leftDownDelta);
            }

            // Check right down
            // for the rightmost one, it can only move to the left down side.
            if (delta.col !== CONSTANT.COLUMN - 1) {
              rightDownDelta = getToDelta(delta,
                  MOVE_TYPE.SIMPLE_MOVE, DIRECTION.DOWN_RIGHT);
              if (board[rightDownDelta.row][rightDownDelta.col]
                  === CONSTANT.DARK_SQUARE) {
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
              if (board[leftDownDelta.row][leftDownDelta.col]
                  === CONSTANT.DARK_SQUARE) {
                moves.push(leftDownDelta);
              }
            }

            // Check right down
            rightDownDelta = getToDelta(delta,
                MOVE_TYPE.SIMPLE_MOVE, DIRECTION.DOWN_RIGHT);

            if (board[rightDownDelta.row][rightDownDelta.col]
                === CONSTANT.DARK_SQUARE) {
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

          if ((Math.abs(fromDelta.row - toDelta.row) === 2)
              && (Math.abs(fromDelta.col - toDelta.col) === 2)) {
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
          if (fromDelta.col < CONSTANT.COLUMN - 2) {
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
          if (fromCoordinate.row > CONSTANT.ROW - 3) {
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
          if (fromCoordinate.col < CONSTANT.COLUMN - 2) {
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
            if (kind === CONSTANT.KING) {
              // Check both direction moves
              tmpMoves = getSimpleUpMoves(board, delta);
              moves = moves.concat(tmpMoves);
              tmpMoves = getSimpleDownMoves(board, delta);
              moves = moves.concat(tmpMoves);
            } else if (color === CONSTANT.WHITE) {
              tmpMoves = getSimpleUpMoves(board, delta);
              moves = moves.concat(tmpMoves);
            } else if (color === CONSTANT.BLACK) {
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
            if (kind === CONSTANT.KING) {
              // Check both direction moves
              tmpMoves = getJumpUpMoves(board, delta);
              moves = moves.concat(tmpMoves);

              tmpMoves = getJumpDownMoves(board, delta);
              moves = moves.concat(tmpMoves);
            } else if (color === CONSTANT.WHITE) {
              tmpMoves = getJumpUpMoves(board, delta);
              moves = moves.concat(tmpMoves);
            } else if (color === CONSTANT.BLACK) {
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
          for (row = 0; row < CONSTANT.ROW; row += 1) {
            for (col = 0; col < CONSTANT.COLUMN; col += 1) {
              if (getColor(board[row][col]) === CONSTANT.WHITE) {
                hasWhite = true;
              } else if (getColor(board[row][col]) === CONSTANT.BLACK) {
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
            return CONSTANT.WHITE;
          }

          // Black won because black player has no pieces
          if (!hasWhite && hasBlack) {
            return CONSTANT.BLACK;
          }

          // Get all the moves for the current turn player
          for (row = 0; row < CONSTANT.ROW; row += 1) {
            for (col = 0; col < CONSTANT.COLUMN; col += 1) {
              coordinate.row = row;
              coordinate.col = col;
              square = board[row][col];

              if (turnIndex === CONSTANT.BLACK_INDEX) {
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
            if (turnIndex === CONSTANT.BLACK_INDEX) {
              // Black has no moves, so white wins!
              return CONSTANT.BLACK;
            }
            return CONSTANT.WHITE;
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

          for (row = 0; row < CONSTANT.ROW; row += 1) {
            for (col = 0; col < CONSTANT.COLUMN; col += 1) {
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
            isToKingsRow = false,
            isAJumpMove = false,
            isASimpleMove = false,
            possibleSimpleMoves,
            possibleJumpMoves,
            winner,
            jumpedCoord;

          /*********************************************************************
           * 1. Check the coordinates first.
           ********************************************************************/

          if (!isDarkSquare(fromDelta)
              || !isDarkSquare(toDelta)) {
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
            board[fromDelta.row][fromDelta.col] = CONSTANT.DARK_SQUARE;
          } else if (isAJumpMove) {
            jumpedCoord = getJumpedDelta(fromDelta, toDelta);
            board[toDelta.row][toDelta.col] =
                board[fromDelta.row][fromDelta.col];
            board[fromDelta.row][fromDelta.col] = CONSTANT.DARK_SQUARE;
            board[jumpedCoord.row][jumpedCoord.col] = CONSTANT.DARK_SQUARE;
          }

          /*********************************************************************
           * 3. Check if the piece remains the same or is legally crowned.
           ********************************************************************/

          isToKingsRow =
              hasMoveOrJumpToKingsRow(toDelta, turnIndexBeforeMove);
          if (isToKingsRow) {
            if (getColor(board[toDelta.row][toDelta.col])
                === CONSTANT.BLACK) {
              board[toDelta.row][toDelta.col] = CONSTANT.BLACK_KING;
            } else if (getColor(board[toDelta.row][toDelta.col])
                === CONSTANT.WHITE) {
              board[toDelta.row][toDelta.col] = CONSTANT.WHITE_KING;
            }
          }

          /*********************************************************************
           * 4. Check the set turn index or end match operation.
           ********************************************************************/

          winner = getWinner(board, turnIndexBeforeMove);

          if (winner !== '') {
            // Has a winner
            firstOperation = {endMatch: {endMatchScores:
                    winner === CONSTANT.BLACK ? [1, 0] :  [0, 1]}};
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
        function isMoveOk(params) {

          console.log(params);

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
            stateBeforeMove.board = getInitialBoard();
          }

          // If the move's length is not 4, it's illegal
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
//            console.log(JSON.stringify(move));
//            console.log(JSON.stringify(expectedMove));
//            console.log(angular.equals(move, expectedMove));
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

          function exampleGame() {
            return (exampleMoves(0,
                {board:[['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
                  ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
                  ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
                  ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
                  ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
                  ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
                  ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
                  ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']],
                  delta: {row: 2, col: 0}},
                [{row: 0, col: 6, comment: "Black plays on square (0,6)"}
                  ,
                  {row: 0, col: 1, comment: "White plays on square (0,1)"}
                  ,
                  {row: 7, col: 1, comment: "Black plays row 7, col 1"},
                  {row: 6, col: 6, comment: "Uh oh, white plays in x-Square"},
                  {row: 7, col: 7, comment: "Black captures bottom-left corner!"},
                  {row: 6, col: 7, comment: "White plays (6,7)"}
                ]));
          }

          function riddles() {
            return([
              exampleMoves(1,
                  {board:[['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
                    ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
                    ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
                    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
                    ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
                    ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
                    ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
                    ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']],
                    delta: {row: 2, col: 0}},
                  [{row: 0, col: 0, comment: "Where should White play to get an advantage on his next turn?"},
                    {row: 6, col: 6, comment: "Black plays row 6, col 6"},
                    {row: 7, col: 7, comment: "White captures diagonal!"}])]
            );
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
          getInitialBoard: getInitialBoard
        };
      }]);
}());