(function () {
  'use strict';
  /*global angular, platform, Audio */

  /**
   * This is the controller for Checkers.
   *
   * TO be clear in case of confusion, the state has two different format in the
   * controller:
   *
   * TO be clear, the state has two different format in the controller:
   * 1. uiState: It's represented as an array of objects with length of 64. Each
   *             element is a square which contains all its information such as
   *             is it a white crown (king) or black crown (king).
   *             Unlike the game API state, All light squares are also stored.
   * e.g. [{
   *         isBlackMan: boolean,
   *         isBlackCro: boolean,
   *         isWhiteMan: boolean,
   *         isWhiteCro: boolean,
   *         isEmpty: boolean,
   *         isDark: boolean,
   *         isLight: boolean,
   *         canSelect: boolean,
   *         isSelected: boolean,
   *         // Background image path
   *         bgSrc: string,
   *         // Piece image path
   *         pieceSrc: string
   *      }...]
   *
   * 2. GameApiState: It's represented as an object. The game board within is a
   *                  two dimensional array (8*8).
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
   */
  angular.module('checkers').controller('CheckersCtrl',
      ['$scope', '$animate', '$timeout', '$location', '$q',
        'checkersLogicService', 'checkersAiService', 'constantService',
        function ($scope, $animate, $timeout, $location, $q,
                  checkersLogicService, checkersAiService, constantService) {
        var CONSTANT = constantService,
          moveAudio,
          game,
          makeMoveCallback,
          board,
          selectedSquares = [];


        /**
         * Check if the square of the delta is dark square
         * @param row
         * @param col
         * @returns {boolean}
         */
        function isDarkSquare(row, col) {
          var isEvenRow = false,
            isEvenCol = false;

          isEvenRow = row % 2 === 0;
          isEvenCol = col % 2 === 0;

          return ((!isEvenRow && isEvenCol) || (isEvenRow && !isEvenCol));
        }

        /**
         * Convert the delta to UI state index
         * @param row
         * @param col
         * @returns {*}
         */
        function convertDeltaToUiIndex(row, col) {
          return row * CONSTANT.COLUMN + col;
        }

        /**
         * Convert the UI state index to delta object
         * @param uiIndex
         * @returns {{row: number, col: number}}
         */
        function converUiIndexToDelta(uiIndex) {
          var delta = {row: -1, col: -1};

          delta.row = Math.floor(uiIndex / CONSTANT.ROW);
          delta.col = uiIndex % CONSTANT.COLUMN;

          return delta;
        }

        /**
         * Set all squares unselectable.
         */
        function setAllSquareUnselectable() {
          var i;

          for (i = 0; i < CONSTANT.ROW *
              CONSTANT.COLUMN; i += 1) {
            $scope.uiState[i].canSelect = false;
          }
        }

        /**
         * Get the indexes necessary for the animation.
         *
         * @returns {{
         *             fromUiIndex: number,
         *             toUiIndex: number,
         *             jumpedUiIndex: number,
         *             column: number
         *          }}
         */
        function getAnimationIndexes() {
          var fromUiIndex = selectedSquares[0],
            toUiIndex = selectedSquares[1],
            jumpedUiIndex = -1,
            fromDelta = converUiIndexToDelta(fromUiIndex),
            toDelta = converUiIndexToDelta(toUiIndex),
            jumpDelta = checkersLogicService.getJumpedDelta(
              fromDelta,
              toDelta
            );

          jumpedUiIndex =
              convertDeltaToUiIndex(jumpDelta.row, jumpDelta.col);

          return {
            fromUiIndex: fromUiIndex,
            toUiIndex: toUiIndex,
            jumpedUiIndex: jumpedUiIndex,
            column: CONSTANT.COLUMN
          };
        }

        /**
         * Add animation class so the animation may be performed accordingly
         *
         * @param callback makeMove function which will be called after the
         *                 animation is completed.
         */
        function addAnimationClass(callback) {
          var animationIndexes = getAnimationIndexes(),
            column = animationIndexes.column,
            fromUiIndex = animationIndexes.fromUiIndex,
            toUiIndex = animationIndexes.toUiIndex,
            jumpedUiIndex = animationIndexes.jumpedUiIndex;

          // Add the corresponding animation class
          switch (toUiIndex - fromUiIndex) {
          case -column - 1:
            // Simple move up left
            $animate.addClass(('#' + fromUiIndex), 'move_up_left', callback);
            break;
          case -column + 1:
            // Simple move up right
            $animate.addClass(('#' + fromUiIndex), 'move_up_right', callback);
            break;
          case column - 1:
            // Simple move down left
            $animate.addClass(('#' + fromUiIndex), 'move_down_left', callback);
            break;
          case column + 1:
            // Simple move down right
            $animate.addClass(('#' + fromUiIndex), 'move_down_right', callback);
            break;
          case -(2 * column) - 2:
            // Jump move up left
            $animate.addClass(('#' + jumpedUiIndex), 'jumped');
            $animate.addClass(('#' + fromUiIndex), 'jump_up_left', callback);
            break;
          case -(2 * column) + 2:
            // Jump move up right
            $animate.addClass(('#' + jumpedUiIndex), 'jumped');
            $animate.addClass(('#' + fromUiIndex), 'jump_up_right', callback);
            break;
          case (2 * column) - 2:
            // Jump move down left
            $animate.addClass(('#' + jumpedUiIndex), 'jumped');
            $animate.addClass(('#' + fromUiIndex), 'jump_down_left', callback);
            break;
          case (2 * column) + 2:
            // Jump move down right
            $animate.addClass(('#' + jumpedUiIndex), 'jumped');
            $animate.addClass(('#' + fromUiIndex), 'jump_down_right', callback);
            break;
          }
        }

        /**
         * remove animation class when the animation finishes.
         */
        function removeAnimationClass() {
          var animationIndexes = getAnimationIndexes(),
            column = animationIndexes.column,
            fromUiIndex = animationIndexes.fromUiIndex,
            toUiIndex = animationIndexes.toUiIndex,
            jumpedUiIndex = animationIndexes.jumpedUiIndex;

          // remove the corresponding animation class
          switch (toUiIndex - fromUiIndex) {
          case -column - 1:
            // Simple move up left
            $animate.removeClass(('#' + fromUiIndex), 'move_up_left');
            break;
          case -column + 1:
            // Simple move up right
            $animate.removeClass(('#' + fromUiIndex), 'move_up_right');
            break;
          case column - 1:
            // Simple move down left
            $animate.removeClass(('#' + fromUiIndex), 'move_down_left');
            break;
          case column + 1:
            // Simple move down right
            $animate.removeClass(('#' + fromUiIndex), 'move_down_right');
            break;
          case -(2 * column) - 2:
            // Jump move up left
            $animate.removeClass(('#' + jumpedUiIndex), 'jumped');
            $animate.removeClass(('#' + fromUiIndex), 'jump_up_left');
            break;
          case -(2 * column) + 2:
            // Jump move up right
            $animate.removeClass(('#' + jumpedUiIndex), 'jumped');
            $animate.removeClass(('#' + fromUiIndex), 'jump_up_right');
            break;
          case (2 * column) - 2:
            // Jump move down left
            $animate.removeClass(('#' + jumpedUiIndex), 'jumped');
            $animate.removeClass(('#' + fromUiIndex), 'jump_down_left');
            break;
          case (2 * column) + 2:
            // Jump move down right
            $animate.removeClass(('#' + jumpedUiIndex), 'jumped');
            $animate.removeClass(('#' + fromUiIndex), 'jump_down_right');
            break;
          }
          // Initialize the selectedSquares after the animation class is removed
          selectedSquares = [];
        }

        /**
         * For each piece, set its property 'canSelect' to true only if it can
         * makes a jump move or a simple move if there's no mandatory jumps.
         */
        function setInitialSelectableSquares() {
          var uiIndex,
            row,
            col,
            darkUiSquare,
            possibleMoves,
            delta,
            hasMandatoryJump = checkersLogicService
                .hasMandatoryJumps(board, $scope.yourPlayerIndex);

          // First reset all squares to unselectable.
          setAllSquareUnselectable();

          for (row = 0; row < CONSTANT.ROW; row += 1) {
            for (col = 0; col < CONSTANT.COLUMN; col += 1) {
              // Check all dark squares
              if (isDarkSquare(row, col)) {
                uiIndex = convertDeltaToUiIndex(row, col);
                darkUiSquare = $scope.uiState[uiIndex];
                delta = {row: row, col: col};
                // If there exists a piece within the darkUiSquare and is the
                // current player's color, then check if it can make a move,
                // otherwise set it's 'canSelect' property to false.
                if (checkersLogicService.isOwnColor($scope.yourPlayerIndex,
                    board[row][col].substr(0, 1))) {

                  // If there's at least one mandatory jump, then only check the
                  // possible jump moves.
                  if (hasMandatoryJump) {
                    possibleMoves = checkersLogicService
                        .getJumpMoves(board, delta, $scope.yourPlayerIndex);
                  } else {
                    possibleMoves = checkersLogicService
                        .getSimpleMoves(board, delta, $scope.yourPlayerIndex);
                  }

                  // If there's at least one possible move, then the
                  // darkUiSquare can be select.
                  if (possibleMoves.length > 0) {
                    darkUiSquare.canSelect = true;
                  } else {
                    darkUiSquare.canSelect = false;
                  }
                } else {
                  // It's not the player's piece, so can not be selected.
                  darkUiSquare.canSelect = false;
                }
              }
            }
          }
        }

        /**
         * Set the possible move destination squares' canSelect to true and
         * others remain the same.
         *
         * @param squareUiIndex the square selected.
         */
        function setSelectableSquares(squareUiIndex) {
          var i,
            fromDelta,
            row,
            col,
            uiIndex,
            possibleMoves;

          fromDelta = converUiIndexToDelta(squareUiIndex);
          possibleMoves =
              checkersLogicService.getAllPossibleMoves(board, fromDelta,
                    $scope.yourPlayerIndex);

          if (possibleMoves.length > 0) {
            // If the possible moves are jump moves, then only keep the
            // destination square indexes.
            for (i = 0; i < possibleMoves.length; i += 1) {
              row = possibleMoves[i].row;
              col = possibleMoves[i].col;
              uiIndex = convertDeltaToUiIndex(row, col);
              $scope.uiState[uiIndex].canSelect = true;
            }
          }
        }

        /**
         * Update the square of the UI state according to the new square of
         * the game API state in order to update the graphics.
         *
         * @param gameApiSquare the square of the game API state.
         * @param uiSquare the square of the UI state.
         */
        function updateUiSquare(gameApiSquare, uiSquare) {
          // Reset the information of the content within the square
          uiSquare.isEmpty = false;
          uiSquare.isBlackMan = false;
          uiSquare.isBlackCro = false;
          uiSquare.isWhiteMan = false;
          uiSquare.isWhiteCro = false;
          uiSquare.canSelect = false;
          uiSquare.isSelected = false;

          switch (gameApiSquare) {
          case CONSTANT.WHITE_MAN:
            uiSquare.isWhiteMan = true;
            uiSquare.pieceSrc = 'img/white_man';
            break;
          case CONSTANT.WHITE_KING:
            uiSquare.isWhiteCro = true;
            uiSquare.pieceSrc = 'img/white_cro';
            break;
          case CONSTANT.BLACK_MAN:
            uiSquare.isBlackMan = true;
            uiSquare.pieceSrc = 'img/black_man';
            break;
          case CONSTANT.BLACK_KING:
            uiSquare.isBlackCro = true;
            uiSquare.pieceSrc = 'img/black_cro';
            break;
          default:
            uiSquare.isEmpty = true;
            uiSquare.pieceSrc = 'img/empty';
          }
        }

          /**
         * Initialize the game, in another word create an empty board.
         *
         * For each square, it is represented as an object in the ui state:
         * e.g. [{
         *        isBlackMan: boolean,
         *        isBlackCro: boolean,
         *        isWhiteMan: boolean,
         *        isWhiteCro: boolean,
         *        isEmpty: boolean,
         *        isDark: boolean,
         *        isLight: boolean,
         *        canSelect: boolean,
         *        isSelected: boolean,
         *        // Background image path
         *        bgSrc: string,
         *        // Piece image path
         *        pieceSrc: string
         *       }...]
         */
        function initializeUiState() {
          // Initialize the ui state as an array first
          $scope.uiState = [];

          var lightUiSquare,
            darkUiSquare,
            defaultUiSquare = {
              isBlackMan: false,
              isBlackCro: false,
              isWhiteMan: false,
              isWhiteCro: false,
              isEmpty: true,
              isDark: false,
              isLight: false,
              canSelect: false,
              isSelected: false,
              bgSrc: '',
              pieceSrc: 'img/empty'
            },
            row,
            col,
            uiSquareIndex;

          // Each time initialize two square at once, one dark and one light
          for (row = 0; row < CONSTANT.ROW; row += 1) {
            for (col = 0; col < CONSTANT.COLUMN; col += 1) {
              if (isDarkSquare(row, col)) {
                // Dark square
                darkUiSquare = angular.copy(defaultUiSquare);

                darkUiSquare.isDark = true;
                darkUiSquare.bgSrc = 'img/dark_square.png';

                uiSquareIndex = convertDeltaToUiIndex(row, col);
                $scope.uiState[uiSquareIndex] = darkUiSquare;
              } else {
                // Light square
                lightUiSquare = angular.copy(defaultUiSquare);

                lightUiSquare.isLight = true;
                lightUiSquare.bgSrc = 'img/light_square.png';
                // Since light square will not be used and clicked, no piece
                // image will be set for it.
                lightUiSquare.isEmpty = false;
                lightUiSquare.pieceSrc = '';

                uiSquareIndex = convertDeltaToUiIndex(row, col);
                $scope.uiState[uiSquareIndex] = lightUiSquare;
              }
            }
          }
        }

        /**
         * Update the UI state after the last move.
         */
        function updateUiState() {
          var deferred = $q.defer(),
            gameApiSquare,
            darkUiSquare,
            darkUiSquareIndex,
            fromUiIndex,
            toUiIndex,
            jumpedUiIndex,
            fromDelta,
            toDelta,
            jumpedDelta,
            row,
            col;

          if (selectedSquares.length === 0) {
            // If the selectedSquares is empty, then the last move should be the
            // first move maded by the black player in order to initialize th
            // game. So update each dark squares.

            for (row = 0; row < CONSTANT.ROW; row += 1) {
              for (col = 0; col < CONSTANT.COLUMN; col += 1) {
                gameApiSquare = board[row][col];
                if (isDarkSquare(row, col)) {
                  darkUiSquareIndex = convertDeltaToUiIndex(row, col);
                  darkUiSquare = $scope.uiState[darkUiSquareIndex];
                  updateUiSquare(gameApiSquare, darkUiSquare);
                }
              }
            }
          } else {
            // It's not the first move, so check the selectedSquares for the
            // squares need to be updated.

            // UI state index
            fromUiIndex = selectedSquares[0];
            toUiIndex = selectedSquares[1];
            jumpedUiIndex = -1;

            // Game API state index
            fromDelta = converUiIndexToDelta(fromUiIndex);
            toDelta = converUiIndexToDelta(toUiIndex);

            // Get the jumped square's index. If it's a simple move, then this
            // index is illegal, yet will not be used.
            jumpedDelta =
                checkersLogicService.getJumpedDelta(fromDelta, toDelta);

            // Update those squares
            updateUiSquare(board[fromDelta.row][fromDelta.col],
                $scope.uiState[fromUiIndex]);
            updateUiSquare(board[toDelta.row][toDelta.col],
                $scope.uiState[toUiIndex]);
            if (jumpedDelta.row !== -1) {
              jumpedUiIndex = convertDeltaToUiIndex(jumpedDelta.row,
                  jumpedDelta.col);

              updateUiSquare(board[jumpedDelta.row][jumpedDelta.col],
                  $scope.uiState[jumpedUiIndex]);
            }
          }

          // In case the board is not updated
          if (!$scope.$$phase) {
            $scope.$apply();
          }

          deferred.resolve('Success');

          return deferred.promise;
        }

        /**
         * Update the graphics (UI state) according to the new game API state
         * and set initial selectable squares.
         *
         * @param isAiMode true if it's in ai mode
         * @param callback callback function
         */
        function updateCheckersGraphics(isAiMode, callback) {
          // Update the board first, when the graphics is updated then move on
          updateUiState().then(function () {
            // Remove the animation classes, whether the animation class is
            // added or not (is Dnd or not) before is not important. Otherwise
            // the square image with the unmoved animation class will not be
            // placed in the right position even if the image is correct.
            if (selectedSquares.length !== 0) {
              removeAnimationClass();
            }

            // If the state is not empty, then set the the selectablility for
            // each square.
            if (!checkersLogicService.isEmptyObj(board)) {
              if (isAiMode && $scope.yourPlayerIndex === 1) {
                // It's ai's turn, the player can not select any squares
                setAllSquareUnselectable();
              } else {
                // It's not in ai's mode or ai's turn, so set selectable
                // squares according to the player index.
                setInitialSelectableSquares($scope.yourPlayerIndex);
              }
            }
            // Call the callback function
            callback();
          });
        }

        /**
         * This function will play the animation by adding proper class to the
         * element if the move is not made by drag and drop. During the
         * animation all squares will also be set to unselectable.
         *
         * @param isDnD true if the move is made by drag and drop, otherwise
         *              false
         * @param callback makeMove function which will be called after the
         *                 animation is completed.
         */
        function playAnimation(isDnD, callback) {
          // Disable all squares, so the player can not click any squares before
          // the move is done and the board is updated.
          setAllSquareUnselectable();

          // If the move is made by drag and drop, just call the callback
          // function
          if (isDnD) {
            callback();
            return;
          }

          // Add the animation class in order to play the animation
          addAnimationClass(callback);
        }

        /**
         * Make the move by first playing the sound effect, then send the
         * corresponding operations to the makeMoveCallback.
         *
         * @param isDnD true if the move is made by drag and drop, otherwise
         *              false
         */
        function makeMove(isDnD) {
          // Play the animation first!!!
          playAnimation(isDnD, function () {
            // Callback function. It's called when the animation is completed.
            var operations,
              fromDelta = converUiIndexToDelta(selectedSquares[0]),
              toDelta = converUiIndexToDelta(selectedSquares[1]);

//            console.log('Move delta: '
//                + ($scope.yourPlayerIndex === 0 ? 'Black' : 'White')
//                + ' Move from [' + fromDelta.row + ', ' + fromDelta.col
//                + '] to [' + toDelta.row + ', ' + toDelta.col + ']');

            // Get the operations
            operations = checkersLogicService
                .createMove(angular.copy(board),
                fromDelta, toDelta, $scope.yourPlayerIndex);

            // Now play the audio.
            moveAudio.play();
            makeMoveCallback(operations);
          });
        }

        /**
         * Select a piece, change the validation of all squares accordingly and
         * send the move if the move is complete and valid.
         *
         * @param index the piece selected.
         */
        $scope.pieceSelected = function (index, isDnD) {
          var square = $scope.uiState[index],
            currSelectedDelta = converUiIndexToDelta(index),
            prevSelectedDelta;

          // Proceed only if it's dark square and it's selectable.
          if (square.isDark && square.canSelect) {
            if (selectedSquares.length === 0 && !square.isEmpty) {
              // If no piece is selected, select it
              square.isSelected = true;
              selectedSquares[0] = index;

              setSelectableSquares(index);
            } else if (selectedSquares.length === 1) {
              // One square is already selected
              prevSelectedDelta = converUiIndexToDelta(selectedSquares[0]);
              if (checkersLogicService
                  .getColor(board[currSelectedDelta.row][currSelectedDelta.col])
                  === checkersLogicService.getColor(
                    board[prevSelectedDelta.row][prevSelectedDelta.col]
                  )) {
                // It the second selected piece is still the player's, no matter
                // it's the same one or a different one, just change the first
                // selected square to the new one.
                $scope.uiState[selectedSquares[0]].isSelected = false;
                square.isSelected = true;
                selectedSquares[0] = index;

                // Reinitialize all the selectable squares
                setInitialSelectableSquares();
                // Set the new selectable squares according to the selected one
                setSelectableSquares(index);

              } else if (square.isEmpty) {
                // If the second selected is an empty square
                selectedSquares[1] = index;
              }
            }

            // If two squares are selected, then a move can be made
            if (selectedSquares.length === 2) {
              $scope.uiState[selectedSquares[0]].isSelected = false;

              makeMove(isDnD);
            }
          }
        };

        /**
         * Handle the drag start, which select the dragged piece and set valid
         * droppable squares.
         *
         * @param index the index of the dragged piece
         */
        $scope.handleDragStart = function (index) {
          var square = $scope.uiState[index],
            isDnD = true;
          if (square.isDark && square.canSelect) {
            $scope.pieceSelected(index, isDnD);
          }
        };

        /**
         * Handle the drop event, which select the piece being dropped on and
         * makes the move without animation.
         *
         * @param index the index of the dropped on piece
         */
        $scope.handleDrop = function (index) {
          var square = $scope.uiState[index],
            isDnD = true;
          if (square.isDark && square.canSelect) {
            $scope.pieceSelected(index, isDnD);
          }
          // The target is not droppable, nothing will happen.
        };

        /**
         * This function use the alpha beta pruning algorithm to calculate a
         * best move for the ai, then make the move and play the animation and
         * sound effect.
         */
        function aiMakeMove() {
          var isDnD = false,
            bestMove,
            depth = 10,
            timeLimit = 800,
            timer = {
              startTime: Date.now(),
              timeLimit: timeLimit
            };

          // Move on only after the best move is calculated.
          checkersAiService.
              findBestMove(angular.copy(board),
              $scope.yourPlayerIndex, depth, timer)
              .then(function (data) {
              bestMove = data;
              // Set the selected squares according to the best move.
              selectedSquares = [
                convertDeltaToUiIndex(bestMove[0].row, bestMove[0].col),
                convertDeltaToUiIndex(bestMove[1].row, bestMove[1].col)
              ];
              makeMove(isDnD);
            });
        }

        game = (function () {
          function getGameDeveloperEmail() {
            return "yl1949@nyu.edu";
          }

          /**
           * This method update the game's UI.
           * @param match
           */
          function updateUI(match) {
            var isAiMode = $location.url() === '/PlayAgainstTheComputer',
              turnIndexBeforeMove = match.turnIndexBeforeMove;
            // Get the new state
            board = angular.copy(match.stateAfterMove.board);
            makeMoveCallback = match.makeMoveCallback;
            $scope.yourPlayerIndex = match.yourPlayerIndex;
            $scope.playersInfo = match.playersInfo;

            if (checkersLogicService.isEmptyObj(board)
                && turnIndexBeforeMove === 0) {
              // If the state is empty and the player is black, the first player
              // with turn index 0 will make the first move to initialize the
              // game.
              // Make the first move
              makeMoveCallback(checkersLogicService.getFirstMove());
            } else {
              // The game is properly initialized, let's make a move :)
              // But first update the graphics
              updateCheckersGraphics(isAiMode, function () {
                // If it's the AI mode and it's the AI turn, then let the AI
                // makes the move.
                if (isAiMode && $scope.yourPlayerIndex === 1) {
                  // Since the events of the Audio API are not well supported,
                  // for ai, there'll be a delay for the audio to end. Otherwise
                  // once the ai starts to compute the best move, things weird
                  // may happen...
                  $timeout(aiMakeMove, 250);
                }
              });
            }
          }

          return {
            getGameDeveloperEmail: getGameDeveloperEmail,
            isMoveOk: checkersLogicService.isMoveOk,
            updateUI: updateUI
          };
        }());

        /**
         * A function to start a new game.
         */
        $scope.newGame = function () {
          // Load the necessary audio.
          moveAudio = new Audio('audio/move.wav');
          moveAudio.load();

          // Initialize the empty game board first
          initializeUiState();

          // Set the game
          platform.setGame(game);
          platform.showUI({minNumberOfPlayers: 2, maxNumberOfPlayers: 2});
        };
      }]);
}());