'use strict';

describe('Checkers E2E Test:', function() {

  browser.get('index.html');

  it('Check the title', function () {
    expect(browser.getTitle()).toEqual('Checkers');
  });

  it('Check the squares is 64', function () {
    var numOfSquares = element.all(by.repeater('square in uiState')).count();
    expect(numOfSquares).toEqual(64);
  });

  it('Some move tests including simple move, jump move and crowned',
      function () {
    // White move: 41 -> 34
    element(by.id('41')).click();
    element(by.id('34')).click();
    expect(element(by.id('42')).getAttribute('class')).toMatch(/isEmpty/);
    expect(element(by.id('34')).getAttribute('class')).toMatch(/isWhiteMan/);

    // Black move: 18 -> 25
    element(by.id('18')).click();
    element(by.id('25')).click();
    expect(element(by.id('18')).getAttribute('class')).toMatch(/isEmpty/);
    expect(element(by.id('25')).getAttribute('class')).toMatch(/isBlackMan/);

    // White move: 50 -> 41
    element(by.id('50')).click();
    element(by.id('41')).click();
    expect(element(by.id('50')).getAttribute('class')).toMatch(/isEmpty/);
    expect(element(by.id('41')).getAttribute('class')).toMatch(/isWhiteMan/);

    // Black move: 22 -> 29
    element(by.id('22')).click();
    element(by.id('29')).click();
    expect(element(by.id('22')).getAttribute('class')).toMatch(/isEmpty/);
    expect(element(by.id('29')).getAttribute('class')).toMatch(/isBlackMan/);

    // White move: 45 -> 36
    element(by.id('45')).click();
    element(by.id('36')).click();
    expect(element(by.id('45')).getAttribute('class')).toMatch(/isEmpty/);
    expect(element(by.id('36')).getAttribute('class')).toMatch(/isWhiteMan/);

    // Black move: 29 -> 38
    element(by.id('29')).click();
    element(by.id('38')).click();
    expect(element(by.id('29')).getAttribute('class')).toMatch(/isEmpty/);
    expect(element(by.id('38')).getAttribute('class')).toMatch(/isBlackMan/);

    // White move: 47 -> 29
    element(by.id('47')).click();
    element(by.id('29')).click();
    expect(element(by.id('47')).getAttribute('class')).toMatch(/isEmpty/);
    expect(element(by.id('38')).getAttribute('class')).toMatch(/isEmpty/);
    expect(element(by.id('29')).getAttribute('class')).toMatch(/isWhiteMan/);

    // Black move: 20 -> 38
    element(by.id('20')).click();
    element(by.id('38')).click();
    expect(element(by.id('20')).getAttribute('class')).toMatch(/isEmpty/);
    expect(element(by.id('29')).getAttribute('class')).toMatch(/isEmpty/);
    expect(element(by.id('38')).getAttribute('class')).toMatch(/isBlackMan/);

    // White move: 54 -> 45
    element(by.id('54')).click();
    element(by.id('45')).click();
    expect(element(by.id('54')).getAttribute('class')).toMatch(/isEmpty/);
    expect(element(by.id('45')).getAttribute('class')).toMatch(/isWhiteMan/);

    // Black move: 38 -> 47
    element(by.id('38')).click();
    element(by.id('47')).click();
    expect(element(by.id('38')).getAttribute('class')).toMatch(/isEmpty/);
    expect(element(by.id('47')).getAttribute('class')).toMatch(/isBlackMan/);

    // White move: 61 -> 54
    element(by.id('61')).click();
    element(by.id('54')).click();
    expect(element(by.id('61')).getAttribute('class')).toMatch(/isEmpty/);
    expect(element(by.id('54')).getAttribute('class')).toMatch(/isWhiteMan/);

    // Black move: 47 -> 61 (CROWNED)
    element(by.id('47')).click();
    element(by.id('61')).click();
    expect(element(by.id('47')).getAttribute('class')).toMatch(/isEmpty/);
    expect(element(by.id('54')).getAttribute('class')).toMatch(/isEmpty/);
    expect(element(by.id('61')).getAttribute('class')).toMatch(/isBlackCro/);
  });
});
