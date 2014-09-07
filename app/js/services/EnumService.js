'use strict';

/**
 * Enums
 */
checkers.factory('enumService', function () {
  var ILLEGAL_CODE,
      DIRECTION,
      MOVE_TYPE,
      KIND,
      COLOR;

  ILLEGAL_CODE = {
    ILLEGAL_MOVE: 'ILLEGAL_MOVE',
    ILLEGAL_SIMPLE_MOVE: 'ILLEGAL_SIMPLE_MOVE',
    ILLEGAL_JUMP_MOVE: 'ILLEGAL_JUMP_MOVE',
    ILLEGAL_INDEX: 'ILLEGAL_INDEX',
    ILLEGAL_COLOR_CHANGED: 'ILLEGAL_COLOR_CHANGED',
    ILLEGAL_CROWNED: 'ILLEGAL_CROWNED',
    ILLEGAL_UNCROWNED: 'ILLEGAL_UNCROWNED',
    ILLEGAL_IGNORE_MANDATORY_JUMP: 'ILLEGAL_IGNORE_MANDATORY_JUMP',
    ILLEGAL_SET_TURN: 'ILLEGAL_SET_TURN',
    ILLEGAL_END_MATCH_SCORE: 'ILLEGAL_END_MATCH_SCORE'
  };

  DIRECTION = {
    UP_LEFT: 'UP_LEFT',
    UP_RIGHT: 'UP_RIGHT',
    DOWN_LEFT: 'DOWN_LEFT',
    DOWN_RIGHT: 'DOWN_RIGHT'
  };

  MOVE_TYPE = {
    SIMPLE_MOVE: 'SIMPLE_MOVE',
    JUMP_MOVE:'JUMP_MOVE'
  };

  return {
    ILLEGAL_CODE: ILLEGAL_CODE,
    DIRECTION: DIRECTION,
    MOVE_TYPE: MOVE_TYPE,
  };
});

