const { GoogleSpreadsheet } = require('google-spreadsheet');
const creds = require('../../../client_secret.json');
const moment = require('moment-timezone');

module.exports = function (logger) {
  let sheets = {};

  /**
   * Loads the Google Sheet into memory based on the Sheet Id.
   * You can find the Google Sheet ID in the URL of an open spreadsheet.
   * @example
   *    https://docs.google.com/spreadsheets/d/1k9P921Hdo654631HmX9WovGaYRIFAhO3QRg3EN3F9gI
   *    Spreadsheet ID: 1k9P921Hdo654631HmX9WovGaYRIFAhO3QRg3EN3F9gI
   * @param {string} spreadsheetId
   * @returns Google Spreadsheet Instance
   */
  const getGoogleSheet = async (spreadsheetId) => {
    const doc = new GoogleSpreadsheet(spreadsheetId);

    // Authentication using Google Service Account (See client_secret.json)
    doc.useServiceAccountAuth(creds);

    // loads document properties and worksheets
    await doc.loadInfo();

    return doc;
  };

  /**
   * Reads the team Google Spreadsheet and returns an array of
   * teams and associated values.
   * @returns Array of text/values
   */
  sheets.getTeams = async () => {
    const doc = await getGoogleSheet(process.env.TEAMS_SPREADSHEET_ID);

    const sheet = doc.sheetsByIndex[0];

    const rows = await sheet.getRows();

    let result = [];

    for (let i = 0; i < sheet.rowCount; i++) {
      if (!rows[i]) break;
      result.push({ text: rows[i].Title, value: rows[i].Id });
    }

    return result;
  };

  sheets.getTeamById = async (teamId) => {
    const doc = await getGoogleSheet(process.env.TEAMS_SPREADSHEET_ID);

    const sheet = doc.sheetsByIndex[0];

    const rows = await sheet.getRows();

    return rows[teamId - 1];
  };

  /**
   * Capture form responses and saves them to the Support Responses
   * Spreadsheet.
   * @param {string} messageId Message Id
   * @param {string} username Current user name
   * @param {date} currentTime JavaScript date object
   * @param {array} usersRequestingSupport Users requesting support
   * @param {string} selectedTeam Selected team
   * @param {string} summaryDescription Summary description
   * @param {string} messageLink Link to support ticket/message
   */
  sheets.captureResponses = async (
    messageId,
    username,
    currentTime,
    usersRequestingSupport,
    selectedTeam,
    summaryDescription,
    messageLink
  ) => {
    const doc = await getGoogleSheet(process.env.RESPONSES_SPREADSHEET_ID);

    const sheet = doc.sheetsByIndex[0];

    const userList = usersRequestingSupport.join(', ');

    const dateFormatted = moment
      .tz(currentTime, 'America/New_York')
      .format('LLLL');

    const row = await sheet.addRow({
      MessageId: messageId,
      SubmittedBy: username,
      DateTimeUTC: currentTime,
      DateTimeEST: dateFormatted,
      Users: userList,
      Team: selectedTeam,
      Summary: summaryDescription,
      MessageLink: messageLink,
    });
  };

  /**
   * Updates the Google Sheet with the first reply time stamp.
   * Note: Since Google Sheet is not a database, the code does a "table scan" to find
   *       the right Message ID.
   * @param {string} messageId - Message ID in Google Sheet to be updated.
   */
  sheets.updateReplyTimeStampForMessage = async (messageId) => {
    const doc = await getGoogleSheet(process.env.RESPONSES_SPREADSHEET_ID);

    const sheet = doc.sheetsByIndex[0];

    const rows = await sheet.getRows();

    let row;

    // TODO: Find the best approach for updating the reply time stamp.
    logger.debug(sheet.rowCount);

    for (let i = 0; i < sheet.rowCount; i++) {
      if (!rows[i]) break;
      if (rows[i].MessageId === messageId) {
        row = rows[i];
        break;
      }
    }

    if (row && row.FirstReplyTimeUTC === '') {
      row.FirstReplyTimeUTC = new Date(Date.now()).toISOString();
      await row.save();
    } else {
      logger.debug('Row not found...');
    }
  };

  return sheets;
};
