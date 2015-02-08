(function () {
  'use strict';
  /*global angular, expect, describe, it, beforeEach, module, inject */

  describe('New AI service:', function () {
    var checkersLogicService,
        CONSTANT,
        checkersNewAiService,
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

    beforeEach(inject(function (_checkersNewAiService_) {
      checkersNewAiService = _checkersNewAiService_;
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


    it("AI/White capture the piece... [5, 2] -> [4, 1] -> [3, 0]", function() {
      var board = [
        ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
        ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
        ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'BM'],
        ['DS', '--', 'WM', '--', 'DS', '--', 'DS', '--'],
        ['--', 'BM', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'WM', '--', 'WM', '--', 'WM', '--'],
        ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
        ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
      ];
      var move = checkersNewAiService.createComputerMove(
          board, 1, {maxDepth: 1});
      var expectedMove =
          [{setTurn: {turnIndex: 0}},
            {set: {key: 'board', value: [
                  ['--', 'BM', '--', 'BM', '--', 'BM', '--', 'BM'],
                  ['BM', '--', 'BM', '--', 'BM', '--', 'BM', '--'],
                  ['--', 'DS', '--', 'BM', '--', 'BM', '--', 'BM'],
                  ['WM', '--', 'WM', '--', 'DS', '--', 'DS', '--'],
                  ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
                  ['DS', '--', 'DS', '--', 'WM', '--', 'WM', '--'],
                  ['--', 'WM', '--', 'WM', '--', 'WM', '--', 'WM'],
                  ['WM', '--', 'WM', '--', 'WM', '--', 'WM', '--']
                ]}},
            {set: {key: 'fromDelta', value: {row: 5, col: 2}}},
            {set: {key: 'toDelta', value: {row: 3, col: 0}}}
          ];

      expect(angular.equals(move, expectedMove)).toBe(true);
    });

    it("AI/White will move forward... [7, 0] -> [6, 1]", function() {
      var board = [
        ['--', 'BM', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['WM', '--', 'DS', '--', 'DS', '--', 'DS', '--']
      ];
      var move = checkersNewAiService.createComputerMove(
          board, 1, {maxDepth: 1});
      var expectedMove =
          [{setTurn: {turnIndex: 0}},
            {set: {key: 'board', value: [
              ['--', 'BM', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'WM', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
            ]}},
            {set: {key: 'fromDelta', value: {row: 7, col: 0}}},
            {set: {key: 'toDelta', value: {row: 6, col: 1}}}
          ];

      expect(angular.equals(move, expectedMove)).toBe(true);
    });

    it("AI/White will move smart... Not getting captured [6, 1] -> [5, 0]", function() {
      var board = [
        ['--', 'BM', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'DS', '--', 'BM', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
        ['--', 'WM', '--', 'DS', '--', 'DS', '--', 'DS'],
        ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
      ];
      var move = checkersNewAiService.createComputerMove(
          board, 1, {maxDepth: 1});
      var expectedMove =
          [{setTurn: {turnIndex: 0}},
            {set: {key: 'board', value: [
              ['--', 'BM', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'BM', '--', 'DS', '--', 'DS'],
              ['WM', '--', 'DS', '--', 'DS', '--', 'DS', '--'],
              ['--', 'DS', '--', 'DS', '--', 'DS', '--', 'DS'],
              ['DS', '--', 'DS', '--', 'DS', '--', 'DS', '--']
            ]}},
            {set: {key: 'fromDelta', value: {row: 6, col: 1}}},
            {set: {key: 'toDelta', value: {row: 5, col: 0}}}
          ];

      expect(angular.equals(move, expectedMove)).toBe(true);
    });
  });
}());