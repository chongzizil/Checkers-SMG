'use strict';

describe('checkersCtrl unit tests:', function () {
  var checkersCtrl,
      checkersLogicService,
      emptyState = {},
      initialState = {},
      WHITE_TURN_INDEX = 0,
      BLACK_TURN_INDEX = 1,
      $scope,
      i;

  // Set up the module
  beforeEach(module('checkers'));

  // Set up the controller
  beforeEach(inject(function ($rootScope, $controller) {
    $scope = $rootScope.$new();
    checkersCtrl = $controller('CheckersCtrl', {
      $scope: $scope
    });
  }));

  // Set up the service
  beforeEach(inject(function (_checkersLogicService_) {
    checkersLogicService = _checkersLogicService_;
  }));

  it('Should have those functions.', function () {
//    console.log($scope);
  });
});