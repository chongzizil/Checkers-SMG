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
  //For unit tests
  //angular.module('myApp', []).controller('CheckersCtrl',
  angular.module('myApp').controller('CheckersCtrl',
      ['$scope', '$animate', '$timeout', '$location', '$q',
        'checkersLogicService', 'checkersAiService', 'checkersNewAiService', 'constantService', 'gameService', 'resizeGameAreaService',
        function ($scope, $animate, $timeout, $location, $q,
                  checkersLogicService, checkersAiService, checkersNewAiService, constantService, gameService, resizeGameAreaService) {
        var CONSTANT = constantService,
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
        $scope.convertDeltaToUIIndex = function(row, col) {
          return row * CONSTANT.COLUMN + col;
        };

        /**
         * Return the id of a square. Basically it's the same as
         * $scope.convertDeltaToUIIndex... Just adds process of rotate...
         * @param row
         * @param col
         * @returns {*}
         */
        $scope.getId = function(row, col) {
          if ($scope.rotate) {
            row = 7 - row;
            col = 7 - col;
          }
          return row * CONSTANT.COLUMN + col;
        };

        /**
         * Convert the UI state index to delta object
         * @param uiIndex
         * @returns {{row: number, col: number}}
         */
        function convertUIIndexToDelta(uiIndex) {
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
         * return the square object of the ui state.
         * @returns square object of the ui state
         */
        $scope.getSquare = function(row, col) {
          // If the board need to rotate 180 degrees, simply change the row and
          // column for the UI... ($scope.uiState remains intact)
          if ($scope.rotate) {
            row = 7 - row;
            col = 7 - col;
          }
          var index = $scope.convertDeltaToUIIndex(row, col);
          return $scope.uiState[index];
        };

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
            fromDelta = convertUIIndexToDelta(fromUiIndex),
            toDelta = convertUIIndexToDelta(toUiIndex),
            jumpDelta = checkersLogicService.getJumpedDelta(
              fromDelta,
              toDelta
            );

          jumpedUiIndex =
              $scope.convertDeltaToUIIndex(jumpDelta.row, jumpDelta.col);

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
            UIFromIndex = animationIndexes.fromUiIndex,
            UIToIndex = animationIndexes.toUiIndex,
            UIJumpedIndex = animationIndexes.jumpedUiIndex;

          // Add the corresponding animation class
          switch (UIToIndex - UIFromIndex) {
          case -column - 1:
            // Simple move up left
            if ($scope.rotate) {
              $animate.addClass(('#' + UIFromIndex), 'move_down_right', callback);
            } else {
              $animate.addClass(('#' + UIFromIndex), 'move_up_left', callback);
            }
            break;
          case -column + 1:
            // Simple move up right
            if ($scope.rotate) {
              $animate.addClass(('#' + UIFromIndex), 'move_down_left', callback);
            } else {
              $animate.addClass(('#' + UIFromIndex), 'move_up_right', callback);
            }
            break;
          case column - 1:
            // Simple move down left
            if ($scope.rotate) {
              $animate.addClass(('#' + UIFromIndex), 'move_up_right', callback);
            } else {
              $animate.addClass(('#' + UIFromIndex), 'move_down_left', callback);
            }
            break;
          case column + 1:
            // Simple move down right
            if ($scope.rotate) {
              $animate.addClass(('#' + UIFromIndex), 'move_up_left', callback);
            } else {
              $animate.addClass(('#' + UIFromIndex), 'move_down_right', callback);
            }
            break;
          case -(2 * column) - 2:
            // Jump move up left
            $animate.addClass(('#' + UIJumpedIndex), 'jumped');
            if ($scope.rotate) {
              $animate.addClass(('#' + UIFromIndex), 'jump_down_right', callback);
            } else {
              $animate.addClass(('#' + UIFromIndex), 'jump_up_left', callback);
            }
            break;
          case -(2 * column) + 2:
            // Jump move up right
            $animate.addClass(('#' + UIJumpedIndex), 'jumped');
            if ($scope.rotate) {
              $animate.addClass(('#' + UIFromIndex), 'jump_down_left', callback);
            } else {
              $animate.addClass(('#' + UIFromIndex), 'jump_up_right', callback);
            }
            break;
          case (2 * column) - 2:
            // Jump move down left
            $animate.addClass(('#' + UIJumpedIndex), 'jumped');
            if ($scope.rotate) {
              $animate.addClass(('#' + UIFromIndex), 'jump_up_right', callback);
            } else {
              $animate.addClass(('#' + UIFromIndex), 'jump_down_left', callback);
            }
            break;
          case (2 * column) + 2:
            // Jump move down right
            $animate.addClass(('#' + UIJumpedIndex), 'jumped');
            if ($scope.rotate) {
              $animate.addClass(('#' + UIFromIndex), 'jump_up_left', callback);
            } else {
              $animate.addClass(('#' + UIFromIndex), 'jump_down_right', callback);
            }
            break;
          }
        }

        /**
         * remove animation class when the animation finishes.
         */
        function removeAnimationClass() {
          var animationIndexes = getAnimationIndexes(),
            column = animationIndexes.column,
            UIFromIndex = animationIndexes.fromUiIndex,
            UIToIndex = animationIndexes.toUiIndex,
            UIJumpedIndex = animationIndexes.jumpedUiIndex;

          // remove the corresponding animation class
          switch (UIToIndex - UIFromIndex) {
          case -column - 1:
            // Simple move up left
            if ($scope.rotate) {
              $animate.removeClass(('#' + UIFromIndex), 'move_down_right');
            } else {
              $animate.removeClass(('#' + UIFromIndex), 'move_up_left');
            }
            break;
          case -column + 1:
            // Simple move up right
            if ($scope.rotate) {
              $animate.removeClass(('#' + UIFromIndex), 'move_down_left');
            } else {
              $animate.removeClass(('#' + UIFromIndex), 'move_up_right');
            }
            break;
          case column - 1:
            // Simple move down left
            if ($scope.rotate) {
              $animate.removeClass(('#' + UIFromIndex), 'move_up_right');
            } else {
              $animate.removeClass(('#' + UIFromIndex), 'move_down_left');
            }
            break;
          case column + 1:
            // Simple move down right
            if ($scope.rotate) {
              $animate.removeClass(('#' + UIFromIndex), 'move_up_left');
            } else {
              $animate.removeClass(('#' + UIFromIndex), 'move_down_right');
            }
            break;
          case -(2 * column) - 2:
            // Jump move up left
            $animate.removeClass(('#' + UIJumpedIndex), 'jumped');
            if ($scope.rotate) {
              $animate.removeClass(('#' + UIFromIndex), 'jump_down_right');
            } else {
              $animate.removeClass(('#' + UIFromIndex), 'jump_up_left');
            }
            break;
          case -(2 * column) + 2:
            // Jump move up right
            $animate.removeClass(('#' + UIJumpedIndex), 'jumped');
            if ($scope.rotate) {
              $animate.removeClass(('#' + UIFromIndex), 'jump_down_left');
            } else {
              $animate.removeClass(('#' + UIFromIndex), 'jump_up_right');
            }
            break;
          case (2 * column) - 2:
            // Jump move down left
            $animate.removeClass(('#' + UIJumpedIndex), 'jumped');
            if ($scope.rotate) {
              $animate.removeClass(('#' + UIFromIndex), 'jump_up_right');
            } else {
              $animate.removeClass(('#' + UIFromIndex), 'jump_down_left');
            }
            break;
          case (2 * column) + 2:
            // Jump move down right
            $animate.removeClass(('#' + UIJumpedIndex), 'jumped');
            if ($scope.rotate) {
              $animate.removeClass(('#' + UIFromIndex), 'jump_up_left');
            } else {
              $animate.removeClass(('#' + UIFromIndex), 'jump_down_right');
            }
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
          var UIIndex,
            row,
            col,
            UISquare,
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
                UIIndex = $scope.convertDeltaToUIIndex(row, col);
                UISquare = $scope.uiState[UIIndex];
                delta = {row: row, col: col};
                // If there exists a piece within the UISquare and is the
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
                  // UISquare can be select.
                  if (possibleMoves.length > 0) {
                    UISquare.canSelect = true;
                  } else {
                    UISquare.canSelect = false;
                  }
                }
              }
            }
          }
        }

        /**
         * Set the possible move destination squares' canSelect to true and
         * others remain the same.
         *
         * @param UISquareIndex the square selected.
         */
        function setSelectableSquares(UISquareIndex) {
          var i,
            fromDelta,
            row,
            col,
            UIIndex,
            possibleMoves;

          fromDelta = convertUIIndexToDelta(UISquareIndex);
          possibleMoves =
              checkersLogicService.getAllPossibleMoves(board, fromDelta,
                    $scope.yourPlayerIndex);

          if (possibleMoves.length > 0) {
            // If the possible moves are jump moves, then only keep the
            // destination square indexes.
            for (i = 0; i < possibleMoves.length; i += 1) {
              row = possibleMoves[i].row;
              col = possibleMoves[i].col;
              UIIndex = $scope.convertDeltaToUIIndex(row, col);
              $scope.uiState[UIIndex].canSelect = true;
            }
          }
        }

        function initializeUISquare(UISquare) {
          UISquare.isEmpty = false;
          UISquare.isBlackMan = false;
          UISquare.isBlackCro = false;
          UISquare.isWhiteMan = false;
          UISquare.isWhiteCro = false;
          UISquare.canSelect = false;
          UISquare.isSelected = false;
        }

        /**
         * Update the square of the UI state according to the new square of
         * the game API state in order to update the graphics.
         *
         * @param APISquare the square of the game API state.
         * @param UISquare the square of the UI state.
         */
        function updateUiSquare(APISquare, UISquare) {
          // Reset the information of the content within the square
          initializeUISquare(UISquare);

          switch (APISquare) {
            case CONSTANT.WHITE_MAN:
              UISquare.isWhiteMan = true;
              UISquare.pieceSrc = 'img/white_man';
              break;
            case CONSTANT.WHITE_KING:
              UISquare.isWhiteCro = true;
              UISquare.pieceSrc = 'img/white_cro';
              break;
            case CONSTANT.BLACK_MAN:
              UISquare.isBlackMan = true;
              UISquare.pieceSrc = 'img/black_man';
              break;
            case CONSTANT.BLACK_KING:
              UISquare.isBlackCro = true;
              UISquare.pieceSrc = 'img/black_cro';
              break;
            default:
              UISquare.isEmpty = true;
              UISquare.pieceSrc = 'img/empty';
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

          var lightUISquare,
            darkUISquare,
            defaultUISquare = {
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
                darkUISquare = angular.copy(defaultUISquare);

                darkUISquare.isDark = true;
                darkUISquare.bgSrc = 'img/dark_square.png';

                uiSquareIndex = $scope.convertDeltaToUIIndex(row, col);
                $scope.uiState[uiSquareIndex] = darkUISquare;
              } else {
                // Light square
                lightUISquare = angular.copy(defaultUISquare);

                lightUISquare.isLight = true;
                lightUISquare.bgSrc = 'img/light_square.png';
                // Since light square will not be used and clicked, no piece
                // image will be set for it.
                lightUISquare.isEmpty = false;
                lightUISquare.pieceSrc = '';

                uiSquareIndex = $scope.convertDeltaToUIIndex(row, col);
                $scope.uiState[uiSquareIndex] = lightUISquare;
              }
            }
          }
        }

        /**
         * Update the UI state according to the new board state.
         */
        function updateUiState(callback) {
          var deferred = $q.defer(),
            gameApiSquare,
            UISquare,
            UISquareIndex,
            UIFromIndex,
            UIToIndex,
            UIJumpedIndex,
            fromDelta,
            toDelta,
            jumpedDelta,
            row,
            col;

          if (selectedSquares.length === 0) {
            // No square/piece is selected
            for (row = 0; row < CONSTANT.ROW; row++) {
              for (col = 0; col < CONSTANT.COLUMN; col++) {
                if (isDarkSquare(row, col)) {
                  gameApiSquare = board[row][col];
                  UISquareIndex = $scope.convertDeltaToUIIndex(row, col);
                  UISquare = $scope.uiState[UISquareIndex];
                  updateUiSquare(gameApiSquare, UISquare);
                }
              }
            }
          } else {
            // Have one square/piece selected

            UIFromIndex = selectedSquares[0];
            UIToIndex = selectedSquares[1];
            UIJumpedIndex = -1;

            // Game API state index
            fromDelta = convertUIIndexToDelta(UIFromIndex);
            toDelta = convertUIIndexToDelta(UIToIndex);

            // Get the jumped square's index. If it's a simple move, then this
            // index is illegal, yet will not be used.
            jumpedDelta =
                checkersLogicService.getJumpedDelta(fromDelta, toDelta);

            // Update those squares
            updateUiSquare(board[fromDelta.row][fromDelta.col],
                $scope.uiState[UIFromIndex]);
            updateUiSquare(board[toDelta.row][toDelta.col],
                $scope.uiState[UIToIndex]);

            if (jumpedDelta.row !== -1) {
              // It's a jump move and a piece is jumped/captured
              UIJumpedIndex = $scope.convertDeltaToUIIndex(jumpedDelta.row,
                  jumpedDelta.col);

              updateUiSquare(board[jumpedDelta.row][jumpedDelta.col],
                  $scope.uiState[UIJumpedIndex]);
            }
          }

          // In case the board is not updated
          if (!$scope.$$phase) {
            $scope.$apply();
          }

          callback();
        }

        /**
         * Update the graphics (UI state) according to the new game API state
         * and set initial selectable squares.
         *
         * @param isAiMove true if it's in ai mode
         * @param callback callback function
         */
        function updateCheckersGraphics(isAiMove, callback) {
          // Update the UI first
          updateUiState(function () {
            // Remove the animation classes, whether the animation class is
            // added or not (is Dnd or not) before is not important. Otherwise
            // the square image with the unmoved animation class will not be
            // placed in the right position even if the image is correct.
            if (selectedSquares.length !== 0) {
              removeAnimationClass();
            }

            if (isAiMove) {
              // It's AI's turn, the player can not select any squares
              setAllSquareUnselectable();
              callback();
            } else {
              setInitialSelectableSquares();
            }
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


          if (isDnD) {
            // If the move is made by drag and drop, just call the callback function
            callback();
          } else {
            // Add the animation class in order to play the animation
            addAnimationClass(callback);
          }
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
              fromDelta = convertUIIndexToDelta(selectedSquares[0]),
              toDelta = convertUIIndexToDelta(selectedSquares[1]);

//            console.log('Move delta: '
//                + ($scope.yourPlayerIndex === 0 ? 'Black' : 'White')
//                + ' Move from [' + fromDelta.row + ', ' + fromDelta.col
//                + '] to [' + toDelta.row + ', ' + toDelta.col + ']');

            try {
              operations = checkersLogicService
                  .createMove(angular.copy(board),
                  fromDelta, toDelta, $scope.yourPlayerIndex);
            } catch (e) {
              return;
            }

            gameService.makeMove(operations);
          });
        }

        /**
         * Select a piece, change the validation of all squares accordingly and
         * send the move if the move is complete and valid.
         *
         * @param index the piece selected.
         * @param isDnD is drag and drop or is not
         */
        $scope.cellClicked = function (row, col, isDnD) {
          if ($scope.rotate) {
            row = 7 - row;
            col = 7 - col;
          }

          var UISquareIndex = row * CONSTANT.ROW + col,
            UISquare = $scope.uiState[UISquareIndex],
            currSelectedDelta = convertUIIndexToDelta(UISquareIndex),
            prevSelectedDelta;

          //$scope.isYourTurn = false; // to prevent making another move

          // Proceed only if it's dark square and it's selectable.
          if (UISquare.isDark && UISquare.canSelect) {
            if (selectedSquares.length === 0 && !UISquare.isEmpty) {
              // If no piece is selected, select it
              UISquare.isSelected = true;
              selectedSquares[0] = UISquareIndex;

              setSelectableSquares(UISquareIndex);
            } else if (selectedSquares.length === 1) {
              // One square is already selected
              prevSelectedDelta = convertUIIndexToDelta(selectedSquares[0]);
              if (checkersLogicService
                  .getColor(board[currSelectedDelta.row][currSelectedDelta.col])
                  === checkersLogicService.getColor(
                    board[prevSelectedDelta.row][prevSelectedDelta.col]
                  )) {
                // It the second selected piece is still the player's, no matter
                // it's the same one or a different one, just change the first
                // selected square to the new one.
                $scope.uiState[selectedSquares[0]].isSelected = false;
                UISquare.isSelected = true;
                selectedSquares[0] = UISquareIndex;

                // Set the new selectable squares according to the selected one
                setSelectableSquares(UISquareIndex);

              } else if (UISquare.isEmpty) {
                // If the second selected is an empty square
                selectedSquares[1] = UISquareIndex;
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
            var delta = convertUIIndexToDelta(index);
            // Since the index/id passed in maybe changed if the board is
            // rotated... so I have to change them back because cellClicked will
            // process them one more time... This is unnecessary and will be
            // refactored in the future... (I guess)
            if ($scope.rotate) {
              delta.row = 7 - delta.row;
              delta.col = 7 - delta.col;
            }
            $scope.cellClicked(delta.row, delta.col, isDnD);
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
            var delta = convertUIIndexToDelta(index);
            // Since the index/id passed in maybe changed if the board is
            // rotated... so I have to change them back because cellClicked will
            // process them one more time... This is unnecessary and will be
            // refactored in the future... (I guess)
            if ($scope.rotate) {
              delta.row = 7 - delta.row;
              delta.col = 7 - delta.col;
            }
            $scope.cellClicked(delta.row, delta.col, isDnD);
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
            //maxDepth = 10,
            timeLimit = 1000;

          bestMove = checkersNewAiService.
              createComputerMove(board, $scope.yourPlayerIndex,
              // 1 seconds for the AI to choose a move
              {millisecondsLimit: timeLimit});

          // Instead of making the move directly, use makeMove function instead.
          var from = bestMove[bestMove.length - 2];
          var to = bestMove[bestMove.length - 1];
          selectedSquares = [
              $scope.convertDeltaToUIIndex(from.set.value.row, from.set.value.col),
              $scope.convertDeltaToUIIndex(to.set.value.row, to.set.value.col)
            ];
          makeMove(isDnD);

          //  var timer = {
          //    startTime: Date.now(),
          //    timeLimit: timeLimit
          //  };
          //
          //// Move on only after the best move is calculated.
          //checkersAiService.
          //    findBestMove(angular.copy(board),
          //    $scope.yourPlayerIndex, maxDepth, timer)
          //    .then(function (data) {
          //    bestMove = data;
          //    // Set the selected squares according to the best move.
          //    selectedSquares = [
          //      $scope.convertDeltaToUIIndex(bestMove[0].row, bestMove[0].col),
          //      $scope.convertDeltaToUIIndex(bestMove[1].row, bestMove[1].col)
          //    ];
          //    makeMove(isDnD);
          //  });
        }

        /**
         * This method update the game's UI.
         * @param params
         */
        function updateUI(params) {
          // If the play mode is not pass and play then "rotate" the board
          // for the player. Therefore the board will always look from the
          // point of view of the player in single player mode...
          if (params.playMode === "playAgainstTheComputer"
              || params.playMode === "passAndPlay"
              || params.playMode === "playBlack") {
            $scope.rotate = true;
          } else {
            $scope.rotate = false;
          }

          // Get the new state
          var turnIndexBeforeMove = params.turnIndexBeforeMove;
          $scope.yourPlayerIndex = params.yourPlayerIndex;
          $scope.playersInfo = params.playersInfo;
          board = params.stateAfterMove.board;

          if (params.stateAfterMove.board === undefined) {
            console.log("initializing...");

            // Initialize the board...
            board = checkersLogicService.getInitialBoard();
            initializeUiState();
            updateUiState(setInitialSelectableSquares);
            $scope.yourPlayerIndex = 0;
          } else {
            // It's your move. (For the current browser...)
            $scope.isYourTurn = params.turnIndexAfterMove >= 0
                && params.yourPlayerIndex === params.turnIndexAfterMove;

            // You're a human player
            $scope.isPlayerMove = $scope.isYourTurn
                && params.playersInfo[params.yourPlayerIndex].playerId !== '';

            // You're an AI player
            $scope.isAiMove = $scope.isYourTurn
                && params.playersInfo[params.yourPlayerIndex].playerId === '';

            // The game is properly initialized, let's make a move :)
            // But first update the graphics (isAiMove: true)
            updateCheckersGraphics($scope.isAiMove, function () {
              // If it's the AI mode and it's the AI turn, then wait 500
              // milliseconds until animation ends.
                $timeout(aiMakeMove, 500);
            });
          }
        }

        // Before getting any updateUI, we show an empty board to a viewer (so you can't perform moves).
        updateUI({playMode: "passAndPlay", stateAfterMove: {}, turnIndexAfterMove: 0, yourPlayerIndex: -2});

        resizeGameAreaService.setWidthToHeight(1);

        /**
         * Set the game!
         */
        gameService.setGame({
          gameDeveloperEmail: "yl1949@nyu.edu",
          minNumberOfPlayers: 2,
          maxNumberOfPlayers: 2,
          //exampleGame: checkersLogicService.getExampleGame(),
          //riddles: checkersLogicService.getRiddles(),
          isMoveOk: checkersLogicService.isMoveOk,
          updateUI: updateUI
        });
      }]);
}());