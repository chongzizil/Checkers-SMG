'use strict';

var checkers = angular.module('checkers', ['ngRoute', 'ngAnimate']);

checkers.config(['$routeProvider',
  function ($routeProvider) {
    $routeProvider
        .when('/PassAndPlay', {
          templateUrl: 'partials/game.html', controller: 'CheckersCtrl'
        })
        .when('/PlayAgainstTheComputer', {
          templateUrl: 'partials/game.html', controller: 'CheckersCtrl'
        })
        .otherwise({
          redirectTo: '/PassAndPlay'
        });
  }
]);
