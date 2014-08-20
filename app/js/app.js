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
