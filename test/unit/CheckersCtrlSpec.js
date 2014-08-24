'use strict';

/**
* Copy a state.
*
* @param state the state need to be copied
* @returns {*} a copy state
*/
var copyState = function (state) {
  var str = JSON.stringify(state),
      copyState = JSON.parse(str);
  return copyState;
};

describe('checkersCtrl unit tests:', function () {
  var checkersCtrl,
      checkersLogicService,
      emptyState = {},
      initialState = {},
      WHITE_TURN_INDEX = 0,
      BLACK_TURN_INDEX = 1,
      i;

  // Set up the module
  beforeEach(module('checkers'));

  // Set up the controller
  beforeEach(inject(function (_checkersCtrl_) {
    checkersCtrl = _checkersCtrl_;
  }));

  // Set up the service
  beforeEach(inject(function (_checkersLogicService_) {
    checkersLogicService = _checkersLogicService_;
  }));



});