const expect = require('chai').expect;
const util = require('../src/util');

describe('Util', () => {
  let sut;

  beforeEach(() => {
    sut = util({});
  });

  afterEach(() => {
    sut = null;
  });

  it('build a message link correctly', () => {
    //https://adhoc.slack.com/archives/C01UZ7SULTX/p1620056853018500
    const channel = 'C01UZ7SULTX';
    const messageId = '1620055651.018100';

    const link = sut.createMessageLink(channel, messageId);

    expect(link).to.equal(
      'https://adhoc.slack.com/archives/C01UZ7SULTX/p1620055651018100'
    );
  });
});
