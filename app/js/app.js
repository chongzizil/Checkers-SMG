(function () {
  'use strict';
  /*global angular */

  angular.module('checkers', ['ngRoute', 'ngAnimate']).config(['$routeProvider',
    function ($routeProvider) {
      $routeProvider
          .when('/PassAndPlay', {
          templateUrl: 'partials/game.html',
          controller: 'CheckersCtrl'
        }).when('/PlayAgainstTheComputer', {
          templateUrl: 'partials/game.html',
          controller: 'CheckersCtrl'
        }).otherwise({
          redirectTo: '/PassAndPlay'
        });
    }]);
}());