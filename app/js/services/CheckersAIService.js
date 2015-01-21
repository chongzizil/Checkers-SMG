(function () {
  'use strict';
  /*global angular */

  /**
   * Checkers AI service.
   *
   * The evaluation function is copied from chinese website http://bit.ly/XTUy5g
   */
  angular.module('myApp').factory('checkersAiService',
      ['checkersLogicService', '$q', 'constantService',
        function (checkersLogicService, $q, constantService) {

        var CONSTANT = constantService;

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
          if (checkersLogicService.getKind(square) === CONSTANT.MAN) {
            if (checkersLogicService.getColor(square) === CONSTANT.WHITE) {
              // White
              if (row === 1) {
                // Closed to be crowned
                return 7;
              }
              return 5;
            }

            // Black
            if (col === CONSTANT.ROW - 2) {
              // Closed to be crowned
              return 7;
            }
            return 5;
          }

          if (checkersLogicService.getKind(square) === CONSTANT.KING) {
            // It's a crown
            return 10;
          }

          // Empty square
          return 0;
        }

//          if (square !== CONSTANT.LIGHT_SQUARE
//              && square !== CONSTANT.DARK_SQUARE) {
//
//          }

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
            square,
            squareValue,
            row,
            col;

          winner = checkersLogicService.getWinner(board, turnIndex);

          if (winner === 'B') {
            return Number.MIN_VALUE;
          }

          if (winner === 'W') {
            return Number.MAX_VALUE;
          }

          for (row = 0; row < CONSTANT.ROW; row += 1) {
            for (col = 0; col < CONSTANT.COLUMN; col += 1) {
              square = board[row][col];

              if (square !== CONSTANT.LIGHT_SQUARE
                  && square !== CONSTANT.DARK_SQUARE) {
                // Get the square value which equals to the square value
                // multiply the board weight.
                squareValue = getSquareValue(square, row, col)
                    * boardWeight[row][col];

                if (checkersLogicService.getColor(square)
                    === CONSTANT.BLACK) {
                  // BLACK
                  stateValue -= squareValue;
                } else {
                  // WHITE
                  stateValue += squareValue;
                }
              }
            }
          }

          return stateValue;
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
          for (row = 0; row < CONSTANT.ROW; row += 1) {
            for (col = 0; col < CONSTANT.COLUMN; col += 1) {
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


        /***********************************************************************
         * Alpha Beta Pruning part
         **********************************************************************/


        /*
         * A function for Array.prototype.sort(). The score will be ordered
         * decreasing.
         */
        function sortScore(a, b) {
          return b.score - a.score;
        }

        /**
         * Find the highest move score of a board.
         *
         * @param board the game API board
         * @param turnIndex 0 represents the black player and 1
         *        represents the white player.
         * @param depth the depth for the alpha beta pruning algorithm.
         * @param alpha the found max value.
         * @param beta the found min value.
         * @param timer the timer which limit the time for the algorithm.
         * @returns {*} the highest board value if the depth is 0, otherwise
         *              return the alpha value if the current player is White,
         *              otherwise return the beta value.
         */
        function findMoveScore(board, turnIndex, depth, alpha, beta, timer) {
          var possibleMoves,
            move,
            childScore,
            index,
            winner = checkersLogicService.getWinner(board, turnIndex);

          if (Date.now() - timer.startTime > timer.timeLimit) {
//            console.log("Time's up");
            throw "Time's up";
          }

          if (depth === 0 || winner !== '') {
            return getStateValue(board, turnIndex);
          }

          possibleMoves = getAllMoves(board, turnIndex);
          for (index = 0; index < possibleMoves.length; index += 1) {
            move = checkersLogicService.createMove(angular.copy(board),
                possibleMoves[index][0], possibleMoves[index][1],
                turnIndex);
            childScore = findMoveScore(angular.copy(move[1].set.value),
                    1 - turnIndex, depth - 1, alpha, beta, timer);

            if (turnIndex === 1) {
              alpha = Math.max(alpha, childScore);
              if (beta <= alpha) {
                break;
              }
            } else {
              beta = Math.min(beta, childScore);
              if (beta <= alpha) {
                break;
              }
            }
          }

          return turnIndex === 1 ? alpha : beta;
        }

        /**
         * Find the best move.
         *
         * @param board the game API board.
         * @param depth the depth for the alpha beta pruning algorithm.
         * @param timer the timer which limit the time for the algorithm.
         * @returns {{fromIndex: *, toIndex: *}} the best move object.
         */
        function findBestMove(board, aiPlayerTurnIndex, depth, timer) {

          var deferred = $q.defer(),
            scores = [],
            score = {},
            moveScore,
            move,
            turnIndex = aiPlayerTurnIndex,
            possibleMoves = getAllMoves(board, turnIndex),
            nextState,
            index,
            i,
            j;

          for (index = 0; index < possibleMoves.length; index += 1) {
            score = {};
            score.move = possibleMoves[index];
            score.score = Number.MIN_VALUE;
            scores.push(score);
          }

          try {
            for (i = 0; i < depth; i += 1) {
//        console.log(Date.now());
//        console.log('Total depth: ' + depth + ' depth start: ' + i);
              for (j = 0; j < scores.length; j += 1) {
                moveScore = scores[j];
                move = checkersLogicService.createMove(angular.copy(board),
                    moveScore.move[0], moveScore.move[1], turnIndex);

                nextState = move[1].set.value;
                score = findMoveScore(nextState, 1 - turnIndex, i,
                        Number.MIN_VALUE, Number.MAX_VALUE, timer);
                if (turnIndex !== 1) {
                  score = -score;
                }
                moveScore.score = score;
              }
              // Sort the scores decreasingly.
              scores.sort(sortScore);
            }
          } catch (e) {
            // Ok, time's up so just make a move :)
          }

          // Sort the scores decreasingly.
          scores.sort(sortScore);

          deferred.resolve(scores[0].move);

          // Return the best move.
          return deferred.promise;
        }

        /***********************************************************************
         * Service part...
         **********************************************************************/

        return {
          findBestMove: findBestMove
        };
      }]);
}());