(function () {
  'use strict';
  /*global angular */

  // Copied from:
  // http://coderdiaries.com/2014/03/09/drag-and-drop-with-angularjs/
  angular.module('checkers').directive('ddDraggable', [function () {
    return {
      restrict: "A",
      link: function (scope, element) {
        element.draggable({
          revert: true,
          start: function () {
            var id = element[0].id;

            // Handle the drag start event only if the square is selectable
            if (scope.uiState[id].canSelect) {
              scope.handleDragStart(id);
            }
          }
        });

        // It seems the jQuery UI changed the css property of the element
        // and will cause the problem for animation, so here change it back.
        element[0].style.position = 'absolute';
      }
    };
  }]);
}());