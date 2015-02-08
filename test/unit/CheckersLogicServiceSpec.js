(function () {
  'use strict';
  /*global angular, expect, describe, it, beforeEach, module, inject */

  function expectIllegalOperation(checkersLogicService, match, illegalCode) {
    expect(checkersLogicService.isMoveOk(match)).
            toEqual(checkersLogicService.getIllegalEmailObj(illegalCode));
  }

  describe('checkersLogicService unit tests:', function () {
    var checkersLogicService,
      CONSTANT,
      ILLEGAL_CODE,
      emptyBoard = {},
      initialBoard = {},
      BLACK_TURN_INDEX = 0,
      WHITE_TURN_INDEX = 1,
      i;

    // Set up the module
    beforeEach(module('myApp'));

    // Set up the service
    beforeEach(inject(function (_checkersLogicService_) {
      checkersLogicService = _checkersLogicService_;
    }));

    beforeEach(inject(function (_constantService_) {
      CONSTANT = _constantService_;
    }));

    beforeEach(inject(function (_enumService_) {
      ILLEGAL_CODE = _enumService_.ILLEGAL_CODE;
    }));

    // Set up an empty (no pieces on board) state for test random situation
    beforeEach(function setEmptyState() {
      emptyBoard = [
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
      ];
    });

    // Set up an initial set up state
    beforeEach(function setInitialState() {
      initialBoard = [
        ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
        ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
        ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
        ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
        ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
      ];
    });

    describe('isMoveOk:', function () {
      /*
       * INITIAL STATE SCENARIO - BLACK
       *
       *             0     1     2     3     4     5     6     7
       * 0:even  [['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
       * 1:odd    ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
       * 2:even   ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
       * 3:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
       * 4:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
       * 5:odd    ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
       * 6:even   ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
       * 7:odd    ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']]
       */
      describe("INITIAL STATE SCENARIO - BLACK:", function () {
        var testState;

        beforeEach(function setTestState() {
          testState = {
            board: initialBoard,
            deltaFrom: {row: -1, col: -1},
            deltaTo: {row: -1, col: -1}
          };
        });

        it("[2, 1] -> [3, 0]", function () {
          var match = {};
          match.turnIndexBeforeMove = BLACK_TURN_INDEX;
          match.stateBeforeMove = testState;

          match.move = [];
          match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
          match.move.push({set: {key: 'board', value: [
            ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
            ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['BM', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
            ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
          ]}});
          match.move.push({set: {key: 'fromDelta', value: {row: 2, col: 1}}});
          match.move.push({set: {key: 'toDelta', value: {row: 3, col: 0}}});

          expect(checkersLogicService.isMoveOk(match)).toBe(true);
        });

        it("[2, 1] -> [3, 4]: Illegal because it can only move one square" +
            "diagonally to an adjacent unoccupied dark square.", function () {
            var match = {};
            match.turnIndexBeforeMove = BLACK_TURN_INDEX;
            match.stateBeforeMove = testState;

            match.move = [];
            match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
            match.move.push({set: {key: 'board', value: [
              ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
              ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['DS', '--', 'DS', '--', 'BM', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
              ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
              ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
            ]}});
            match.move.push({set: {key: 'fromDelta', value: {row: 2, col: 1}}});
            match.move.push({set: {key: 'toDelta', value: {row: 3, col: 4}}});

            expectIllegalOperation(checkersLogicService, match,
                ILLEGAL_CODE.ILLEGAL_MOVE);
          });

        it("[2, 1] -> [4, 1]: Illegal because it can only move one square" +
            "diagonally to an adjacent unoccupied dark square.", function () {
            var match = {};
            match.turnIndexBeforeMove = BLACK_TURN_INDEX;
            match.stateBeforeMove = testState;

            match.move = [];
            match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
            match.move.push({set: {key: 'board', value: [
              ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
              ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'BM', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
              ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
              ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
            ]}});
            match.move.push({set: {key: 'fromDelta', value: {row: 2, col: 1}}});
            match.move.push({set: {key: 'toDelta', value: {row: 4, col: 1}}});

            expectIllegalOperation(checkersLogicService, match,
                ILLEGAL_CODE.ILLEGAL_MOVE);
          });

        it("[2, 1] -> [1, 0]: Illegal because MAN can not move backward",
              function () {
            var match = {};
            match.turnIndexBeforeMove = BLACK_TURN_INDEX;
            // Empty 4 first
            initialBoard[1][0] = CONSTANT.DARK_SQUARE;
            match.stateBeforeMove = testState;

            match.move = [];
            match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
            match.move.push({set: {key: 'board', value: [
              ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
              ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
              ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
              ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
            ]}});
            match.move.push({set: {key: 'fromDelta', value: {row: 2, col: 1}}});
            match.move.push({set: {key: 'toDelta', value: {row: 1, col: 0}}});

            expectIllegalOperation(checkersLogicService, match,
                ILLEGAL_CODE.ILLEGAL_MOVE);
          });

        it("[1, 0] -> [2, 1]: Illegal because 4 is occupied", function () {
          var match = {};
          match.turnIndexBeforeMove = BLACK_TURN_INDEX;
          match.stateBeforeMove = testState;

          match.move = [];
          match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
          match.move.push({set: {key: 'board', value: [
            ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['DS', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
            ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
            ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
          ]}});
          match.move.push({set: {key: 'fromDelta', value: {row: 1, col: 0}}});
          match.move.push({set: {key: 'toDelta', value: {row: 2, col: 1}}});

          expectIllegalOperation(checkersLogicService, match,
              ILLEGAL_CODE.ILLEGAL_SIMPLE_MOVE);
        });

        it("[5, 0] -> [4, 1]: Illegal because the player can only move" +
              "his/her own pieces", function () {
            var match = {};
            match.turnIndexBeforeMove = BLACK_TURN_INDEX;
            match.stateBeforeMove = testState;

            match.move = [];
            match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
            match.move.push({set: {key: 'board', value: [
              ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
              ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'WM', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
              ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
              ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
            ]}});
            match.move.push({set: {key: 'fromDelta', value: {row: 5, col: 0}}});
            match.move.push({set: {key: 'toDelta', value: {row: 4, col: 1}}});

            expectIllegalOperation(checkersLogicService, match,
                ILLEGAL_CODE.ILLEGAL_SIMPLE_MOVE);
          });

        it("[?, ?] -> [3, 0]: Illegal because the piece does not exist",
              function () {
            var match = {};
            match.turnIndexBeforeMove = BLACK_TURN_INDEX;
            match.stateBeforeMove = testState;

            match.move = [];
            match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
            match.move.push({set: {key: 'board', value: [
              ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
              ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
              ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
              ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
            ]}});
            match.move.push({set: {key: 'fromDelta', value: {row: 8, col: 8}}});
            match.move.push({set: {key: 'toDelta', value: {row: 3, col: 0}}});

            expectIllegalOperation(checkersLogicService, match,
                ILLEGAL_CODE.ILLEGAL_DELTA);
          });

        it("[2, 0] -> [?, ?]: Illegal because it moves to non exist square",
              function () {
            var match = {};
            match.turnIndexBeforeMove = BLACK_TURN_INDEX;
            match.stateBeforeMove = testState;

            match.move = [];
            match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
            match.move.push({set: {key: 'board', value: [
              ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
              ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
              ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
              ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
            ]}});
            match.move.push({set: {key: 'fromDelta', value: {row: 2, col: 1}}});
            match.move.push({set: {key: 'toDelta', value: {row: 8, col: 8}}});

            expectIllegalOperation(checkersLogicService, match,
                ILLEGAL_CODE.ILLEGAL_DELTA);
          });
      });

      /*
       * FIRST STATE SCENARIO - WHITE (Black first move: [2, 1] -> [3, 0])
       *
       *             0     1     2     3     4     5     6     7
       * 0:even  [['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
       * 1:odd    ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
       * 2:even   ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'BM'],
       * 3:odd    ['BM', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
       * 4:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
       * 5:odd    ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
       * 6:even   ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
       * 7:odd    ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']]
       */
      describe("FIRST STATE SCENARIO - WHITE:", function () {
        var testState;

        beforeEach(function setTestState() {
          initialBoard[2][1] = CONSTANT.DARK_SQUARE;
          initialBoard[3][0] = CONSTANT.BLACK_MAN;
          testState = {
            board: initialBoard,
            deltaFrom: {row: 2, col: 1},
            deltaTo: {row: 3, col: 0}
          };
        });

        it("[5, 0] -> [4, 1]", function () {
          var match = {};
          match.turnIndexBeforeMove = WHITE_TURN_INDEX;
          match.stateBeforeMove = testState;

          match.move = [];
          match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
          match.move.push({set: {key: 'board', value: [
            ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
            ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['BM', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'WM', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
            ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
          ]}});
          match.move.push({set: {key: 'fromDelta', value: {row: 5, col: 0}}});
          match.move.push({set: {key: 'toDelta', value: {row: 4, col: 1}}});

          expect(checkersLogicService.isMoveOk(match)).toBe(true);
        });

        it("[5, 0] -> [4, 3]: Illegal because it can only move one square" +
            "diagonally to an adjacent unoccupied dark square.", function () {
            var match = {};
            match.turnIndexBeforeMove = WHITE_TURN_INDEX;
            match.stateBeforeMove = testState;

            match.move = [];
            match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
            match.move.push({set: {key: 'board', value: [
              ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
              ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['BM', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
              ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
              ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
              ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
            ]}});
            match.move.push({set: {key: 'fromDelta', value: {row: 5, col: 0}}});
            match.move.push({set: {key: 'toDelta', value: {row: 4, col: 3}}});

            expectIllegalOperation(checkersLogicService, match,
                ILLEGAL_CODE.ILLEGAL_MOVE);
          });

        it("[5, 2] -> [3, 2]: Illegal because it can only move one square" +
            "diagonally to an adjacent unoccupied dark square.", function () {
            var match = {};
            match.turnIndexBeforeMove = WHITE_TURN_INDEX;
            match.stateBeforeMove = testState;

            match.move = [];
            match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
            match.move.push({set: {key: 'board', value: [
              ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
              ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['BM', '--', 'WM', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['WM', '--', 'DS', '--', 'WM', '--', 'WM', '--'],
              ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
              ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
            ]}});
            match.move.push({set: {key: 'fromDelta', value: {row: 5, col: 2}}});
            match.move.push({set: {key: 'toDelta', value: {row: 3, col: 2}}});

            expectIllegalOperation(checkersLogicService, match,
                ILLEGAL_CODE.ILLEGAL_MOVE);
          });

        it("[5, 0] -> [6, 1]: Illegal because MAN can not move backward",
            function () {
            var match = {};
            match.turnIndexBeforeMove = WHITE_TURN_INDEX;
            match.stateBeforeMove = testState;
            testState.board[6][1] = CONSTANT.DARK_SQUARE;

            match.move = [];
            match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
            match.move.push({set: {key: 'board', value: [
              ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
              ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['BM', '--', 'WM', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['WM', '--', 'DS', '--', 'WM', '--', 'WM', '--'],
              ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
              ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
            ]}});
            match.move.push({set: {key: 'fromDelta', value: {row: 5, col: 0}}});
            match.move.push({set: {key: 'toDelta', value: {row: 6, col: 1}}});

            expectIllegalOperation(checkersLogicService, match,
                ILLEGAL_CODE.ILLEGAL_MOVE);
          });

        it("[6, 1] -> [5, 0]: Illegal because [6, 0] is occupied", function () {
          var match = {};
          match.turnIndexBeforeMove = WHITE_TURN_INDEX;
          match.stateBeforeMove = testState;

          match.move = [];
          match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
          match.move.push({set: {key: 'board', value: [
            ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
            ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'BM'],
            ['BM', '--', 'WM', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
            ['--', 'DS', '--', 'WM', '--', 'WM', '--', 'WM'],
            ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
          ]}});
          match.move.push({set: {key: 'fromDelta', value: {row: 6, col: 1}}});
          match.move.push({set: {key: 'toDelta', value: {row: 5, col: 0}}});

          expectIllegalOperation(checkersLogicService, match,
              ILLEGAL_CODE.ILLEGAL_SIMPLE_MOVE);
        });

        it("[2, 7] -> [3, 6]: Illegal because the player can only move" +
              "his/her own pieces", function () {
            var match = {};
            match.turnIndexBeforeMove = WHITE_TURN_INDEX;
            match.stateBeforeMove = testState;

            match.move = [];
            match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
            match.move.push({set: {key: 'board', value: [
              ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
              ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'DS'],
              ['BM', '--', 'WM', '--', 'DS', '--', 'BM', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'WM', '--', 'WM', '--'],
              ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
              ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
            ]}});
            match.move.push({set: {key: 'fromDelta', value: {row: 2, col: 7}}});
            match.move.push({set: {key: 'toDelta', value: {row: 3, col: 6}}});

            expectIllegalOperation(checkersLogicService, match,
                ILLEGAL_CODE.ILLEGAL_SIMPLE_MOVE);
          });

        it("[?, ?] -> [4, 1]: Illegal because the piece does not exist",
              function () {
            var match = {};
            match.turnIndexBeforeMove = WHITE_TURN_INDEX;
            match.stateBeforeMove = testState;

            match.move = [];
            match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
            match.move.push({set: {key: 'board', value: [
              ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
              ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['BM', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'WM', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
              ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
              ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
            ]}});
            match.move.push({
              set: {key: 'fromDelta', value: {row: -1, col: -1}}
            });
            match.move.push({set: {key: 'toDelta', value: {row: 4, col: 1}}});

            expectIllegalOperation(checkersLogicService, match,
                ILLEGAL_CODE.ILLEGAL_DELTA);
          });

        it("[5, 0] -> [?, ]: Illegal because it moves to non exist square",
            function () {
            var match = {};
            match.turnIndexBeforeMove = WHITE_TURN_INDEX;
            match.stateBeforeMove = testState;

            match.move = [];
            match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
            match.move.push({set: {key: 'board', value: [
              ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
              ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'BM'],
              ['BM', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
              ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
              ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
            ]}});
            match.move.push({set: {key: 'fromDelta', value: {row: 5, col: 0}}});
            match.move.push({set: {key: 'toDelta', value: {row: -1, col: -1}}});

            expectIllegalOperation(checkersLogicService, match,
                ILLEGAL_CODE.ILLEGAL_DELTA);
          });
      });

      /*
       * MANDATORY JUMP SCENARIO - BLACK
       *
       *             0     1     2     3     4     5     6     7
       * 0:even  [['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
       * 1:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
       * 2:even   ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
       * 3:odd    ['DS', '--', 'BK', '--', 'DS', '--', 'DS', '--'],
       * 4:even   ['--', 'DS', '--', 'DS', '--', 'BM', '--', 'DS'],
       * 5:odd    ['DS', '--', 'DS', '--', 'WK', '--', 'DS', '--'],
       * 6:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
       * 7:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']]
       */
      describe('MANDATORY JUMP SCENARIO - BLACK:', function () {
        var testState;
        beforeEach(function setTestState() {
          testState = {
            board: emptyBoard,
            deltaFrom: {row: 3, col: 4},
            deltaTo: {row: 2, col: 3}
          };
          testState.board[2][3] = CONSTANT.WHITE_MAN;
          testState.board[3][2] = CONSTANT.BLACK_KING;
          testState.board[4][5] = CONSTANT.BLACK_MAN;
          testState.board[5][4] = CONSTANT.WHITE_KING;
        });

        it("[3, 2] -> [2, 3] -> [1, 4]", function () {
          var match = {};
          match.turnIndexBeforeMove = BLACK_TURN_INDEX;
          match.stateBeforeMove = testState;

          match.move = [];
          match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
          match.move.push({set: {key: 'board', value: [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'BK', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'BM', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'WK', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
          ]}});
          match.move.push({set: {key: 'fromDelta', value: {row: 3, col: 2}}});
          match.move.push({set: {key: 'toDelta', value: {row: 1, col: 4}}});

          expect(checkersLogicService.isMoveOk(match)).toEqual(true);
        });

        it("[4, 5] -> [5, 4] -> [6, 3]", function () {
          var match = {};
          match.turnIndexBeforeMove = BLACK_TURN_INDEX;
          match.stateBeforeMove = testState;

          match.move = [];
          match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
          match.move.push({set: {key: 'board', value: [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'BK', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'BM', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
          ]}});
          match.move.push({set: {key: 'fromDelta', value: {row: 4, col: 5}}});
          match.move.push({set: {key: 'toDelta', value: {row: 6, col: 3}}});

          expect(checkersLogicService.isMoveOk(match)).toEqual(true);
        });

        it("[3, 2] -> [2, 1]: Illegal because 13 ignores the mandatory jump",
            function () {
            var match = {};
            match.turnIndexBeforeMove = BLACK_TURN_INDEX;
            match.stateBeforeMove = testState;

            match.move = [];
            match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
            match.move.push({set: {key: 'board', value: [
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'BK', '--', 'WM', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'BM', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'WK', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
            ]}});
            match.move.push({set: {key: 'fromDelta', value: {row: 3, col: 2}}});
            match.move.push({set: {key: 'toDelta', value: {row: 2, col: 1}}});

            expectIllegalOperation(checkersLogicService, match,
                ILLEGAL_CODE.ILLEGAL_IGNORE_MANDATORY_JUMP);
          });

        it("[4, 5] -> [5, 6]: Illegal because 18 ignores the mandatory jump",
            function () {
            var match = {};
            match.turnIndexBeforeMove = BLACK_TURN_INDEX;
            match.stateBeforeMove = testState;

            match.move = [];
            match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
            match.move.push({set: {key: 'board', value: [
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'BK', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'WK', '--', 'BM', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
            ]}});
            match.move.push({set: {key: 'fromDelta', value: {row: 4, col: 5}}});
            match.move.push({set: {key: 'toDelta', value: {row: 5, col: 6}}});

            expectIllegalOperation(checkersLogicService, match,
                ILLEGAL_CODE.ILLEGAL_IGNORE_MANDATORY_JUMP);
          });
      });

      /*
       * MANDATORY JUMP SCENARIO - WHITE
       *
       *             0     1     2     3     4     5     6     7
       * 0:even  [['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
       * 1:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
       * 2:even   ['--', 'DS', '--', 'BK', '--', 'DS', '--', 'DS'],
       * 3:odd    ['DS', '--', 'WM', '--', 'DS', '--', 'DS', '--'],
       * 4:even   ['--', 'DS', '--', 'DS', '--', 'WK', '--', 'DS'],
       * 5:odd    ['DS', '--', 'DS', '--', 'BM', '--', 'DS', '--'],
       * 6:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
       * 7:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']]
       */
      describe('MANDATORY JUMP SCENARIO - WHITE', function () {
        var testState;
        beforeEach(function setTestState() {
          testState = {
            board: emptyBoard,
            deltaFrom: {row: 4, col: 1},
            deltaTo: {row: 3, col: 2}
          };
          testState.board[3][2] = CONSTANT.WHITE_MAN;
          testState.board[2][3] = CONSTANT.BLACK_KING;
          testState.board[5][4] = CONSTANT.BLACK_MAN;
          testState.board[4][5] = CONSTANT.WHITE_KING;
        });

        it("[3, 2] -> [2, 3] -> [1, 4]", function () {
          var match = {};
          match.turnIndexBeforeMove = WHITE_TURN_INDEX;
          match.stateBeforeMove = testState;

          match.move = [];
          match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
          match.move.push({set: {key: 'board', value: [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'WM', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'WK', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'BM', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
          ]}});
          match.move.push({set: {key: 'fromDelta', value: {row: 3, col: 2}}});
          match.move.push({set: {key: 'toDelta', value: {row: 1, col: 4}}});

          expect(checkersLogicService.isMoveOk(match)).toEqual(true);
        });

        it("[4, 5] -> [5, 4] -> [6, 3]", function () {
          var match = {};
          match.turnIndexBeforeMove = WHITE_TURN_INDEX;
          match.stateBeforeMove = testState;

          match.move = [];
          match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
          match.move.push({set: {key: 'board', value: [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'BK', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'WM', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'WK', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
          ]}});
          match.move.push({set: {key: 'fromDelta', value: {row: 4, col: 5}}});
          match.move.push({set: {key: 'toDelta', value: {row: 6, col: 3}}});

          expect(checkersLogicService.isMoveOk(match)).toEqual(true);
        });

        it("[3, 2] -> [2, 1]: Illegal because 13 ignores the mandatory jump",
            function () {
            var match = {};
            match.turnIndexBeforeMove = WHITE_TURN_INDEX;
            match.stateBeforeMove = testState;

            match.move = [];
            match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
            match.move.push({set: {key: 'board', value: [
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'WM', '--', 'BK', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'WK', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'BM', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
            ]}});
            match.move.push({set: {key: 'fromDelta', value: {row: 3, col: 2}}});
            match.move.push({set: {key: 'toDelta', value: {row: 2, col: 1}}});

            expectIllegalOperation(checkersLogicService, match,
                ILLEGAL_CODE.ILLEGAL_IGNORE_MANDATORY_JUMP);
          });

        it("[4, 5] -> [5, 6]: Illegal because 18 ignores the mandatory jump",
            function () {
            var match = {};
            match.turnIndexBeforeMove = WHITE_TURN_INDEX;
            match.stateBeforeMove = testState;

            match.move = [];
            match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
            match.move.push({set: {key: 'board', value: [
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'BK', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'WM', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'BM', '--', 'WK', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
            ]}});
            match.move.push({set: {key: 'fromDelta', value: {row: 4, col: 5}}});
            match.move.push({set: {key: 'toDelta', value: {row: 5, col: 6}}});

            expectIllegalOperation(checkersLogicService, match,
                ILLEGAL_CODE.ILLEGAL_IGNORE_MANDATORY_JUMP);
          });
      });

      /*
       * CROWNED SCENARIO - BLACK
       *
       *             0     1     2     3     4     5     6     7
       * 0:even  [['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
       * 1:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
       * 2:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
       * 3:odd    ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
       * 4:even   ['--', 'DS', '--', 'WM?','--', 'DS', '--', 'DS'],
       * 5:odd    ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
       * 6:even   ['--', 'BM', '--', 'WM?','--', 'DS', '--', 'DS'],
       * 7:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'WM', '--']]
       *
       * Note: piece with '?' mean the piece exist for certain test case in
       *       order to prevent the influence of mandatory jump.
       */
      describe('CROWNED SCENARIO FOR BLACK', function () {
        var testState;
        beforeEach(function setTestState() {
          testState = {
            board: emptyBoard,
            deltaFrom: {row: 5, col: 4},
            deltaTo: {row: 4, col: 3}
          };
          testState.board[3][2] = CONSTANT.BLACK_MAN;
          testState.board[5][2] = CONSTANT.BLACK_MAN;
          testState.board[6][1] = CONSTANT.BLACK_MAN;
          testState.board[7][6] = CONSTANT.WHITE_MAN;
        });

        it("[6, 1] -> [7, 0]*", function () {
          var match = {};
          match.turnIndexBeforeMove = BLACK_TURN_INDEX;
          match.stateBeforeMove = testState;

          match.move = [];
          match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
          match.move.push({set: {key: 'board', value: [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['BK', '--', 'DS', '--', 'DS', '--', 'WM', '--']
          ]}});
          match.move.push({set: {key: 'fromDelta', value: {row: 6, col: 1}}});
          match.move.push({set: {key: 'toDelta', value: {row: 7, col: 0}}});

          expect(checkersLogicService.isMoveOk(match)).toEqual(true);
        });

        it("[5, 2] -> [6, 3] -> [7, 4]*", function () {
          var match = {};
          match.turnIndexBeforeMove = BLACK_TURN_INDEX;
          testState.board[6][3] = CONSTANT.WHITE_MAN;
          match.stateBeforeMove = testState;

          match.move = [];
          match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
          match.move.push({set: {key: 'board', value: [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'BM', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'BK', '--', 'WM', '--']
          ]}});
          match.move.push({set: {key: 'fromDelta', value: {row: 5, col: 2}}});
          match.move.push({set: {key: 'toDelta', value: {row: 7, col: 4}}});

          expect(checkersLogicService.isMoveOk(match)).toEqual(true);
        });

        it("[5, 2] -> [6, 3]*: Illegal because it does not move to the final" +
            "row in order to be crowned", function () {
            var match = {};
            match.turnIndexBeforeMove = BLACK_TURN_INDEX;
            match.stateBeforeMove = testState;

            match.move = [];
            match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
            match.move.push({set: {key: 'board', value: [
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'BM', '--', 'BK', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
            ]}});
            match.move.push({set: {key: 'fromDelta', value: {row: 5, col: 2}}});
            match.move.push({set: {key: 'toDelta', value: {row: 6, col: 3}}});

            expectIllegalOperation(checkersLogicService, match,
                ILLEGAL_CODE.ILLEGAL_MOVE);
          });

        it("[3, 2] -> [4, 3] -> [5, 4]*: Illegal because it does not move" +
            "to the final row in order to be crowned", function () {
            var match = {};
            match.turnIndexBeforeMove = BLACK_TURN_INDEX;
            match.stateBeforeMove = testState;
            testState.board[4][3] = CONSTANT.WHITE_MAN;

            match.move = [];
            match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
            match.move.push({set: {key: 'board', value: [
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'BM', '--', 'BK', '--', 'DS', '--'],
              ['--', 'BM', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
            ]}});
            match.move.push({set: {key: 'fromDelta', value: {row: 3, col: 2}}});
            match.move.push({set: {key: 'toDelta', value: {row: 5, col: 4}}});
            expectIllegalOperation(checkersLogicService, match,
                  ILLEGAL_CODE.ILLEGAL_MOVE);
          });
      });

      /*
       * CROWNED SCENARIO - WHITE
       *
       *             0     1     2     3     4     5     6     7
       * 0:even  [['--', 'DS', '--', 'DS', '--', 'DS', '--', 'BM'],
       * 1:odd    ['DS', '--', 'WM', '--', 'BM?','--', 'DS', '--'],
       * 2:even   ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
       * 3:odd    ['DS', '--', 'DS', '--', 'BM?','--', 'DS', '--'],
       * 4:even   ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
       * 5:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
       * 6:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
       * 7:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']]
       *
       * Note: piece with '?' mean the piece exist for certain test case in
       *       order to prevent the influence of mandatory jump.
       */
      describe('CROWNED SCENARIO FOR WHITE', function () {
        var testState;
        beforeEach(function setTestState() {
          testState = {
            board: emptyBoard,
            deltaFrom: {row: 5, col: 4},
            deltaTo: {row: 4, col: 3}
          };
          testState.board[1][2] = CONSTANT.WHITE_MAN;
          testState.board[2][3] = CONSTANT.WHITE_MAN;
          testState.board[4][3] = CONSTANT.WHITE_MAN;
          testState.board[0][7] = CONSTANT.BLACK_MAN;
        });

//        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'BM'],
//        ['DS', '--', 'WM', '--', 'BM?','--', 'DS', '--'],
//        ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
//        ['DS', '--', 'DS', '--', 'BM?','--', 'DS', '--'],
//        ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
//        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
//        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
//        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']

        it("[1, 2] -> [0, 3]*", function () {
          var match = {};
          match.turnIndexBeforeMove = WHITE_TURN_INDEX;
          match.stateBeforeMove = testState;

          match.move = [];
          match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
          match.move.push({set: {key: 'board', value: [
            ['--', 'DS', '--', 'WK', '--', 'DS', '--', 'BM'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
          ]}});
          match.move.push({set: {key: 'fromDelta', value: {row: 1, col: 2}}});
          match.move.push({set: {key: 'toDelta', value: {row: 0, col: 3}}});

          expect(checkersLogicService.isMoveOk(match)).toEqual(true);
        });

        it("[2, 3] -> [1, 4] -> [0, 5]*", function () {
          var match = {};
          match.turnIndexBeforeMove = WHITE_TURN_INDEX;
          testState.board[1][4] = CONSTANT.BLACK_MAN;
          match.stateBeforeMove = testState;

          match.move = [];
          match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
          match.move.push({set: {key: 'board', value: [
            ['--', 'DS', '--', 'DS', '--', 'WK', '--', 'BM'],
            ['DS', '--', 'WM', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
          ]}});
          match.move.push({set: {key: 'fromDelta', value: {row: 2, col: 3}}});
          match.move.push({set: {key: 'toDelta', value: {row: 0, col: 5}}});

          expect(checkersLogicService.isMoveOk(match)).toEqual(true);
        });

        it("[2, 3] -> [1, 4]*: Illegal because it does not move to the final" +
            "row in order to be crowned", function () {
            var match = {};
            match.turnIndexBeforeMove = WHITE_TURN_INDEX;
            match.stateBeforeMove = testState;

            match.move = [];
            match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
            match.move.push({set: {key: 'board', value: [
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'BM'],
              ['DS', '--', 'WM', '--', 'WK', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
            ]}});
            match.move.push({set: {key: 'fromDelta', value: {row: 2, col: 3}}});
            match.move.push({set: {key: 'toDelta', value: {row: 1, col: 4}}});

            expectIllegalOperation(checkersLogicService, match,
                ILLEGAL_CODE.ILLEGAL_MOVE);
          });

        it("[4, 3] -> [3, 4] -> [2, 5]*: Illegal because it does not move to" +
            "the final row in order to be crowned", function () {
            var match = {};
            match.turnIndexBeforeMove = WHITE_TURN_INDEX;
            testState.board[3][4] = CONSTANT.BLACK_MAN;
            match.stateBeforeMove = testState;

            match.move = [];
            match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
            match.move.push({set: {key: 'board', value: [
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'BM'],
              ['DS', '--', 'WM', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'WM', '--', 'WK', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
            ]}});
            match.move.push({set: {key: 'fromDelta', value: {row: 4, col: 3}}});
            match.move.push({set: {key: 'toDelta', value: {row: 2, col: 5}}});

            expectIllegalOperation(checkersLogicService, match,
                ILLEGAL_CODE.ILLEGAL_MOVE);
          });
      });

      /**
       * CONSECUTIVE JUMP - BLACK
       */
      describe('CONSECUTIVE JUMP SCENARIO FOR BLACK', function () {
        var testState;
        beforeEach(function setTestState() {
          testState = {
            board: emptyBoard,
            deltaFrom: {row: 5, col: 4},
            deltaTo: {row: 4, col: 3}
          };
        });

        /*
         * BLACK
         *             0     1     2     3     4     5     6     7
         * 0:even  [['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 1:odd    ['BM', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 2:even   ['--', 'WM', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 3:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 4:even   ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
         * 5:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 6:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 7:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']]
         */
        it("[1, 0] -> [2, 1] -> [3, 2]", function () {
          var match = {};
          match.turnIndexBeforeMove = BLACK_TURN_INDEX;
          testState.board[1][0] = CONSTANT.BLACK_MAN;
          testState.board[2][1] = CONSTANT.WHITE_MAN;
          testState.board[4][3] = CONSTANT.WHITE_MAN;
          match.stateBeforeMove = testState;

          match.move = [];
          match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
          match.move.push({set: {key: 'board', value: [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
          ]}});
          match.move.push({set: {key: 'fromDelta', value: {row: 1, col: 0}}});
          match.move.push({set: {key: 'toDelta', value: {row: 3, col: 2}}});

          expect(checkersLogicService.isMoveOk(match)).toEqual(true);
        });

        /*
         * BLACK
         *             0     1     2     3     4     5     6     7
         * 0:even  [['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 1:odd    ['BM', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 2:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 3:odd    ['DS', '--', 'WM', '--', 'DS', '--', 'DS', '--'],
         * 4:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 5:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 6:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 7:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']]
         */
        it("[1, 0] -> [2, 1]", function () {
          var match = {};
          match.turnIndexBeforeMove = BLACK_TURN_INDEX;
          testState.board[1][0] = CONSTANT.BLACK_MAN;
          testState.board[3][2] = CONSTANT.WHITE_MAN;
          match.stateBeforeMove = testState;

          match.move = [];
          match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
          match.move.push({set: {key: 'board', value: [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'BM', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'WM', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
          ]}});
          match.move.push({set: {key: 'fromDelta', value: {row: 1, col: 0}}});
          match.move.push({set: {key: 'toDelta', value: {row: 2, col: 1}}});

          expect(checkersLogicService.isMoveOk(match)).toEqual(true);
        });
      });

      /**
       * CONSECUTIVE JUMP - WHITE
       */
      describe('CONSECUTIVE JUMP SCENARIO FOR WHITE', function () {
        var testState;
        beforeEach(function setTestState() {
          testState = {
            board: emptyBoard,
            deltaFrom: {row: 5, col: 4},
            deltaTo: {row: 4, col: 3}
          };
        });

        /*
         * WHITE
         *
         *             0     1     2     3     4     5     6     7
         * 0:even  [['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 1:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 2:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 3:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 4:even   ['--', 'DS', '--', 'BM', '--', 'DS', '--', 'DS'],
         * 5:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 6:even   ['--', 'BM', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 7:odd    ['WM', '--', 'DS', '--', 'DS', '--', 'DS', '--']]
         *
         *   Note: piece with '?' mean the piece exist for certain test case in
         *         order to prevent the influence of mandatory jump.
         */
        it("[7, 0] -> [6, 1] -> [5, 2]", function () {
          var match = {};
          match.turnIndexBeforeMove = WHITE_TURN_INDEX;
          testState.board[7][0] = CONSTANT.WHITE_MAN;
          testState.board[6][1] = CONSTANT.BLACK_MAN;
          testState.board[4][3] = CONSTANT.BLACK_MAN;
          match.stateBeforeMove = testState;

          match.move = [];
          match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
          match.move.push({set: {key: 'board', value: [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'BM', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'WM', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
          ]}});
          match.move.push({set: {key: 'fromDelta', value: {row: 7, col: 0}}});
          match.move.push({set: {key: 'toDelta', value: {row: 5, col: 2}}});

          expect(checkersLogicService.isMoveOk(match)).toEqual(true);
        });

        /*
         * WHITE
         *
         *             0     1     2     3     4     5     6     7
         * 0:even  [['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 1:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 2:even   ['--', 'BM', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 3:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 4:even   ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
         * 5:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 6:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 7:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']]
         */
        it("WHITE: [4, 3] -> [3, 2]", function () {
          var match = {};
          match.turnIndexBeforeMove = WHITE_TURN_INDEX;
          testState.board[2][1] = CONSTANT.BLACK_MAN;
          testState.board[4][3] = CONSTANT.WHITE_MAN;
          match.stateBeforeMove = testState;

          match.move = [];
          match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
          match.move.push({set: {key: 'board', value: [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'BM', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'WM', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
          ]}});
          match.move.push({set: {key: 'fromDelta', value: {row: 4, col: 3}}});
          match.move.push({set: {key: 'toDelta', value: {row: 3, col: 2}}});

          expect(checkersLogicService.isMoveOk(match)).toEqual(true);
        });
      });

      /*
       * TERMINATE TURN WHEN MOVES TO KINGS ROW - BLACK
       *
       *             0     1     2     3     4     5     6     7
       * 0:even  [['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
       * 1:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
       * 2:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
       * 3:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
       * 4:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
       * 5:odd   ['BM/K','--', 'DS', '--', 'DS', '--', 'DS', '--'],
       * 6:even   ['--', 'WM', '--', 'WM', '--', 'DS', '--', 'DS'],
       * 7:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']]
       *
       * Note: BM/L means it will be assigned to BM or BK according to the
       *       specific test.
       */
      describe('TERMINATE TURN WHEN MOVES TO KINGS ROW FOR BLACK', function () {
        var testState;
        beforeEach(function setTestState() {
          testState = {
            board: emptyBoard,
            deltaFrom: {row: 5, col: 4},
            deltaTo: {row: 4, col: 3}
          };
          testState.board[6][1] = CONSTANT.WHITE_MAN;
          testState.board[6][3] = CONSTANT.WHITE_MAN;
        });

        it("[5, 0] -> [6, 1] -> [7, 2]*: Test for MAN", function () {
          var match = {};
          match.turnIndexBeforeMove = BLACK_TURN_INDEX;
          testState.board[5][0] = CONSTANT.BLACK_MAN;
          match.stateBeforeMove = testState;

          match.move = [];
          match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
          match.move.push({set: {key: 'board', value: [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'BK', '--', 'DS', '--', 'DS', '--']
          ]}});
          match.move.push({set: {key: 'fromDelta', value: {row: 5, col: 0}}});
          match.move.push({set: {key: 'toDelta', value: {row: 7, col: 2}}});

          expect(checkersLogicService.isMoveOk(match)).toEqual(true);
        });

        it("[5, 0] -> [6, 1] -> [7, 2]: Test for king", function () {
          var match = {};
          match.turnIndexBeforeMove = BLACK_TURN_INDEX;
          testState.board[5][0] = CONSTANT.BLACK_KING;
          match.stateBeforeMove = testState;

          match.move = [];
          match.move.push({setTurn: {turnIndex: WHITE_TURN_INDEX}});
          match.move.push({set: {key: 'board', value: [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'WM', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'BK', '--', 'DS', '--', 'DS', '--']
          ]}});
          match.move.push({set: {key: 'fromDelta', value: {row: 5, col: 0}}});
          match.move.push({set: {key: 'toDelta', value: {row: 7, col: 2}}});
          expect(checkersLogicService.isMoveOk(match)).toEqual(true);
        });
      });

      /*
       * TERMINATE TURN WHEN MOVES TO KINGS ROW - WHITE
       *
       *             0     1     2     3     4     5     6     7
       * 0:even  [['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
       * 1:odd    ['DS', '--', 'BM', '--', 'BM', '--', 'DS', '--'],
       * 2:even   ['--','WM/K','--', 'DS', '--', 'DS', '--', 'DS'],
       * 3:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
       * 4:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
       * 5:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
       * 6:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
       * 7:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']]
       *
       * Note: WM/K means it will be assigned to WM or WK according to the
       *       specific test.
       */
      describe('TERMINATE TURN WHEN MOVES TO KINGS ROW FOR WHITE', function () {
        var testState;
        beforeEach(function setTestState() {
          testState = {
            board: emptyBoard,
            deltaFrom: {row: 5, col: 4},
            deltaTo: {row: 4, col: 3}
          };
          testState.board[1][2] = CONSTANT.BLACK_MAN;
          testState.board[1][4] = CONSTANT.BLACK_MAN;
        });

        it("[2, 1] -> [1, 2] -> [0, 3]*: Test for MAN", function () {
          var match = {};
          match.turnIndexBeforeMove = WHITE_TURN_INDEX;
          testState.board[2][1] = CONSTANT.WHITE_MAN;
          match.stateBeforeMove = testState;

          match.move = [];
          match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
          match.move.push({set: {key: 'board', value: [
            ['--', 'DS', '--', 'WK', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'BM', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
          ]}});
          match.move.push({set: {key: 'fromDelta', value: {row: 2, col: 1}}});
          match.move.push({set: {key: 'toDelta', value: {row: 0, col: 3}}});

          expect(checkersLogicService.isMoveOk(match)).toEqual(true);
        });

        it("[2, 1] -> [1, 2] -> [0, 3]: Test for king", function () {
          var match = {};
          match.turnIndexBeforeMove = WHITE_TURN_INDEX;
          testState.board[2][1] = CONSTANT.WHITE_MAN;
          match.stateBeforeMove = testState;

          match.move = [];
          match.move.push({setTurn: {turnIndex: BLACK_TURN_INDEX}});
          match.move.push({set: {key: 'board', value: [
            ['--', 'DS', '--', 'WK', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'BM', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
          ]}});
          match.move.push({set: {key: 'fromDelta', value: {row: 2, col: 1}}});
          match.move.push({set: {key: 'toDelta', value: {row: 0, col: 3}}});

          expect(checkersLogicService.isMoveOk(match)).toEqual(true);
        });
      });

      describe("ENDGAME SCENARIO - BLACK", function () {
        /*
         * END GAME SCENARIO - BLACK
         *
         *             0     1     2     3     4     5     6     7
         * 0:even  [['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 1:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 2:even   ['--', 'DS', '--', 'BM', '--', 'DS', '--', 'DS'],
         * 3:odd    ['DS', '--', 'WM', '--', 'DS', '--', 'DS', '--'],
         * 4:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 5:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 6:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 7:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']]
         */
        it("[2, 3] -> [3, 2], [4, 1]", function () {
          var match = {};
          match.turnIndexBeforeMove = BLACK_TURN_INDEX;
          match.stateBeforeMove = {
            board: emptyBoard,
            deltaFrom: {row: 5, col: 4},
            deltaTo: {row: 4, col: 3}
          };

          match.stateBeforeMove.board[2][3] = CONSTANT.BLACK_MAN;
          match.stateBeforeMove.board[3][2] = CONSTANT.WHITE_MAN;

          match.move = [];
          match.move.push({endMatch: {endMatchScores: [1, 0]}});
          match.move.push({set: {key: 'board', value: [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'BM', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
          ]}});
          match.move.push({set: {key: 'fromDelta', value: {row: 2, col: 3}}});
          match.move.push({set: {key: 'toDelta', value: {row: 4, col: 1}}});

          expect(checkersLogicService.isMoveOk(match)).toEqual(true);
        });

        /*
         * END GAME SCENARIO - BLACK
         *
         *             0     1     2     3     4     5     6     7
         * 0:even  [['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 1:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 2:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 3:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 4:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 5:odd    ['BM', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
         * 6:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 7:odd    ['WM', '--', 'DS', '--', 'DS', '--', 'DS', '--']]
         */
        it("[5, 0] -> [6, 1]: Legal because [7, 0] has no moves", function () {
          var match = {};
          match.turnIndexBeforeMove = BLACK_TURN_INDEX;
          match.stateBeforeMove = {
            board: emptyBoard,
            deltaFrom: {row: 5, col: 0},
            deltaTo: {row: 6, col: 1}
          };

          match.stateBeforeMove.board[5][0] = CONSTANT.BLACK_MAN;
          match.stateBeforeMove.board[5][2] = CONSTANT.BLACK_MAN;
          match.stateBeforeMove.board[7][0] = CONSTANT.WHITE_MAN;

          match.move = [];
          match.move.push({endMatch: {endMatchScores: [1, 0]}});
          match.move.push({set: {key: 'board', value: [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
            ['--', 'BM', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['WM', '--', 'DS', '--', 'DS', '--', 'DS', '--']
          ]}});
          match.move.push({set: {key: 'fromDelta', value: {row: 5, col: 0}}});
          match.move.push({set: {key: 'toDelta', value: {row: 6, col: 1}}});

          expect(checkersLogicService.isMoveOk(match)).toEqual(true);
        });

        /**
         * END GAME SCENARIO - BLACK (ILLEGAL)
         *
         *             0     1     2     3     4     5     6     7
         * 0:even  [['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 1:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 2:even   ['--', 'DS', '--', 'BM', '--', 'DS', '--', 'DS'],
         * 3:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 4:even   ['--', 'WM', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 5:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 6:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 7:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']]
         */
        it("[2, 3] -> [3, 2]: Illegal because the game is not ended.",
              function () {
            var match = {};
            match.turnIndexBeforeMove = BLACK_TURN_INDEX;
            match.stateBeforeMove = {
              board: emptyBoard,
              deltaFrom: {row: 5, col: 0},
              deltaTo: {row: 6, col: 1}
            };

            match.stateBeforeMove.board[2][3] = CONSTANT.BLACK_MAN;
            match.stateBeforeMove.board[4][1] = CONSTANT.WHITE_MAN;

            match.move = [];
            match.move.push({endMatch: {endMatchScores: [1, 0]}});
            match.move.push({set: {key: 'board', value: [
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
              ['--', 'BM', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['WM', '--', 'DS', '--', 'DS', '--', 'DS', '--']
            ]}});
            match.move.push({set: {key: 'fromDelta', value: {row: 2, col: 3}}});
            match.move.push({set: {key: 'toDelta', value: {row: 3, col: 2}}});

            expectIllegalOperation(checkersLogicService, match,
                ILLEGAL_CODE.ILLEGAL_MOVE);
          });
      });

      describe("ENDGAME SCENARIO - WHITE: ", function () {
        /*
         * END GAME SCENARIO - WHITE
         *
         *             0     1     2     3     4     5     6     7
         * 0:even  [['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 1:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 2:even   ['--', 'DS', '--', 'BM', '--', 'DS', '--', 'DS'],
         * 3:odd    ['DS', '--', 'WM', '--', 'DS', '--', 'DS', '--'],
         * 4:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 5:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 6:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 7:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']]
         */
        it("[3, 2] -> [2, 3] -> [1, 4]", function () {
          var match = {};
          match.turnIndexBeforeMove = WHITE_TURN_INDEX;
          match.stateBeforeMove = {
            board: emptyBoard,
            deltaFrom: {row: 5, col: 4},
            deltaTo: {row: 4, col: 3}
          };

          match.stateBeforeMove.board[2][3] = CONSTANT.BLACK_MAN;
          match.stateBeforeMove.board[3][2] = CONSTANT.WHITE_MAN;

          match.move = [];
          match.move.push({endMatch: {endMatchScores: [0, 1]}});
          match.move.push({set: {key: 'board', value: [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'WM', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
          ]}});
          match.move.push({set: {key: 'fromDelta', value: {row: 3, col: 2}}});
          match.move.push({set: {key: 'toDelta', value: {row: 1, col: 4}}});
          expect(checkersLogicService.isMoveOk(match)).toEqual(true);
        });

        /*
         * END GAME SCENARIO - WHITE
         *
         *             0     1     2     3     4     5     6     7
         * 0:even  [['--', 'DS', '--', 'DS', '--', 'DS', '--', 'BM'],
         * 1:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 2:even   ['--', 'DS', '--', 'DS', '--', 'WM', '--', 'WM'],
         * 3:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 4:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 5:odd    ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
         * 6:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 7:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']]
         */
        it("[2, 7] -> [1, 6]: Legal because 3 has no moves", function () {
          var match = {};
          match.turnIndexBeforeMove = WHITE_TURN_INDEX;
          match.stateBeforeMove = {
            board: emptyBoard,
            deltaFrom: {row: 5, col: 0},
            deltaTo: {row: 6, col: 1}
          };

          match.stateBeforeMove.board[0][7] = CONSTANT.BLACK_MAN;
          match.stateBeforeMove.board[2][5] = CONSTANT.WHITE_MAN;
          match.stateBeforeMove.board[2][7] = CONSTANT.WHITE_MAN;

          match.move = [];
          match.move.push({endMatch: {endMatchScores: [0, 1]}});
          match.move.push({set: {key: 'board', value: [
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'BM'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'WM', '--'],
            ['--', 'DS', '--', 'DS', '--', 'WM', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
            ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
            ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
          ]}});
          match.move.push({set: {key: 'fromDelta', value: {row: 2, col: 7}}});
          match.move.push({set: {key: 'toDelta', value: {row: 1, col: 6}}});

          expect(checkersLogicService.isMoveOk(match)).toEqual(true);
        });

        /**
         * END GAME SCENARIO - WHITE (ILLEGAL)
         *
         *             0     1     2     3     4     5     6     7
         * 0:even  [['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 1:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 2:even   ['--', 'DS', '--', 'BM', '--', 'DS', '--', 'DS'],
         * 3:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 4:even   ['--', 'WM', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 5:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
         * 6:even   ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
         * 7:odd    ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']]
         */
        it("[4, 1] -> [3, 2]: Illegal because the game is not ended.",
              function () {
            var match = {};
            match.turnIndexBeforeMove = WHITE_TURN_INDEX;
            match.stateBeforeMove = {
              board: emptyBoard,
              deltaFrom: {row: 5, col: 0},
              deltaTo: {row: 6, col: 1}
            };

            match.stateBeforeMove.board[2][3] = CONSTANT.BLACK_MAN;
            match.stateBeforeMove.board[4][1] = CONSTANT.WHITE_MAN;

            match.move = [];
            match.move.push({endMatch: {endMatchScores: [0, 1]}});
            match.move.push({set: {key: 'board', value: [
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'BM', '--', 'DS', '--', 'DS', '--'],
              ['--', 'BM', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['WM', '--', 'DS', '--', 'DS', '--', 'DS', '--']
            ]}});
            match.move.push({set: {key: 'fromDelta', value: {row: 4, col: 1}}});
            match.move.push({set: {key: 'toDelta', value: {row: 3, col: 2}}});

            expectIllegalOperation(checkersLogicService, match,
                ILLEGAL_CODE.ILLEGAL_MOVE);
          });
      });
    });
  });
}());