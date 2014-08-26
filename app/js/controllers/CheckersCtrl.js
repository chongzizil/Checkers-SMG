checkers.controller('CheckersCtrl', ['$scope', '$animate', '$timeout', 'checkersLogicService', function ($scope, $animate, $timeout, checkersLogicService) {

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
   * Convert the game API state to the UI state. The ui state contains all 64
   * square objects as:
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
   *   row: -1,
   *   col: -1
   * }
   *
   * @param state the game API state
   * @returns {Array} the UI state
   */
  var convertStateToUiState = function (state) {
    var uiState = [],
      piece,
      lightSquare,
      darkSquare,
      square = {
        isBlackMan: false,
        isBlackCro: false,
        isWhiteMan: false,
        isWhiteCro: false,
        isEmpty: false,
        isDark: false,
        isLight: false,
        canSelect: false,
        isSelected: false,
        bgSrc: '',
        src: '',
        row: -1,
        col: -1
      };

    for (var i = 0; i < checkersLogicService.CONSTANT.get('ROW') *
        checkersLogicService.CONSTANT.get('COLUMN'); i += 1) {

      piece = state[i];
      darkSquare = checkersLogicService.cloneObj(square);
      lightSquare = checkersLogicService.cloneObj(square);

      darkSquare.isDark = true;
      darkSquare.bgSrc = 'img/dark_square.png';
      lightSquare.isLight = true;
      lightSquare.isEmpty = true;
      lightSquare.src = 'img/empty';
      lightSquare.bgSrc = 'img/light_square.png';

      switch(piece) {
        case 'WMAN':
          darkSquare.isWhiteMan = true;
          darkSquare.src = 'img/white_man';
          break;
        case 'WCRO':
          darkSquare.isWhiteCro = true;
          darkSquare.src = 'img/white_cro';
          break;
        case 'BMAN':
          darkSquare.isBlackMan = true;
          darkSquare.src = 'img/black_man';
          break;
        case 'BCRO':
          darkSquare.isBlackCro = true;
          darkSquare.src = 'img/black_cro';
          break;
        default:
          darkSquare.isEmpty = true;
          darkSquare.src = 'img/empty';
      }

      if (Math.floor(i / CONSTANT.get('COLUMN')) % 2 === 0) {
        // EVEN

        var darkSquareIndex = 2 * i;
        var lightSquareIndex = 2 * i + 1;
        darkSquare.row = Math.floor(darkSquareIndex /
            (checkersLogicService.CONSTANT.get('COLUMN') * 2));
        darkSquare.col = darkSquareIndex %
            (checkersLogicService.CONSTANT.get('COLUMN') * 2);
        lightSquare.row = Math.floor(lightSquareIndex /
            (checkersLogicService.CONSTANT.get('COLUMN') * 2));
        lightSquare.col = lightSquareIndex %
            (checkersLogicService.CONSTANT.get('COLUMN') * 2);

        uiState.push(darkSquare);
        uiState.push(lightSquare);
      } else {
        // ODD

        var darkSquareIndex = 2 * i + 1;
        var lightSquareIndex = 2 * i;
        darkSquare.row = Math.floor(darkSquareIndex /
            (checkersLogicService.CONSTANT.get('COLUMN') * 2));
        darkSquare.col = darkSquareIndex %
            (checkersLogicService.CONSTANT.get('COLUMN') * 2);
        lightSquare.row = Math.floor(lightSquareIndex /
            (checkersLogicService.CONSTANT.get('COLUMN') * 2));
        lightSquare.col = lightSquareIndex %
            (checkersLogicService.CONSTANT.get('COLUMN') * 2);

        uiState.push(lightSquare);
        uiState.push(darkSquare);
      }
    }

    return uiState;
  };

  /**
   * Update the graphics
   */
  var updateCheckersGraphics = function () {
    $scope.uiState = convertStateToUiState(state);
    if (!checkersLogicService.isEmptyObj(state)) {
      setInitialSelectableSquares(yourPlayerIndex);
    }
  };

  /**
   * For each piece, set its property 'canSelect' to true only if it is valid
   * to select.
   */
  var setInitialSelectableSquares = function () {
    var square,
      possibleMoves,
      hasMandatoryJump = checkersLogicService.checkMandatoryJump(state, yourPlayerIndex);

    for (var i = 0; i < checkersLogicService.CONSTANT.get('ROW') *
        checkersLogicService.CONSTANT.get('COLUMN'); i += 1) {

      if (Math.floor(i / CONSTANT.get('COLUMN')) % 2 === 0) {
        square = $scope.uiState[2 * i];
      } else {
        square = $scope.uiState[2 * i + 1];
      }
      if ((yourPlayerIndex === 0 && state[i].substr(0, 1) === 'W') ||
          (yourPlayerIndex === 1 && state[i].substr(0, 1) === 'B')) {

        if (hasMandatoryJump) {
          possibleMoves = checkersLogicService.getJumpMoves(state, i, yourPlayerIndex);
        } else {
          possibleMoves = checkersLogicService.getSimpleMoves(state, i, yourPlayerIndex);
        }

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
   * After one piece is selected, set 'canSelect' of all possible moves squares
   * and itself to true.
   *
   * @param pieceIndex the piece selected.
   */
  var setSelectableSquares = function (pieceIndex, isDnd) {
    var possibleMoves = checkersLogicService.getAllPossibleMoves(state, Math.floor(pieceIndex / 2), yourPlayerIndex);

    if (possibleMoves.length > 0) {
      if (typeof possibleMoves[0] !== 'number') {
        for (var i = 0; i < possibleMoves.length; i++) {
          possibleMoves[i] = possibleMoves[i][1];
        }
      }

      // If the move is made by drag and drop, then set 'canSelect' of the
      // dragged piece and all other selectable own pieces to be false, hence
      // the dragged piece can not be dropped on the illegal squares.
      if (isDnd) {
        setAllSquareUnselectable();
      } else {
        $scope.uiState[pieceIndex].canSelect = true;
      }

      for (var i = 0; i < possibleMoves.length; i++) {
        if (Math.floor(possibleMoves[i] / CONSTANT.get('COLUMN')) % 2 === 0) {
          // EVEN

          $scope.uiState[2 * possibleMoves[i]].canSelect = true;
        } else {
          // ODD
          $scope.uiState[2 * possibleMoves[i] + 1].canSelect = true;
        }
      }
    }
  };

  /**
   * Add animation class so the animation may be performed accordingly
   *
   * @param selectedPiece the selected pieces.
   */
  var addAnimationClass = function(selectedPiece) {
    var fromUiIndex = selectedPiece[0];
    var toUiIndex = selectedPiece[1];
    var column = checkersLogicService.CONSTANT.get('COLUMN') * 2;
    var jumpedIndex = checkersLogicService.calculateJumpedIndex(
        Math.floor(fromUiIndex / 2), Math.floor(toUiIndex / 2));
    var jumpedUiIndex = -1;

    if (Math.floor(jumpedUiIndex / checkersLogicService.CONSTANT.get('COLUMN')) % 2 === 0) {
      // EVEN
      jumpedUiIndex = jumpedIndex * 2;
    } else {
      // ODD
      jumpedUiIndex = jumpedIndex * 2 + 1;
    }

    switch (toUiIndex - fromUiIndex) {
      case -column - 1:
        // Simple move up left
        $animate.addClass($('#'+fromUiIndex), 'move_up_left');
        break;
      case -column + 1:
        // Simple move up right
        $animate.addClass($('#'+fromUiIndex), 'move_up_right');
        break;
      case column - 1:
        // Simple move down left
        $animate.addClass($('#'+fromUiIndex), 'move_down_left');
        break;
      case column + 1:
        // Simple move down right
        $animate.addClass($('#'+fromUiIndex), 'move_down_right');
        break;
      case -(2 * column) - 2:
        // Jump move up left
        $animate.addClass($('#'+fromUiIndex), 'jump_up_left');
        $animate.addClass($('#'+jumpedUiIndex), 'disappear');
        break;
      case -(2 * column) + 2:
        // Jump move up right
        $animate.addClass($('#'+fromUiIndex), 'jump_up_right');
        $animate.addClass($('#'+jumpedUiIndex), 'disappear');
        break;
      case (2 * column) - 2:
        // Jump move down left
        $animate.addClass($('#'+fromUiIndex), 'jump_down_left');
        $animate.addClass($('#'+jumpedUiIndex), 'disappear');
        break;
      case (2 * column) + 2:
        // Jump move down right
        $animate.addClass($('#'+fromUiIndex), 'jump_down_right');
        $animate.addClass($('#'+jumpedUiIndex), 'disappear');
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
  var makeMove = function(fromUiIndex, toUiIndex) {
    var moveAudio = new Audio('audio/move.mp3');
    var jumpAudio = new Audio('audio/jump.mp3');
    var column = checkersLogicService.CONSTANT.get('COLUMN');

    var fromIndex = Math.floor(fromUiIndex / 2);
    var toIndex = Math.floor(toUiIndex / 2);
    operations = checkersLogicService.getExpectedOperations(state, fromIndex, toIndex, yourPlayerIndex);

    if ([column - 1, column, column + 1].indexOf(Math.abs(toIndex - fromIndex)) !== -1) {
      // Simple move
      moveAudio.play();
    } else {
      // Jump move
      jumpAudio.play();
    }

    makeMoveCallback(operations);
  };

  /**
   * Select a piece, change the validation of all squares accordingly and send
   * the move if the move is complete and valid.
   *
   * @param index the piece selected.
   */
  $scope.pieceSelected = function (index) {
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
        if (state[Math.floor(index / 2)].substr(0, 1) === state[Math.floor(selectedPiece[0] / 2)].substr(0, 1)) {
          // If it's own color piece, then simply change the selected piece
          // to this new one
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


        //TODO: WHITE DISAPPEAR BUG
        addAnimationClass(selectedPiece);

        var delayMakeMove = function() {
          makeMove(selectedPiece[0], selectedPiece[1])
        };

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
    console.log("dragging");
    if (square.isDark && square.canSelect) {
      setSelectableSquares(index, isDnd);
      selectedPiece[0] = index;
    }
  };

  /**
   * Handle the drop event, which select the piece being dropped on and makes
   * the move without animation.
   *
   * @param index the index of the dropped on piece
   */
  $scope.handleDrop = function (index) {
    var square = $scope.uiState[index];
    console.log(square);
    console.log(square.canSelect);
    if (square.isDark && square.canSelect) {
      selectedPiece[1] = index;
      console.log(selectedPiece);
      makeMove(selectedPiece[0], selectedPiece[1]);
    } else {
      // The target is not drappable, therefore clean the selectedPiece so
      // the player may drag another one.
      setInitialSelectableSquares(yourPlayerIndex);
      selectedPiece = [];
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

      state = stateAfterMove;
      updateCheckersGraphics();

      // In case the ui is not updated
      if(!$scope.$$phase) {
        $scope.$apply();
      }

      // If the state is empty and the player is white, send the initial move.
      if (checkersLogicService.isEmptyObj(stateAfterMove) && turnIndexBeforeMove === 0) {
        makeMoveCallback(checkersLogicService.getInitialMove());
      }
    };

    return {
      getGameDeveloperEmail: getGameDeveloperEmail,
      isMoveOk: checkersLogicService.isMoveOk,
      updateUI: updateUI
    };
  })();
  platform.setGame(game);
  platform.showUI({minNumberOfPlayers: 2, maxNumberOfPlayers: 2});
}]);