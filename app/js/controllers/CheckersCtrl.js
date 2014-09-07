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
        // Initialize the selectedSquares first
        selectedSquares = [];

        // Update the board
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

      var getAnimationIndexes = function() {
        var fromUiIndex = selectedSquares[0],
            toUiIndex = selectedSquares[1],
            jumpedUiIndex = -1,
            jumpedIndex = checkersLogicService.getJumpedIndex(
                convertUiIndexToGameApiIndex(fromUiIndex),
                convertUiIndexToGameApiIndex(toUiIndex));

        // Get the jumped square's index. If it's a simple move, then this
        // index is illegal yet will not be used.
        if (Math.floor(jumpedIndex / CONSTANT.COLUMN) % 2 === 0) {
          // EVEN
          jumpedUiIndex = jumpedIndex * 2 + 1;
        } else {
          // ODD
          jumpedUiIndex = jumpedIndex * 2;
        }

        return {
          fromUiIndex: fromUiIndex,
          toUiIndex: toUiIndex,
          jumpedUiIndex: jumpedUiIndex,
          // The column is based on 8 x 8 UI state
          column: CONSTANT.COLUMN * 2
        }
      };

      /**
       * Add animation class so the animation may be performed accordingly
       *
       * @param callback makeMove function which will be called after the
       *                 animation is completed.
       */
      var addAnimationClass = function (callback) {
        var animationIndexes = getAnimationIndexes(),
            column = animationIndexes.column,
            fromUiIndex = animationIndexes.fromUiIndex,
            toUiIndex = animationIndexes.toUiIndex,
            jumpedUiIndex = animationIndexes.jumpedUiIndex;

        // Add the corresponding animation class
        switch (toUiIndex - fromUiIndex) {
          case -column - 1:
            // Simple move up left
            $animate.addClass($('#' + fromUiIndex), 'move_up_left', callback);
            break;
          case -column + 1:
            // Simple move up right
            $animate.addClass($('#' + fromUiIndex), 'move_up_right', callback);
            break;
          case column - 1:
            // Simple move down left
            $animate.addClass($('#' + fromUiIndex), 'move_down_left', callback);
            break;
          case column + 1:
            // Simple move down right
            $animate.addClass($('#' + fromUiIndex), 'move_down_right', callback);
            break;
          case -(2 * column) - 2:
            // Jump move up left
            $animate.addClass($('#' + jumpedUiIndex), 'jumped');
            $animate.addClass($('#' + fromUiIndex), 'jump_up_left', callback);
            break;
          case -(2 * column) + 2:
            // Jump move up right
            $animate.addClass($('#' + jumpedUiIndex), 'jumped');
            $animate.addClass($('#' + fromUiIndex), 'jump_up_right', callback);
            break;
          case (2 * column) - 2:
            // Jump move down left
            $animate.addClass($('#' + jumpedUiIndex), 'jumped');
            $animate.addClass($('#' + fromUiIndex), 'jump_down_left', callback);
            break;
          case (2 * column) + 2:
            // Jump move down right
            $animate.addClass($('#' + jumpedUiIndex), 'jumped');
            $animate.addClass($('#' + fromUiIndex), 'jump_down_right', callback);
            break;
        }
      };

      /**
       * remove animation class when the animation finishes.
       */
      var removeAnimationClass = function () {
        var animationIndexes = getAnimationIndexes(),
            column = animationIndexes.column,
            fromUiIndex = animationIndexes.fromUiIndex,
            toUiIndex = animationIndexes.toUiIndex,
            jumpedUiIndex = animationIndexes.jumpedUiIndex;

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
       * This function will play the animation by adding proper class to the
       * element if the move is not made by drag and drop. During the animation
       * all squares will also be set to unselectable.
       *
       * @param isDnD true if the move is made by drag and drop, otherwise false
       * @param callback makeMove function which will be called after the
       *                 animation is completed.
       */
      var playAnimation = function(isDnD, callback) {
        // Disable all squares, so the player can not click any squares before
        // the move is done and the board is updated.
        setAllSquareUnselectable();

        // If the move is made by drag and drop, just call the callback function
        if (isDnD) {
          callback();
          return;
        }

        // Add the animation class in order to play the animation
        addAnimationClass(callback);
      };

      /**
       * Make the move by first playing the sound effect, then send the
       * corresponding operations to the makeMoveCallback.
       *
       * @param isDnD true if the move is made by drag and drop, otherwise false
       */
      var makeMove = function (isDnD) {
        // Play the animation first!!!
        playAnimation(isDnD, function () {
          // Callback function. It's called when the animation is completed.

          var moveAudio,
              jumpAudio,
              column = CONSTANT.COLUMN,
              fromIndex = convertUiIndexToGameApiIndex(selectedSquares[0]),
              toIndex = convertUiIndexToGameApiIndex(selectedSquares[1]);

          console.log('Traditional index: '
              + (yourPlayerIndex === 0 ? 'Black' : 'White')
              + ' Move from ' + (fromIndex + 1) + ' to ' + (toIndex + 1));

          // Get the operations
          var operations = checkersLogicService.getExpectedOperations(state,
              fromIndex, toIndex, yourPlayerIndex);

          // Play the sound effect
          if ([column - 1, column, column + 1].
              indexOf(Math.abs(toIndex - fromIndex)) !== -1) {
            // Simple move
            moveAudio = new Audio('audio/move.mp3');
            moveAudio.play();
          } else {
            // Jump move
            jumpAudio = new Audio('audio/jump.mp3');
            jumpAudio.play();
          }

          // If the move is not made by drag and drop, then we need to remove
          // the animation class, otherwise the square image will stayed at the
          // same position after the animation.
          if (!isDnD) {
            // Remove the animation class first,
            removeAnimationClass();
          }

          makeMoveCallback(operations);
        });
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
              var bestMove = data,
                  sDnD = false;

              // Set the selected squares according to the best move.
              selectedSquares =[
                convertGameApiIndexToUiIndex(bestMove.fromIndex),
                convertGameApiIndexToUiIndex(bestMove.toIndex)
              ];

              makeMove(isDnD);
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

          if (checkersLogicService.isEmptyObj(stateAfterMove)
              && turnIndexBeforeMove === 0)
          {
            // If the state is empty and the player is black, the first player
            // with turn index 0 will make the first move to initialize the game.
            // Make the first move
            makeMoveCallback(checkersLogicService.getFirstMove());
          } else {
            // The game is properly initialized, let's make a move :)

            // Get the new state
            state = stateAfterMove;

            // Update the graphics
            updateCheckersGraphics(isAiMode);

            // In case the board is not updated
            if (!$scope.$$phase) {
              $scope.$apply();
            }

            // If it's the AI mode and it's the AI turn, then let the AI makes
            // the move.
            if (isAiMode && yourPlayerIndex === 1) {
              // Give it a little time for completing the sound effect of
              // the player's move
              $timeout(aiMakeMove, 50);
            }
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
    }]);