'use strict';

describe('Checkers E2E Test:', function() {

  browser.get('index.html');

  it('Check the title', function () {
    expect(browser.getTitle()).toEqual('Checkers');
  });
  console.log(squares);
});
