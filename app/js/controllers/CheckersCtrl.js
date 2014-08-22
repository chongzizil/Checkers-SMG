checkers.controller('CheckersCtrl', ['$scope', 'checkersLogicService', function ($scope, checkersLogicService) {

  var state = null;
  var yourPlayerIndex;
  var makeMoveCallback;

  var seletedPiece = [];

  state = {
    S0: 'BMAN', S1: 'BMAN', S2: 'BMAN', S3: 'BMAN',
    S4: 'BMAN', S5: 'BMAN', S6: 'BMAN', S7: 'BMAN',
    S8: 'BMAN', S9: 'BMAN', S10: 'BMAN', S11: 'BMAN',
    S12: 'EMPTY', S13: 'EMPTY', S14: 'EMPTY', S15: 'EMPTY',
    S16: 'EMPTY', S17: 'EMPTY', S18: 'EMPTY', S19: 'EMPTY',
    S20: 'WMAN', S21: 'WMAN', S22: 'WMAN', S23: 'WMAN',
    S24: 'WMAN', S25: 'WMAN', S26: 'WMAN', S27: 'WMAN',
    S28: 'WMAN', S29: 'WMAN', S30: 'WMAN', S31: 'WMAN'
  };

  var convertStateToUiState = function (state) {
    var uiState = [];
    var square = {
      isBlackMan: false,
      isBlackCro: false,
      isWhiteMan: false,
      isWhiteCro: false,
      isEmpty: false,
      isDark: false,
      isLight: false,
      isSelected: false,
      row: -1,
      col: -1
    };

    // TODO: Be careful of empty state.
    for (var i = 0; i < checkersLogicService.CONSTANT.get('ROW') *
        checkersLogicService.CONSTANT.get('COLUMN'); i += 1) {

      var piece = state['S' + i];
      var darkSquare = checkersLogicService.cloneObj(square);
      var lightSquare = checkersLogicService.cloneObj(square);

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

  var isMyMove = function() {
    if (state === null) {
      return;
    }

    return yourPlayerIndex;
  };

  $scope.uiState = convertStateToUiState(state);

  $scope.pieceSelected = function (index) {
    var operations = [];
    if ($scope.uiState[index].isDark) {
      $scope.uiState[index].isSelected = !$scope.uiState[index].isSelected;
      if (seletedPiece.indexOf(index) === -1) {
        seletedPiece.push(index);
      } else {
        seletedPiece = [];
      }

      if (seletedPiece.length === 2) {
        var from = seletedPiece[0];
        var to = seletedPiece[1];
        var fromPiece = state['S' + Math.floor(from / 2)];
        var toPiece = state['S' + Math.floor(to / 2)];
        console.log(fromPiece);
        console.log(toPiece);
        seletedPiece = [];
        $scope.uiState[from].isSelected = false;
        $scope.uiState[to].isSelected = false;

        operations.push({setTurn: {turnIndex: 1 - yourPlayerIndex}});
        operations.push({set: {i : 2}});

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
      console.log("updateUI:", match);

      var yourPlayerIndex = match.yourPlayerIndex,
          makeMoveCallback = match.maekMoveCallback,
          turnIndexBeforeMove = match.turnIndexBeforeMove,
          turnIndexAfterMove = match.turnIndexAfterMove,
          stateBeforeMove = match.stateBeforeMove,
          stateAfterMove = match.stateAfterMove,
          endMatchScores = match.endMatchScores,
          endMatchReason = match.endMatchReason,
          playersInfo = match.playersInfo;

      convertStateToUiState(stateAfterMove);
    };

    return {
      getGameDeveloperEmail: getGameDeveloperEmail,
      isMoveOk: checkersLogicService.isMoveOk,
      updateUI: updateUI
    };
  })();
//  platform.setGame(game);
//  platform.showUI({minNumberOfPlayers: 2, maxNumberOfPlayers: 2});

}])
;