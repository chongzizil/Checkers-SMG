checkers.controller('CheckersCtrl', ['$scope', 'checkersLogicService', function ($scope, checkersLogicService) {

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
        row: -1,
        col: -1
      };

    // TODO: Be careful of empty state.
    for (var i = 0; i < checkersLogicService.CONSTANT.get('ROW') *
        checkersLogicService.CONSTANT.get('COLUMN'); i += 1) {

      piece = state[i];
      darkSquare = checkersLogicService.cloneObj(square);
      lightSquare = checkersLogicService.cloneObj(square);

      darkSquare.isDark = true;
      lightSquare.isLight = true;
      lightSquare.isEmpty = true;

      switch(piece) {
        case 'WMAN': darkSquare.isWhiteMan = true; break;
        case 'WCRO': darkSquare.isWhiteCro = true; break;
        case 'BMAN': darkSquare.isBlackMan = true; break;
        case 'BCRO': darkSquare.isBlackCro = true; break;
        default: darkSquare.isEmpty = true;
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
   * Check if there's any mandatory jumps.
   *
   * @returns {boolean}
   */
  var checkMandatoryJump = function() {
    var possibleMoves = [];
    for (var i = 0; i < checkersLogicService.CONSTANT.get('ROW') *
        checkersLogicService.CONSTANT.get('COLUMN'); i += 1) {
      possibleMoves = possibleMoves.concat(checkersLogicService.getJumpMoves(state, i, yourPlayerIndex));
    }

    return possibleMoves.length > 0;
  };

  /**
   * For each piece, set its property 'canSelect' to true only if it is valid
   * to select.
   */
  var setInitialSelectableSquares = function () {
    var square,
      possibleMoves,
      hasMandatoryJump = checkMandatoryJump();

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
  var setSelectableSquares = function (pieceIndex) {
    var possibleMoves = checkersLogicService.getAllPossibleMoves(state, Math.floor(pieceIndex / 2), yourPlayerIndex);

    if (possibleMoves.length > 0) {
      if (typeof possibleMoves[0] !== 'number') {
        for (var i = 0; i < possibleMoves.length; i++) {
          possibleMoves[i] = possibleMoves[i][1];
        }
      }

      setAllSquareUnselectable();

      $scope.uiState[pieceIndex].canSelect = true;

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
   * Select a piece, change the validation of all squares accordingly and send
   * the move if the move is complete and valid.
   *
   * @param index the piece selected.
   */
  $scope.pieceSelected = function (index) {
    var operations = [],
      square = $scope.uiState[index];

    if (square.isDark && square.canSelect) {
      if (selectedPiece.indexOf(index) === -1) {
        square.isSelected = true;
        selectedPiece.push(index);
        setSelectableSquares(index);
      } else {
        square.isSelected = false;
        selectedPiece = [];
        setInitialSelectableSquares();
      }

      if (selectedPiece.length === 2) {
        var fromUiIndex = selectedPiece[0];
        var fromIndex = Math.floor(fromUiIndex / 2);
        var toUiIndex = selectedPiece[1];
        var toIndex = Math.floor(toUiIndex / 2);
        var fromPiece = state[fromIndex];

        selectedPiece = [];

        $scope.uiState[fromUiIndex].isSelected = false;

        if (Math.abs(Math.abs(fromUiIndex - toUiIndex) - checkersLogicService.CONSTANT.get('COLUMN') * 2) === 1) {
          // Simple move

          operations.push({setTurn: {turnIndex: 1 - yourPlayerIndex}});
          operations.push({set: {key: fromIndex, value: "EMPTY"}});
          operations.push({set: {key: toIndex, value: fromPiece}});
        } else if (Math.abs(Math.abs(fromUiIndex - toUiIndex) -  checkersLogicService.CONSTANT.get('COLUMN') * 4) === 2) {
          // Jump move

          var jumpedUiIndex;
          switch(toUiIndex - fromUiIndex) {
            case 18: jumpedUiIndex = fromUiIndex + 9; break;
            case 14: jumpedUiIndex = fromUiIndex + 7; break;
            case -18: jumpedUiIndex = fromUiIndex - 9; break;
            case -14: jumpedUiIndex = fromUiIndex - 7; break;
          }

          var jumpedIndex = Math.floor(jumpedUiIndex / 2);

          operations.push({set: {key: fromIndex, value: "EMPTY"}});
          operations.push({set: {key: jumpedIndex, value: "EMPTY"}});
          operations.push({set: {key: toIndex, value: fromPiece}});

          if (checkersLogicService.getJumpMoves(
              checkersLogicService.getNextState(checkersLogicService.cloneObj(state), operations, yourPlayerIndex).nextState, toIndex, yourPlayerIndex).length > 0) {
            operations.push({setTurn: {turnIndex: yourPlayerIndex}});
          } else {
            operations.push({setTurn: {turnIndex: 1 - yourPlayerIndex}});
          }
        }
        makeMoveCallback(operations);
      }
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

      state = stateAfterMove;
      updateCheckersGraphics();

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

}])
;