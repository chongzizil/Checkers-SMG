// Copied from http://coderdiaries.com/2014/03/09/drag-and-drop-with-angularjs/

checkers.
    directive('ddDropTarget', [function() {
      return {
        restrict: "AC",
        link: function (scope, element, attributes, ctlr) {
          element.droppable({
            drop: function (event, ui) {
              var id = element[0].id;
              
              // Handle the drop only when the drop target is an empty square
              if (scope.uiState[id].isEmpty) {
                scope.handleDrop(id);
              }
            }
          });
        }
      };
    }]
);