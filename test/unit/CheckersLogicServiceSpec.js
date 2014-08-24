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

describe('checkersLogicService unit tests:', function () {
  var checkersLogicService,
    emptyState = {},
    initialState = {},
    WHITE_TURN_INDEX = 0,
    BLACK_TURN_INDEX = 1,
    i;

  // Set up the module
  beforeEach(module('checkers'));

  // Set up the service
  beforeEach(inject(function (_checkersLogicService_) {
    checkersLogicService = _checkersLogicService_;
  }));

  // Set up an empty (no pieces on board) state for test random situation
  beforeEach(function setEmptyState() {
    emptyState = {};
    for (i = 0; i < Math.pow(checkersLogicService.CONSTANT.get('ROW'), 2);
         i += 1) {
      emptyState[i] = 'EMPTY';
    }
  });

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
    expect(angular.isFunction(checkersLogicService.isMoveOk)).toBe(true);
    expect(angular.isFunction(checkersLogicService.getNextState)).toBe(true);
    expect(angular.isFunction(checkersLogicService.getInitialMove)).toBe(true);
    expect(angular.isFunction(checkersLogicService.getExpectedOperations)).toBe(true);
    expect(angular.isFunction(checkersLogicService.getJumpMoves)).toBe(true);
    expect(angular.isFunction(checkersLogicService.getSimpleMoves)).toBe(true);
    expect(angular.isFunction(checkersLogicService.getAllPossibleMoves)).toBe(true);
    expect(angular.isFunction(checkersLogicService.checkMandatoryJump)).toBe(true);
    expect(angular.isFunction(checkersLogicService.cloneObj)).toBe(true);
    expect(angular.isFunction(checkersLogicService.isEmptyObj)).toBe(true);
  });

  describe('isMoveOk:', function () {
    describe("INITIALIZE MOVE TEST:", function () {
      it("White legally makes the initial move to set up the state", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = {};
        match.stateAfterMove = initialState;
        match.move = checkersLogicService.getInitialMove();
        expect(isMoveOk(match)).toBe(true);
      });

      it("White illegally makes the initial move at the middle of the game",
          function () {
            var match = {};
            match.turnIndexBeforeMove = WHITE_TURN_INDEX;
            match.turnIndexAfterMove = WHITE_TURN_INDEX;
            match.stateBeforeMove = initialState;
            match.stateAfterMove = initialState;
            match.move = checkersLogicService.getInitialMove();
            expect(isMoveOk(match)).toEqual({email: 'x@x.x', emailSubject: 'hacker!',
              emailBody: 'Illegal move!!!'});
          });

      it("Black illegally makes the initial move to set up the state", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = {};
        match.stateAfterMove = initialState;
        match.move = checkersLogicService.getInitialMove();
        expect(isMoveOk(match)).toEqual({email: 'x@x.x', emailSubject: 'hacker!',
          emailBody: 'Illegal move!!!'});
      });
    });

    /**
     * INITIAL STATE SCENARIO, WHITE
     *
     *     0    1    2    3    4    5    6    7
     * 0 |  0 | ** |  1 | ** |  2 | ** |  3 | ** |
     *   | BB | -- | BB | -- | BB | -- | BB | -- |
     * 1 | ** |  4 | ** |  5 | ** |  6 | ** |  7 |
     *   | -- | BB | -- | BB | -- | BB | -- | BB |
     * 2 |  8 | ** |  9 | ** | 10 | ** | 11 | ** |
     *   | BB | -- | BB | -- | BB | -- | BB | -- |
     * 3 | ** | 12 | ** | 13 | ** | 14 | ** | 15 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 4 | 16 | ** | 17 | ** | 18 | ** | 19 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 5 | ** | 20 | ** | 21 | ** | 22 | ** | 23 |
     *   | -- | WW | -- | WW | -- | WW | -- | WW |
     * 6 | 24 | ** | 25 | ** | 26 | ** | 27 | ** |
     *   | WW | -- | WW | -- | WW | -- | WW | -- |
     * 7 | ** | 28 | ** | 29 | ** | 30 | ** | 31 |
     *   | -- | WW | -- | WW | -- | WW | -- | WW |
     */
    describe("INITIAL STATE SCENARIO FOR WHITE", function () {
      it("White legally moves S20 to S16", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = initialState;
        match.stateAfterMove = copyState(initialState);
        match.move = [];

        match.stateAfterMove['20'] = "EMPTY";
        match.stateAfterMove['16'] = "WMAN";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 20, value: "EMPTY"}});
        match.move.push({set: {key: 16, value: "WMAN"}});
        expect(isMoveOk(match)).toBe(true);
      });

      it("White illegally moves S20 to S18 because it can only move one square " +
          "diagonally to an adjacent unoccupied dark square.", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = initialState;
        match.stateAfterMove = copyState(initialState);
        match.move = [];

        match.stateAfterMove['20'] = "EMPTY";
        match.stateAfterMove['18'] = "WMAN";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 20, value: "EMPTY"}});
        match.move.push({set: {key: 18, value: "WMAN"}});
        expect(isMoveOk(match)).toEqual({email: 'x@x.x',
          emailSubject: 'hacker!', emailBody: 'Illegal simple moves!!!'});
      });

      it("White illegally moves S20 to S12 because it can only move one square" +
          "diagonally to an adjacent unoccupied dark square.", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = initialState;
        match.stateAfterMove = copyState(initialState);
        match.move = [];

        match.stateAfterMove['20'] = "EMPTY";
        match.stateAfterMove['12'] = "WMAN";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 20, value: "EMPTY"}});
        match.move.push({set: {key: 12, value: "WMAN"}});
        expect(isMoveOk(match)).toEqual({email: 'x@x.x',
          emailSubject: 'hacker!', emailBody: 'Illegal simple moves!!!'});
      });

      it("White illegally moves S20 to S18 because MAN can not move backward",
          function () {
            var match = {};
            match.turnIndexBeforeMove = WHITE_TURN_INDEX;
            match.turnIndexAfterMove = BLACK_TURN_INDEX;
            match.stateBeforeMove = initialState;
            match.stateAfterMove = copyState(initialState);
            match.move = [];

            match.stateAfterMove['20'] = "EMPTY";
            match.stateAfterMove['24'] = "WMAN";
            match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
            match.move.push({set: {key: 20, value: "EMPTY"}});
            match.move.push({set: {key: 24, value: "WMAN"}});
            expect(isMoveOk(match)).toEqual({email: 'x@x.x',
              emailSubject: 'hacker!', emailBody: 'Illegal simple moves!!!'});
          });

      it("White illegally moves S9 to S12 because the white player can only" +
              " operate on white pieces",
          function () {
            var match = {};
            match.turnIndexBeforeMove = WHITE_TURN_INDEX;
            match.turnIndexAfterMove = WHITE_TURN_INDEX;
            match.stateBeforeMove = initialState;
            match.stateAfterMove = copyState(initialState);
            match.move = [];

            match.stateAfterMove['9'] = "EMPTY";
            match.stateAfterMove['12'] = "BMAN";
            match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
            match.move.push({set: {key: 9, value: "EMPTY"}});
            match.move.push({set: {key: 12, value: "BMAN"}});
            expect(isMoveOk(match)).toEqual({email: 'x@x.x',
              emailSubject: 'hacker!', emailBody: 'Illegal simple moves!!!'});
          });

      it("White illegal moves a non exist piece", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = initialState;
        match.stateAfterMove = copyState(initialState);
        match.move = [];

        match.stateAfterMove['33'] = "EMPTY";
        match.stateAfterMove['15'] = "WMAN";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 33, value: "EMPTY"}});
        match.move.push({set: {key: 15, value: "WMAN"}});
        expect(isMoveOk(match)).toEqual({email: 'x@x.x', emailSubject: 'hacker!',
          emailBody: 'Illegal index'});
      });

      it("White illegal moves S20 to a non exist square", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = initialState;
        match.stateAfterMove = copyState(initialState);
        match.move = [];

        match.stateAfterMove['20'] = "EMPTY";
        match.stateAfterMove['33'] = "WMAN";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 20, value: "EMPTY"}});
        match.move.push({set: {key: 33, value: "WMAN"}});
        expect(isMoveOk(match)).toEqual({email: 'x@x.x', emailSubject: 'hacker!',
          emailBody: 'Illegal index'});
      });
    });

    /**
     * INITIAL STATE SCENARIO, BLACK (After white make first move 20 -> 16)
     *
     *     0    1    2    3    4    5    6    7
     * 0 |  0 | ** |  1 | ** |  2 | ** |  3 | ** |
     *   | BB | -- | BB | -- | BB | -- | BB | -- |
     * 1 | ** |  4 | ** |  5 | ** |  6 | ** |  7 |
     *   | -- | BB | -- | BB | -- | BB | -- | BB |
     * 2 |  8 | ** |  9 | ** | 10 | ** | 11 | ** |
     *   | BB | -- | BB | -- | BB | -- | BB | -- |
     * 3 | ** | 12 | ** | 13 | ** | 14 | ** | 15 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 4 | 16 | ** | 17 | ** | 18 | ** | 19 | ** |
     *   | WW | -- | -- | -- | -- | -- | -- | -- |
     * 5 | ** | 20 | ** | 21 | ** | 22 | ** | 23 |
     *   | -- | -- | -- | WW | -- | WW | -- | WW |
     * 6 | 24 | ** | 25 | ** | 26 | ** | 27 | ** |
     *   | WW | -- | WW | -- | WW | -- | WW | -- |
     * 7 | ** | 28 | ** | 29 | ** | 30 | ** | 31 |
     *   | -- | WW | -- | WW | -- | WW | -- | WW |
     */
    describe("INITIAL STATE SCENARIO FOR BLACK", function () {
      var testState;
      beforeEach(function setTestState() {
        testState = initialState;
        testState['20'] = "EMPTY";
        testState['16'] = "WMAN";
      });

      it("Black legally moves S8 to S12", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateAfterMove = copyState(match.stateBeforeMove);
        match.stateAfterMove['8'] = "EMPTY";
        match.stateAfterMove['12'] = "BMAN";

        match.move = [];
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 8, value: "EMPTY"}});
        match.move.push({set: {key: 12, value: "BMAN"}});
        expect(isMoveOk(match)).toBe(true);
      });

      it("Black illegally moves S8 to S17 because it can only move one square " +
          "diagonally to an adjacent unoccupied dark square.", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateAfterMove = copyState(match.stateBeforeMove);
        match.stateAfterMove['8'] = "EMPTY";
        match.stateAfterMove['17'] = "BMAN";

        match.move = [];
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 8, value: "EMPTY"}});
        match.move.push({set: {key: 17, value: "BMAN"}});
        expect(isMoveOk(match)).toEqual({ email : 'x@x.x',
          emailSubject : 'hacker!', emailBody : 'Illegal simple moves!!!' });
      });

      it("Black illegally moves S8 to S16 because it can only move one square" +
          "diagonally to an adjacent unoccupied dark square.", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateAfterMove = copyState(match.stateBeforeMove);
        match.stateAfterMove['8'] = "EMPTY";
        match.stateAfterMove['16'] = "BMAN";

        match.move = [];
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 8, value: "EMPTY"}});
        match.move.push({set: {key: 16, value: "BMAN"}});
        expect(isMoveOk(match)).toEqual({ email : 'x@x.x',
          emailSubject : 'hacker!', emailBody : 'Illegal simple moves!!!' });
      });

      it("Black illegally moves S20 to S18 because MAN can not move backward",
          function () {
            var match = {};
            match.turnIndexBeforeMove = BLACK_TURN_INDEX;
            match.turnIndexAfterMove = WHITE_TURN_INDEX;
            match.stateBeforeMove = testState;
            match.stateAfterMove = copyState(match.stateBeforeMove);
            match.stateAfterMove['8'] = "EMPTY";
            match.stateAfterMove['4'] = "BMAN";

            match.move = [];
            match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
            match.move.push({set: {key: 8, value: "EMPTY"}});
            match.move.push({set: {key: 4, value: "BMAN"}});
            expect(isMoveOk(match)).toEqual({ email : 'x@x.x',
              emailSubject : 'hacker!', emailBody : 'Illegal simple moves!!!' });
          });

      it("Black illegally moves S9 to S12 because the white player can only" +
              " operate on white pieces",
          function () {
            var match = {};
            match.turnIndexBeforeMove = BLACK_TURN_INDEX;
            match.turnIndexAfterMove = WHITE_TURN_INDEX;
            match.stateBeforeMove = testState;
            match.stateAfterMove = copyState(match.stateBeforeMove);
            match.stateAfterMove['16'] = "EMPTY";
            match.stateAfterMove['12'] = "WMAN";

            match.move = [];
            match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
            match.move.push({set: {key: 16, value: "EMPTY"}});
            match.move.push({set: {key: 12, value: "WMAN"}});
            expect(isMoveOk(match)).toEqual({ email : 'x@x.x',
              emailSubject : 'hacker!', emailBody : 'Illegal simple moves!!!' });
          });
    });

    /**
     * MANDATORY JUMP SCENARIO, WHITE
     *
     *     0    1    2    3    4    5    6    7
     * 0 |  0 | ** |  1 | ** |  2 | ** |  3 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 1 | ** |  4 | ** |  5 | ** |  6 | ** |  7 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 2 |  8 | ** |  9 | ** | 10 | ** | 11 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 3 | ** | 12 | ** | 13 | ** | 14 | ** | 15 |
     *   | -- | WW | -- | BC | -- | -- | -- | -- |
     * 4 | 16 | ** | 17 | ** | 18 | ** | 19 | ** |
     *   | -- | -- | WC | -- | -- | -- | -- | -- |
     * 5 | ** | 20 | ** | 21 | ** | 22 | ** | 23 |
     *   | -- | -- | -- | BB | -- | -- | -- | -- |
     * 6 | 24 | ** | 25 | ** | 26 | ** | 27 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 7 | ** | 28 | ** | 29 | ** | 30 | ** | 31 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     */
    describe('MANDATORY JUMP SCENARIO FOR WHITE', function () {
      var testState;
      beforeEach(function setTestState() {
        testState = emptyState;
        testState['12'] = "WMAN";
        testState['13'] = "BCRO";
        testState['17'] = "WCRO";
        testState['21'] = "BMAN";
      });

      it("White legally jumps from S17 over S13 to S10", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateAfterMove = copyState(testState);
        match.move = [];

        match.stateAfterMove['17'] = "EMPTY";
        match.stateAfterMove['13'] = "EMPTY";
        match.stateAfterMove['10'] = "WCRO";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 17, value: "EMPTY"}});
        match.move.push({set: {key: 13, value: "EMPTY"}});
        match.move.push({set: {key: 10, value: "WCRO"}});

        expect(isMoveOk(match)).toEqual(true);
      });

      it("White legally jumps from S17 over S21 to S26", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateAfterMove = copyState(testState);
        match.move = [];

        match.stateAfterMove['17'] = "EMPTY";
        match.stateAfterMove['21'] = "EMPTY";
        match.stateAfterMove['26'] = "WCRO";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 17, value: "EMPTY"}});
        match.move.push({set: {key: 21, value: "EMPTY"}});
        match.move.push({set: {key: 26, value: "WCRO"}});

        expect(isMoveOk(match)).toEqual(true);
      });

      it("White illegally moves S17 to S20 by ignoring the mandatory jump",
          function () {
            var match = {};
            match.turnIndexBeforeMove = WHITE_TURN_INDEX;
            match.turnIndexAfterMove = BLACK_TURN_INDEX;
            match.stateBeforeMove = testState;
            match.stateAfterMove = copyState(testState);
            match.move = [];

            match.stateAfterMove['17'] = "EMPTY";
            match.stateAfterMove['20'] = "WCRO";
            match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
            match.move.push({set: {key: 17, value: "EMPTY"}});
            match.move.push({set: {key: 20, value: "WCRO"}});

            expect(isMoveOk(match)).toEqual({ email: 'x@x.x',emailSubject: 'hacker!',
              emailBody: 'Illegal ignore mandatory jump!!!' });
          });

      it("White illegally moves S12 to S8 by ignoring the mandatory jump",
          function () {
            var match = {};
            match.turnIndexBeforeMove = WHITE_TURN_INDEX;
            match.turnIndexAfterMove = BLACK_TURN_INDEX;
            match.stateBeforeMove = testState;
            match.stateAfterMove = copyState(testState);
            match.move = [];

            match.stateAfterMove['8'] = "WMAN";
            match.stateAfterMove['12'] = "WEMPTY";
            match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
            match.move.push({set: {key: 12, value: "EMPTY"}});
            match.move.push({set: {key: 8, value: "WMAN"}});

            expect(isMoveOk(match)).toEqual({ email: 'x@x.x', emailSubject: 'hacker!',
              emailBody: 'Illegal ignore mandatory jump!!!' });
          });
    });

    /**
     * MANDATORY JUMP SCENARIO, BLACK
     *
     *     0    1    2    3    4    5    6    7
     * 0 |  0 | ** |  1 | ** |  2 | ** |  3 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 1 | ** |  4 | ** |  5 | ** |  6 | ** |  7 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 2 |  8 | ** |  9 | ** | 10 | ** | 11 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 3 | ** | 12 | ** | 13 | ** | 14 | ** | 15 |
     *   | -- | WW | -- | BC | -- | -- | -- | -- |
     * 4 | 16 | ** | 17 | ** | 18 | ** | 19 | ** |
     *   | -- | -- | WC | -- | -- | -- | -- | -- |
     * 5 | ** | 20 | ** | 21 | ** | 22 | ** | 23 |
     *   | -- | -- | -- | BB | -- | -- | -- | -- |
     * 6 | 24 | ** | 25 | ** | 26 | ** | 27 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 7 | ** | 28 | ** | 29 | ** | 30 | ** | 31 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     */
    describe('MANDATORY JUMP SCENARIO FOR BLACK', function () {
      var testState;
      beforeEach(function setTestState() {
        testState = emptyState;
        testState['12'] = "WMAN";
        testState['13'] = "BCRO";
        testState['17'] = "WCRO";
        testState['21'] = "BMAN";
      });

      it("Black legally jumps from 13 over 17 to 20", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateAfterMove = copyState(testState);
        match.move = [];

        match.stateAfterMove['13'] = "EMPTY";
        match.stateAfterMove['17'] = "EMPTY";
        match.stateAfterMove['20'] = "BCRO";
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 13, value: "EMPTY"}});
        match.move.push({set: {key: 17, value: "EMPTY"}});
        match.move.push({set: {key: 20, value: "BCRO"}});

        expect(isMoveOk(match)).toEqual(true);
      });

      it("Black illegally jumps from 13 to 10 by ignoring the mandatory jump",
          function () {
            var match = {};
            match.turnIndexBeforeMove = BLACK_TURN_INDEX;
            match.turnIndexAfterMove = WHITE_TURN_INDEX;
            match.stateBeforeMove = testState;
            match.stateAfterMove = copyState(testState);
            match.move = [];

            match.stateAfterMove['13'] = "EMPTY";
            match.stateAfterMove['20'] = "BCRO";
            match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
            match.move.push({set: {key: 13, value: "EMPTY"}});
            match.move.push({set: {key: 20, value: "BCRO"}});

            expect(isMoveOk(match)).toEqual({ email: 'x@x.x',emailSubject: 'hacker!',
              emailBody: 'Illegal ignore mandatory jump!!!' });
          });

      it("Black illegally moves 21 to 18 by ignoring the mandatory jump",
          function () {
            var match = {};
            match.turnIndexBeforeMove = BLACK_TURN_INDEX;
            match.turnIndexAfterMove = WHITE_TURN_INDEX;
            match.stateBeforeMove = testState;
            match.stateAfterMove = copyState(testState);
            match.move = [];

            match.stateAfterMove['21'] = "EMPTY";
            match.stateAfterMove['18'] = "BMAN";
            match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
            match.move.push({set: {key: 21, value: "EMPTY"}});
            match.move.push({set: {key: 18, value: "BMAN"}});

            expect(isMoveOk(match)).toEqual({ email: 'x@x.x',emailSubject: 'hacker!',
              emailBody: 'Illegal ignore mandatory jump!!!' });
          });
    });

    /**
     * CROWNED SCENARIO, WHITE
     *
     *     0    1    2    3    4    5    6    7
     * 0 |  0 | ** |  1 | ** |  2 | ** |  3 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 1 | ** |  4 | ** |  5 | ** |  6 | ** |  7 |
     *   | -- | WW | -- | -- | -- | BB | -- | -- |
     * 2 |  8 | ** |  9 | ** | 10 | ** | 11 | ** |
     *   | -- | -- | -- | -- | WW*| -- | -- | -- |
     * 3 | ** | 12 | ** | 13 | ** | 14 | ** | 15 |
     *   | -- | WW | -- | BB | -- | -- | -- | -- |
     * 4 | 16 | ** | 17 | ** | 18 | ** | 19 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 5 | ** | 20 | ** | 21 | ** | 22 | ** | 23 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 6 | 24 | ** | 25 | ** | 26 | ** | 27 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 7 | ** | 28 | ** | 29 | ** | 30 | ** | 31 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     */
    describe('CROWNED SCENARIO FOR WHITE', function () {
      var testState;
      beforeEach(function setTestState() {
        testState = emptyState;
        testState['4'] = "WMAN";
        testState['6'] = "BMAN";
        // Since this generate a mandatory jump, it will be added in the specific
        // test
        // testState['10'] = "WMAN";
        testState['12'] = "WMAN";
        testState['13'] = "BMAN";
      });

      it("White legally moves from 4 to 0 and be crowned", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateAfterMove = copyState(testState);
        match.move = [];

        match.stateAfterMove['4'] = "EMPTY";
        match.stateAfterMove['0'] = "WCRO";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 4, value: "EMPTY"}});
        match.move.push({set: {key: 0, value: "WCRO"}});

        expect(isMoveOk(match)).toEqual(true);
      });

      it("White legally jumps from 10 over 6 to 3 and be crowned", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateBeforeMove['10'] = "WMAN";
        match.stateAfterMove = copyState(testState);
        match.move = [];

        match.stateAfterMove['10'] = "EMPTY";
        match.stateAfterMove['6'] = "EMPTY";
        match.stateAfterMove['3'] = "WCRO";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 10, value: "EMPTY"}});
        match.move.push({set: {key: 6, value: "EMPTY"}});
        match.move.push({set: {key: 3, value: "WCRO"}});

        expect(isMoveOk(match)).toEqual(true);
      });

      it("White illegally be crowned by moving from 12 to 8",
          function () {
            var match = {};
            match.turnIndexBeforeMove = WHITE_TURN_INDEX;
            match.turnIndexAfterMove = BLACK_TURN_INDEX;
            match.stateBeforeMove = testState;
            match.stateAfterMove = copyState(testState);
            match.move = [];

            match.stateAfterMove['12'] = "EMPTY";
            match.stateAfterMove['8'] = "WCRO";
            match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
            match.move.push({set: {key: 12, value: "EMPTY"}});
            match.move.push({set: {key: 8, value: "WCRO"}});

            expect(isMoveOk(match)).toEqual({email: 'x@x.x', emailSubject: 'hacker!',
              emailBody: 'Illegal crowned!!!'});
          });
    });

    /**
     * CROWNED SCENARIO, BLACK
     *
     *     0    1    2    3    4    5    6    7
     * 0 |  0 | ** |  1 | ** |  2 | ** |  3 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 1 | ** |  4 | ** |  5 | ** |  6 | ** |  7 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 2 |  8 | ** |  9 | ** | 10 | ** | 11 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 3 | ** | 12 | ** | 13 | ** | 14 | ** | 15 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 4 | 16 | ** | 17 | ** | 18 | ** | 19 | ** |
     *   | WW | -- | BB | -- | -- | -- | -- | -- |
     * 5 | ** | 20 | ** | 21 | ** | 22 | ** | 23 |
     *   | -- | -- | -- | -- | -- | BB | -- | -- |
     * 6 | 24 | ** | 25 | ** | 26 | ** | 27 | ** |
     *   | -- | -- | BB | -- | WW*| -- | -- | -- |
     * 7 | ** | 28 | ** | 29 | ** | 30 | ** | 31 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     */
    describe('CROWNED SCENARIO FOR BLACK', function () {
      var testState;
      beforeEach(function setTestState() {
        testState = emptyState;
        testState['16'] = "WMAN";
        testState['17'] = "BMAN";
        // Since this generate a mandatory jump, it will be added in the specific
        // test
        // testState['26'] = "WMAN";
        testState['22'] = "BMAN";
        testState['25'] = "BMAN";
      });

      it("Black legally moves from 25 to 29 and be crowned", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateAfterMove = copyState(testState);
        match.move = [];

        match.stateAfterMove['25'] = "EMPTY";
        match.stateAfterMove['29'] = "BCRO";
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 25, value: "EMPTY"}});
        match.move.push({set: {key: 29, value: "BCRO"}});

        expect(isMoveOk(match)).toEqual(true);
      });

      it("Black legally jumps from 22 over 26 to 29 and be crowned", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateBeforeMove['26'] = "WMAN"
        match.stateAfterMove = copyState(testState);
        match.move = [];

        match.stateAfterMove['22'] = "EMPTY";
        match.stateAfterMove['26'] = "EMPTY";
        match.stateAfterMove['29'] = "BCRO";
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 22, value: "EMPTY"}});
        match.move.push({set: {key: 26, value: "EMPTY"}});
        match.move.push({set: {key: 29, value: "BCRO"}});

        expect(isMoveOk(match)).toEqual(true);
      });

      it("Black illegally be crowned by moving from 17 to 20",
          function () {
            var match = {};
            match.turnIndexBeforeMove = BLACK_TURN_INDEX;
            match.turnIndexAfterMove = WHITE_TURN_INDEX;
            match.stateBeforeMove = testState;
            match.stateAfterMove = copyState(testState);
            match.move = [];

            match.stateAfterMove['17'] = "EMPTY";
            match.stateAfterMove['20'] = "BCRO";
            match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
            match.move.push({set: {key: 17, value: "EMPTY"}});
            match.move.push({set: {key: 20, value: "BCRO"}});

            expect(isMoveOk(match)).toEqual({email: 'x@x.x', emailSubject: 'hacker!',
              emailBody: 'Illegal crowned!!!'});
          });
    });

    describe("ENDGAME SCENARIO FOR WHITE", function () {
      /**
       * END GAME SCENARIO, WHITE
       *     0    1    2    3    4    5    6    7
       * 0 |  0 | ** |  1 | ** |  2 | ** |  3 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 1 | ** |  4 | ** |  5 | ** |  6 | ** |  7 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 2 |  8 | ** |  9 | ** | 10 | ** | 11 | ** |
       *   | -- | -- | WC | -- | -- | -- | -- | -- |
       * 3 | ** | 12 | ** | 13 | ** | 14 | ** | 15 |
       *   | -- | -- | -- | BB | -- | -- | -- | -- |
       * 4 | 16 | ** | 17 | ** | 18 | ** | 19 | ** |
       *   | -- | -- | WW | -- | -- | -- | -- | -- |
       * 5 | ** | 20 | ** | 21 | ** | 22 | ** | 23 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 6 | 24 | ** | 25 | ** | 26 | ** | 27 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 7 | ** | 28 | ** | 29 | ** | 30 | ** | 31 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       */
      it("White won by jumping from S9 over 13 to 18.", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = emptyState;
        match.stateAfterMove = copyState(emptyState);
        match.move = [];

        match.stateBeforeMove['9'] = "WCRO";
        match.stateBeforeMove['13'] = "BMAN";
        match.stateBeforeMove['17'] = "WMAN";
        match.stateAfterMove['9'] = "EMPTY";
        match.stateAfterMove['13'] = "EMPTY";
        match.stateAfterMove['18'] = "WCRO";
        match.stateAfterMove['17'] = "WMAN";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 9, value: "EMPTY"}});
        match.move.push({set: {key: 13, value: "EMPTY"}});
        match.move.push({set: {key: 18, value: "WCRO"}});
        match.move.push({endMatch: {endMatchScores: [1, 0]}});
        expect(isMoveOk(match)).toEqual(true);
      });

      /**
       * END GAME SCENARIO (ILLEGAL)
       *     0    1    2    3    4    5    6    7
       * 0 |  0 | ** |  1 | ** |  2 | ** |  3 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 1 | ** |  4 | ** |  5 | ** |  6 | ** |  7 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 2 |  8 | ** |  9 | ** | 10 | ** | 11 | ** |
       *   | -- | -- | WC | -- | -- | -- | -- | -- |
       * 3 | ** | 12 | ** | 13 | ** | 14 | ** | 15 |
       *   | -- | -- | -- | -- | -- | BB | -- | -- |
       * 4 | 16 | ** | 17 | ** | 18 | ** | 19 | ** |
       *   | -- | -- | WW | -- | -- | -- | -- | -- |
       * 5 | ** | 20 | ** | 21 | ** | 22 | ** | 23 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 6 | 24 | ** | 25 | ** | 26 | ** | 27 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 7 | ** | 28 | ** | 29 | ** | 30 | ** | 31 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       */
      it("White illegally won by hacking the end game score", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = emptyState;
        match.stateAfterMove = copyState(emptyState);
        match.move = [];

        match.stateBeforeMove['9'] = "WCRO";
        match.stateBeforeMove['14'] = "BMAN";
        match.stateBeforeMove['17'] = "WMAN";
        match.stateAfterMove['9'] = "EMPTY";
        match.stateAfterMove['5'] = "WCRO";
        match.stateAfterMove['14'] = "BMAN";
        match.stateAfterMove['17'] = "WMAN";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 9, value: "EMPTY"}});
        match.move.push({set: {key: 5, value: "WCRO"}});
        match.move.push({endMatch: {endMatchScores: [1, 0]}});

        expect(isMoveOk(match)).toEqual({email: 'x@x.x', emailSubject: 'hacker!',
          emailBody: 'Illegal winner'});
      });
    });

    describe("ENDGAME SCENARIO FOR BLACK: ", function () {
      /**
       * END GAME SCENARIO, BLACK
       *     0    1    2    3    4    5    6    7
       * 0 |  0 | ** |  1 | ** |  2 | ** |  3 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 1 | ** |  4 | ** |  5 | ** |  6 | ** |  7 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 2 |  8 | ** |  9 | ** | 10 | ** | 11 | ** |
       *   | -- | -- | BC | -- | -- | -- | -- | -- |
       * 3 | ** | 12 | ** | 13 | ** | 14 | ** | 15 |
       *   | -- | -- | -- | WW | -- | -- | -- | -- |
       * 4 | 16 | ** | 17 | ** | 18 | ** | 19 | ** |
       *   | -- | -- | BB | -- | -- | -- | -- | -- |
       * 5 | ** | 20 | ** | 21 | ** | 22 | ** | 23 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 6 | 24 | ** | 25 | ** | 26 | ** | 27 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 7 | ** | 28 | ** | 29 | ** | 30 | ** | 31 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       */
      it("Black won by jumping from 9 over 13 to 18.", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = emptyState;
        match.stateAfterMove = copyState(emptyState);
        match.move = [];

        match.stateBeforeMove['9'] = "BCRO";
        match.stateBeforeMove['13'] = "WMAN";
        match.stateBeforeMove['17'] = "BMAN";
        match.stateAfterMove['9'] = "EMPTY";
        match.stateAfterMove['13'] = "EMPTY";
        match.stateAfterMove['18'] = "BCRO";
        match.stateAfterMove['17'] = "BCRO";
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 9, value: "EMPTY"}});
        match.move.push({set: {key: 13, value: "EMPTY"}});
        match.move.push({set: {key: 18, value: "BCRO"}});
        match.move.push({endMatch: {endMatchScores: [0, 1]}});
        expect(isMoveOk(match)).toEqual(true);
      });

      /**
       * END GAME SCENARIO (ILLEGAL)
       *     0    1    2    3    4    5    6    7
       * 0 |  0 | ** |  1 | ** |  2 | ** |  3 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 1 | ** |  4 | ** |  5 | ** |  6 | ** |  7 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 2 |  8 | ** |  9 | ** | 10 | ** | 11 | ** |
       *   | -- | -- | BC | -- | -- | -- | -- | -- |
       * 3 | ** | 12 | ** | 13 | ** | 14 | ** | 15 |
       *   | -- | -- | -- | -- | -- | WW | -- | -- |
       * 4 | 16 | ** | 17 | ** | 18 | ** | 19 | ** |
       *   | -- | -- | BB | -- | -- | -- | -- | -- |
       * 5 | ** | 20 | ** | 21 | ** | 22 | ** | 23 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 6 | 24 | ** | 25 | ** | 26 | ** | 27 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 7 | ** | 28 | ** | 29 | ** | 30 | ** | 31 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       */
      it("Black illegally won by hacking the end game score", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = emptyState;
        match.stateAfterMove = copyState(emptyState);
        match.move = [];

        match.stateBeforeMove['9'] = "BCRO";
        match.stateBeforeMove['14'] = "WMAN";
        match.stateBeforeMove['17'] = "BMAN";
        match.stateAfterMove['9'] = "EMPTY";
        match.stateAfterMove['5'] = "BCRO";
        match.stateAfterMove['14'] = "WMAN";
        match.stateAfterMove['17'] = "BMAN";
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 9, value: "EMPTY"}});
        match.move.push({set: {key: 5, value: "BCRO"}});
        match.move.push({endMatch: {endMatchScores: [1, 0]}});

        expect(isMoveOk(match)).toEqual({email: 'x@x.x', emailSubject: 'hacker!',
          emailBody: 'Illegal winner'});
      });
    });
  });

  describe('isMoveOk:', function () {

  })

});