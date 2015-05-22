(function () {
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
