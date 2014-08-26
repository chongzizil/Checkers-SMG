'use strict';

var checkers = angular.module('checkers', ['ngRoute', 'ngAnimate']);

checkers.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
        otherwise({
          redirectTo: '/'
        });
  }
]);
