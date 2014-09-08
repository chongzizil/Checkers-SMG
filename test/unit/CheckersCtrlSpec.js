(function () {
  'use strict';
  /*global angular, expect, describe, it, beforeEach, module, inject */


  describe('checkersCtrl unit tests:', function () {
    var CONSTANT,
      checkersCtrl,
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

    beforeEach(inject(function (_constantService_) {
      CONSTANT = _constantService_;
    }));

    // Set up an initial set up state
    beforeEach(function setInitialState() {
      initialState = {};

      for (i = 0; i < (CONSTANT.ROW - 2)
          / 2 * CONSTANT.COLUMN; i += 1) {
        initialState[i] = 'BMAN';
      }

      for (i = (CONSTANT.ROW / 2 - 1)
          * CONSTANT.COLUMN;
           i < (CONSTANT.ROW / 2 + 1)
               * CONSTANT.COLUMN; i += 1) {
        initialState[i] = 'EMPTY';
      }

      for (i = (CONSTANT.ROW / 2 + 1)
          * CONSTANT.COLUMN;
           i < CONSTANT.ROW
               * CONSTANT.COLUMN; i += 1) {
        initialState[i] = 'WMAN';
      }
    });
  });
}());