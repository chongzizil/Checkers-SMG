checkers.controller('CheckersCtrl', ['$scope', 'checkersLogicService', function($scope, checkersLogicService) {

  var game = (function() {
    function getGameDeveloperEmail() {
      return "yoav.zibin@gmail.com";
    }

    function isMoveOk(match) {
      console.log("verifyMove:", match);
      return true;
    }

    /**
     * This method update the game's UI.
     * @param match
     */
    function updateUI (match) {
      var yourPlayerIndex = match.yourPlayerIndex,
          makeMoveCallback = match.maekMoveCallback,
          turnIndexBeforeMove = match.turnIndexBeforeMove,
          turnIndexAfterMove = match.turnIndexAfterMove,
          stateBeforeMove = match.stateBeforeMove,
          stateAfterMove = match.stateAfterMove,
          endMatchScores = match.endMatchScores,
          endMatchReason = match.endMatchReason,
          playersInfo = match.playersInfo;
    };

    return {
      getGameDeveloperEmail : getGameDeveloperEmail,
      isMoveOk : checkersLogicService.isMoveOk,
      updateUI: updateUI
    };
  });
}]);