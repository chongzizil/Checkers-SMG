/**
 * This is the controller for the game Checkers.
 *
 * TO be clear, the state has two different format in the controller:
 * 1. uiState is the controller state represented as an array of objects.
 *    Each element is a square which contains all the information necessary.
 *    Unlike the game API state, All light squares and dark squares are stored.
 *    e.g. {
 *           isBlackMan: false,
 *           isBlackCro: false,
 *           isWhiteMan: false,
 *           isWhiteCro: false,
 *           isEmpty: false,
 *           isDark: false,
 *           isLight: false,
 *           canSelect: false,
 *           isSelected: false,
 *         }
 * 2. GameApiState is the game API state represented as an object.
 *    A key and value pair represents the square index and the piece itself.
 *    Only the dark squares are contained.
 *    e.g. {"0": "EMPTY, "1": "WMAN"}
 */

checkers.controller('CheckersCtrl',
    ['$scope', '$animate', '$timeout', '$location', 'checkersLogicService',
      'checkersAiService', function ($scope, $animate, $timeout, $location, checkersLogicService, checkersAiService) {
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
        selectedPiece = [];

      /**
       * Convert the game API state to the UI state. The ui state contains
       * all 64 square objects as below:
       * {
         *   isBlackMan: false,
         *   isBlackCro: false,
         *   isWhiteMan: false,
         *   isWhiteCro: false,
         *   isEmpty: false,
         *   isDark: false,
         *   isLight: false,
         *   canSelect: false,
         *   isSelected: false,
         * }
       *
       * @param state the game API state
       * @returns {Array} the UI state
       */
      var convertStateToUiState = function (state) {
        var uiState = [],
          gameApiSquare,
          lightUiSquare,
          darkUiSquare,
          defaultUiSquare = {
            isBlackMan: false,
            isBlackCro: false,
            isWhiteMan: false,
            isWhiteCro: false,
            isEmpty: false,
            isDark: false,
            isLight: false,
            canSelect: false,
            isSelected: false,
            // Background image path
            bgSrc: '',
            // Piece image path
            src: ''
          };

        for (var i = 0; i < checkersLogicService.CONSTANT.get('ROW') *
            checkersLogicService.CONSTANT.get('COLUMN'); i += 1) {

          gameApiSquare = state[i];
          darkUiSquare = checkersLogicService.cloneObj(defaultUiSquare);
          lightUiSquare = checkersLogicService.cloneObj(defaultUiSquare);

          darkUiSquare.isDark = true;
          darkUiSquare.bgSrc = 'img/dark_square.png';

          lightUiSquare.isLight = true;
          lightUiSquare.isEmpty = true;
          lightUiSquare.src = 'img/empty';
          lightUiSquare.bgSrc = 'img/light_square.png';

          switch (gameApiSquare) {
            case 'WMAN':
              darkUiSquare.isWhiteMan = true;
              darkUiSquare.src = 'img/white_man';
              break;
            case 'WCRO':
              darkUiSquare.isWhiteCro = true;
              darkUiSquare.src = 'img/white_cro';
              break;
            case 'BMAN':
              darkUiSquare.isBlackMan = true;
              darkUiSquare.src = 'img/black_man';
              break;
            case 'BCRO':
              darkUiSquare.isBlackCro = true;
              darkUiSquare.src = 'img/black_cro';
              break;
            default:
              darkUiSquare.isEmpty = true;
              darkUiSquare.src = 'img/empty';
          }

          if (Math.floor(i / CONSTANT.get('COLUMN')) % 2 === 0) {
            // EVEN

            uiState.push(lightUiSquare);
            uiState.push(darkUiSquare);
          } else {
            // ODD

            uiState.push(darkUiSquare);
            uiState.push(lightUiSquare);
          }
        }

        return uiState;
      };

      /**
       * Update the graphics by convert the game API state to UI state and
       * set initial selectable squares.
       */
      var updateCheckersGraphics = function () {
        $scope.uiState = convertStateToUiState(state);
        // If the state is not empty, then set the initial selectable squares.
        if (!checkersLogicService.isEmptyObj(state)) {
          setInitialSelectableSquares(yourPlayerIndex);
        }
      };

      /**
       * For each piece, set its property 'canSelect' to true only if it can
       * makes a simple move or jump move.
       */
      var setInitialSelectableSquares = function () {
        var square,
            possibleMoves,
            hasMandatoryJump = checkersLogicService.checkMandatoryJump(state,
                yourPlayerIndex);

        // Check all dark squares
        for (var i = 0; i < checkersLogicService.CONSTANT.get('ROW') *
            checkersLogicService.CONSTANT.get('COLUMN'); i += 1) {

          if (Math.floor(i / CONSTANT.get('COLUMN')) % 2 === 0) {
            // EVEN
            square = $scope.uiState[2 * i + 1];
          } else {
            // ODD
            square = $scope.uiState[2 * i];
          }

          // If there exists a piece within the square and is the current
          // player's color, then check if it can make a move, otherwise set
          // it's 'canSelect' property to false.
          if (checkersLogicService
              .checkTurnIndexMatchesPieceColor(yourPlayerIndex,
              state[i].substr(0, 1)))
          {
            // If there's at least one mandatory, then check only the possible
            // jump moves of that square.
            if (hasMandatoryJump) {
              possibleMoves = checkersLogicService.getJumpMoves(state,
                  i, yourPlayerIndex);
            } else {
              possibleMoves = checkersLogicService.getSimpleMoves(state,
                  i, yourPlayerIndex);
            }

            // If there's at least one possible move, then the square can be
            // select.
            if (possibleMoves.length > 0) {
              square.canSelect = true;
            } else {
              square.canSelect = false;
            }
          } else {
            square.canSelect = false;
          }
        }
      };

      /**
       * Set all squares unselectable.
       */
      var setAllSquareUnselectable = function () {
        for (var i = 0; i < checkersLogicService.CONSTANT.get('ROW') *
            checkersLogicService.CONSTANT.get('COLUMN') * 2; i += 1) {
          $scope.uiState[i].canSelect = false;
        }
      };

      /**
       * If the select is by clicking, then set the possible move destination
       * squares' canSelect to true and others remain the same.
       * If the select is by DnD, then all other original selectable squares
       * are disabled. If the piece is dropped at an illegal place, then
       * reinitialize the selectable squares.
       *
       * @param squareIndex the square selected.
       * @param isDnd true if the select is done by drag and drop.
       */
      var setSelectableSquares = function (squareIndex, isDnd) {
        var checkersState =
            checkersLogicService.convertGameApiStateToCheckersState(state);
        var possibleMoves = checkersLogicService.getAllPossibleMoves(
            checkersState, Math.floor(squareIndex / 2), yourPlayerIndex);

        if (possibleMoves.length > 0) {
          // If the possible moves are jump moves, then only keep the
          // destination square indexes.
          if (typeof possibleMoves[0] !== 'number') {
            for (var i = 0; i < possibleMoves.length; i++) {
              possibleMoves[i] = possibleMoves[i][1];
            }
          }

          // If the move is made by drag and drop, then previous all
          // selectable squares are changed to unselectable. Hence the
          // dragged piece can not be dropped on the illegal squares
          if (isDnd) {
            setAllSquareUnselectable();
          }

          // Set all possible move destination squares to be selectable
          for (var i = 0; i < possibleMoves.length; i++) {
            if (Math.floor(possibleMoves[i] / CONSTANT.get('COLUMN')) % 2 === 0) {
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
       * @param selectedPiece the selected pieces.
       */
      var addAnimationClass = function (selectedPiece) {
        var fromUiIndex = selectedPiece[0];
        var toUiIndex = selectedPiece[1];
        var column = checkersLogicService.CONSTANT.get('COLUMN') * 2;
        var jumpedIndex = checkersLogicService.calculateJumpedIndex(
            Math.floor(fromUiIndex / 2), Math.floor(toUiIndex / 2));
        var jumpedUiIndex = -1;

        // Get the jumped square's index. If it's a simple move, then this
        // index is illegal yet will not be used.
        if (Math.floor(jumpedIndex /
            checkersLogicService.CONSTANT.get('COLUMN')) % 2 === 0) {
          // EVEN
          jumpedUiIndex = jumpedIndex * 2 + 1;
        } else {
          // ODD
          jumpedUiIndex = jumpedIndex * 2;
        }

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
       * Make the move by first playing the sound effect, then send the
       * corresponding operations to the makeMoveCallback.
       *
       * @param fromUiIndex the UI index of the from piece
       * @param toUiIndex the UI index of the to piece
       */
      var makeMove = function (fromUiIndex, toUiIndex) {
        var moveAudio = new Audio('audio/move.mp3');
        var jumpAudio = new Audio('audio/jump.mp3');
        var column = checkersLogicService.CONSTANT.get('COLUMN');

        console.log('Move from ' + fromUiIndex + ' to ' + toUiIndex);
        var fromIndex = Math.floor(fromUiIndex / 2);
        var toIndex = Math.floor(toUiIndex / 2);
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
      $scope.pieceSelected = function (index) {
//        console.log(index + ' isSelected.');
        var operations = [],
            square = $scope.uiState[index],
            isDnd = false;

        // Proceed only if it's dark square and it's selectable.
        if (square.isDark && square.canSelect) {
          if (selectedPiece.length === 0) {
            square.isSelected = true;
            selectedPiece[0] = index;
            setSelectableSquares(index, isDnd);
          } else if (selectedPiece.length === 1) {
            if (state[Math.floor(index / 2)].substr(0, 1) ===
                state[Math.floor(selectedPiece[0] / 2)].substr(0, 1)) {
              // If it's own color piece, then simply change the selected
              // piece to this new one
              $scope.uiState[selectedPiece[0]].isSelected = false;
              square.isSelected = true;
              selectedPiece[0] = index;
              setSelectableSquares(index, isDnd);
            } else {
              selectedPiece[1] = index;
            }
          }

          if (selectedPiece.length === 2) {
            $scope.uiState[selectedPiece[0]].isSelected = false;


            // Do the animation
            addAnimationClass(selectedPiece);

            var delayMakeMove = function () {
              makeMove(selectedPiece[0], selectedPiece[1])
            };

            // After the animation finishes, now makes the move.
            $timeout(delayMakeMove, 600);
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
            isDnd = true;
        if (square.isDark && square.canSelect) {
          setSelectableSquares(index, isDnd);
          selectedPiece[0] = index;
        }
      };

      /**
       * Handle the drop event, which select the piece being dropped on and
       * makes the move without animation.
       *
       * @param index the index of the dropped on piece
       */
      $scope.handleDrop = function (index) {
        var square = $scope.uiState[index];
        if (square.isDark && square.canSelect) {
          selectedPiece[1] = index;
          makeMove(selectedPiece[0], selectedPiece[1]);
        } else {
          // The target is not drappable, therefore clean the selectedPiece so
          // the player may drag another one.
          setInitialSelectableSquares(yourPlayerIndex);
          selectedPiece = [];
        }
      };

      var convertGameApiIndexToUiIndex = function (gameApiIndex) {
        if (Math.floor(gameApiIndex / checkersLogicService.CONSTANT.get('COLUMN')) % 2 === 0) {
          // Even row
          return gameApiIndex * 2 + 1;
        } else {
          // Odd row
          return gameApiIndex * 2;
        }
      };

      var game = (function () {
        function getGameDeveloperEmail() {
          return "chongzizil@gmail.com";
        }

        /**
         * This method update the game's UI.
         * @param match
         */
        function updateUI(match) {
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
          selectedPiece = [];

          // Give it a time to between the move of player and ai...
          $timeout(function () {
          }, 50);

          state = stateAfterMove;
          updateCheckersGraphics();

          // In case the ui is not updated
          if (!$scope.$$phase) {
            $scope.$apply();
          }

          // If the state is empty and the player is white
          // send the initial move.
          if (checkersLogicService.isEmptyObj(stateAfterMove) &&
              turnIndexBeforeMove === 0) {
            makeMoveCallback(checkersLogicService.getInitialMove());
          }

          // If it's the AI mode and it's the AI turn, then let the AI makes
          // the move.
          if ($location.url() === '/PlayAgainstTheComputer'
              && yourPlayerIndex === 1) {
            var depth = 8;
            var timeLimit = 800;
            var timer = {
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
                    addAnimationClass([fromUiIndex, toUiIndex]);
                  };

                  var delayMakeMove = function () {
                    makeMove(fromUiIndex, toUiIndex);
                  };

                  // It seem a little delay will fix the animation bug...
                  $timeout(delayAnimation, 1);

                  // After the animation finishes, now makes the move.
                  $timeout(delayMakeMove, 600);
                });
          }
        };

        return {
          getGameDeveloperEmail: getGameDeveloperEmail,
          isMoveOk: checkersLogicService.isMoveOk,
          updateUI: updateUI
        };
      })();

      $scope.newGame = function () {
        platform.setGame(game);
        platform.showUI({minNumberOfPlayers: 2, maxNumberOfPlayers: 2});
      };
      $scope.newGame();
    }]);