'use strict';

var checkers = angular.module('checkers', ['ngRoute']);

checkers.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
        otherwise({
          redirectTo: '/'
        });
  }
]);


//angular.module('myApp', [
//  'ngRoute',
//  'myApp.filters',
//  'myApp.services',
//  'myApp.directives',
//  'myApp.controllers'
//]).
//config(['$routeProvider', function($routeProvider) {
//  $routeProvider.when('/view1', {templateUrl: 'partials/partial1.html', controller: 'MyCtrl1'});
//  $routeProvider.when('/view2', {templateUrl: 'partials/partial2.html', controller: 'MyCtrl2'});
//  $routeProvider.otherwise({redirectTo: '/view1'});
//}]);
