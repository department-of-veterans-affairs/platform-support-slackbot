const expect = require('chai').expect;
const responseBuilder = require('../../../../src/api/slack/block-kit/response-builder');

describe('Response Builder', () => {
  it('should populate a response message correctly', () => {
    const userId = 'alex.yip';
    const selectedTeam = 'FE Tools';
    const summaryDescription = 'I need a PR Reviewed';

    let response = responseBuilder.buildSupportResponse(
      userId,
      selectedTeam,
      summaryDescription
    );

    expect(response[0].text.text).to.equal(
      "Hey there <@alex.yip>! We've recieved your Platform support request."
    );
    expect(response[1].text.text).to.equal('*Need help with*\nFE Tools');
    expect(response[2].text.text).to.equal('*Summary*\nI need a PR Reviewed');
  });
});
