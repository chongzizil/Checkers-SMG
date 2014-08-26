// Copied from http://coderdiaries.com/2014/03/09/drag-and-drop-with-angularjs/

checkers.
    directive('ddDraggable', [function() {
      return {
        restrict: "A",
        link: function(scope, element, attrs) {

          element.attr("draggable", true);

          element.bind("dragstart", function(eventObject) {
            var id = element[0].id;
            scope.handleDragStart(id);
          });
        }
      };
    }]
);