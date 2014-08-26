// Copied from http://coderdiaries.com/2014/03/09/drag-and-drop-with-angularjs/

checkers.
    directive('ddDropTarget', [function() {
      return {
        restrict: "A",
        link: function (scope, element, attributes, ctlr) {

          element.bind("dragover", function(eventObject){
            eventObject.preventDefault();
          });

          element.bind("drop", function(eventObject) {
            var id = element[0].id;
            scope.handleDrop(id);

            // cancel actual UI element from dropping, since the angular will recreate a the UI element
//            eventObject.preventDefault();
          });
        }
      };
    }]
);