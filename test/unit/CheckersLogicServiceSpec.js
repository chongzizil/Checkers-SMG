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

var expectIllegalOperation = function (checkersLogicService, match, illegalCode) {
  var emailBody = '';

  emailBody = checkersLogicService.getIllegalEmailBody(illegalCode);

  expect(checkersLogicService.isMoveOk(match)).
      toEqual({
        email: 'yl1949@nyu.edu',
        emailSubject: 'hacker!',
        emailBody: emailBody
      });
};

describe('checkersLogicService unit tests:', function () {
  var checkersLogicService,
      ILLEGAL_CODE,
      emptyState = {},
      initialState = {},
      BLACK_TURN_INDEX = 0,
      WHITE_TURN_INDEX = 1,
      i;

  // Set up the module
  beforeEach(module('checkers'));

  // Set up the service
  beforeEach(inject(function (_checkersLogicService_) {
    checkersLogicService = _checkersLogicService_;
    ILLEGAL_CODE = checkersLogicService.ILLEGAL_CODE;
  }));

  // Set up an empty (no pieces on board) state for test random situation
  beforeEach(function setEmptyState() {
    emptyState = {};
    for (
      i = 0;
      i < checkersLogicService.CONSTANT.get('ROW') *
          checkersLogicService.CONSTANT.get('COLUMN');
      i += 1
    ) {
      emptyState[i] = 'EMPTY';
    }
  });

  // Set up an initial set up state
  beforeEach(function setInitialState() {
    initialState = {};

    for (
      i = 0;
      i < (checkersLogicService.CONSTANT.get('ROW') - 2)
          / 2 * checkersLogicService.CONSTANT.get('COLUMN');
      i += 1
    ) {
      initialState[i] = 'BMAN';
    }

    for (
      i = (checkersLogicService.CONSTANT.get('ROW') / 2 - 1)
        * checkersLogicService.CONSTANT.get('COLUMN');
      i < (checkersLogicService.CONSTANT.get('ROW') / 2 + 1)
        * checkersLogicService.CONSTANT.get('COLUMN');
      i  += 1
    ) {
      initialState[i] = 'EMPTY';
    }

    for (
      i = (checkersLogicService.CONSTANT.get('ROW') / 2 + 1)
        * checkersLogicService.CONSTANT.get('COLUMN');
      i < checkersLogicService.CONSTANT.get('ROW')
        * checkersLogicService.CONSTANT.get('COLUMN');
      i  += 1
    ) {
      initialState[i] = 'WMAN';
    }
  });

  it('Should have those functions.', function () {
    expect(angular.isFunction(checkersLogicService.isMoveOk)).toBe(true);
    expect(angular.isFunction(checkersLogicService.getNextState)).toBe(true);
    expect(angular.isFunction(checkersLogicService.getInitialMove)).toBe(true);
    expect(angular.isFunction(checkersLogicService.getExpectedOperations)).
        toBe(true);
    expect(angular.isFunction(checkersLogicService.getJumpMoves)).toBe(true);
    expect(angular.isFunction(checkersLogicService.getSimpleMoves)).toBe(true);
    expect(angular.isFunction(checkersLogicService.getAllPossibleMoves))
        .toBe(true);
    expect(angular.isFunction(checkersLogicService.checkMandatoryJump))
        .toBe(true);
    expect(angular.isFunction(checkersLogicService.calculateJumpedIndex))
        .toBe(true);
    expect(angular.isFunction(
        checkersLogicService.convertGameApiStateToCheckersState
    )).toBe(true);
    expect(angular.isFunction(
        checkersLogicService.checkTurnIndexMatchesPieceColor
    )).toBe(true);
    expect(angular.isFunction(checkersLogicService.hasWon)).toBe(true);
    expect(angular.isFunction(checkersLogicService.cloneObj)).toBe(true);
    expect(angular.isFunction(checkersLogicService.isEmptyObj)).toBe(true);
  });

  describe('isMoveOk:', function () {
    describe("INITIALIZE - BLACK:", function () {
      it("Black legally makes the initialize move", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = {};
        match.stateAfterMove = initialState;
        match.move = checkersLogicService.getInitialMove();

        expect(checkersLogicService.isMoveOk(match)).toBe(true);
      });

      it("Black illegally makes the initialize move at the middle of the game",
          function () {
            var match = {};
            match.turnIndexBeforeMove = BLACK_TURN_INDEX;
            match.turnIndexAfterMove = BLACK_TURN_INDEX;
            match.stateBeforeMove = initialState;
            match.stateAfterMove = initialState;
            match.move = checkersLogicService.getInitialMove();

            expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_MOVE'));
          });

      it("White illegally makes the initialize move", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = {};
        match.stateAfterMove = initialState;
        match.move = checkersLogicService.getInitialMove();

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_MOVE'));
      });
    });

    /*
     * FIRST STATE SCENARIO - BLACK
     *
     *      0    1    2    3    4    5    6    7
     * 0 | ** |  0 | ** |  1 | ** |  2 | ** |  3 |
     *   | -- | BM | -- | BM | -- | BM | -- | BM |
     * 1 |  4 | ** |  5 | ** |  6 | ** |  7 | ** |
     *   | BM | -- | BM | -- | BM | -- | BM | -- |
     * 2 | ** |  8 | ** |  9 | ** | 10 | ** | 11 |
     *   | -- | BM | -- | BM | -- | BM | -- | BM |
     * 3 | 12 | ** | 13 | ** | 14 | ** | 15 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 4 | ** | 16 | ** | 17 | ** | 18 | ** | 19 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 5 | 20 | ** | 21 | ** | 22 | ** | 23 | ** |
     *   | WM | -- | WM | -- | WM | -- | WM | -- |
     * 6 | ** | 24 | ** | 25 | ** | 26 | ** | 27 |
     *   | -- | WM | -- | WM | -- | WM | -- | WM |
     * 7 | 28 | ** | 29 | ** | 30 | ** | 31 | ** |
     *   | WM | -- | WM | -- | WM | -- | WM | -- |
     */
    describe("FIRST STATE SCENARIO - BLACK:", function () {
      it("8 -> 12", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = initialState;
        match.stateAfterMove = copyState(initialState);
        match.move = [];

        match.stateAfterMove['8'] = "EMPTY";
        match.stateAfterMove['12'] = "BMAN";
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 8, value: "EMPTY"}});
        match.move.push({set: {key: 12, value: "BMAN"}});

        expect(checkersLogicService.isMoveOk(match)).toBe(true);
      });

      it("8 -> 14: Illegal because it can only move one square diagonally to" +
              "an adjacent unoccupied dark square.", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = initialState;
        match.stateAfterMove = copyState(initialState);
        match.move = [];

        match.stateAfterMove['8'] = "EMPTY";
        match.stateAfterMove['14'] = "BMAN";
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 8, value: "EMPTY"}});
        match.move.push({set: {key: 14, value: "BMAN"}});

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_SIMPLE_MOVE'));
      });

      it("8 -> 16: Illegal because it can only move one square diagonally to" +
          "an adjacent unoccupied dark square.", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = initialState;
        match.stateAfterMove = copyState(initialState);
        match.move = [];

        match.stateAfterMove['8'] = "EMPTY";
        match.stateAfterMove['16'] = "BMAN";
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 8, value: "EMPTY"}});
        match.move.push({set: {key: 16, value: "BMAN"}});

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_SIMPLE_MOVE'));
      });

      it("8 -> 4: Illegal because MAN can not move backward", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = initialState;
        // Empty 4 first
        match.stateBeforeMove['4'] = "EMPTY";
        match.stateAfterMove = copyState(initialState);
        match.move = [];

        match.stateAfterMove['8'] = "EMPTY";
        match.stateAfterMove['4'] = "BMAN";
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 8, value: "EMPTY"}});
        match.move.push({set: {key: 4, value: "BMAN"}});

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_SIMPLE_MOVE'));
      });

      it("8 -> 4: Illegal because 4 is occupied", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = initialState;
        match.stateAfterMove = copyState(initialState);
        match.move = [];

        match.stateAfterMove['8'] = "EMPTY";
        match.stateAfterMove['4'] = "BMAN";
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 8, value: "EMPTY"}});
        match.move.push({set: {key: 4, value: "BMAN"}});

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_SIMPLE_MOVE'));
      });

      it("20 -> 16: Illegal because the player can only move his/her own" +
          "pieces", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = initialState;
        match.stateAfterMove = copyState(initialState);
        match.move = [];

        match.stateAfterMove['20'] = "EMPTY";
        match.stateAfterMove['16'] = "WMAN";
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 20, value: "EMPTY"}});
        match.move.push({set: {key: 16, value: "WMAN"}});

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_SIMPLE_MOVE'));
      });

      it("? -> 15: Illegal because the piece does not exist", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = initialState;
        match.stateAfterMove = copyState(initialState);
        match.move = [];

        match.stateAfterMove['33'] = "EMPTY";
        match.stateAfterMove['15'] = "BMAN";
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 33, value: "EMPTY"}});
        match.move.push({set: {key: 15, value: "BMAN"}});

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_INDEX'));
      });

      it("8 -> ?: Illegal because it moves to a non exist square", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = initialState;
        match.stateAfterMove = copyState(initialState);
        match.move = [];

        match.stateAfterMove['8'] = "EMPTY";
        match.stateAfterMove['33'] = "BMAN";
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 8, value: "EMPTY"}});
        match.move.push({set: {key: 33, value: "BMAN"}});

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_INDEX'));
      });
    });

    /*
     * FIRST STATE SCENARIO - WHITE (Black first move: 8 -> 12)
     *
     *      0    1    2    3    4    5    6    7
     * 0 | ** |  0 | ** |  1 | ** |  2 | ** |  3 |
     *   | -- | BM | -- | BM | -- | BM | -- | BM |
     * 1 |  4 | ** |  5 | ** |  6 | ** |  7 | ** |
     *   | BM | -- | BM | -- | BM | -- | BM | -- |
     * 2 | ** |  8 | ** |  9 | ** | 10 | ** | 11 |
     *   | -- | -- | -- | BM | -- | BM | -- | BM |
     * 3 | 12 | ** | 13 | ** | 14 | ** | 15 | ** |
     *   | BM | -- | -- | -- | -- | -- | -- | -- |
     * 4 | ** | 16 | ** | 17 | ** | 18 | ** | 19 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 5 | 20 | ** | 21 | ** | 22 | ** | 23 | ** |
     *   | WM | -- | WM | -- | WM | -- | WM | -- |
     * 6 | ** | 24 | ** | 25 | ** | 26 | ** | 27 |
     *   | -- | WM | -- | WM | -- | WM | -- | WM |
     * 7 | 28 | ** | 29 | ** | 30 | ** | 31 | ** |
     *   | WM | -- | WM | -- | WM | -- | WM | -- |
     */
    describe("FIRST STATE SCENARIO - WHITE:", function () {
      var testState;
      beforeEach(function setTestState() {
        testState = initialState;
        testState['8'] = "EMPTY";
        testState['12'] = "BMAN";
      });

      it("20 -> 16", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateAfterMove = copyState(match.stateBeforeMove);
        match.stateAfterMove['20'] = "EMPTY";
        match.stateAfterMove['16'] = "WMAN";

        match.move = [];
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 20, value: "EMPTY"}});
        match.move.push({set: {key: 16, value: "WMAN"}});

        expect(checkersLogicService.isMoveOk(match)).toBe(true);
      });

      it("20 -> 17: Illegal because it can only move one square diagonally to" +
          "an adjacent unoccupied dark square.", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateAfterMove = copyState(match.stateBeforeMove);
        match.stateAfterMove['20'] = "EMPTY";
        match.stateAfterMove['17'] = "WMAN";

        match.move = [];
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 20, value: "EMPTY"}});
        match.move.push({set: {key: 17, value: "WMAN"}});

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_SIMPLE_MOVE'));
      });

      it("21 -> 13: Illegal because it can only move one square diagonally to" +
          "an adjacent unoccupied dark square.", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateAfterMove = copyState(match.stateBeforeMove);
        match.stateAfterMove['21'] = "EMPTY";
        match.stateAfterMove['13'] = "WMAN";

        match.move = [];
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 21, value: "EMPTY"}});
        match.move.push({set: {key: 13, value: "WMAN"}});

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_SIMPLE_MOVE'));
      });

      it("20 -> 24: Illegal because MAN can not move backward", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = initialState;
        // Empty 4 first
        match.stateBeforeMove['24'] = "EMPTY";
        match.stateAfterMove = copyState(initialState);
        match.move = [];

        match.stateAfterMove['20'] = "EMPTY";
        match.stateAfterMove['24'] = "WMAN";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 20, value: "EMPTY"}});
        match.move.push({set: {key: 24, value: "WMAN"}});

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_SIMPLE_MOVE'));
      });

      it("20 -> 24: Illegal because 4 is occupied", function () {
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

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_SIMPLE_MOVE'));
      });

      it("12 -> 16: Illegal because the player can only move his/her own" +
          "pieces", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = initialState;
        match.stateAfterMove = copyState(initialState);
        match.move = [];

        match.stateAfterMove['12'] = "EMPTY";
        match.stateAfterMove['16'] = "BMAN";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 12, value: "EMPTY"}});
        match.move.push({set: {key: 16, value: "BMAN"}});

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_SIMPLE_MOVE'));
      });

      it("? -> 16: Illegal because the piece does not exist", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = initialState;
        match.stateAfterMove = copyState(initialState);
        match.move = [];

        match.stateAfterMove['33'] = "EMPTY";
        match.stateAfterMove['16'] = "WMAN";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 33, value: "EMPTY"}});
        match.move.push({set: {key: 16, value: "WMAN"}});

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_INDEX'));
      });

      it("20 -> ?: Illegal because it moves to a non exist square", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = initialState;
        match.stateAfterMove = copyState(initialState);
        match.move = [];

        match.stateAfterMove['20'] = "EMPTY";
        match.stateAfterMove['33'] = "WMAN";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 20, value: "EMPTY"}});
        match.move.push({set: {key: 33, value: "WMAN"}});

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_INDEX'));
      });
    });

    /*
     * MANDATORY JUMP SCENARIO - BLACK
     *
     *     0    1    2    3    4    5    6    7
     * 0 | ** |  0 | ** |  1 | ** |  2 | ** |  3 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 1 |  4 | ** |  5 | ** |  6 | ** |  7 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 2 | ** |  8 | ** |  9 | ** | 10 | ** | 11 |
     *   | -- | -- | -- | WM | -- | -- | -- | -- |
     * 3 | 12 | ** | 13 | ** | 14 | ** | 15 | ** |
     *   | -- | -- | BC | -- | -- | -- | -- | -- |
     * 4 | ** | 16 | ** | 17 | ** | 18 | ** | 19 |
     *   | -- | -- | -- | -- | -- | WM | -- | -- |
     * 5 | 20 | ** | 21 | ** | 22 | ** | 23 | ** |
     *   | -- | -- | -- | -- | WC | -- | -- | -- |
     * 6 | ** | 24 | ** | 25 | ** | 26 | ** | 27 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 7 | 28 | ** | 29 | ** | 30 | ** | 31 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     */
    describe('MANDATORY JUMP SCENARIO - BLACK:', function () {
      var testState;
      beforeEach(function setTestState() {
        testState = emptyState;
        testState['9'] = "WMAN";
        testState['13'] = "BCRO";
        testState['18'] = "BMAN";
        testState['22'] = "WCRO";
      });

      it("13 -> 9 -> 6", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateAfterMove = copyState(testState);
        match.move = [];

        match.stateAfterMove['13'] = "EMPTY";
        match.stateAfterMove['9'] = "EMPTY";
        match.stateAfterMove['6'] = "BCRO";
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 13, value: "EMPTY"}});
        match.move.push({set: {key: 9, value: "EMPTY"}});
        match.move.push({set: {key: 6, value: "BCRO"}});

        expect(checkersLogicService.isMoveOk(match)).toEqual(true);
      });

      it("18 -> 22 -> 25", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateAfterMove = copyState(testState);
        match.move = [];

        match.stateAfterMove['18'] = "EMPTY";
        match.stateAfterMove['22'] = "EMPTY";
        match.stateAfterMove['25'] = "BMAN";
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 18, value: "EMPTY"}});
        match.move.push({set: {key: 22, value: "EMPTY"}});
        match.move.push({set: {key: 25, value: "BMAN"}});

        expect(checkersLogicService.isMoveOk(match)).toEqual(true);
      });

      it("13 - 8: Illegal because 13 ignores the mandatory jump", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateAfterMove = copyState(testState);
        match.move = [];

        match.stateAfterMove['13'] = "EMPTY";
        match.stateAfterMove['8'] = "BCRO";
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 13, value: "EMPTY"}});
        match.move.push({set: {key: 8, value: "BCRO"}});

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_IGNORE_MANDATORY_JUMP'));
      });

      it("18 - 23: Illegal because 18 ignores the mandatory jump", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateAfterMove = copyState(testState);
        match.move = [];

        match.stateAfterMove['18'] = "EMPTY";
        match.stateAfterMove['23'] = "BMAN";
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 18, value: "EMPTY"}});
        match.move.push({set: {key: 23, value: "BMAN"}});

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_IGNORE_MANDATORY_JUMP'));
      });
    });

    /*
     * MANDATORY JUMP SCENARIO - WHITE
     *
     *     0    1    2    3    4    5    6    7
     * 0 | ** |  0 | ** |  1 | ** |  2 | ** |  3 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 1 |  4 | ** |  5 | ** |  6 | ** |  7 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 2 | ** |  8 | ** |  9 | ** | 10 | ** | 11 |
     *   | -- | -- | -- | BC | -- | -- | -- | -- |
     * 3 | 12 | ** | 13 | ** | 14 | ** | 15 | ** |
     *   | -- | -- | WM | -- | -- | -- | -- | -- |
     * 4 | ** | 16 | ** | 17 | ** | 18 | ** | 19 |
     *   | -- | -- | -- | -- | -- | WC | -- | -- |
     * 5 | 20 | ** | 21 | ** | 22 | ** | 23 | ** |
     *   | -- | -- | -- | -- | BM | -- | -- | -- |
     * 6 | ** | 24 | ** | 25 | ** | 26 | ** | 27 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 7 | 28 | ** | 29 | ** | 30 | ** | 31 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     */
    describe('MANDATORY JUMP SCENARIO - WHITE', function () {
      var testState;
      beforeEach(function setTestState() {
        testState = emptyState;
        testState['9'] = "BCRO";
        testState['13'] = "WMAN";
        testState['18'] = "WCRO";
        testState['22'] = "BMAN";
      });

      it("13 -> 9 -> 6", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateAfterMove = copyState(testState);
        match.move = [];

        match.stateAfterMove['13'] = "EMPTY";
        match.stateAfterMove['9'] = "EMPTY";
        match.stateAfterMove['6'] = "WMAN";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 13, value: "EMPTY"}});
        match.move.push({set: {key: 9, value: "EMPTY"}});
        match.move.push({set: {key: 6, value: "WMAN"}});

        expect(checkersLogicService.isMoveOk(match)).toEqual(true);
      });

      it("18 -> 22 -> 25", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateAfterMove = copyState(testState);
        match.move = [];

        match.stateAfterMove['18'] = "EMPTY";
        match.stateAfterMove['22'] = "EMPTY";
        match.stateAfterMove['25'] = "WCRO";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 18, value: "EMPTY"}});
        match.move.push({set: {key: 22, value: "EMPTY"}});
        match.move.push({set: {key: 25, value: "WCRO"}});

        expect(checkersLogicService.isMoveOk(match)).toEqual(true);
      });

      it("13 - 8: Illegal because 13 ignores the mandatory jump", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateAfterMove = copyState(testState);
        match.move = [];

        match.stateAfterMove['13'] = "EMPTY";
        match.stateAfterMove['8'] = "WMAN";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 13, value: "EMPTY"}});
        match.move.push({set: {key: 8, value: "WMAN"}});

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_IGNORE_MANDATORY_JUMP'));
      });

      it("18 - 23: Illegal because 18 ignores the mandatory jump", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateAfterMove = copyState(testState);
        match.move = [];

        match.stateAfterMove['18'] = "EMPTY";
        match.stateAfterMove['23'] = "WCRO";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 18, value: "EMPTY"}});
        match.move.push({set: {key: 23, value: "WCRO"}});

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_IGNORE_MANDATORY_JUMP'));
      });
    });

    /*
     * CROWNED SCENARIO - BLACK
     *
     *      0    1    2    3    4    5    6    7
     * 0 | ** |  0 | ** |  1 | ** |  2 | ** |  3 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 1 |  4 | ** |  5 | ** |  6 | ** |  7 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 2 | ** |  8 | ** |  9 | ** | 10 | ** | 11 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 3 | 12 | ** | 13 | ** | 14 | ** | 15 | ** |
     *   | -- | -- | BM | -- | -- | -- | -- | -- |
     * 4 | ** | 16 | ** | 17 | ** | 18 | ** | 19 |
     *   | -- | -- | -- | WM?| -- | -- | -- | -- |
     * 5 | 20 | ** | 21 | ** | 22 | ** | 23 | ** |
     *   | -- | -- | BM | -- | -- | -- | -- | -- |
     * 6 | ** | 24 | ** | 25 | ** | 26 | ** | 27 |
     *   | -- | BM | -- | WM?| -- | -- | -- | -- |
     * 7 | 28 | ** | 29 | ** | 30 | ** | 31 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     *
     *   Note: piece with '?' mean the piece exist for certain test case in
     *         order to prevent the influence of mandatory jump.
     */
    describe('CROWNED SCENARIO FOR WHITE', function () {
      var testState;
      beforeEach(function setTestState() {
        testState = emptyState;
        testState['13'] = "BMAN";
        testState['21'] = "BMAN";
        testState['24'] = "BMAN";
      });

      it("24 -> 28*", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateAfterMove = copyState(testState);
        match.move = [];

        match.stateAfterMove['24'] = "EMPTY";
        match.stateAfterMove['28'] = "BCRO";
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 24, value: "EMPTY"}});
        match.move.push({set: {key: 28, value: "BCRO"}});

        expect(checkersLogicService.isMoveOk(match)).toEqual(true);
      });

      it("21 -> 25 -> 30*", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateBeforeMove['25'] = "WMAN";
        match.stateAfterMove = copyState(testState);
        match.move = [];

        match.stateAfterMove['21'] = "EMPTY";
        match.stateAfterMove['25'] = "EMPTY";
        match.stateAfterMove['30'] = "BCRO";
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 21, value: "EMPTY"}});
        match.move.push({set: {key: 25, value: "EMPTY"}});
        match.move.push({set: {key: 30, value: "BCRO"}});
        //TODO: Fix the kind check later.

        expect(checkersLogicService.isMoveOk(match)).toEqual(true);
      });

      it("13 -> 16*: Illegal because it does not move to the final row in" +
          "order to be crowned", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateAfterMove = copyState(testState);
        match.move = [];

        match.stateAfterMove['13'] = "EMPTY";
        match.stateAfterMove['16'] = "BCRO";
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 13, value: "EMPTY"}});
        match.move.push({set: {key: 16, value: "BCRO"}});

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_CROWNED'));
      });

      it("13 -> 17 -> 22*: Illegal because it does not move to the final row" +
          "in order to be crowned", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateBeforeMove['17'] = "WMAN";
        match.stateAfterMove = copyState(testState);
        match.move = [];

        match.stateAfterMove['13'] = "EMPTY";
        match.stateAfterMove['17'] = "EMPTY";
        match.stateAfterMove['22'] = "BCRO";
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 13, value: "EMPTY"}});
        match.move.push({set: {key: 17, value: "EMPTY"}});
        match.move.push({set: {key: 22, value: "BCRO"}});

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_CROWNED'));
      });
    });

    /*
     * CROWNED SCENARIO - WHITE
     *
     *      0    1    2    3    4    5    6    7
     * 0 | ** |  0 | ** |  1 | ** |  2 | ** |  3 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 1 |  4 | ** |  5 | ** |  6 | ** |  7 | ** |
     *   | -- | -- | WM | -- | BM?| -- | -- | -- |
     * 2 | ** |  8 | ** |  9 | ** | 10 | ** | 11 |
     *   | -- | -- | -- | WM | -- | -- | -- | -- |
     * 3 | 12 | ** | 13 | ** | 14 | ** | 15 | ** |
     *   | -- | -- | -- | -- | BM?| -- | -- | -- |
     * 4 | ** | 16 | ** | 17 | ** | 18 | ** | 19 |
     *   | -- | -- | -- | WM | -- | -- | -- | -- |
     * 5 | 20 | ** | 21 | ** | 22 | ** | 23 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 6 | ** | 24 | ** | 25 | ** | 26 | ** | 27 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 7 | 28 | ** | 29 | ** | 30 | ** | 31 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     *
     *   Note: piece with '?' mean the piece exist for certain test case in
     *         order to prevent the influence of mandatory jump.
     */
    describe('CROWNED SCENARIO FOR BLACK', function () {
      var testState;
      beforeEach(function setTestState() {
        testState = emptyState;
        testState['5'] = "WMAN";
        testState['9'] = "WMAN";
        testState['17'] = "WMAN";
      });

      it("5 -> 0*", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateAfterMove = copyState(testState);
        match.move = [];

        match.stateAfterMove['5'] = "EMPTY";
        match.stateAfterMove['0'] = "WCRO";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 5, value: "EMPTY"}});
        match.move.push({set: {key: 0, value: "WCRO"}});

        expect(checkersLogicService.isMoveOk(match)).toEqual(true);
      });

      it("9 -> 6 -> 2*", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateBeforeMove['6'] = "BMAN";
        match.stateAfterMove = copyState(testState);
        match.move = [];

        match.stateAfterMove['9'] = "EMPTY";
        match.stateAfterMove['6'] = "EMPTY";
        match.stateAfterMove['2'] = "WCRO";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 9, value: "EMPTY"}});
        match.move.push({set: {key: 6, value: "EMPTY"}});
        match.move.push({set: {key: 2, value: "WCRO"}});

        expect(checkersLogicService.isMoveOk(match)).toEqual(true);
      });

      it("17 -> 13*: Illegal because it does not move to the final row in" +
          "order to be crowned", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateAfterMove = copyState(testState);
        match.move = [];

        match.stateAfterMove['17'] = "EMPTY";
        match.stateAfterMove['13'] = "WCRO";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 17, value: "EMPTY"}});
        match.move.push({set: {key: 13, value: "WCRO"}});

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_CROWNED'));
      });

      it("17 -> 14 -> 10*: Illegal because it does not move to the final row" +
          "in order to be crowned", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = testState;
        match.stateBeforeMove['14'] = "BMAN";
        match.stateAfterMove = copyState(testState);
        match.move = [];

        match.stateAfterMove['17'] = "EMPTY";
        match.stateAfterMove['14'] = "EMPTY";
        match.stateAfterMove['10'] = "WCRO";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 17, value: "EMPTY"}});
        match.move.push({set: {key: 14, value: "EMPTY"}});
        match.move.push({set: {key: 10, value: "WCRO"}});

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_CROWNED'));
      });
    });

    describe("ENDGAME SCENARIO - BLACK", function () {
      /*
       * END GAME SCENARIO - BLACK
       *
       *      0    1    2    3    4    5    6    7
       * 0 | ** |  0 | ** |  1 | ** |  2 | ** |  3 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 1 |  4 | ** |  5 | ** |  6 | ** |  7 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 2 | ** |  8 | ** |  9 | ** | 10 | ** | 11 |
       *   | -- | -- | -- | BM | -- | -- | -- | -- |
       * 3 | 12 | ** | 13 | ** | 14 | ** | 15 | ** |
       *   | -- | -- | WM | -- | -- | -- | -- | -- |
       * 4 | ** | 16 | ** | 17 | ** | 18 | ** | 19 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 5 | 20 | ** | 21 | ** | 22 | ** | 23 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 6 | ** | 24 | ** | 25 | ** | 26 | ** | 27 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 7 | 28 | ** | 29 | ** | 30 | ** | 31 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       */
      it("9 -> 13 - > 16", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = emptyState;
        match.stateAfterMove = copyState(emptyState);
        match.move = [];

        match.stateBeforeMove['9'] = "BMAN";
        match.stateBeforeMove['13'] = "WMAN";
        match.stateAfterMove['9'] = "EMPTY";
        match.stateAfterMove['13'] = "EMPTY";
        match.stateAfterMove['16'] = "BMAN";
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 9, value: "EMPTY"}});
        match.move.push({set: {key: 13, value: "EMPTY"}});
        match.move.push({set: {key: 16, value: "BMAN"}});
        match.move.push({endMatch: {endMatchScores: [1, 0]}});

        expect(checkersLogicService.isMoveOk(match)).toEqual(true);
      });

      /*
       * END GAME SCENARIO - BLACK
       *
       *      0    1    2    3    4    5    6    7
       * 0 | ** |  0 | ** |  1 | ** |  2 | ** |  3 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 1 |  4 | ** |  5 | ** |  6 | ** |  7 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 2 | ** |  8 | ** |  9 | ** | 10 | ** | 11 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 3 | 12 | ** | 13 | ** | 14 | ** | 15 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 4 | ** | 16 | ** | 17 | ** | 18 | ** | 19 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 5 | 20 | ** | 21 | ** | 22 | ** | 23 | ** |
       *   | BM | -- | BM | -- | -- | -- | -- | -- |
       * 6 | ** | 24 | ** | 25 | ** | 26 | ** | 27 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 7 | 28 | ** | 29 | ** | 30 | ** | 31 | ** |
       *   | WM | -- | -- | -- | -- | -- | -- | -- |
       */
      it("20 -> 24: Legal because 28 has no moves", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = emptyState;
        match.stateAfterMove = copyState(emptyState);
        match.move = [];

        match.stateBeforeMove['20'] = "BMAN";
        match.stateBeforeMove['21'] = "BMAN";
        match.stateBeforeMove['28'] = "WMAN";
        match.stateAfterMove['20'] = "EMPAY";
        match.stateAfterMove['21'] = "BMAN";
        match.stateAfterMove['24'] = "BMAN";
        match.stateAfterMove['28'] = "WMAN";
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 20, value: "EMPTY"}});
        match.move.push({set: {key: 24, value: "BMAN"}});
        match.move.push({endMatch: {endMatchScores: [1, 0]}});

        expect(checkersLogicService.isMoveOk(match)).toEqual(true);
      });

      /**
       * END GAME SCENARIO - BLACK (ILLEGAL)
       *
       *      0    1    2    3    4    5    6    7
       * 0 | ** |  0 | ** |  1 | ** |  2 | ** |  3 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 1 |  4 | ** |  5 | ** |  6 | ** |  7 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 2 | ** |  8 | ** |  9 | ** | 10 | ** | 11 |
       *   | -- | -- | -- | BM | -- | -- | -- | -- |
       * 3 | 12 | ** | 13 | ** | 14 | ** | 15 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 4 | ** | 16 | ** | 17 | ** | 18 | ** | 19 |
       *   | -- | WM | -- | -- | -- | -- | -- | -- |
       * 5 | 20 | ** | 21 | ** | 22 | ** | 23 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 6 | ** | 24 | ** | 25 | ** | 26 | ** | 27 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 7 | 28 | ** | 29 | ** | 30 | ** | 31 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       */
      it("9 -> 13: Illegal because the game is not ended.", function () {
        var match = {};
        match.turnIndexBeforeMove = BLACK_TURN_INDEX;
        match.turnIndexAfterMove = WHITE_TURN_INDEX;
        match.stateBeforeMove = emptyState;
        match.stateAfterMove = copyState(emptyState);
        match.move = [];

        match.stateBeforeMove['16'] = "WMAN";
        match.stateBeforeMove['9'] = "BMAN";
        match.stateAfterMove['9'] = "EMPTY";
        match.stateAfterMove['13'] = "BMAN";
        match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
        match.move.push({set: {key: 9, value: "EMPTY"}});
        match.move.push({set: {key: 13, value: "BMAN"}});
        match.move.push({endMatch: {endMatchScores: [1, 0]}});

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_END_MATCH_SCORE'));
      });
    });

    describe("ENDGAME SCENARIO - WHITE: ", function () {
      /*
       * END GAME SCENARIO - WHITE
       *
       *      0    1    2    3    4    5    6    7
       * 0 | ** |  0 | ** |  1 | ** |  2 | ** |  3 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 1 |  4 | ** |  5 | ** |  6 | ** |  7 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 2 | ** |  8 | ** |  9 | ** | 10 | ** | 11 |
       *   | -- | -- | -- | BM | -- | -- | -- | -- |
       * 3 | 12 | ** | 13 | ** | 14 | ** | 15 | ** |
       *   | -- | -- | WM | -- | -- | -- | -- | -- |
       * 4 | ** | 16 | ** | 17 | ** | 18 | ** | 19 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 5 | 20 | ** | 21 | ** | 22 | ** | 23 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 6 | ** | 24 | ** | 25 | ** | 26 | ** | 27 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 7 | 28 | ** | 29 | ** | 30 | ** | 31 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       */
      it("13 -> 9 -> 6", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = emptyState;
        match.stateAfterMove = copyState(emptyState);
        match.move = [];

        match.stateBeforeMove['13'] = "WMAN";
        match.stateBeforeMove['9'] = "BMAN";
        match.stateAfterMove['13'] = "EMPTY";
        match.stateAfterMove['9'] = "EMPTY";
        match.stateAfterMove['6'] = "WMAN";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 13, value: "EMPTY"}});
        match.move.push({set: {key: 9, value: "EMPTY"}});
        match.move.push({set: {key: 6, value: "WMAN"}});
        match.move.push({endMatch: {endMatchScores: [0, 1]}});

        expect(checkersLogicService.isMoveOk(match)).toEqual(true);
      });

      /*
       * END GAME SCENARIO - WHITE
       *
       *      0    1    2    3    4    5    6    7
       * 0 | ** |  0 | ** |  1 | ** |  2 | ** |  3 |
       *   | -- | -- | -- | -- | -- | -- | -- | BM |
       * 1 |  4 | ** |  5 | ** |  6 | ** |  7 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 2 | ** |  8 | ** |  9 | ** | 10 | ** | 11 |
       *   | -- | -- | -- | -- | -- | WM | -- | WM |
       * 3 | 12 | ** | 13 | ** | 14 | ** | 15 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 4 | ** | 16 | ** | 17 | ** | 18 | ** | 19 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 5 | 20 | ** | 21 | ** | 22 | ** | 23 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 6 | ** | 24 | ** | 25 | ** | 26 | ** | 27 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 7 | 28 | ** | 29 | ** | 30 | ** | 31 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       */
      it("11 -> 7: Legal because 3 has no moves", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = emptyState;
        match.stateAfterMove = copyState(emptyState);
        match.move = [];

        match.stateBeforeMove['3'] = "BMAN";
        match.stateBeforeMove['10'] = "WMAN";
        match.stateBeforeMove['11'] = "WMAN";
        match.stateAfterMove['3'] = "BMAN";
        match.stateAfterMove['7'] = "WMAN";
        match.stateAfterMove['10'] = "WMAN";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 11, value: "EMPTY"}});
        match.move.push({set: {key: 7, value: "WMAN"}});
        match.move.push({endMatch: {endMatchScores: [0, 1]}});

        expect(checkersLogicService.isMoveOk(match)).toEqual(true);
      });

      /**
       * END GAME SCENARIO - WHITE (ILLEGAL)
       *
       *      0    1    2    3    4    5    6    7
       * 0 | ** |  0 | ** |  1 | ** |  2 | ** |  3 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 1 |  4 | ** |  5 | ** |  6 | ** |  7 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 2 | ** |  8 | ** |  9 | ** | 10 | ** | 11 |
       *   | -- | -- | -- | BM | -- | -- | -- | -- |
       * 3 | 12 | ** | 13 | ** | 14 | ** | 15 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 4 | ** | 16 | ** | 17 | ** | 18 | ** | 19 |
       *   | -- | WM | -- | -- | -- | -- | -- | -- |
       * 5 | 20 | ** | 21 | ** | 22 | ** | 23 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 6 | ** | 24 | ** | 25 | ** | 26 | ** | 27 |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       * 7 | 28 | ** | 29 | ** | 30 | ** | 31 | ** |
       *   | -- | -- | -- | -- | -- | -- | -- | -- |
       */
      it("16 -> 13: Illegal because the game is not ended.", function () {
        var match = {};
        match.turnIndexBeforeMove = WHITE_TURN_INDEX;
        match.turnIndexAfterMove = BLACK_TURN_INDEX;
        match.stateBeforeMove = emptyState;
        match.stateAfterMove = copyState(emptyState);
        match.move = [];

        match.stateBeforeMove['9'] = "BMAN";
        match.stateBeforeMove['16'] = "WMAN";
        match.stateAfterMove['16'] = "EMPTY";
        match.stateAfterMove['13'] = "WMAN";
        match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
        match.move.push({set: {key: 16, value: "EMPTY"}});
        match.move.push({set: {key: 13, value: "WMAN"}});
        match.move.push({endMatch: {endMatchScores: [0, 1]}});

        expectIllegalOperation(checkersLogicService, match, ILLEGAL_CODE.get('ILLEGAL_END_MATCH_SCORE'));
      });
    });
  });

  describe('Test getExpectedOperations:', function () {
    var setBlackTurn = {setTurn: {turnIndex: 0}};
    var setWhiteTurn = {setTurn: {turnIndex: 1}};
    var setBlackWin= {endMatch: {endMatchScores: [1, 0]}};
    var setWhiteWin = {endMatch: {endMatchScores: [0, 1]}};

    /*
     * SIMPLE MOVE SCENARIO
     *
     *      0    1    2    3    4    5    6    7
     * 0 | ** |  0 | ** |  1 | ** |  2 | ** |  3 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 1 |  4 | ** |  5 | ** |  6 | ** |  7 | ** |
     *   | -- | -- | BC | -- | -- | -- | BM | -- |
     * 2 | ** |  8 | ** |  9 | ** | 10 | ** | 11 |
     *   | -- | -- | -- | BM | -- | -- | -- | -- |
     * 3 | 12 | ** | 13 | ** | 14 | ** | 15 | ** |
     *   | -- | -- | WM | -- | -- | -- | -- | -- |
     * 4 | ** | 16 | ** | 17 | ** | 18 | ** | 19 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 5 | 20 | ** | 21 | ** | 22 | ** | 23 | ** |
     *   | -- | -- | WC | -- | -- | -- | WM | -- |
     * 6 | ** | 24 | ** | 25 | ** | 26 | ** | 27 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 7 | 28 | ** | 29 | ** | 30 | ** | 31 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     */
    describe('SIMPLE MOVE SCENARIO:', function () {
      var state;
      beforeEach(function () {
        state = emptyState;
        state[5] = 'BCRO';
        state[7] = 'BMAN';
        state[21] = 'WCRO';
        state[23] = 'WMAN';
      });

      /*************************************************************************
       * BLACK
       ************************************************************************/

      it("Black player try to move white player's piece", function () {
        expect(function () {
          checkersLogicService.getExpectedOperations(state, 23, 18, 0);
        }).toThrow();
      });

      it('Black move up left', function () {
        var expectedOperations =
            checkersLogicService.getExpectedOperations(state, 5, 0, 0);

        expect(expectedOperations.length).toEqual(3);
        expect(expectedOperations[0])
            .toEqual({set: {key: 5, value: "EMPTY"}});
        expect(expectedOperations[1])
            .toEqual({set: {key: 0, value: "BCRO"}});
        expect(expectedOperations[2]).toEqual(setWhiteTurn);
      });

      it('Black move up right', function () {
        var expectedOperations =
            checkersLogicService.getExpectedOperations(state, 5, 1, 0);
        expect(expectedOperations.length).toEqual(3);
        expect(expectedOperations[0])
            .toEqual({set: {key: 5, value: "EMPTY"}});
        expect(expectedOperations[1])
            .toEqual({set: {key: 1, value: "BCRO"}});
        expect(expectedOperations[2]).toEqual(setWhiteTurn);
      });

      it('Black move down left', function () {
        var expectedOperations =
            checkersLogicService.getExpectedOperations(state, 7, 10, 0);
        expect(expectedOperations.length).toEqual(3);
        expect(expectedOperations[0])
            .toEqual({set: {key: 7, value: "EMPTY"}});
        expect(expectedOperations[1])
            .toEqual({set: {key: 10, value: "BMAN"}});
        expect(expectedOperations[2]).toEqual(setWhiteTurn);
      });

      it('Black move down right', function () {
        var expectedOperations =
            checkersLogicService.getExpectedOperations(state, 7, 11, 0);
        expect(expectedOperations.length).toEqual(3);
        expect(expectedOperations[0])
            .toEqual({set: {key: 7, value: "EMPTY"}});
        expect(expectedOperations[1])
            .toEqual({set: {key: 11, value: "BMAN"}});
        expect(expectedOperations[2]).toEqual(setWhiteTurn);
      });

      /*************************************************************************
       * WHITE
       ************************************************************************/

      it("White player try to move black player's piece", function () {
        expect(function () {
          checkersLogicService.getExpectedOperations(state, 5, 0, 1);
        }).toThrow();
      });

      it('White move up left', function () {
        var expectedOperations =
            checkersLogicService.getExpectedOperations(state, 23, 18, 1);
        expect(expectedOperations.length).toEqual(3);
        expect(expectedOperations[0])
            .toEqual({set: {key: 23, value: "EMPTY"}});
        expect(expectedOperations[1])
            .toEqual({set: {key: 18, value: "WMAN"}});
        expect(expectedOperations[2]).toEqual(setBlackTurn);
      });

      it('White move up right', function () {
        var expectedOperations =
            checkersLogicService.getExpectedOperations(state, 23, 19, 1);
        expect(expectedOperations.length).toEqual(3);
        expect(expectedOperations[0])
            .toEqual({set: {key: 23, value: "EMPTY"}});
        expect(expectedOperations[1])
            .toEqual({set: {key: 19, value: "WMAN"}});
        expect(expectedOperations[2]).toEqual(setBlackTurn);
      });

      it('White move down left', function () {
        var expectedOperations =
            checkersLogicService.getExpectedOperations(state, 21, 24, 1);
        expect(expectedOperations.length).toEqual(3);
        expect(expectedOperations[0])
            .toEqual({set: {key: 21, value: "EMPTY"}});
        expect(expectedOperations[1])
            .toEqual({set: {key: 24, value: "WCRO"}});
        expect(expectedOperations[2]).toEqual(setBlackTurn);
      });

      it('White move down right', function () {
        var expectedOperations =
            checkersLogicService.getExpectedOperations(state, 21, 25, 1);
        expect(expectedOperations.length).toEqual(3);
        expect(expectedOperations[0])
            .toEqual({set: {key: 21, value: "EMPTY"}});
        expect(expectedOperations[1])
            .toEqual({set: {key: 25, value: "WCRO"}});
        expect(expectedOperations[2]).toEqual(setBlackTurn);
      });
    });

    /**
     * JUMP MOVE SCENARIO
     *
     *      0    1    2    3    4    5    6    7
     * 0 | ** |  0 | ** |  1 | ** |  2 | ** |  3 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 1 |  4 | ** |  5 | ** |  6 | ** |  7 | ** |
     *   | -- | -- | WM | -- | WM | -- | -- | -- |
     * 2 | ** |  8 | ** |  9 | ** | 10 | ** | 11 |
     *   | -- | -- | -- | BC | -- | -- | -- | -- |
     * 3 | 12 | ** | 13 | ** | 14 | ** | 15 | ** |
     *   | -- | -- | WM?| -- | WM | -- | -- | -- |
     * 4 | ** | 16 | ** | 17 | ** | 18 | ** | 19 |
     *   | -- | -- | -- | BM | -- | BM?| -- | -- |
     * 5 | 20 | ** | 21 | ** | 22 | ** | 23 | ** |
     *   | -- | -- | -- | -- | WC | -- | -- | -- |
     * 6 | ** | 24 | ** | 25 | ** | 26 | ** | 27 |
     *   | -- | -- | -- | BM | -- | BM | -- | -- |
     * 7 | 28 | ** | 29 | ** | 30 | ** | 31 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     *
     *   Note: piece with '?' mean the piece exist for certain test case in
     *         order to prevent the influence of mandatory jump.
     */
    describe('Test jump move', function () {
      var state;
      beforeEach(function () {
        state = emptyState;
        state[5] = 'WMAN';
        state[6] = 'WMAN';
        state[9] = 'BCRO';
//        state[13] = 'WMAN';
        state[14] = 'WMAN';
        state[17] = 'BMAN';
//        state[18] = 'BMAN';
        state[22] = 'WCRO';
        state[25] = 'BMAN';
        state[26] = 'BMAN';
      });

      /*************************************************************************
       * BLACK
       ************************************************************************/
      it('Black jump up left', function () {
        var expectedOperations =
            checkersLogicService.getExpectedOperations(state, 9, 0, 0);
        expect(expectedOperations.length).toEqual(4);
        expect(expectedOperations[0])
            .toEqual({set: {key: 9, value: "EMPTY"}});
        expect(expectedOperations[1])
            .toEqual({set: {key: 5, value: "EMPTY"}});
        expect(expectedOperations[2])
            .toEqual({set: {key: 0, value: "BCRO"}});
        expect(expectedOperations[3]).toEqual(setWhiteTurn);
      });

      it('Black jump up right', function () {
        var expectedOperations =
            checkersLogicService.getExpectedOperations(state, 9, 2, 0);
        expect(expectedOperations.length).toEqual(4);
        expect(expectedOperations[0])
            .toEqual({set: {key: 9, value: "EMPTY"}});
        expect(expectedOperations[1])
            .toEqual({set: {key: 6, value: "EMPTY"}});
        expect(expectedOperations[2])
            .toEqual({set: {key: 2, value: "BCRO"}});
        expect(expectedOperations[3]).toEqual(setWhiteTurn);
      });

      it('Black jump down left', function () {
        state[13] = "WMAN";
        var expectedOperations =
            checkersLogicService.getExpectedOperations(state, 9, 16, 0);
        expect(expectedOperations.length).toEqual(4);
        expect(expectedOperations[0])
            .toEqual({set: {key: 9, value: "EMPTY"}});
        expect(expectedOperations[1])
            .toEqual({set: {key: 13, value: "EMPTY"}});
        expect(expectedOperations[2])
            .toEqual({set: {key: 16, value: "BCRO"}});
        expect(expectedOperations[3]).toEqual(setWhiteTurn);
      });

      it('Black jump down right', function () {
        var expectedOperations =
            checkersLogicService.getExpectedOperations(state, 9, 18, 0);
        expect(expectedOperations.length).toEqual(4);
        expect(expectedOperations[0])
            .toEqual({set: {key: 9, value: "EMPTY"}});
        expect(expectedOperations[1])
            .toEqual({set: {key: 14, value: "EMPTY"}});
        expect(expectedOperations[2])
            .toEqual({set: {key: 18, value: "BCRO"}});
        expect(expectedOperations[3]).toEqual(setWhiteTurn);
      });

      /*************************************************************************
       * WHITE
       ************************************************************************/
      it('White jump up left', function () {
        var expectedOperations =
            checkersLogicService.getExpectedOperations(state, 22, 13, 1);
        expect(expectedOperations.length).toEqual(4);
        expect(expectedOperations[0])
            .toEqual({set: {key: 22, value: "EMPTY"}});
        expect(expectedOperations[1])
            .toEqual({set: {key: 17, value: "EMPTY"}});
        expect(expectedOperations[2])
            .toEqual({set: {key: 13, value: "WCRO"}});
        expect(expectedOperations[3])
            .toEqual(setBlackTurn);
      });

      it('White jump up right', function () {
        state[18] = "BMAN";
        var expectedOperations =
            checkersLogicService.getExpectedOperations(state, 22, 15, 1);
        expect(expectedOperations.length).toEqual(4);
        expect(expectedOperations[0])
            .toEqual({set: {key: 22, value: "EMPTY"}});
        expect(expectedOperations[1])
            .toEqual({set: {key: 18, value: "EMPTY"}});
        expect(expectedOperations[2])
            .toEqual({set: {key: 15, value: "WCRO"}});
        expect(expectedOperations[3]).toEqual(setBlackTurn);
      });

      it('White jump down left', function () {
        var expectedOperations =
            checkersLogicService.getExpectedOperations(state, 22, 29, 1);
        expect(expectedOperations.length).toEqual(4);
        expect(expectedOperations[0])
            .toEqual({set: {key: 22, value: "EMPTY"}});
        expect(expectedOperations[1])
            .toEqual({set: {key: 25, value: "EMPTY"}});
        expect(expectedOperations[2])
            .toEqual({set: {key: 29, value: "WCRO"}});
        expect(expectedOperations[3]).toEqual(setBlackTurn);
      });

      it('White jump down right', function () {
        var expectedOperations =
            checkersLogicService.getExpectedOperations(state, 22, 31, 1);
        expect(expectedOperations.length).toEqual(4);
        expect(expectedOperations[0])
            .toEqual({set: {key: 22, value: "EMPTY"}});
        expect(expectedOperations[1])
            .toEqual({set: {key: 26, value: "EMPTY"}});
        expect(expectedOperations[2])
            .toEqual({set: {key: 31, value: "WCRO"}});
        expect(expectedOperations[3]).toEqual(setBlackTurn);
      });
    });

    /**
     * CONSECUTIVE JUMPS SCENARIO
     *
     *      0    1    2    3    4    5    6    7
     * 0 | ** |  0 | ** |  1 | ** |  2 | ** |  3 |
     *   | -- | -- | -- | -- | -- | BM | -- | -- |
     * 1 |  4 | ** |  5 | ** |  6 | ** |  7 | ** |
     *   | -- | -- | -- | -- | WM | -- | -- | -- |
     * 2 | ** |  8 | ** |  9 | ** | 10 | ** | 11 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 3 | 12 | ** | 13 | ** | 14 | ** | 15 | ** |
     *   | -- | -- | WM | -- | -- | -- | -- | -- |
     * 4 | ** | 16 | ** | 17 | ** | 18 | ** | 19 |
     *   | -- | -- | -- | -- | -- | BM | -- | -- |
     * 5 | 20 | ** | 21 | ** | 22 | ** | 23 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 6 | ** | 24 | ** | 25 | ** | 26 | ** | 27 |
     *   | -- | -- | -- | BM | -- | -- | -- | -- |
     * 7 | 28 | ** | 29 | ** | 30 | ** | 31 | ** |
     *   | -- | -- | WM | -- | -- | -- | -- | -- |
     */
    describe('Test setTurn in consecutive scenario', function () {
      var state;
      beforeEach(function () {
        state = emptyState;
        state[2] = 'BMAN';
        state[6] = 'WMAN';
        state[13] = 'WMAN';

        state[18] = 'BMAN';
        state[25] = 'BMAN';
        state[29] = 'WMAN';
      });

      it('2 -> 6 -> 9: Black has one more jump 9 -> 13 -> 16', function () {
        var expectedOperations =
            checkersLogicService.getExpectedOperations(state, 2, 9, 0);
        expect(expectedOperations.length).toEqual(4);
        expect(expectedOperations[0])
            .toEqual({set: {key: 2, value: "EMPTY"}});
        expect(expectedOperations[1])
            .toEqual({set: {key: 6, value: "EMPTY"}});
        expect(expectedOperations[2])
            .toEqual({set: {key: 9, value: "BMAN"}});
        expect(expectedOperations[3]).toEqual(setBlackTurn);
      });

      it('29 -> 25 -> 22: White has one more jump 22 -> 18 -> 15', function () {
        var expectedOperations =
            checkersLogicService.getExpectedOperations(state, 29, 22, 1);
        expect(expectedOperations.length).toEqual(4);
        expect(expectedOperations[0])
            .toEqual({set: {key: 29, value: "EMPTY"}});
        expect(expectedOperations[1])
            .toEqual({set: {key: 25, value: "EMPTY"}});
        expect(expectedOperations[2])
            .toEqual({set: {key: 22, value: "WMAN"}});
        expect(expectedOperations[3]).toEqual(setWhiteTurn);
      });
    });

    /**
     * CROWN SCENARIO
     *
     *      0    1    2    3    4    5    6    7
     * 0 | ** |  0 | ** |  1 | ** |  2 | ** |  3 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 1 |  4 | ** |  5 | ** |  6 | ** |  7 | ** |
     *   | -- | -- | WM | -- | BM | -- | -- | -- |
     * 2 | ** |  8 | ** |  9 | ** | 10 | ** | 11 |
     *   | -- | -- | -- | WM | -- | -- | -- | -- |
     * 3 | 12 | ** | 13 | ** | 14 | ** | 15 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 4 | ** | 16 | ** | 17 | ** | 18 | ** | 19 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 5 | 20 | ** | 21 | ** | 22 | ** | 23 | ** |
     *   | -- | -- | -- | -- | BM | -- | -- | -- |
     * 6 | ** | 24 | ** | 25 | ** | 26 | ** | 27 |
     *   | -- | -- | -- | BM | -- | WM | -- | -- |
     * 7 | 28 | ** | 29 | ** | 30 | ** | 31 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     *
     */
    describe('Test crown', function () {
      var state;
      beforeEach(function () {
        state = emptyState;
        state[5] = 'WMAN';
        state[6] = 'BMAN';
        state[9] = 'WMAN';

        state[22] = 'BMAN';
        state[25] = 'BMAN';
        state[26] = 'WMAN';
      });

      it('25 -> 29: Black is crowned through simple move', function () {
        var expectedOperations =
            checkersLogicService.getExpectedOperations(state, 25, 29, 0);
        expect(expectedOperations.length).toEqual(3);
        expect(expectedOperations[0])
            .toEqual({set: {key: 25, value: "EMPTY"}});
        expect(expectedOperations[1])
            .toEqual({set: {key: 29, value: "BCRO"}});
        expect(expectedOperations[2]).toEqual(setWhiteTurn);
      });

      it('22 -> 26 -> 31: Black is crowned through jump move', function () {
        var expectedOperations =
            checkersLogicService.getExpectedOperations(state, 22, 31, 0);
        expect(expectedOperations.length).toEqual(4);
        expect(expectedOperations[0])
            .toEqual({set: {key: 22, value: "EMPTY"}});
        expect(expectedOperations[1])
            .toEqual({set: {key: 26, value: "EMPTY"}});
        expect(expectedOperations[2])
            .toEqual({set: {key: 31, value: "BCRO"}});
        expect(expectedOperations[3]).toEqual(setWhiteTurn);
      });

      it('5 -> 0: White is crowned through simple move', function () {
        var expectedOperations =
            checkersLogicService.getExpectedOperations(state, 5, 0, 1);
        expect(expectedOperations.length).toEqual(3);
        expect(expectedOperations[0])
            .toEqual({set: {key: 5, value: "EMPTY"}});
        expect(expectedOperations[1])
            .toEqual({set: {key: 0, value: "WCRO"}});
        expect(expectedOperations[2]).toEqual(setBlackTurn);
      });

      it('9 -> 6 -> 2: White is crowned through jump move', function () {
        var expectedOperations =
            checkersLogicService.getExpectedOperations(state, 9, 2, 1);
        expect(expectedOperations.length).toEqual(4);
        expect(expectedOperations[0])
            .toEqual({set: {key: 9, value: "EMPTY"}});
        expect(expectedOperations[1])
            .toEqual({set: {key: 6, value: "EMPTY"}});
        expect(expectedOperations[2])
            .toEqual({set: {key: 2, value: "WCRO"}});
        expect(expectedOperations[3]).toEqual(setBlackTurn);
      });
    });

    /**
     * END GAME SCENARIO
     *
     *      0    1    2    3    4    5    6    7
     * 0 | ** |  0 | ** |  1 | ** |  2 | ** |  3 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 1 |  4 | ** |  5 | ** |  6 | ** |  7 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 2 | ** |  8 | ** |  9 | ** | 10 | ** | 11 |
     *   | -- | -- | -- | BM | -- | -- | -- | -- |
     * 3 | 12 | ** | 13 | ** | 14 | ** | 15 | ** |
     *   | -- | -- | WM | -- | -- | -- | -- | -- |
     * 4 | ** | 16 | ** | 17 | ** | 18 | ** | 19 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 5 | 20 | ** | 21 | ** | 22 | ** | 23 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 6 | ** | 24 | ** | 25 | ** | 26 | ** | 27 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 7 | 28 | ** | 29 | ** | 30 | ** | 31 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     */
    describe('Test crown', function () {
      var state;
      beforeEach(function () {
        state = emptyState;
        state[9] = 'BMAN';
        state[13] = 'WMAN';
      });

      it('Black won', function () {
        var expectedOperations =
            checkersLogicService.getExpectedOperations(state, 9, 16, 0);
        expect(expectedOperations.length).toEqual(5);
        expect(expectedOperations[0])
            .toEqual({set: {key: 9, value: "EMPTY"}});
        expect(expectedOperations[1])
            .toEqual({set: {key: 13, value: "EMPTY"}});
        expect(expectedOperations[2])
            .toEqual({set: {key: 16, value: "BMAN"}});
        expect(expectedOperations[3]).toEqual(setWhiteTurn);
        expect(expectedOperations[4])
            .toEqual({endMatch: {endMatchScores: [1, 0]}});
      });

      it('White won', function () {
        var expectedOperations =
            checkersLogicService.getExpectedOperations(state, 13, 6, 1);
        expect(expectedOperations.length).toEqual(5);
        expect(expectedOperations[0])
            .toEqual({set: {key: 13, value: "EMPTY"}});
        expect(expectedOperations[1])
            .toEqual({set: {key: 9, value: "EMPTY"}});
        expect(expectedOperations[2])
            .toEqual({set: {key: 6, value: "WMAN"}});
        expect(expectedOperations[3]).toEqual(setBlackTurn);
        expect(expectedOperations[4])
            .toEqual({endMatch: {endMatchScores: [0, 1]}});
      });

    });
  });
});