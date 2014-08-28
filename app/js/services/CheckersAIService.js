/**
 * Checkers AI service.
 * The evaluation function is copied from http://bit.ly/XTUy5g (It's in Chinese)
 */
checkers.factory('checkersAiService', ['checkersLogicService', '$q',
  function (checkersLogicService, $q) {
    /**************************************************************************
     * Heuristic part
     **************************************************************************/

    /**
     * Check if there's a winner for the input state
     *
     * @param state the game API state.
     * @returns {string} the winner's color 'W' or 'B', if the game is not yet
     *                   ended, return ' '.
     */
    var hasWon = function (state) {
      var hasWhite,
        hasBlack,
        squareIndex;

      // Traverse all squares to identify whether there's any white and black
      // pieces.
      for (squareIndex in state) {
        if (state[squareIndex].substr(0, 1) === 'W') {
          hasWhite = true;
        } else if (state[squareIndex].substr(0, 1) === 'B') {
          hasBlack = true;
        }
      }

      if (hasWhite && !hasBlack) {
        // The winner is white player with turn index 0
        return 'W';
      }

      if (!hasWhite && hasBlack) {
        // The winner is black player with turn index 1
        return 'B';
      }

      // No winner
      return ' ';
    };

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
    var getSquareValue = function (square, squareIndex) {
      if (square.substr(1) === 'MAN') {
        var row = checkersLogicService.CONSTANT.get('ROW'),
          column = checkersLogicService.CONSTANT.get('COLUMN');
        if (square.substr(0, 1) === 'W') {
          // White
          if (Math.floor(squareIndex / column) >= 1 &&
              Math.floor(squareIndex / column) < 2) {
            // Closed to be crowned
            return 7;
          }
          return 5;
        } else {
          // Black
          if (Math.floor(squareIndex / column) >= row - 2 &&
              Math.floor(squareIndex / column) < row - 1) {
            // Closed to be crowned
            return 7;
          }
          return 5;
        }
      }

      if (square.substr(1) === 'CRO') {
        // It's a crown
        return 10;
      }

      // Empty square
      return 0;
    };

    /**
     * Get the state value.
     *
     * @param state the game API state.
     * @returns {*} the state value.
     */
    var getStateValue = function getStateValue (state) {
      var stateValue = 0,
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

      if (hasWon(state) === 'W') {
        return Number.MIN_VALUE;
      } else if (hasWon(state) === 'B') {
        return Number.MAX_VALUE;
      }

      for (squareIndex in state) {
        square = state[squareIndex];
        // Get the square value which equals to the square value multiply the
        // board weight.
        squareValue = getSquareValue(square, squareIndex) * boardWeight[squareIndex];

        if (square.substr(0, 1) === 'W') {
          // WHITE
          stateValue -= squareValue;
        } else {
          // BLACK
          stateValue += squareValue;
        }
      }
      return stateValue;
    };

    /**
     * Get all possible moves.
     *
     * @param state the game API state
     * @param turnIndex the turn index which 0 represents the white player and 1
     *        represents the black player.
     * @returns {
     *            fromIndex: number,
     *            toIndex: number
     *          }
     */
    var getAllMoves = function (state, turnIndex) {
      var allPossibleMoves = [],
        hasMandatoryJump = checkersLogicService.checkMandatoryJump(state,
          turnIndex),
        possibleMoves,
        checkersState,
        squareIndex;


      for (squareIndex in state) {
        // Only check if the piece within the square is the current player's.
        if ((state[squareIndex].substr(0, 1) === 'W' && turnIndex === 0) ||
            (state[squareIndex].substr(0, 1) === 'B' && turnIndex === 1)) {
          squareIndex = parseInt(squareIndex, 10);
          checkersState =
              checkersLogicService.convertGameApiStateToCheckersState(state);

          if (hasMandatoryJump) {
            // If there's any mandatory jumps
            possibleMoves = checkersLogicService.getJumpMoves(checkersState,
                squareIndex, turnIndex);
          } else {
            // If there's no mandatory jump, then check the possible simple move
            possibleMoves = checkersLogicService.getSimpleMoves(checkersState,
                squareIndex, turnIndex);
          }

          // Convert each possible moves to a move object, and added to the
          // allPossibleMoves array.
          for (var index in possibleMoves) {
            var toIndex = -1;
            if (typeof possibleMoves[0] === 'number') {
              toIndex = possibleMoves[0];
            } else {
              toIndex = possibleMoves[0][1];
            }

            var possibleMove = {
              fromIndex: squareIndex,
              toIndex: toIndex
            };
            allPossibleMoves.push(possibleMove);
          }
        }
      }

      return allPossibleMoves;
    };

    /**************************************************************************
     * Alpha Beta Pruning part
     **************************************************************************/

    /**
     *
     * @param state the game API state.
     * @param moveObj the move object.
     * @param turnIndex the turn index which 0 represents the white player and 1
     *        represents the black player.
     * @returns {} the new state after the move.
     */
    var getNextState = function (state, moveObj, turnIndex) {
      var fromIndex = moveObj.fromIndex;
      var toIndex = moveObj.toIndex;
      return checkersLogicService.getNextState(
          state, getExpectedOperations(state, fromIndex, toIndex, turnIndex),
          turnIndex).nextState;
    };

    /*
     * A function for Array.prototype.sort(). The score will be ordered
     * decreasing.
     */
    var sortScore = function (a, b) {
      return b.score - a.score;
    };

    /**
     * Find the best move.
     *
     * @param state the game API state.
     * @param depth the depth for the alpha beta pruning algorithm.
     * @param timer the timer which limit the time for the algorithm.
     * @returns {{fromIndex: *, toIndex: *}} the best move object.
     */
    var findBestMove = function (state, aiPlayerTurnIndex, depth, timer) {
      var deferred = $q.defer();
      var scores = [];
      var turnIndex = aiPlayerTurnIndex;

      var possibleMoves = getAllMoves(state, turnIndex);
      for (var index in possibleMoves) {
        var score = {};
        score.move = possibleMoves[index];
        score.score = Number.MIN_VALUE;
        scores.push(score);
      }

      try {
        for (var i = 0; i < depth; i += 1) {
          for (var j = 0; j < scores.length; j += 1) {
            var moveScore = scores[j];
            var move = moveScore.move;
            var score = findMoveScore(
                getNextState(state, move, turnIndex), 1 - turnIndex, i,
                Number.MIN_VALUE, Number.MAX_VALUE, timer);
            if (turnIndex !== 1) {
              score = -score;
            }
            moveScore.score = score;
          }
          // Sort the scores decreasingly.
          scores.sort(sortScore);
        }
      } catch (err) {
        // Ok, time's up so just make a move :)
      }

      // Sort the scores decreasingly.
      scores.sort(sortScore);

      deferred.resolve(scores[0]['move']);

      // Return the best move.
      return deferred.promise;
    };

    /**
     * Find the highest move score of a state.
     *
     * @param state the game API state
     * @param turnIndex the turn index which 0 represents the white player and 1
     *        represents the black player.
     * @param depth the depth for the alpha beta pruning algorithm.
     * @param alpha the found max value.
     * @param beta the found min value.
     * @param timer the timer which limit the time for the algorithm.
     * @returns {*} the highest state value if the depth is 0, otherwise return
     *              the alpha value if the current player is White, otherwise
     *              return the beta value.
     */
    var findMoveScore = function (state, turnIndex, depth, alpha, beta, timer) {
      if (Date.now() - timer.startTime > timer.timeLimit) {
        throw "Time's up";
      }

      if (depth === 0 || hasWon(state) !== ' ') {
        return getStateValue(state);
      }

      var possibleMoves = getAllMoves(state, turnIndex);
      for (var index in possibleMoves) {
        var childScore =
            findMoveScore(getNextState(state, possibleMoves[index], turnIndex),
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
    };

    /**************************************************************************
     * Service part...
     **************************************************************************/

    return {
      findBestMove: findBestMove
    };
  }]);