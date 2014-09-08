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
      COLUMN: 4,
      BLACK: 'B',
      WHITE: 'W',
      BLACK_INDEX: 0,
      WHITE_INDEX: 1
    };
  });
}());