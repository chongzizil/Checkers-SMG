'use strict';

var isEvenRow = function (row) {
  if (row % 2 === 0) {
    return true;
  }
  return false;
};

var isEvenCol = function (col) {
  if (col % 2 === 0) {
    return true;
  }
  return false;
};

var checkInitialState = function () {
  for (var i = 0; i < 64; i += 1) {
    var row = Math.floor(i / 8);
    var col = i % 8;
    if (row < 3) {
      if (isEvenRow(row) !== isEvenCol(col)) {
        expect(element(by.id(i + '')).getAttribute('class')).toMatch(/isBlackMan/);
      } else {
        expect(element(by.id(i + '')).getAttribute('class')).toMatch(/isEmpty/);
      }
    } else if (row >= 3 && row < 5) {
      expect(element(by.id(i + '')).getAttribute('class')).toMatch(/isEmpty/);
    } else if (row >= 5 && row < 8) {
      if (isEvenRow(row) !== isEvenCol(col)) {
        expect(element(by.id(i + '')).getAttribute('class')).toMatch(/isWhiteMan/);
      } else {
        expect(element(by.id(i + '')).getAttribute('class')).toMatch(/isEmpty/);
      }
    }
  }
};

describe('Checkers E2E Test:', function() {

  browser.get('index.html');

  it('Check the title', function () {
    expect(browser.getTitle()).toEqual('Checkers');
  });

  it('Check the squares is 64', function () {
    var numOfSquares = element.all(by.repeater('square in uiState')).count();
    expect(numOfSquares).toEqual(64);
  });

  it('Check the squares are proper initialized', function () {
    checkInitialState();
  });

  it('Check the new game button functionality', function () {
    // Make a simple move first.
    element(by.id('17')).click();
    element(by.id('26')).click();
    expect(element(by.id('17')).getAttribute('class')).toMatch(/isEmpty/);
    expect(element(by.id('26')).getAttribute('class')).toMatch(/isBlackMan/);

    // Click the new game button to start a new game.
    element(by.id('new_game_btn')).click();
    expect(element(by.id('17')).getAttribute('class')).toMatch(/isBlackMan/);
    expect(element(by.id('26')).getAttribute('class')).toMatch(/isEmpty/);
  });

  it('Test run', function () {
    element(by.id('new_game_btn')).click();

    // Sample game: http://en.wikipedia.org/wiki/English_draughts#Sample_game

//    17 -> 26
    element(by.id('17')).click();
    element(by.id('26')).click();
//    44 -> 35
    element(by.id('44')).click();
    element(by.id('35')).click();
//    26 -> 44
    element(by.id('26')).click();
    element(by.id('44')).click();
//    53 -> 35
    element(by.id('53')).click();
    element(by.id('35')).click();
//    8 -> 17
    element(by.id('8')).click();
    element(by.id('17')).click();
//    51 -> 44
    element(by.id('51')).click();
    element(by.id('44')).click();
//    23 -> 30
    element(by.id('23')).click();
    element(by.id('30')).click();
//    58 -> 51
    element(by.id('58')).click();
    element(by.id('51')).click();
//    30 -> 37
    element(by.id('30')).click();
    element(by.id('37')).click();
//    46 -> 28
    element(by.id('46')).click();
    element(by.id('28')).click();
//    19 -> 37
    element(by.id('19')).click();
    element(by.id('37')).click();
//    44 -> 30
    element(by.id('44')).click();
    element(by.id('30')).click();
//    21 -> 39
    element(by.id('21')).click();
    element(by.id('39')).click();
//    42 -> 33
    element(by.id('42')).click();
    element(by.id('33')).click();
//    12 -> 21
    element(by.id('12')).click();
    element(by.id('21')).click();
//    35 -> 28
    element(by.id('35')).click();
    element(by.id('28')).click();
//    21 -> 35
    element(by.id('21')).click();
    element(by.id('35')).click();
//    55 -> 46
    element(by.id('55')).click();
    element(by.id('46')).click();
//    39 -> 53
    element(by.id('39')).click();
    element(by.id('53')).click();
//    62 -> 44
    element(by.id('62')).click();
    element(by.id('44')).click();
//    44 -> 26
    element(by.id('44')).click();
    element(by.id('26')).click();
//    26 -> 8
    element(by.id('26')).click();
    element(by.id('8')).click();
//    14 -> 21
    element(by.id('14')).click();
    element(by.id('21')).click();
//    51 -> 44
    element(by.id('51')).click();
    element(by.id('44')).click();
//    7 -> 14
    element(by.id('7')).click();
    element(by.id('14')).click();
//    49 -> 42
    element(by.id('49')).click();
    element(by.id('42')).click();
//    21 -> 28
    element(by.id('21')).click();
    element(by.id('28')).click();
//    33 -> 24
    element(by.id('33')).click();
    element(by.id('24')).click();
//    14 -> 21
    element(by.id('14')).click();
    element(by.id('21')).click();
//    40 -> 33
    element(by.id('40')).click();
    element(by.id('33')).click();
//    21 -> 30
    element(by.id('21')).click();
    element(by.id('30')).click();
//    44 -> 35
    element(by.id('44')).click();
    element(by.id('35')).click();
//    28 -> 37
    element(by.id('28')).click();
    element(by.id('37')).click();
//    33 -> 26
    element(by.id('33')).click();
    element(by.id('26')).click();
//    37 -> 46
    element(by.id('37')).click();
    element(by.id('46')).click();
//    26 -> 19
    element(by.id('26')).click();
    element(by.id('19')).click();
//    10 -> 28
    element(by.id('10')).click();
    element(by.id('28')).click();
//    35 -> 21
    element(by.id('35')).click();
    element(by.id('21')).click();
//    46 -> 55
    element(by.id('46')).click();
    element(by.id('55')).click();
//    42 -> 33
    element(by.id('42')).click();
    element(by.id('33')).click();
//    55 -> 62
    element(by.id('55')).click();
    element(by.id('62')).click();
//    33 -> 26
    element(by.id('33')).click();
    element(by.id('26')).click();
//    62 -> 55
    element(by.id('62')).click();
    element(by.id('55')).click();
//    60 -> 53
    element(by.id('60')).click();
    element(by.id('53')).click();
//    30 -> 37
    element(by.id('30')).click();
    element(by.id('37')).click();
//    53 -> 46
    element(by.id('53')).click();
    element(by.id('46')).click();
//    37 -> 44
    element(by.id('37')).click();
    element(by.id('44')).click();
//    46 -> 39
    element(by.id('46')).click();
    element(by.id('39')).click();
//    44 -> 51
    element(by.id('44')).click();
    element(by.id('51')).click();
//    56 -> 49
    element(by.id('56')).click();
    element(by.id('49')).click();
//    51 -> 58
    element(by.id('51')).click();
    element(by.id('58')).click();
//    49 -> 40
    element(by.id('49')).click();
    element(by.id('40')).click();
//    58 -> 51
    element(by.id('58')).click();
    element(by.id('51')).click();
//    26 -> 17
    element(by.id('26')).click();
    element(by.id('17')).click();
//    51 -> 44
    element(by.id('51')).click();
    element(by.id('44')).click();
//    39 -> 30
    element(by.id('39')).click();
    element(by.id('30')).click();
//    44 -> 35
    element(by.id('44')).click();
    element(by.id('35')).click();
//    30 -> 23
    element(by.id('30')).click();
    element(by.id('23')).click();
//    35 -> 26
    element(by.id('35')).click();
    element(by.id('26')).click();
//    21 -> 14
    element(by.id('21')).click();
    element(by.id('14')).click();
//    55 -> 46
    element(by.id('55')).click();
    element(by.id('46')).click();
//    14 -> 7
    element(by.id('14')).click();
    element(by.id('7')).click();
//    46 -> 37
    element(by.id('46')).click();
    element(by.id('37')).click();
//    7 -> 14
    element(by.id('7')).click();
    element(by.id('14')).click();
//    37 -> 30
    element(by.id('37')).click();
    element(by.id('30')).click();
//    17 -> 10
    element(by.id('17')).click();
    element(by.id('10')).click();
//    1 -> 19
    element(by.id('1')).click();
    element(by.id('19')).click();
//    8 -> 1
    element(by.id('8')).click();
    element(by.id('1')).click();
//    19 -> 28
    element(by.id('19')).click();
    element(by.id('28')).click();
//    1 -> 10
    element(by.id('1')).click();
    element(by.id('10')).click();
//    3 -> 17
    element(by.id('3')).click();
    element(by.id('17')).click();
//    24 -> 10
    element(by.id('24')).click();
    element(by.id('10')).click();
//    30 -> 21
    element(by.id('30')).click();
    element(by.id('21')).click();
//    14 -> 7
    element(by.id('14')).click();
    element(by.id('7')).click();
//    28 -> 35
    element(by.id('28')).click();
    element(by.id('35')).click();
//    10 -> 1
    element(by.id('10')).click();
    element(by.id('1')).click();
//    35 -> 42
    element(by.id('35')).click();
    element(by.id('42')).click();
//    1 -> 10
    element(by.id('1')).click();
    element(by.id('10')).click();
//    42 -> 51
    element(by.id('42')).click();
    element(by.id('51')).click();
//    10 -> 1
    element(by.id('10')).click();
    element(by.id('1')).click();
//    51 -> 58
    element(by.id('51')).click();
    element(by.id('58')).click();
//    1 -> 10
    element(by.id('1')).click();
    element(by.id('10')).click();
//    58 -> 51
    element(by.id('58')).click();
    element(by.id('51')).click();
//    10 -> 1
    element(by.id('10')).click();
    element(by.id('1')).click();
//    51 -> 42
    element(by.id('51')).click();
    element(by.id('42')).click();
//    1 -> 10
    element(by.id('1')).click();
    element(by.id('10')).click();
//    42 -> 35
    element(by.id('42')).click();
    element(by.id('35')).click();
//    10 -> 1
    element(by.id('10')).click();
    element(by.id('1')).click();
//    26 -> 17
    element(by.id('26')).click();
    element(by.id('17')).click();
//    1 -> 8
    element(by.id('1')).click();
    element(by.id('8')).click();
//    17 -> 10
    element(by.id('17')).click();
    element(by.id('10')).click();
//    40 -> 33
    element(by.id('40')).click();
    element(by.id('33')).click();
//    35 -> 42
    element(by.id('35')).click();
    element(by.id('42')).click();

    /**
     * Expected Result
     *
     *      0    1    2    3    4    5    6    7
     * 0 | ** |  0 | ** |  1 | ** |  2 | ** |  3 |
     *   | -- | -- | -- | -- | -- | BM | -- | WC |
     * 1 |  4 | ** |  5 | ** |  6 | ** |  7 | ** |
     *   | WC | -- | BC | -- | -- | -- | -- | -- |
     * 2 | ** |  8 | ** |  9 | ** | 10 | ** | 11 |
     *   | -- | -- | -- | -- | -- | BC | -- | WM |
     * 3 | 12 | ** | 13 | ** | 14 | ** | 15 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 4 | ** | 16 | ** | 17 | ** | 18 | ** | 19 |
     *   | -- | WB | -- | -- | -- | -- | -- | -- |
     * 5 | 20 | ** | 21 | ** | 22 | ** | 23 | ** |
     *   | -- | -- | BC | -- | -- | -- | -- | -- |
     * 6 | ** | 24 | ** | 25 | ** | 26 | ** | 27 |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     * 7 | 28 | ** | 29 | ** | 30 | ** | 31 | ** |
     *   | -- | -- | -- | -- | -- | -- | -- | -- |
     */

    expect(element(by.id('5')).getAttribute('class')).toMatch(/isBlackMan/);
    expect(element(by.id('7')).getAttribute('class')).toMatch(/isWhiteCro/);
    expect(element(by.id('8')).getAttribute('class')).toMatch(/isWhiteCro/);
    expect(element(by.id('10')).getAttribute('class')).toMatch(/isBlackCro/);
    expect(element(by.id('21')).getAttribute('class')).toMatch(/isBlackCro/);
    expect(element(by.id('23')).getAttribute('class')).toMatch(/isWhiteMan/);
    expect(element(by.id('33')).getAttribute('class')).toMatch(/isWhiteMan/);
    expect(element(by.id('42')).getAttribute('class')).toMatch(/isBlackCro/);
  });
});
