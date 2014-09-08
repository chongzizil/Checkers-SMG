(function () {
  'use strict';
  /*global angular */

  // Copied from:
  // http://coderdiaries.com/2014/03/09/drag-and-drop-with-angularjs/
  angular.module('checkers').directive('ddDropTarget', [function () {
    return {
      restrict: "A",
      link: function (scope, element) {
        element.droppable({
          drop: function () {
            var id = element[0].id;

            // Handle the drop only when the drop target is an empty square
            if (scope.uiState[id].isEmpty) {
              scope.handleDrop(id);
            }
          }
        });
      }
    };
  }]);
}());