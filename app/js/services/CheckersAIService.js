(function () {
  'use strict';
  /*global angular */

  /**
   * Checkers AI service.
   *
   * The evaluation function is copied from chinese website http://bit.ly/XTUy5g
   */
  angular.module('checkers').factory('checkersAiService',
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
        function getSquareValue(square, squareIndex) {
          if (checkersLogicService.getKind(square) === 'MAN') {
            var row = CONSTANT.ROW,
              column = CONSTANT.COLUMN;

            if (checkersLogicService.getColor(square) === 'W') {
              // White
              if (Math.floor(squareIndex / column) >= 1 &&
                  Math.floor(squareIndex / column) < 2) {
                // Closed to be crowned
                return 7;
              }
              return 5;
            }

            // Black
            if (Math.floor(squareIndex / column) >= row - 2 &&
                Math.floor(squareIndex / column) < row - 1) {
              // Closed to be crowned
              return 7;
            }
            return 5;
          }

          if (checkersLogicService.getKind(square) === 'CRO') {
            // It's a crown
            return 10;
          }

          // Empty square
          return 0;
        }

        /**
         * Get the state value.
         *
         * @param state the game API state.
         * @param turnIndex 0 represents the black player and 1
         *        represents the white player.
         * @returns {*} the state value.
         */
        function getStateValue(state, turnIndex) {
          var stateValue = 0,
            winner,
            // For different position of the board, there's a different weight.
            boardWeight = [
              4, 4, 4, 4,
              4, 3, 3, 3,
              3, 2, 2, 4,
              4, 2, 1, 3,
              3, 1, 2, 4,
              4, 2, 2, 3,
              3, 3, 3, 4,
              4, 4, 4, 4
            ],
            squareIndex,
            square,
            squareValue;

          winner = checkersLogicService.getWinner(checkersLogicService.
              convertGameApiStateToLogicState(state), turnIndex);

          if (winner === 'B') {
            return Number.MIN_VALUE;
          }

          if (winner === 'W') {
            return Number.MAX_VALUE;
          }

          for (squareIndex in state) {
            if (state.hasOwnProperty(squareIndex)) {
              square = state[squareIndex];
              // Get the square value which equals to the square value multiply
              // the board weight.
              squareValue = getSquareValue(square, squareIndex)
                  * boardWeight[squareIndex];

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

          return stateValue;
        }

        /**
         * Get all possible moves.
         *
         * @param state the game API state
         * @param turnIndex 0 represents the black player and 1
         *        represents the white player.
         * @returns {
         *            fromIndex: number,
         *            toIndex: number
         *          }
         */
        function getAllMoves(state, turnIndex) {
          var allPossibleMoves = [],
            hasMandatoryJump,
            possibleMoves,
            possibleMove,
            logicState,
            squareIndex,
            i;

          hasMandatoryJump = checkersLogicService
              .hasMandatoryJumps(state, turnIndex);

          // Check each square of the state
          for (squareIndex in state) {
            if (state.hasOwnProperty(squareIndex)) {
              // Only check if the piece within the square is the current
              // player's
              if (checkersLogicService.isOwnColor(turnIndex,
                  state[squareIndex].substr(0, 1))) {
                squareIndex = parseInt(squareIndex, 10);
                logicState =
                    checkersLogicService.convertGameApiStateToLogicState(state);

                if (hasMandatoryJump) {
                  // If there's any mandatory jumps
                  possibleMoves = checkersLogicService
                      .getJumpMoves(logicState, squareIndex, turnIndex);
                } else {
                  // If there's no mandatory jump,
                  // then check the possible simple move
                  possibleMoves = checkersLogicService
                      .getSimpleMoves(logicState, squareIndex, turnIndex);
                }

                // Convert each possible moves to a move object, and added to
                // the allPossibleMoves array.
                for (i = 0; i < possibleMoves.length; i += 1) {
                  possibleMove = {
                    fromIndex: squareIndex,
                    toIndex: -1
                  };

                  if (typeof possibleMoves[i] === 'number') {
                    // Simple move
                    // e.g. [16] or [16, 17]
                    possibleMove.toIndex = possibleMoves[i];
                    allPossibleMoves.push(possibleMove);
                  } else {
                    // Jump move
                    // e.g. [[4, 8]] or [[4, 8], [5, 10]]
                    possibleMove.toIndex = possibleMoves[i][1];
                    allPossibleMoves.push(possibleMove);
                  }
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
         * Find the highest move score of a state.
         *
         * @param state the game API state
         * @param turnIndex 0 represents the black player and 1
         *        represents the white player.
         * @param depth the depth for the alpha beta pruning algorithm.
         * @param alpha the found max value.
         * @param beta the found min value.
         * @param timer the timer which limit the time for the algorithm.
         * @returns {*} the highest state value if the depth is 0, otherwise
         *              return the alpha value if the current player is White,
         *              otherwise return the beta value.
         */
        function findMoveScore(state, turnIndex, depth, alpha, beta, timer) {
          var possibleMoves,
            move,
            childScore,
            index,
            winner = checkersLogicService.getWinner(checkersLogicService.
              convertGameApiStateToLogicState(state), turnIndex);

          if (Date.now() - timer.startTime > timer.timeLimit) {
//      console.log("Time's up");
            throw "Time's up";
          }

          if (depth === 0 || winner !== '') {
            return getStateValue(state, turnIndex);
          }

          possibleMoves = getAllMoves(state, turnIndex);
          for (index = 0; index < possibleMoves.length; index += 1) {
            move = checkersLogicService.getExpectedOperations(state,
                possibleMoves[index].fromIndex, possibleMoves[index].toIndex,
                turnIndex);

            childScore = findMoveScore(checkersLogicService.
                    getNextState(state, move).nextState,
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
         * @param state the game API state.
         * @param depth the depth for the alpha beta pruning algorithm.
         * @param timer the timer which limit the time for the algorithm.
         * @returns {{fromIndex: *, toIndex: *}} the best move object.
         */
        function findBestMove(state, aiPlayerTurnIndex, depth, timer) {
          var deferred = $q.defer(),
            scores = [],
            score = {},
            moveScore,
            move,
            turnIndex = aiPlayerTurnIndex,
            possibleMoves = getAllMoves(state, turnIndex),
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
//        console.log('depth: ' + i);
              for (j = 0; j < scores.length; j += 1) {
                moveScore = scores[j];
                move = checkersLogicService
                    .getExpectedOperations(state, moveScore.move.fromIndex,
                    moveScore.move.toIndex, turnIndex);
                score = findMoveScore(checkersLogicService.
                        getNextState(state, move).nextState,
                        1 - turnIndex, i,
                        Number.MIN_VALUE, Number.MAX_VALUE, timer);

                if (turnIndex !== 1) {
                  score = -score;
                }
                moveScore.score = score;
              }
              // Sort the scores decreasingly.
              scores.sort(sortScore);
            }
          } catch (ignore) {
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