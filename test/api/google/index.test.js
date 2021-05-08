const sinon = require('sinon');
const chai = require('chai');
const assertArrays = require('chai-arrays');

// Chai Setup
chai.use(assertArrays);
const expect = chai.expect;

const logger = require('pino')({
  enabled: false,
});

describe('api/google', () => {
  describe('Google Sheets', () => {
    let sheets;

    beforeEach(() => {
      sheets = require('../../../src/api/google')(logger);

      const obj = {};

      sinon
        .stub(sheets, 'getGoogleSheet')
        .withArgs(sinon.match.any)
        .returns(obj);

      sinon.stub(sheets, 'getTeamsSheetRows').resolves([
        { Title: 'Frontend Tools', Id: 'FE' },
        { Title: 'Backend Tools', Id: 'BE' },
      ]);

      sheets.getGoogleSheet.callThrough();
      sheets.getTeamsSheetRows.callThrough();
    });

    afterEach(() => {
      sheets = null;
    });

    describe('getTeams()', () => {
      it('should convert teams to text/value pair', async () => {
        const result = await sheets.getTeams();

        expect(result).to.eql([
          { text: 'Frontend Tools', value: 'FE' },
          { text: 'Backend Tools', value: 'BE' },
        ]);
      });
    });
  });
});
