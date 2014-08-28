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

  // Set up an initial set up state
  beforeEach(function setInitialState() {
    initialState = {};

    for (i = 0; i < (checkersLogicService.CONSTANT.get('ROW') - 2)
        / 2 * checkersLogicService.CONSTANT.get('COLUMN'); i += 1) {
      initialState[i] = 'BMAN';
    }

    for (i = (checkersLogicService.CONSTANT.get('ROW') / 2 - 1)
        * checkersLogicService.CONSTANT.get('COLUMN');
         i < (checkersLogicService.CONSTANT.get('ROW') / 2 + 1)
             * checkersLogicService.CONSTANT.get('COLUMN'); i += 1) {
      initialState[i] = 'EMPTY';
    }

    for (i = (checkersLogicService.CONSTANT.get('ROW') / 2 + 1)
        * checkersLogicService.CONSTANT.get('COLUMN');
         i < checkersLogicService.CONSTANT.get('ROW')
             * checkersLogicService.CONSTANT.get('COLUMN'); i += 1) {
      initialState[i] = 'WMAN';
    }
  });

  it('Should have those functions.', function () {

  });
});