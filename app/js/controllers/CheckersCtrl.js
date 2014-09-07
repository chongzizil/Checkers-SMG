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
 *    e.g. [{
 *            isBlackMan: boolean,
 *            isBlackCro: boolean,
 *            isWhiteMan: boolean,
 *            isWhiteCro: boolean,
 *            isEmpty: boolean,
 *            isDark: boolean,
 *            isLight: boolean,
 *            canSelect: boolean,
 *            isSelected: boolean,
 *            // Background image path
 *            bgSrc: string,
 *            // Piece image path
 *            pieceSrc: string
 *         }...]
 *
 * 2. GameApiState: It's represented as an object with size equals to 32. Each
 *                  key and value pair represents a dark square index (0 - 31)
 *                  and the content within it.
 *    e.g. {0: "BMAN, ..., 12: "EMPTY", 20: "WMAN", ...}
 */

checkers.controller('CheckersCtrl',
    ['$scope', '$animate', '$timeout', '$location', '$q', 'checkersLogicService', 'checkersAiService', 'constantService', function ($scope, $animate, $timeout, $location, $q, checkersLogicService, checkersAiService, constantService) {
      var CONSTANT = constantService;
      var yourPlayerIndex,
        makeMoveCallback,
        turnIndexBeforeMove,
        turnIndexAfterMove,
        stateBeforeMove,
        stateAfterMove,
        endMatchScores,
        endMatchReason,
        playersInfo,
        state = {},
        selectedSquares = [];

      /**
       * Update the square of the UI state according to the new square of
       * the game API state in order to update the graphics.
       *
       * @param gameApiSquare the square of the game API state.
       * @param uiSquare the square of the UI state.
       */
      var updateUiSquare = function (gameApiSquare, uiSquare) {
        // Reset the information of the content within the square
        uiSquare.isEmpty = false;
        uiSquare.isBlackMan = false;
        uiSquare.isBlackCro = false;
        uiSquare.isWhiteMan = false;
        uiSquare.isWhiteCro = false;
        uiSquare.canSelect = false;
        uiSquare.isSelected = false;

        switch (gameApiSquare) {
          case 'WMAN':
            uiSquare.isWhiteMan = true;
            uiSquare.pieceSrc = 'img/white_man';
            break;
          case 'WCRO':
            uiSquare.isWhiteCro = true;
            uiSquare.pieceSrc = 'img/white_cro';
            break;
          case 'BMAN':
            uiSquare.isBlackMan = true;
            uiSquare.pieceSrc = 'img/black_man';
            break;
          case 'BCRO':
            uiSquare.isBlackCro = true;
            uiSquare.pieceSrc = 'img/black_cro';
            break;
          default:
            uiSquare.isEmpty = true;
            uiSquare.pieceSrc = 'img/empty';
        }
      };

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
      var initializeUiState = function () {
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
          };

        // Each time initialize two square at once, one dark and one light
        for (var i = 0; i < CONSTANT.ROW *
            CONSTANT.COLUMN; i += 1) {

          darkUiSquare = checkersLogicService.cloneObj(defaultUiSquare);
          lightUiSquare = checkersLogicService.cloneObj(defaultUiSquare);

          // Set the dark square
          darkUiSquare.isDark = true;
          darkUiSquare.bgSrc = 'img/dark_square.png';

          // Set the light square
          lightUiSquare.isLight = true;
          lightUiSquare.bgSrc = 'img/light_square.png';
          // Since light square will not be used and clicked, no piece image
          // will be set for it.
          lightUiSquare.isEmpty = false;
          lightUiSquare.pieceSrc = '';

          // Push the light and dark squares into the ui state
          if (Math.floor(i / CONSTANT.COLUMN) % 2 === 0) {
            // EVEN ROW
            $scope.uiState[2 * i] = lightUiSquare;
            $scope.uiState[2 * i + 1] = darkUiSquare;
          } else {
            // ODD ROW
            $scope.uiState[2 * i + 1] = lightUiSquare;
            $scope.uiState[2 * i ] = darkUiSquare;
          }
        }
      };

      /**
       * Update the UI state after the last move.
       */
      var updateUiState = function () {
        var gameApiSquare,
          darkUiSquare;

        if (selectedSquares.length === 0) {
          // If the selectedSquares is empty, then the last move should be the
          // first move maded by the black player in order to initialize th
          // game. So update each dark squares.

          for (var i = 0; i < CONSTANT.ROW *
              CONSTANT.COLUMN; i += 1) {

            gameApiSquare = state[i];

            if (Math.floor(i / CONSTANT.COLUMN) % 2 === 0) {
              // EVEN
              darkUiSquare = $scope.uiState[2 * i + 1];
              updateUiSquare(gameApiSquare, darkUiSquare);
            } else {
              // ODD
              darkUiSquare = $scope.uiState[2 * i ];
              updateUiSquare(gameApiSquare, darkUiSquare);
            }
          }
        } else {
          // It's not the first move, so check the selectedSquares for the
          // squares need to be updated.

          // UI state index
          var fromUiIndex = selectedSquares[0];
          var toUiIndex = selectedSquares[1];
          var jumpedUiIndex = -1;

          // Game API state index
          var fromIndex = convertUiIndexToGameApiIndex(fromUiIndex);
          var toIndex = convertUiIndexToGameApiIndex(toUiIndex);

          // Get the jumped square's index. If it's a simple move, then this
          // index is illegal, yet will not be used.
          var jumpedIndex =
              checkersLogicService.getJumpedIndex(fromIndex, toIndex);

          updateUiSquare(state[fromIndex], $scope.uiState[fromUiIndex]);
          updateUiSquare(state[toIndex], $scope.uiState[toUiIndex]);
          if (jumpedIndex !== -1) {
            jumpedUiIndex = convertGameApiIndexToUiIndex(jumpedIndex);
            updateUiSquare(state[jumpedIndex], $scope.uiState[jumpedUiIndex]);
          }
        }
      };

      /**
       * Update the graphics (UI state) according to the new game API state and
       * set initial selectable squares.
       *
       * @param isAiMode true if it's in ai mode
       */
      var updateCheckersGraphics = function (isAiMode) {
        updateUiState();

        // If the state is not empty, then set the the selectablility for each
        // square.
        if (!checkersLogicService.isEmptyObj(state)) {
          if (isAiMode && yourPlayerIndex === 1) {
            // It's ai's turn, the player can not select any squares
            setAllSquareUnselectable();
          } else {
            // It's not in ai's mode or ai's turn, so set selectable
            // squares according to the player index.
            setInitialSelectableSquares(yourPlayerIndex);
          }
        }
      };

      /**
       * For each piece, set its property 'canSelect' to true only if it can
       * makes a jump move or a simple move if there's no mandatory jumps.
       */
      var setInitialSelectableSquares = function () {
        var darkUiSquare,
            possibleMoves,
            hasMandatoryJump = checkersLogicService.hasMandatoryJumps(state,
                yourPlayerIndex);

        // First reset all squares to unselectable.
        setAllSquareUnselectable();

        // Check all dark squares
        for (var i = 0; i < CONSTANT.ROW *
            CONSTANT.COLUMN; i += 1) {

          if (Math.floor(i / CONSTANT.COLUMN) % 2 === 0) {
            // EVEN
            darkUiSquare = $scope.uiState[2 * i + 1];
          } else {
            // ODD
            darkUiSquare = $scope.uiState[2 * i];
          }

          // If there exists a piece within the darkUiSquare and is the current
          // player's color, then check if it can make a move, otherwise set
          // it's 'canSelect' property to false.
          if (checkersLogicService
              .isOwnColor(yourPlayerIndex,
              state[i].substr(0, 1)))
          {
            // If there's at least one mandatory jump, then only check the
            // possible jump moves.
            if (hasMandatoryJump) {
              possibleMoves = checkersLogicService.getJumpMoves(state,
                  i, yourPlayerIndex);
            } else {
              possibleMoves = checkersLogicService.getSimpleMoves(state,
                  i, yourPlayerIndex);
            }

            // If there's at least one possible move, then the darkUiSquare can
            // be select.
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
      };

      /**
       * Set all squares unselectable.
       */
      var setAllSquareUnselectable = function () {
        for (var i = 0; i < CONSTANT.ROW *
            CONSTANT.COLUMN * 2; i += 1) {
          $scope.uiState[i].canSelect = false;
        }
      };

      /**
       * Set the possible move destination squares' canSelect to true and
       * others remain the same.
       *
       * @param squareUiIndex the square selected.
       */
      var setSelectableSquares = function (squareUiIndex) {
        var logicState =
            checkersLogicService.convertGameApiStateToLogicState(state);
        var possibleMoves =
            checkersLogicService.getAllPossibleMoves(logicState,
                convertUiIndexToGameApiIndex(squareUiIndex), yourPlayerIndex);

        if (possibleMoves.length > 0) {
          // If the possible moves are jump moves, then only keep the
          // destination square indexes.
          if (typeof possibleMoves[0] !== 'number') {
            // Jump move
            for (var i = 0; i < possibleMoves.length; i++) {
              possibleMoves[i] = possibleMoves[i][1];
            }
          }

          // Set all possible move destination squares to be selectable
          for (var i = 0; i < possibleMoves.length; i++) {
            if (Math.floor(possibleMoves[i] /
                CONSTANT.COLUMN) % 2 === 0)
            {
              // EVEN
              $scope.uiState[2 * possibleMoves[i] + 1].canSelect = true;
            } else {
              // ODD
              $scope.uiState[2 * possibleMoves[i]].canSelect = true;
            }
          }
        }
      };

      /**
       * Add animation class so the animation may be performed accordingly
       *
       * @param animationIndexes an object containing the necessary info for
       *          the animation. e.g.
       *          {
       *            column
       *            fromUiIndex
       *            toUiIndex
       *            jumpedUiIndex
       *          };
       */
      var addAnimationClass = function (animationIndexes) {
        var fromUiIndex = animationIndexes.fromUiIndex;
        var toUiIndex = animationIndexes.toUiIndex;
        var jumpedUiIndex = animationIndexes.jumpedUiIndex;
        var column = animationIndexes.column;
        // Add the corresponding animation class
        switch (toUiIndex - fromUiIndex) {
          case -column - 1:
            // Simple move up left
            $animate.addClass($('#' + fromUiIndex), 'move_up_left');
            break;
          case -column + 1:
            // Simple move up right
            $animate.addClass($('#' + fromUiIndex), 'move_up_right');
            break;
          case column - 1:
            // Simple move down left
            $animate.addClass($('#' + fromUiIndex), 'move_down_left');
            break;
          case column + 1:
            // Simple move down right
            $animate.addClass($('#' + fromUiIndex), 'move_down_right');
            break;
          case -(2 * column) - 2:
            // Jump move up left
            $animate.addClass($('#' + jumpedUiIndex), 'jumped');
            $animate.addClass($('#' + fromUiIndex), 'jump_up_left');
            break;
          case -(2 * column) + 2:
            // Jump move up right
            $animate.addClass($('#' + jumpedUiIndex), 'jumped');
            $animate.addClass($('#' + fromUiIndex), 'jump_up_right');
            break;
          case (2 * column) - 2:
            // Jump move down left
            $animate.addClass($('#' + jumpedUiIndex), 'jumped');
            $animate.addClass($('#' + fromUiIndex), 'jump_down_left');
            break;
          case (2 * column) + 2:
            // Jump move down right
            $animate.addClass($('#' + jumpedUiIndex), 'jumped');
            $animate.addClass($('#' + fromUiIndex), 'jump_down_right');
            break;
        }
      };

      /**
       * remove animation class when the animation finishes.
       *
       * @param animationIndexes an object containing the necessary info for
       *          the animation. e.g.
       *          {
       *            column
       *            fromUiIndex
       *            toUiIndex
       *            jumpedUiIndex
       *          };
       */
      var removeAnimationClass = function (animationIndexes) {
        var fromUiIndex = animationIndexes.fromUiIndex;
        var toUiIndex = animationIndexes.toUiIndex;
        var jumpedUiIndex = animationIndexes.jumpedUiIndex;
        var column = animationIndexes.column;
        // remove the corresponding animation class
        switch (toUiIndex - fromUiIndex) {
          case -column - 1:
            // Simple move up left
            $animate.removeClass($('#' + fromUiIndex), 'move_up_left');
            break;
          case -column + 1:
            // Simple move up right
            $animate.removeClass($('#' + fromUiIndex), 'move_up_right');
            break;
          case column - 1:
            // Simple move down left
            $animate.removeClass($('#' + fromUiIndex), 'move_down_left');
            break;
          case column + 1:
            // Simple move down right
            $animate.removeClass($('#' + fromUiIndex), 'move_down_right');
            break;
          case -(2 * column) - 2:
            // Jump move up left
            $animate.removeClass($('#' + jumpedUiIndex), 'jumped');
            $animate.removeClass($('#' + fromUiIndex), 'jump_up_left');
            break;
          case -(2 * column) + 2:
            // Jump move up right
            $animate.removeClass($('#' + jumpedUiIndex), 'jumped');
            $animate.removeClass($('#' + fromUiIndex), 'jump_up_right');
            break;
          case (2 * column) - 2:
            // Jump move down left
            $animate.removeClass($('#' + jumpedUiIndex), 'jumped');
            $animate.removeClass($('#' + fromUiIndex), 'jump_down_left');
            break;
          case (2 * column) + 2:
            // Jump move down right
            $animate.removeClass($('#' + jumpedUiIndex), 'jumped');
            $animate.removeClass($('#' + fromUiIndex), 'jump_down_right');
            break;
        }
      };

      /**
       * Calculate the indexes for play the animation first, an then add the
       * proper animation class to the proper squares in order to play the
       * animation.
       *
       * @param selectedPiece the selected pieces as an array
       */
      var playAnimation = function(selectedPiece) {
        // Disable all squares, so the player can not click anything squares
        // during the animation which may cause errors.
        setAllSquareUnselectable();
        $scope.animationIndexes = {
          column: CONSTANT.COLUMN * 2,
          fromUiIndex: selectedPiece[0],
          toUiIndex: selectedPiece[1],
          jumpedUiIndex: -1
        };

        var jumpedIndex = checkersLogicService.getJumpedIndex(
            Math.floor($scope.animationIndexes.fromUiIndex / 2),
            Math.floor($scope.animationIndexes.toUiIndex / 2)
        );

        // Get the jumped square's index. If it's a simple move, then this
        // index is illegal yet will not be used.
        if (Math.floor(jumpedIndex /
            CONSTANT.COLUMN) % 2 === 0) {
          // EVEN
          $scope.animationIndexes.jumpedUiIndex = jumpedIndex * 2 + 1;
        } else {
          // ODD
          $scope.animationIndexes.jumpedUiIndex = jumpedIndex * 2;
        }

        // Add the animation class
        addAnimationClass($scope.animationIndexes);
      };

      /**
       * Make the move by first playing the sound effect, then send the
       * corresponding operations to the makeMoveCallback.
       *
       * @param fromUiIndex the UI index of the from piece
       * @param toUiIndex the UI index of the to piece
       */
      var makeMove = function (fromUiIndex, toUiIndex, isDnD) {
        if (!isDnD) {
          // Remove the animation class first, otherwise the square image
          // will stayed at the same position after the animation.
          removeAnimationClass($scope.animationIndexes);
        }

        var moveAudio = new Audio('audio/move.mp3');
        var jumpAudio = new Audio('audio/jump.mp3');
        var column = CONSTANT.COLUMN;

        var fromIndex = Math.floor(fromUiIndex / 2);
        var toIndex = Math.floor(toUiIndex / 2);

//        console.log('Game API index: '
//            + (yourPlayerIndex === 0 ? 'Black' : 'White')
//            + ' Move from ' + fromUiIndex + ' to ' + toUiIndex);
        console.log('Traditional index: '
            + (yourPlayerIndex === 0 ? 'Black' : 'White')
            + ' Move from ' + (fromIndex + 1) + ' to ' + (toIndex + 1));

        var operations = checkersLogicService.getExpectedOperations(state,
            fromIndex, toIndex, yourPlayerIndex);

        if ([column - 1, column, column + 1].
            indexOf(Math.abs(toIndex - fromIndex)) !== -1) {
          // Simple move
          moveAudio.play();
        } else {
          // Jump move
          jumpAudio.play();
        }

        makeMoveCallback(operations);
      };

      /**
       * Select a piece, change the validation of all squares accordingly and
       * send the move if the move is complete and valid.
       *
       * @param index the piece selected.
       */
      $scope.pieceSelected = function (index, isDnD) {
//        console.log(index + ' isSelected.');
        var operations = [],
            square = $scope.uiState[index];

        // Proceed only if it's dark square and it's selectable.
        if (square.isDark && square.canSelect) {
          if (selectedSquares.length === 0 && !square.isEmpty) {
            // If no piece is selected, select it
            square.isSelected = true;
            selectedSquares[0] = index;

            setSelectableSquares(index);
          } else if (selectedSquares.length === 1) {
            // One square is already selected
            if (state[Math.floor(index / 2)].substr(0, 1) ===
                state[Math.floor(selectedSquares[0] / 2)].substr(0, 1)) {
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

            // Play the animation if the move is not done by drag and drop
            if (!isDnD) {
              playAnimation(selectedSquares);

              var delayMakeMove = function () {
                makeMove(selectedSquares[0], selectedSquares[1], isDnD);
              };

              $timeout(delayMakeMove, 420);
            } else {
              makeMove(selectedSquares[0], selectedSquares[1], isDnD);
            }
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
//          setSelectableSquares(index, isDnD);
//          selectedSquares[0] = index;
//          console.log(selectedSquares);
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
       * Convert the game API index (0 - 31) to the UI state index (0 - 63).
       * @param gameApiIndex the game API index
       * @returns {number} the ui state index
       */
      var convertGameApiIndexToUiIndex = function (gameApiIndex) {
        if (Math.floor(gameApiIndex
            / CONSTANT.COLUMN) % 2 === 0) {
          // Even row
          return gameApiIndex * 2 + 1;
        } else {
          // Odd row
          return gameApiIndex * 2;
        }
      };

      /**
       * Convert the UI state index (0 - 63) to the game API index (0 - 31).
       * @param the UI state index
       * @returns {number} the game API index
       */
      var convertUiIndexToGameApiIndex = function (uiIndex) {
        return Math.floor(uiIndex / 2);
      };

      /**
       * This function use the alpha beta pruning algorithm to calculate a best
       * move for the ai, then make the move and play the animation and sound
       * effect.
       */
      var aiMakeMove = function() {
        var isDnD = false,
          depth = 10,
          timeLimit = 800,
          timer = {
            startTime: Date.now(),
            timeLimit: timeLimit
          };

        // Move on only after the best move is calculated.
        checkersAiService.
            findBestMove(state, yourPlayerIndex, depth, timer)
            .then(function (data) {
              var bestMove = data;
              var fromUiIndex =
                  convertGameApiIndexToUiIndex(bestMove.fromIndex);
              var toUiIndex =
                  convertGameApiIndexToUiIndex(bestMove.toIndex);

              var delayAnimation = function () {
                playAnimation([fromUiIndex, toUiIndex]);
              };

              var delayMakeMove = function () {
                makeMove(fromUiIndex, toUiIndex, isDnD);
              };

              // It seems a little delay will fix the animation bug...
              $timeout(delayAnimation, 1);

              // Makes the move only when the animation finishes
              $timeout(delayMakeMove, 420);
            });
      };

      var game = (function () {
        function getGameDeveloperEmail() {
          return "yl1949@nyu.edu";
        }

        /**
         * This method update the game's UI.
         * @param match
         */
        function updateUI(match) {
          var isAiMode = $location.url() === '/PlayAgainstTheComputer';

          yourPlayerIndex = match.yourPlayerIndex;
          makeMoveCallback = match.makeMoveCallback;
          turnIndexBeforeMove = match.turnIndexBeforeMove;
          turnIndexAfterMove = match.turnIndexAfterMove;
          stateBeforeMove = match.stateBeforeMove;
          stateAfterMove = match.stateAfterMove;
          endMatchScores = match.endMatchScores;
          endMatchReason = match.endMatchReason;
          playersInfo = match.playersInfo;

          $scope.yourPlayerIndex = yourPlayerIndex;
          $scope.playersInfo = playersInfo;

          // Get the new state
          state = stateAfterMove;
          // Update the graphics
          updateCheckersGraphics(isAiMode);

          // Initialize the selectedSquares in each turn
          selectedSquares = [];

          // In case the board is not updated
          if (!$scope.$$phase) {
            $scope.$apply();
          }

          // If the state is empty and the player is black,
          // send the initial move to initialize the game board.
          if (checkersLogicService.isEmptyObj(stateAfterMove) &&
              turnIndexBeforeMove === 0) {
            makeMoveCallback(checkersLogicService.getFirstMove());
          }

          // If it's the AI mode and it's the AI turn, then let the AI makes
          // the move.
          if (isAiMode && yourPlayerIndex === 1) {
            // Give it a little time for completing the sound effect of
            // the player's move
            $timeout(aiMakeMove, 50);
          }
        };

        return {
          getGameDeveloperEmail: getGameDeveloperEmail,
          isMoveOk: checkersLogicService.isMoveOk,
          updateUI: updateUI
        };
      })();

      /**
       * A function to start a new game.
       */
      $scope.newGame = function () {
        // Initialize the empty game board first
        initializeUiState();
        // Set the game
        platform.setGame(game);
        platform.showUI({minNumberOfPlayers: 2, maxNumberOfPlayers: 2});
      };

      // Play!
      $scope.newGame();
    }]);