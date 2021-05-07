const expect = require('chai').expect;
const util = require('../src/api/slack/util');

describe('Util', () => {
  let sut;

  beforeEach(() => {
    sut = util({});
  });

  afterEach(() => {
    sut = null;
  });

  it('build a message link correctly', () => {
    // Example Link:
    // https://adhoc.slack.com/archives/C01UZ7SULTX/p1620056853018500
    const channel = 'C01UZ7SULTX';
    const messageId = '1620055651.018100';

    const link = sut.createMessageLink(channel, messageId);

    expect(link).to.equal(
      'https://adhoc.slack.com/archives/C01UZ7SULTX/p1620055651018100'
    );
  });

  it('should return an empty string with a null channel', () => {
    const channel = null;
    const messageId = null;

    const link = sut.createMessageLink(channel, messageId);

    expect(link).to.equal('');
  });
});
