(function () {
  "use strict";
  /*global angular */

  /**
   * This is the logic service for Checkers.
   *
   * For squares of the board:
   *   : Light square (Can not place piece within)
   * DS: Dark square (Can place piece within)
   *
   * For 4 kinds of piece of the game:
   * BM: Black MAN
   * BK: Black KING
   * WM: White MAN
   * WK: White KING
   *
   * //////////////////////////////////////////////////////////////////////////
   *
   * The state is represented as a two dimensional array with length 64.
   * Each has a corresponding index.
   *
   * e.g. state[0][0]'s index = 0,
   *      state[1][2]'s index = 9
   *
   * State:
   *             0     1     2     3     4     5     6     7
   * 0:even  [['  ', 'BM', '  ', 'BM', '  ', 'BM', '  ', 'BM'],
   * 1:odd    ['BM', '  ', 'BM', '  ', 'BM', '  ', 'BM', '  '],
   * 2:even   ['  ', 'BM', '  ', 'BM', '  ', 'BM', '  ', 'BM'],
   * 3:odd    ['DS', '  ', 'DS', '  ', 'DS', '  ', 'DS', '  '],
   * 4:even   ['  ', 'DS', '  ', 'DS', '  ', 'DS', '  ', 'DS'],
   * 5:odd    ['WM', '  ', 'WM', '  ', 'WM', '  ', 'WM', '  '],
   * 6:even   ['  ', 'WM', '  ', 'WM', '  ', 'WM', '  ', 'WM'],
   * 7:odd    ['WM', '  ', 'WM', '  ', 'WM', '  ', 'WM', '  ']]
   *
   * //////////////////////////////////////////////////////////////////////////
   *
   * The move operation is an array consist of several parts:
   *
   * 0 - setTurn: {setTurn: {turnIndex: 0}}
   * 0 - endMatch: {endMatch: {endMatchScores: [1, 0]}}
   * 1 - setBoard: {set: {key: 'board', value: [[...], ..., [...]]}}
   * 2 - setDeltaFrom: {set: {key: 'deltaFrom', value: {row: row, col: col}}}
   * 3 - setDeltaTo: {set: {key: 'deltaTo', value: {row: row, col: col}}}
   *
   * e.g. [
   *       {setTurn: {turnIndex: 1}},
   *       {set: {key: 'board', value:
   *         [
   *          ['  ', 'BM', '  ', 'BM', '  ', 'BM', '  ', 'BM'],
   *          ['BM', '  ', 'BM', '  ', 'BM', '  ', 'BM', '  '],
   *          ['  ', 'BM', '  ', 'BM', '  ', 'BM', '  ', 'BM'],
   *          ['DS', '  ', 'DS', '  ', 'DS', '  ', 'DS', '  '],
   *          ['  ', 'DS', '  ', 'DS', '  ', 'DS', '  ', 'DS'],
   *          ['WM', '  ', 'WM', '  ', 'WM', '  ', 'WM', '  '],
   *          ['  ', 'WM', '  ', 'WM', '  ', 'WM', '  ', 'WM'],
   *          ['WM', '  ', 'WM', '  ', 'WM', '  ', 'WM', '  ']
   *         ]
   *       }}
   *       {set: {key: 'deltaFrom', value: {row: 2, col: 0}}}
   *       {set: {key: 'deltaTo', value: {row: 3, col: 1}}}
   *      ]
   */
  angular.module('checkers').factory('checkersLogicService',
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
         * 8x8 board for reference.
         * The row number is zero based, so the first row is considered even
         * row.
         *
         *             0     1     2     3     4     5     6     7
         * 0:even  [['  ', 'BM', '  ', 'BM', '  ', 'BM', '  ', 'BM'],
         * 1:odd    ['BM', '  ', 'BM', '  ', 'BM', '  ', 'BM', '  '],
         * 2:even   ['  ', 'BM', '  ', 'BM', '  ', 'BM', '  ', 'BM'],
         * 3:odd    ['DS', '  ', 'DS', '  ', 'DS', '  ', 'DS', '  '],
         * 4:even   ['  ', 'DS', '  ', 'DS', '  ', 'DS', '  ', 'DS'],
         * 5:odd    ['WM', '  ', 'WM', '  ', 'WM', '  ', 'WM', '  '],
         * 6:even   ['  ', 'WM', '  ', 'WM', '  ', 'WM', '  ', 'WM'],
         * 7:odd    ['WM', '  ', 'WM', '  ', 'WM', '  ', 'WM', '  ']]
         */

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
         *          otherwise it's empty.
         */
        function getColor(square) {
          return square.substr(0, 1);
        }

        /**
         * Get the kind of the piece within the square.
         *
         * @param square the square of the board.
         * @returns string "MAN" if the piece is man, "CRO" if the piece king or
         *                 crowned
         */
        function getKind(square) {
          return square.substr(1);
        }

        /**
         * Check if the two coordinates are the same.
         *
         * @param coordA
         * @param coordB
         * @returns {boolean}
         */
        function isCoordinateEqual(coordA, coordB) {
          if (coordA.row !== coordB.row) {
            return false;
          }

          if (coordA.col !== coordB.col) {
            return false;
          }

          return true;
        }

        /**
         * Check if the move exists in the mvoes array
         * @param moves
         * @param move
         * @returns {boolean}
         */
        function doesContainMove(moves, move) {
          var i;
          for (i = 0; i < moves.length; i += 1) {
            if (isCoordinateEqual(moves[i], move)) {
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
        function isLegalCoordinate(coord) {
          var row = coord.row,
            col = coord.col,
            isEvenRow,
            isEvenCol;

          if (!(coord.hasOwnProperty('row') && coord.hasOwnProperty('col'))) {
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
         * Check if it's a simple move according to the from and to coordinate.
         *
         * @param fromCoord from coordinate
         * @param toCoord to coordinate
         * @returns {boolean} true if it's simple move, otherwise false
         */
        function isSimpleMove(board, fromCoord, toCoord) {
          var square = board[fromCoord.row][fromCoord.col];

          if (getKind(square) === CONSTANT.KING) {
            // If it's a king, it can move both forward and backward
            if ((Math.abs(fromCoord.row - toCoord.row) === 1)
                && (Math.abs(fromCoord.col - toCoord.col) === 1)) {
              return true;
            }
          } else if (getColor(square) === CONSTANT.BLACK) {
            // If it's not a black king, it can only move downwards.
            if ((fromCoord.row - toCoord.row === -1)
                && (Math.abs(fromCoord.col - toCoord.col) === 1)) {
              return true;
            }
          } else if (getColor(square) === CONSTANT.WHITE) {
            // If it's not a white king, it can only move upwards.
            if ((fromCoord.row - toCoord.row === 1)
                && (Math.abs(fromCoord.col - toCoord.col) === 1)) {
              return true;
            }
          }

          return false;
        }

        /**
         * Check if it's a jump move according to the from and to coordinate.
         *
         * @param fromCoord from coordinate
         * @param toCoord to coordinate
         * @returns {boolean} true if it's jump move, otherwise false
         */
        function isJumpMove(board, fromCoord, toCoord) {
          var square = board[fromCoord.row][fromCoord.col];
          if (getKind(square) === CONSTANT.KING) {
            // If it's a king, it can move both forward and backward
            if ((Math.abs(fromCoord.row - toCoord.row) === 2)
                && (Math.abs(fromCoord.col - toCoord.col) === 2)) {
              return true;
            }
          } else if (getColor(square) === CONSTANT.BLACK) {
            // If it's not a black king, it can only move downwards.
            if ((fromCoord.row - toCoord.row === -2)
                && (Math.abs(fromCoord.col - toCoord.col) === 2)) {
              return true;
            }
          } else if (getColor(square) === CONSTANT.WHITE) {
            // If it's not a white king, it can only move upwards.
            if ((fromCoord.row - toCoord.row === 2)
                && (Math.abs(fromCoord.col - toCoord.col) === 2)) {
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
         * @param toCoord the index of the square moving to or jumping to
         * @param playerTurnIndex the player's turn index
         * @returns true if it enters the kings row, otherwise false.
         */
        function hasMoveOrJumpToKingsRow(toCoord, playerTurnIndex) {
          // Check if the square can be crowned
          if (
            // For white square, it's moving or jumping to the first row
            (playerTurnIndex === 1 && toCoord.row === 0)
            // For black square, it's moving or jumping to the last row
              || (playerTurnIndex === 0 && toCoord.row === CONSTANT.ROW - 1)
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
          case ILLEGAL_CODE.ILLEGAL_COORDINATE:
            emailBody = 'ILLEGAL_COORDINATE';
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
         * Get the to square index (the destination of the move) according to
         * the move type and direction.
         *
         * @param fromCoordinate the from square (the square contains the piece
         *                        moved or jumped) coordinate.
         * @param moveType the move type of the move, either simple move or jump
         *                 move
         * @param direction the direction of the move, up-left, up-right,
         *                  down-left and down-right.
         * @returns {number} the to square index.
         */
        function getToCoordinate(fromCoordinate, moveType, direction) {
          var toCoordinate = {row: -1, col: -1};

          if (!isLegalCoordinate(fromCoordinate)) {
            throw new Error("Illegal from coordinate!!!");
          }

          switch (moveType) {
          case MOVE_TYPE.SIMPLE_MOVE:
            switch (direction) {
            case DIRECTION.UP_LEFT:
              toCoordinate.row = fromCoordinate.row - 1;
              toCoordinate.col = fromCoordinate.col - 1;
              break;
            case DIRECTION.UP_RIGHT:
              toCoordinate.row = fromCoordinate.row - 1;
              toCoordinate.col = fromCoordinate.col + 1;
              break;
            case DIRECTION.DOWN_LEFT:
              toCoordinate.row = fromCoordinate.row + 1;
              toCoordinate.col = fromCoordinate.col - 1;
              break;
            case DIRECTION.DOWN_RIGHT:
              toCoordinate.row = fromCoordinate.row + 1;
              toCoordinate.col = fromCoordinate.col + 1;
              break;
            default:
              throw new Error("Illegal direction!");
            }
            break;
          case MOVE_TYPE.JUMP_MOVE:
            switch (direction) {
            case DIRECTION.UP_LEFT:
              toCoordinate.row = fromCoordinate.row - 2;
              toCoordinate.col = fromCoordinate.col - 2;
              break;
            case DIRECTION.UP_RIGHT:
              toCoordinate.row = fromCoordinate.row - 2;
              toCoordinate.col = fromCoordinate.col + 2;
              break;
            case DIRECTION.DOWN_LEFT:
              toCoordinate.row = fromCoordinate.row + 2;
              toCoordinate.col = fromCoordinate.col - 2;
              break;
            case DIRECTION.DOWN_RIGHT:
              toCoordinate.row = fromCoordinate.row + 2;
              toCoordinate.col = fromCoordinate.col + 2;
              break;
            default:
              throw new Error("Illegal direction!");
            }
            break;
          default:
            throw new Error("Illegal move type!");
          }

          if (!isLegalCoordinate(toCoordinate)) {
            throw new Error("Illegal to coordinate!!!");
          }



          return toCoordinate;
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

          board =  [['  ', 'BM', '  ', 'BM', '  ', 'BM', '  ', 'BM'],
                    ['BM', '  ', 'BM', '  ', 'BM', '  ', 'BM', '  '],
                    ['  ', 'BM', '  ', 'BM', '  ', 'BM', '  ', 'BM'],
                    ['DS', '  ', 'DS', '  ', 'DS', '  ', 'DS', '  '],
                    ['  ', 'DS', '  ', 'DS', '  ', 'DS', '  ', 'DS'],
                    ['WM', '  ', 'WM', '  ', 'WM', '  ', 'WM', '  '],
                    ['  ', 'WM', '  ', 'WM', '  ', 'WM', '  ', 'WM'],
                    ['WM', '  ', 'WM', '  ', 'WM', '  ', 'WM', '  ']];

          operations.push({set: {key: 'board', value: board}});

          return operations;
        }

        /**
         * Get all possible upwards simple moves for a specific piece by its
         * square index.
         *
         * @param state the game state
         * @param coordinate the coordinate of the square holds the piece
         * @return an array of all possible moves
         */
        function getSimpleUpMoves(state, coordinate) {
          var moves = [],
            leftUpCoordinate,
            rightUpCoordinate;

          // If the piece is in the first row, then there's no way to move
          // upwards.
          if (coordinate.row === 0) {
            return moves;
          }

          // In even row, the leftmost piece can only move right up.
          // In odd row, the rightmost piece can only move left up.
          if (coordinate.row % 2 === 0) {
            // Even row

            // Check left up
            leftUpCoordinate = getToCoordinate(coordinate,
                MOVE_TYPE.SIMPLE_MOVE, DIRECTION.UP_LEFT);

            if (state[leftUpCoordinate.row][leftUpCoordinate.col]
                === CONSTANT.DARK_SQUARE) {
              moves.push(leftUpCoordinate);
            }

            // Check right up
            // for the rightmost one, it can only move to the left up side.
            if (coordinate.col !== CONSTANT.COLUMN - 1) {
              rightUpCoordinate = getToCoordinate(coordinate,
                  MOVE_TYPE.SIMPLE_MOVE, DIRECTION.UP_RIGHT);
              if (state[rightUpCoordinate.row][rightUpCoordinate.col]
                  === CONSTANT.DARK_SQUARE) {
                moves.push(rightUpCoordinate);
              }
            }
          } else {
            // Odd row

            // Check left up
            // For the leftmost one, it can only move to the right up side
            if (coordinate.col !== 0) {
              leftUpCoordinate = getToCoordinate(coordinate,
                  MOVE_TYPE.SIMPLE_MOVE, DIRECTION.UP_LEFT);
              if (state[leftUpCoordinate.row][leftUpCoordinate.col]
                  === CONSTANT.DARK_SQUARE) {
                moves.push(leftUpCoordinate);
              }
            }

            // Check right up
            rightUpCoordinate = getToCoordinate(coordinate,
                MOVE_TYPE.SIMPLE_MOVE, DIRECTION.UP_RIGHT);

            if (state[rightUpCoordinate.row][rightUpCoordinate.col]
                === CONSTANT.DARK_SQUARE) {
              moves.push(rightUpCoordinate);
            }
          }

          return moves;
        }

        /**
         * Get all possible downwards simple moves for a specific piece by its
         * square index.
         *
         * @param state the game state
         * @param coordinate the coordinate of the square holds the piece
         * @return an array of all possible moves
         */
        function getSimpleDownMoves(state, coordinate) {
          var moves = [],
            leftDownCoordinate,
            rightDownCoordinate;

          // If the piece is in the last row, then there's no way to move
          // downwards.
          if (coordinate.row === CONSTANT.ROW - 1) {
            return moves;
          }

          // In even row, the leftmost piece can only move right down.
          // In odd row, the rightmost piece can only move left down.
          if (coordinate.row % 2 === 0) {
            // Even row

            // Check left up
            leftDownCoordinate = getToCoordinate(coordinate,
                MOVE_TYPE.SIMPLE_MOVE, DIRECTION.DOWN_LEFT);

            if (state[leftDownCoordinate.row][leftDownCoordinate.col]
                === CONSTANT.DARK_SQUARE) {
              moves.push(leftDownCoordinate);
            }

            // Check right up
            // for the rightmost one, it can only move to the left up side.
            if (coordinate.col !== CONSTANT.COLUMN - 1) {
              rightDownCoordinate = getToCoordinate(coordinate,
                  MOVE_TYPE.SIMPLE_MOVE, DIRECTION.DOWN_RIGHT);
              if (state[rightDownCoordinate.row][rightDownCoordinate.col]
                  === CONSTANT.DARK_SQUARE) {
                moves.push(rightDownCoordinate);
              }
            }
          } else {
            // Odd row

            // Check left down
            // For the leftmost one, it can only move to the right down side
            if (coordinate.col !== 0) {
              leftDownCoordinate = getToCoordinate(coordinate,
                  MOVE_TYPE.SIMPLE_MOVE, DIRECTION.DOWN_LEFT);
              if (state[leftDownCoordinate.row][leftDownCoordinate.col]
                  === CONSTANT.DARK_SQUARE) {
                moves.push(leftDownCoordinate);
              }
            }

            // Check right up
            rightDownCoordinate = getToCoordinate(coordinate,
                MOVE_TYPE.SIMPLE_MOVE, DIRECTION.DOWN_RIGHT);

            if (state[rightDownCoordinate.row][rightDownCoordinate.col]
                === CONSTANT.DARK_SQUARE) {
              moves.push(rightDownCoordinate);
            }
          }

          return moves;
        }

        /**
         * Calculate the jumped (opponent) square index
         * @param fromCoord the first selected square coordinate.
         *                      (The one moving or jumping)
         * @param toCoord the second selected square coordinate.
         *                     (The destination)
         * @returns {row: row, col: col} the jumped (opponent) square coordinate
         */
        function getJumpedCoordinate(fromCoord, toCoord) {
          var jumpedCoordinate = {row: -1, col: -1};

          if (!isLegalCoordinate(fromCoord)
              || !isLegalCoordinate(toCoord)) {
            throw new Error("Illegal coordinate!!!");
          }

          if ((Math.abs(fromCoord.row - toCoord.row) === 2)
              && (Math.abs(fromCoord.col - toCoord.col) === 2)) {
            jumpedCoordinate.row = (fromCoord.row + toCoord.row) / 2;
            jumpedCoordinate.col = (fromCoord.col + toCoord.col) / 2;
          }

          return jumpedCoordinate;
        }


          /**
         * Get all possible upwards jump moves for a specific piece by its
         * square index.
         *
         * @param state the logic state
         * @param coordinate the index of the square holds the piece
         * @return an array of all possible moves
         */
        function getJumpUpMoves(state, coordinate) {
          var fromCoordinate = coordinate,
            fromSquare = state[coordinate.row][coordinate.col],
            jumpedCoordinate,
            jumpedSquare,
            toCoordinate,
            toSquare,
            moves = [];

          // If the piece is in either the first or the second row, then there's
          // no way to jump upwards.
          if (fromCoordinate.row < 2) {
            return moves;
          }

          // Check left first, for the leftmost one, it can only jump right
          // upwards.
          if (fromCoordinate.col > 1) {
            toCoordinate = getToCoordinate(coordinate, MOVE_TYPE.JUMP_MOVE,
                DIRECTION.UP_LEFT);
            jumpedCoordinate =
                getJumpedCoordinate(fromCoordinate, toCoordinate);

            toSquare = state[toCoordinate.row][toCoordinate.col];
            jumpedSquare = state[jumpedCoordinate.row][jumpedCoordinate.col];

            if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
              moves.push(toCoordinate);
            }
          }

          // Check right, for the rightmost one, it can only jump left upwards.
          if (fromCoordinate.col < CONSTANT.COLUMN - 2) {
            toCoordinate = getToCoordinate(coordinate, MOVE_TYPE.JUMP_MOVE,
                DIRECTION.UP_RIGHT);
            jumpedCoordinate =
                getJumpedCoordinate(fromCoordinate, toCoordinate);

            toSquare = state[toCoordinate.row][toCoordinate.col];
            jumpedSquare = state[jumpedCoordinate.row][jumpedCoordinate.col];

            if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
              moves.push(toCoordinate);
            }
          }

          return moves;
        }

        /**
         * Get all possible downwards jump moves for a specific piece by its
         * square index.
         *
         * @param logicState the logic state
         * @param squareIndex the index of the square holds the piece
         * @return an array of all possible moves
         */
        function getJumpDownMoves(state, coordinate) {
          var fromCoordinate = coordinate,
            fromSquare = state[coordinate.row][coordinate.col],
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
            toCoordinate = getToCoordinate(coordinate, MOVE_TYPE.JUMP_MOVE,
                DIRECTION.DOWN_LEFT);

            jumpedCoordinate =
                getJumpedCoordinate(fromCoordinate, toCoordinate);

            toSquare = state[toCoordinate.row][toCoordinate.col];
            jumpedSquare = state[jumpedCoordinate.row][jumpedCoordinate.col];

            if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
              moves.push(toCoordinate);
            }
          }


          // Check right, for the rightmost one, it can only jump left
          // downwards.
          if (fromCoordinate.col < CONSTANT.COLUMN - 2) {
            toCoordinate = getToCoordinate(coordinate, MOVE_TYPE.JUMP_MOVE,
                DIRECTION.DOWN_RIGHT);
            jumpedCoordinate =
                getJumpedCoordinate(fromCoordinate, toCoordinate);
            toSquare = state[toCoordinate.row][toCoordinate.col];
            jumpedSquare = state[jumpedCoordinate.row][jumpedCoordinate.col];

            if (isValidJump(fromSquare, jumpedSquare, toSquare)) {
              moves.push(toCoordinate);
            }
          }

          return moves;
        }

        /**
         * Get all possible simple moves for a specific piece by its square
         * index. If it is crowned, also check if it can move one step backward.
         *
         * @param board the logic board
         * @param coordinate the index of the square holds the piece
         * @param turnIndex 0 represents the black player and 1
         *        represents the white player.
         * @return an array of all possible moves.
         */
        function getSimpleMoves(board, coordinate, turnIndex) {
          var moves = [],
            tmpMoves = [],
            fromSquare = board[coordinate.row][coordinate.col],
            color = fromSquare.substr(0, 1),
            kind = fromSquare.substr(1);

          // Check whether it's the current player's piece first, if not, since
          // the player can not operate it, then no move will be available.
          if (isOwnColor(turnIndex, color)) {
            if (kind === CONSTANT.KING) {
              // Check both direction moves
              tmpMoves = getSimpleUpMoves(board, coordinate);
              moves = moves.concat(tmpMoves);

              tmpMoves = getSimpleDownMoves(board, coordinate);
              moves = moves.concat(tmpMoves);
            } else if (color === CONSTANT.WHITE) {
              tmpMoves = getSimpleUpMoves(board, coordinate);
              moves = moves.concat(tmpMoves);
            } else if (color === CONSTANT.BLACK) {
              tmpMoves = getSimpleDownMoves(board, coordinate);
              moves = moves.concat(tmpMoves);
            }
          }

          return moves;
        }

        /**
         * Get all possible jump moves for a specific piece by its square index.
         * If it is crowned, also check if it can jump one step backward.
         *
         * @param board the logic board
         * @param coordinate the index of the square holds the piece
         * @param turnIndex 0 represents the black player and 1
         *        represents the white player.
         * @return an array of all possible moves
         */
        function getJumpMoves(board, coordinate, turnIndex) {
          var moves = [],
            tmpMoves = [],
            fromSquare = board[coordinate.row][coordinate.col],
            color = fromSquare.substr(0, 1),
            kind = fromSquare.substr(1);
          // Check whether it's the current player's piece first, if not, since
          // the player can not operate it, then no move will be available.
          if (isOwnColor(turnIndex, color)) {
            if (kind === CONSTANT.KING) {
              // Check both direction moves
              tmpMoves = getJumpUpMoves(board, coordinate);
              moves = moves.concat(tmpMoves);

              tmpMoves = getJumpDownMoves(board, coordinate);
              moves = moves.concat(tmpMoves);
            } else if (color === CONSTANT.WHITE) {
              tmpMoves = getJumpUpMoves(board, coordinate);
              moves = moves.concat(tmpMoves);
            } else if (color === CONSTANT.BLACK) {
              tmpMoves = getJumpDownMoves(board, coordinate);
              moves = moves.concat(tmpMoves);
            }
          }

          return moves;
        }

        /**
         * Get all possible moves for a specific piece by its square index.
         *
         * @param board the logic board.
         * @param coordinate the index of the square holds the piece
         * @param turnIndex 0 represents the black player and 1
         *        represents the white player.
         * @return an array of all possible move.
         */
        function getAllPossibleMoves(board, coordinate, turnIndex) {
          var possibleMoves;

          // First get all possible jump moves.
          possibleMoves = getJumpMoves(board, coordinate, turnIndex);
          // If there's at least one jump move, then no need to check the simple
          // moves since jump move is mandatory.
          if (possibleMoves.length === 0) {
            possibleMoves = getSimpleMoves(board, coordinate, turnIndex);
          }

          return possibleMoves;
        }

        /**
         * Get the winner based on the current board.
         *
         * @param gameApiState the current game API board
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
            coordinate = {row: -1, col: -1},
            row,
            col;

          for (row = 0; row < CONSTANT.ROW; row += 1) {
            for (col = 0; col < CONSTANT.COLUMN; col += 1) {
              coordinate.row = row;
              coordinate.col = col;
              possibleMoves = possibleMoves.concat(
                getJumpMoves(board, coordinate, yourPlayerIndex)
              );
            }
          }
          return possibleMoves.length > 0;
        }

        /**
         * Get the expected operations for the selected squares (from and to
         * square indexes).
         *
         * @param board the game API state.
         * @param fromCoord the first selected square index. (The one moving or
         *                  jumping)
         * @param toCoord the second selected square index. (The destination)
         * @param turnIndexBeforeMove 0 represents the black player and 1
         *        represents the white player.
         * @returns {Array} operations
         */
        function createMove(board, fromCoord, toCoord, turnIndexBeforeMove) {
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

          if (!isLegalCoordinate(fromCoord)
              || !isLegalCoordinate(toCoord)) {
            throw new Error(ILLEGAL_CODE.ILLEGAL_COORDINATE);
          }

          if (isSimpleMove(board, fromCoord, toCoord)) {
            isASimpleMove = true;
          } else if (isJumpMove(board, fromCoord, toCoord)) {
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
            possibleSimpleMoves = getSimpleMoves(board, fromCoord,
                turnIndexBeforeMove);

            // The move should exist in the possible simple moves.
            if (!doesContainMove(possibleSimpleMoves, toCoord)) {
              throw new Error(ILLEGAL_CODE.ILLEGAL_SIMPLE_MOVE);
            }
          } else if (isAJumpMove) {
            // Jump move
            possibleJumpMoves = getJumpMoves(board, fromCoord,
                turnIndexBeforeMove);
            // The move should exist in the possible jump moves.
            if (!doesContainMove(possibleJumpMoves, toCoord)) {
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
            board[toCoord.row][toCoord.col] =
                board[fromCoord.row][fromCoord.col];
            board[fromCoord.row][fromCoord.col] = CONSTANT.DARK_SQUARE;
          } else if (isAJumpMove) {
            jumpedCoord = getJumpedCoordinate(fromCoord, toCoord);
            board[toCoord.row][toCoord.col] =
                board[fromCoord.row][fromCoord.col];
            board[fromCoord.row][fromCoord.col] = CONSTANT.DARK_SQUARE;
            board[jumpedCoord.row][jumpedCoord.col] = CONSTANT.DARK_SQUARE;
          }

          /*********************************************************************
           * 3. Check if the piece remains the same or is legally crowned.
           ********************************************************************/

          isToKingsRow =
              hasMoveOrJumpToKingsRow(toCoord, turnIndexBeforeMove);
          if (isToKingsRow) {
            if (getColor(board[toCoord.row][toCoord.col])
                === CONSTANT.BLACK) {
              board[toCoord.row][toCoord.col] = CONSTANT.BLACK_KING;
            } else if (getColor(board[toCoord.row][toCoord.col])
                === CONSTANT.WHITE) {
              board[toCoord.row][toCoord.col] = CONSTANT.WHITE_KING;
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
            possibleJumpMoves = getJumpMoves(board, toCoord,
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
            {set: {key: 'fromDelta', value: fromCoord}},
            {set: {key: 'toDelta', value: toCoord}}];
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
          var stateBeforeMove = params.stateBeforeMove,
            turnIndexBeforeMove = params.turnIndexBeforeMove,
            board,
            move = params.move,
            fromCoord,
            toCoord,
            expectedMove;

          /*********************************************************************
           * 1. If the state is empty, then the move should be the first move.
           * If the state is not empty, then the move operations array should
           * have a length of 4.
           ********************************************************************/

          if (isEmptyObj(stateBeforeMove)) {
            if (move.length === 0) {
              return true;
            }

            if (angular.equals(move, getFirstMove())) {
              return true;
            }

            return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_MOVE);
          }

          // If the move's length is not 4, it's illegal
          if (move.length !== 4) {
            return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_MOVE);
          }

          /*********************************************************************
           * 2. Create the move according to to move.
           ********************************************************************/

          try {
            // Example move:
            // [{setTurn: {turnIndex : 1},
            //  {set: {key: 'board', value: [['X', '', ''],
            // ['', '', ''], ['', '', '']]}},
            //  {set: {key: 'delta', value: {row: 0, col: 0}}}]
            fromCoord = move[2].set.value;
            toCoord = move[3].set.value;
            board = stateBeforeMove.board;

            expectedMove =
                createMove(board, fromCoord, toCoord, turnIndexBeforeMove);

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
            case ILLEGAL_CODE.ILLEGAL_COORDINATE:
              return getIllegalEmailObj(ILLEGAL_CODE.ILLEGAL_COORDINATE);
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
              throw new Error('Illegal code!!!');
            }
          }

          return true;
        }

        return {
          isMoveOk: isMoveOk,
          getFirstMove: getFirstMove,
          createMove: createMove,
          getJumpMoves: getJumpMoves,
          getSimpleMoves: getSimpleMoves,
          getAllPossibleMoves: getAllPossibleMoves,
          hasMandatoryJumps: hasMandatoryJumps,
          getJumpedCoordinate: getJumpedCoordinate,
          isOwnColor: isOwnColor,
          getIllegalEmailObj: getIllegalEmailObj,
          getWinner: getWinner,
          getColor: getColor,
          getKind: getKind,
          isEmptyObj: isEmptyObj,
          isSimpleMove: isSimpleMove,
          isJumpMove: isJumpMove
        };
      }]);
}());