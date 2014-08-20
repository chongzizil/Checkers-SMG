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

describe('checkersLogicService unit tests', function () {
  var checkersLogicService,
    emptyState = {},
    initialState = {},
    WHITE_TURN_INDEX = 0,
    BLACK_TURN_INDEX = 1,
    i;

  beforeEach(module('checkers'));

  beforeEach(inject(function (_checkersLogicService_) {
    checkersLogicService = _checkersLogicService_;
  }));

  beforeEach(function setEmptyState() {
    emptyState = {};
    for (i = 0; i < Math.pow(checkersLogicService.CONSTANT.get('ROW'), 2);
         i += 1) {
      emptyState['S' + i] = 'EMPTY';
    }
  });

  beforeEach(function setInitialState() {
    initialState = {};

    for (i = 0; i < (checkersLogicService.CONSTANT.get('ROW') - 2)
        / 2 * checkersLogicService.CONSTANT.get('COLUMN'); i += 1) {
      initialState['S' + i] = 'BMAN';
    }

    for (i = (checkersLogicService.CONSTANT.get('ROW') / 2 - 1)
        * checkersLogicService.CONSTANT.get('COLUMN');
         i < (checkersLogicService.CONSTANT.get('ROW') / 2 + 1)
             * checkersLogicService.CONSTANT.get('COLUMN'); i += 1) {
      initialState['S' + i] = 'EMPTY';
    }

    for (i = (checkersLogicService.CONSTANT.get('ROW') / 2 + 1)
        * checkersLogicService.CONSTANT.get('COLUMN');
         i < checkersLogicService.CONSTANT.get('ROW')
             * checkersLogicService.CONSTANT.get('COLUMN'); i += 1) {
      initialState['S' + i] = 'WMAN';
    }
  });

  it('should have those functions', function () {
    expect(angular.isFunction(checkersLogicService.isMoveOk)).toBe(true);
    expect(angular.isFunction(checkersLogicService.getNextState)).toBe(true);
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
      match.turnIndexBeforeMove = 0;
      match.turnIndexAfterMove = 1;
      match.stateBeforeMove = initialState;
      match.stateAfterMove = copyState(initialState);
      match.move = [];

      match.stateAfterMove.S20 = "EMPTY";
      match.stateAfterMove.S16 = "WMAN";
      match.move.push({setTurn: 1});
      match.move.push({set: {S20: "EMPTY"}});
      match.move.push({set: {S16: "WMAN"}});
      expect(isMoveOk(match)).toBe(true);
    });

    it("White illegally moves S20 to S18 because it can only move one square " +
        "diagonally to an adjacent unoccupied dark square.", function () {
        var match = {};
        match.turnIndexBeforeMove = 0;
        match.turnIndexAfterMove = 1;
        match.stateBeforeMove = initialState;
        match.stateAfterMove = copyState(initialState);
        match.move = [];

        match.stateAfterMove.S20 = "EMPTY";
        match.stateAfterMove.S18 = "WMAN";
        match.move.push({setTurn: 1});
        match.move.push({set: {S20: "EMPTY"}});
        match.move.push({set: {S18: "WMAN"}});
        expect(isMoveOk(match)).toEqual({email: 'x@x.x',
          emailSubject: 'hacker!', emailBody: 'Illegal simple moves!!!'});
    });

    it("White illegally moves S20 to S12 because it can only move one square" +
        "diagonally to an adjacent unoccupied dark square.", function () {
        var match = {};
        match.turnIndexBeforeMove = 0;
        match.turnIndexAfterMove = 1;
        match.stateBeforeMove = initialState;
        match.stateAfterMove = copyState(initialState);
        match.move = [];

        match.stateAfterMove.S20 = "EMPTY";
        match.stateAfterMove.S12 = "WMAN";
        match.move.push({setTurn: 1});
        match.move.push({set: {S20: "EMPTY"}});
        match.move.push({set: {S12: "WMAN"}});
        expect(isMoveOk(match)).toEqual({email: 'x@x.x',
          emailSubject: 'hacker!', emailBody: 'Illegal simple moves!!!'});
    });

    it("White illegally moves S20 to S18 because MAN can not move backward",
        function () {
          var match = {};
          match.turnIndexBeforeMove = 0;
          match.turnIndexAfterMove = 1;
          match.stateBeforeMove = initialState;
          match.stateAfterMove = copyState(initialState);
          match.move = [];

          match.stateAfterMove.S20 = "EMPTY";
          match.stateAfterMove.S24 = "WMAN";
          match.move.push({setTurn: 1});
          match.move.push({set: {S20: "EMPTY"}});
          match.move.push({set: {S24: "WMAN"}});
          expect(isMoveOk(match)).toEqual({email: 'x@x.x',
            emailSubject: 'hacker!', emailBody: 'Illegal simple moves!!!'});
        });

    it("White illegally moves S9 to S12 because the white player can only" +
            " operate on white pieces",
        function () {
          var match = {};
          match.turnIndexBeforeMove = 0;
          match.turnIndexAfterMove = 0;
          match.stateBeforeMove = initialState;
          match.stateAfterMove = copyState(initialState);
          match.move = [];

          match.stateAfterMove.S9 = "EMPTY";
          match.stateAfterMove.S12 = "BMAN";
          match.move.push({setTurn: 1});
          match.move.push({set: {S9: "EMPTY"}});
          match.move.push({set: {S12: "BMAN"}});
          expect(isMoveOk(match)).toEqual({email: 'x@x.x',
            emailSubject: 'hacker!', emailBody: 'Illegal simple moves!!!'});
     });

    it("White illegal moves a non exist piece", function () {
      var match = {};
      match.turnIndexBeforeMove = 0;
      match.turnIndexAfterMove = 0;
      match.stateBeforeMove = initialState;
      match.stateAfterMove = copyState(initialState);
      match.move = [];

      match.stateAfterMove.S33 = "EMPTY";
      match.stateAfterMove.S15 = "WMAN";
      match.move.push({setTurn: 1});
      match.move.push({set: {S33: "EMPTY"}});
      match.move.push({set: {S15: "WMAN"}});
      expect(isMoveOk(match)).toEqual({email: 'x@x.x', emailSubject: 'hacker!',
        emailBody: 'Illegal index'});
    });

    it("White illegal moves S20 to a non exist square", function () {
      var match = {};
      match.turnIndexBeforeMove = 0;
      match.turnIndexAfterMove = 0;
      match.stateBeforeMove = initialState;
      match.stateAfterMove = copyState(initialState);
      match.move = [];

      match.stateAfterMove.S20 = "EMPTY";
      match.stateAfterMove.S33 = "WMAN";
      match.move.push({setTurn: 1});
      match.move.push({set: {S20: "EMPTY"}});
      match.move.push({set: {S33: "WMAN"}});
      expect(isMoveOk(match)).toEqual({email: 'x@x.x', emailSubject: 'hacker!',
        emailBody: 'Illegal index'});
    });
  });

  /**
   * INITIAL STATE SCENARIO, BLACK
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
  describe("Initial state scenario after white's first move", function () {
    it("Black legally moves S8 to S12", function () {
      var match = {};
      match.turnIndexBeforeMove = BLACK_TURN_INDEX;
      match.turnIndexAfterMove = WHITE_TURN_INDEX;
      match.stateBeforeMove = initialState;
      match.stateBeforeMove.S20 = "EMPTY";
      match.stateBeforeMove.S16 = "WMAN";
      match.stateAfterMove = copyState(match.stateBeforeMove);
      match.stateAfterMove.S8 = "EMPTY";
      match.stateAfterMove.S12 = "BMAN";

      match.move = [];
      match.move.push({setTurn: 0});
      match.move.push({set: {S8: "EMPTY"}});
      match.move.push({set: {S12: "BMAN"}});
      expect(isMoveOk(match)).toBe(true);
    });

    it("Black illegally moves S8 to S17 because it can only move one square " +
        "diagonally to an adjacent unoccupied dark square.", function () {
      var match = {};
      match.turnIndexBeforeMove = BLACK_TURN_INDEX;
      match.turnIndexAfterMove = WHITE_TURN_INDEX;
      match.stateBeforeMove = initialState;
      match.stateBeforeMove.S20 = "EMPTY";
      match.stateBeforeMove.S16 = "WMAN";
      match.stateAfterMove = copyState(match.stateBeforeMove);
      match.stateAfterMove.S8 = "EMPTY";
      match.stateAfterMove.S17 = "BMAN";

      match.move = [];
      match.move.push({setTurn: 0});
      match.move.push({set: {S8: "EMPTY"}});
      match.move.push({set: {S17: "BMAN"}});
      expect(isMoveOk(match)).toEqual({ email : 'x@x.x',
        emailSubject : 'hacker!', emailBody : 'Illegal simple moves!!!' });
    });

    it("Black illegally moves S8 to S16 because it can only move one square" +
        "diagonally to an adjacent unoccupied dark square.", function () {
      var match = {};
      match.turnIndexBeforeMove = BLACK_TURN_INDEX;
      match.turnIndexAfterMove = WHITE_TURN_INDEX;
      match.stateBeforeMove = initialState;
      match.stateBeforeMove.S20 = "EMPTY";
      match.stateBeforeMove.S16 = "WMAN";
      match.stateAfterMove = copyState(match.stateBeforeMove);
      match.stateAfterMove.S8 = "EMPTY";
      match.stateAfterMove.S16 = "BMAN";

      match.move = [];
      match.move.push({setTurn: 0});
      match.move.push({set: {S8: "EMPTY"}});
      match.move.push({set: {S16: "BMAN"}});
      expect(isMoveOk(match)).toEqual({ email : 'x@x.x',
        emailSubject : 'hacker!', emailBody : 'Illegal simple moves!!!' });
    });

    it("Black illegally moves S20 to S18 because MAN can not move backward",
        function () {
          var match = {};
          match.turnIndexBeforeMove = BLACK_TURN_INDEX;
          match.turnIndexAfterMove = WHITE_TURN_INDEX;
          match.stateBeforeMove = initialState;
          match.stateBeforeMove.S20 = "EMPTY";
          match.stateBeforeMove.S16 = "WMAN";
          match.stateAfterMove = copyState(match.stateBeforeMove);
          match.stateAfterMove.S8 = "EMPTY";
          match.stateAfterMove.S4 = "BMAN";

          match.move = [];
          match.move.push({setTurn: 0});
          match.move.push({set: {S8: "EMPTY"}});
          match.move.push({set: {S4: "BMAN"}});
          expect(isMoveOk(match)).toEqual({ email : 'x@x.x',
            emailSubject : 'hacker!', emailBody : 'Illegal simple moves!!!' });
        });

    it("Black illegally moves S9 to S12 because the white player can only" +
            " operate on white pieces",
        function () {
          var match = {};
          match.turnIndexBeforeMove = BLACK_TURN_INDEX;
          match.turnIndexAfterMove = WHITE_TURN_INDEX;
          match.stateBeforeMove = initialState;
          match.stateBeforeMove.S20 = "EMPTY";
          match.stateBeforeMove.S16 = "WMAN";
          match.stateAfterMove = copyState(match.stateBeforeMove);
          match.stateAfterMove.S16 = "EMPTY";
          match.stateAfterMove.S12 = "WMAN";

          match.move = [];
          match.move.push({setTurn: 0});
          match.move.push({set: {S16: "EMPTY"}});
          match.move.push({set: {S12: "WMAN"}});
          expect(isMoveOk(match)).toEqual({ email : 'x@x.x',
            emailSubject : 'hacker!', emailBody : 'Illegal simple moves!!!' });
        });
  });


  /**
   * MANDATORY JUMP SCENARIO
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
    it("White legally jumps from S17 over S13 to S10", function () {
      var match = {};
      match.turnIndexBeforeMove = 0;
      match.turnIndexAfterMove = 1;
      match.stateBeforeMove = emptyState;
      match.stateAfterMove = copyState(emptyState);
      match.move = [];

      match.stateBeforeMove.S12 = "WMAN";
      match.stateBeforeMove.S13 = "BCRO";
      match.stateBeforeMove.S17 = "WCRO";
      match.stateBeforeMove.S21 = "BMAN";
      match.stateAfterMove.S12 = "WMAN";
      match.stateAfterMove.S17 = "EMPTY";
      match.stateAfterMove.S13 = "EMPTY";
      match.stateAfterMove.S10 = "WCRO";
      match.stateAfterMove.S21 = "BMAN";
      match.move.push({setTurn: 1});
      match.move.push({set: {S17: "EMPTY"}});
      match.move.push({set: {S13: "EMPTY"}});
      match.move.push({set: {S10: "WCRO"}});

      expect(isMoveOk(match)).toEqual(true);
    });

    it("White legally jumps from S17 over S21 to S26", function () {
      var match = {};
      match.turnIndexBeforeMove = 0;
      match.turnIndexAfterMove = 1;
      match.stateBeforeMove = emptyState;
      match.stateAfterMove = copyState(emptyState);
      match.move = [];

      match.stateBeforeMove.S12 = "WMAN";
      match.stateBeforeMove.S13 = "BCRO";
      match.stateBeforeMove.S17 = "WCRO";
      match.stateBeforeMove.S21 = "BMAN";
      match.stateAfterMove.S12 = "WMAN";
      match.stateAfterMove.S17 = "EMPTY";
      match.stateAfterMove.S21 = "EMPTY";
      match.stateAfterMove.S31 = "BCRO";
      match.stateAfterMove.S26 = "WCRO";
      match.move.push({setTurn: 1});
      match.move.push({set: {S17: "EMPTY"}});
      match.move.push({set: {S21: "EMPTY"}});
      match.move.push({set: {S26: "WCRO"}});

      expect(isMoveOk(match)).toEqual(true);
    });

    it("White illegally moves S17 to S20 by ignoring the mandatory jump",
        function () {
      var match = {};
      match.turnIndexBeforeMove = 0;
      match.turnIndexAfterMove = 1;
      match.stateBeforeMove = emptyState;
      match.stateAfterMove = copyState(emptyState);
      match.move = [];

      match.stateBeforeMove.S12 = "WMAN";
      match.stateBeforeMove.S13 = "BCRO";
      match.stateBeforeMove.S17 = "WCRO";
      match.stateBeforeMove.S21 = "BMAN";
      match.stateAfterMove.S12 = "WMAN";
      match.stateAfterMove.S13 = "BCRO";
      match.stateAfterMove.S17 = "EMPTY";
      match.stateAfterMove.S20 = "WCRO";
      match.stateAfterMove.S21 = "BMAN";
      match.move.push({setTurn: 1});
      match.move.push({set: {S17: "EMPTY"}});
      match.move.push({set: {S20: "WCRO"}});

      expect(isMoveOk(match)).toEqual({ email: 'x@x.x',emailSubject: 'hacker!',
        emailBody: 'Illegal ignore mandatory jump!!!' });
    });

    it("White illegally moves S12 to S8 by ignoring the mandatory jump",
        function () {
      var match = {};
      match.turnIndexBeforeMove = 0;
      match.turnIndexAfterMove = 1;
      match.stateBeforeMove = emptyState;
      match.stateAfterMove = copyState(emptyState);
      match.move = [];

      match.stateBeforeMove.S12 = "WMAN";
      match.stateBeforeMove.S13 = "BCRO";
      match.stateBeforeMove.S17 = "WCRO";
      match.stateBeforeMove.S21 = "BMAN";
      match.stateAfterMove.S8 = "WMAN";
      match.stateAfterMove.S12 = "WEMPTY";
      match.stateAfterMove.S13 = "BCRO";
      match.stateAfterMove.S17 = "WCRO";
      match.stateAfterMove.S21 = "BMAN";
      match.move.push({setTurn: 1});
      match.move.push({set: {S12: "EMPTY"}});
      match.move.push({set: {S8: "WMAN"}});

      expect(isMoveOk(match)).toEqual({ email: 'x@x.x', emailSubject: 'hacker!',
        emailBody: 'Illegal ignore mandatory jump!!!' });
    });

  });

  describe("ENDGAME SCENARIO ", function () {
    /**
     * END GAME SCENARIO
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
      match.turnIndexBeforeMove = 0;
      match.turnIndexAfterMove = 1;
      match.stateBeforeMove = emptyState;
      match.stateAfterMove = copyState(emptyState);
      match.move = [];

      match.stateBeforeMove.S9 = "WCRO";
      match.stateBeforeMove.S13 = "BMAN";
      match.stateBeforeMove.S17 = "WMAN";
      match.stateAfterMove.S9 = "EMPTY";
      match.stateAfterMove.S13 = "EMPTY";
      match.stateAfterMove.S18 = "WMAN";
      match.stateAfterMove.S17 = "WMAN";
      match.move.push({setTurn: 1});
      match.move.push({set: {S9: "EMPTY"}});
      match.move.push({set: {S13: "EMPTY"}});
      match.move.push({set: {S18: "WMAN"}});
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
    it("White illegally won by moving S9 to S5", function () {
      var match = {};
      match.turnIndexBeforeMove = 0;
      match.turnIndexAfterMove = 1;
      match.stateBeforeMove = emptyState;
      match.stateAfterMove = copyState(emptyState);
      match.move = [];

      match.stateBeforeMove.S9 = "WCRO";
      match.stateBeforeMove.S14 = "BMAN";
      match.stateBeforeMove.S17 = "WMAN";
      match.stateAfterMove.S9 = "EMPTY";
      match.stateAfterMove.S5 = "WMAN";
      match.stateAfterMove.S14 = "BMAN";
      match.stateAfterMove.S17 = "WMAN";
      match.move.push({setTurn: 1});
      match.move.push({set: {S9: "EMPTY"}});
      match.move.push({set: {S5: "WMAN"}});
      match.move.push({endMatch: {endMatchScores: [1, 0]}});

      expect(isMoveOk(match)).toEqual({email: 'x@x.x', emailSubject: 'hacker!',
        emailBody: 'Illegal winner'});
    });
  });
});