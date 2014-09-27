(function () {
  'use strict';
  /*global angular */

  /**
   * Constants
   */
  angular.module('checkers').factory('constantService', function () {
    return {
      ROW: 8,
      // Since only the dark square may contain pieces, for both the
      // gameApiState and logicState, I only concern the dark squares.
      // Therefore the column is count to only 4.
      COLUMN: 8,
      LIGHT_SQUARE: '  ',
      DARK_SQUARE: 'DS',
      BLACK_MAN: 'BM',
      BLACK_KING: 'BK',
      WHITE_MAN: 'WM',
      WHITE_KING: 'WK',
      BLACK: 'B',
      WHITE: 'W',
      MAN: 'M',
      KING: 'K',
      BLACK_INDEX: 0,
      WHITE_INDEX: 1
    };
  });
}());