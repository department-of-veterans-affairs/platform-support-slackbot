const { GoogleSpreadsheet } = require('google-spreadsheet');
const client_config = require('../../../google_client.json');
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
  sheets.getGoogleSheet = async (spreadsheetId) => {
    const doc = new GoogleSpreadsheet(spreadsheetId);

    // Authentication using Google Service Account
    const creds = {
      "private_key_id": process.env.GOOGLE_PRIVATE_KEY_ID,
      "private_key": process.env.GOOGLE_PRIVATE_KEY,
      "client_id": process.env.GOOGLE_CLIENT_ID
    };
    const auth = {
      ... client_config,
      ... creds
    };

    doc.useServiceAccountAuth(auth);

    // loads document properties and worksheets
    await doc.loadInfo();

    return doc;
  };

  /**
   * Returns the Google Sheet containing the list of teams and mappings
   * @returns Teams Sheet
   */
  sheets.getTeamsSheet = async () => {
    const doc = await sheets.getGoogleSheet(process.env.TEAMS_SPREADSHEET_ID);

    // Return first tab
    return doc.sheetsByIndex[0];
  };

  /**
   * Returns the Google Sheet containing the list of categories and mappings
   * @returns Categories Sheet
   */
   sheets.getCategoriesSheet = async () => {
    const doc = await sheets.getGoogleSheet(process.env.CATEGORIES_SPREADSHEET_ID);

    // Return first tab
    return doc.sheetsByIndex[0];
  };

  /**
   * Returns the Google Sheet collecting all form responses
   * @returns Responses Sheet
   */
  sheets.getResponsesSheet = async () => {
    const doc = await sheets.getGoogleSheet(
      process.env.RESPONSES_SPREADSHEET_ID
    );

    // Return first tab
    return doc.sheetsByIndex[0];
  };

  /**
   * Gets all rows for the Google Teams Sheet
   * @returns Google Sheet Rows
   */
  sheets.getTeamsSheetRows = async () => {
    const sheet = await sheets.getTeamsSheet();

    return await sheet.getRows();
  };

   /**
   * Gets all rows for the Google Categories Sheet
   * @returns Google Sheet Rows
   */
    sheets.getCategoriesSheetRows = async () => {
      const sheet = await sheets.getCategoriesSheet();
  
      return await sheet.getRows();
    };

  /**
   * Gets all rows for the Google Responses Sheet
   * @returns Google Sheet Rows
   */
  sheets.getResponseSheetRows = async () => {
    const sheet = await sheets.getResponsesSheet();

    return await sheet.getRows();
  };

  /**
   * Reads the team Google Spreadsheet and returns an array of
   * teams and associated values.
   * @returns Array of text/values
   */
  sheets.getTeams = async () => {
    const rows = await sheets.getTeamsSheetRows();

    return rows.map((row) => {
      return {
        text: row.Display,
        value: row.Id,
      };
    });
  };

   /**
   * Reads the category Google Spreadsheet and returns an array of
   * categories and associated values.
   * @returns Array of text/values
   */
    sheets.getCategories = async () => {
      const rows = await sheets.getCategoriesSheetRows();
  
      return rows.map((row) => {
        return {
          text: row.Name,
          value: row.Id,
        };
      });
    };

  /**
   * Get team based on teamId (1-based index)
   * @param {number} teamId
   * @returns
   */
  sheets.getTeamById = async (teamId) => {
    const rows = await sheets.getTeamsSheetRows();

    if (rows.length < teamId) return null;

    return rows[teamId - 1];
  };

  /**
   * Get category based on categoryId (1-based index)
   * @param {number} categoryId
   * @returns
   */
   sheets.getCategoryById = async (categoryId) => {
    const rows = await sheets.getCategoriesSheetRows();

    if (rows.length < categoryId) return null;

    return rows[categoryId - 1];
  };

  /**
   * Capture form responses and saves them to the Support Responses
   * Spreadsheet.
   * @param {string} ticketId Ticket Id
   * @param {string} messageId Message Id
   * @param {string} username Current user name
   * @param {array} usersRequestingSupport Users requesting support
   * @param {string} selectedTeam Selected team
   * @param {string} selectedCategory Selected Category
   * @param {string} summaryDescription Summary description
   * @param {string} messageLink Link to support ticket/message
   * @param {date} currentTime JavaScript date object
   */
  sheets.captureResponses = async (
    ticketId,
    messageId,
    username,
    usersRequestingSupport,
    selectedTeam,
    selectedCategory,
    summaryDescription,
    messageLink,
    dateTime = new Date()
  ) => {
    const sheet = await sheets.getResponsesSheet();

    const userList = usersRequestingSupport.join(', ');

    const dateFormatted = moment
      .tz(dateTime, 'America/New_York')
      .format('LLLL');

    const row = await sheet.addRow({
      TicketId: ticketId,
      MessageId: messageId,
      SubmittedBy: username,
      DateTimeUTC: dateTime,
      DateTimeEST: dateFormatted,
      Users: userList,
      Team: selectedTeam,
      Category: selectedCategory,
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
    const rows = await sheets.getResponseSheetRows();

    const row = rows.find((row) => row.MessageId === messageId);

    if (row && row.FirstReplyTimeUTC === '') {
      const dateTime = new Date(Date.now());
      row.FirstReplyTimeUTC = dateTime.toISOString();
      row.FirstReplyTimeEST = moment
        .tz(dateTime, 'America/New_York')
        .format('LLLL');
      await row.save();
    } else {
      logger.info(`Row not found for messageId: ${messageId}`);
    }
  };

  /**
   * Update assigned team for the given ticket Id.
   * @param {string} ticketId Ticket Id
   * @param {string} team updated team
   */
  sheets.updateAssignedTeamForMessage = async (ticketId, team) => {
    const rows = await sheets.getResponseSheetRows();

    const row = rows.find((row) => row.TicketId === ticketId);

    if (row) {
      row.Team = team;
      await row.save();
    } else {
      logger.info(`Row not found for ticketId: ${ticketId}`);
    }
  };

  /**
   * Get Google Sheet Row associated with Ticket Id
   * @param {string} ticketId Message Ticket Id
   * @returns Google Sheet row assocated with Ticket Id
   */
  sheets.getMessageByTicketId = async (ticketId) => {
    const rows = await sheets.getResponseSheetRows();

    const row = rows.find((row) => row.TicketId === ticketId);

    return row ? row.MessageId.replace('msgId:', '') : null;
  };

  return sheets;
};
