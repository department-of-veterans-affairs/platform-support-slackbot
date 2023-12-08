const { GoogleSpreadsheet } = require('google-spreadsheet');
const client_config = require('../../../google_client.json');
const fetch = require('node-fetch');
const moment = require('moment-timezone');
let googleSheets = {}
    

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
  sheets.getGoogleSheet = async (spreadsheetId, forceUpdate) => {
    if (!googleSheets[spreadsheetId] || forceUpdate) {
      const doc = new GoogleSpreadsheet(spreadsheetId),
            // Authentication using Google Service Account
            creds = {
              "private_key_id": process.env.GOOGLE_PRIVATE_KEY_ID,
              "private_key": process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
              "client_id": process.env.GOOGLE_CLIENT_ID
            },
            auth = {
              ... client_config,
              ... creds
            };
      await doc.useServiceAccountAuth(auth);

      // loads document properties and worksheets
      await doc.loadInfo();
      googleSheets[spreadsheetId] = doc;
      return doc;
    } else {
      return googleSheets[spreadsheetId];
    }
  };

  /**
   * Returns the Google Sheet containing the list of teams and mappings
   * @returns Teams Sheet
   */
  sheets.getTeamsSheet = async (forceUpdate) => {
      const doc = await sheets.getGoogleSheet(process.env.TEAMS_SPREADSHEET_ID, forceUpdate),
            teamsSheet = doc.sheetsByIndex[0];
      return teamsSheet;
  };

  /**
   * Returns the Google Sheet containing the list of topics and mappings
   * @returns Topics Sheet
   */
   sheets.getTopicsSheet = async () => {
      const doc = await sheets.getGoogleSheet(process.env.RESPONSES_SPREADSHEET_ID),
            topicsSheet = doc.sheetsById[process.env.TOPICS_SPREADSHEET_ID];

      return topicsSheet
  };

  /**
   * Returns the Google Sheet containing the list of automatic answers and mappings
   * @returns Auto Answer Sheet
   */
   sheets.getAutoAnswerSheet = async () => {
    const doc = await sheets.getGoogleSheet(process.env.RESPONSES_SPREADSHEET_ID);

    // Return first tab
    return doc.sheetsById[process.env.AUTO_ANSWER_SHEET_ID];
  };

  /**
   * Returns the Google Sheet containing the list of automatic answers and mappings
   * @returns Auto Answer Sheet
   */
   sheets.getAnswerAnalyticsSheet = async () => {
    const doc = await sheets.getGoogleSheet(process.env.RESPONSES_SPREADSHEET_ID);

    // Return first tab
    return doc.sheetsById[process.env.ANSWER_ANALYTICS_SHEET_ID];
  };

  /**
   * Returns the Google Sheet collecting all form responses
   * @returns Responses Sheet
   */
  sheets.getResponsesSheet = async (forceUpdate) => {
    const doc = await sheets.getGoogleSheet(
      process.env.RESPONSES_SPREADSHEET_ID,
      forceUpdate
    );
    // Return first tab
    return doc.sheetsByIndex[0];
  };

  /**
   * Gets all rows for the Google Teams Sheet
   * @returns Google Sheet Rows
   */
  sheets.getTeamsSheetRows = async (forceUpdate) => {
    const sheet = await sheets.getTeamsSheet(forceUpdate);

    return await sheet.getRows();
  };

   /**
   * Gets all rows for the Google Topics Sheet
   * @returns Google Sheet Rows
   */
    sheets.getTopicsSheetRows = async () => {
      const sheet = await sheets.getTopicsSheet();
      return await sheet.getRows();
    };

    /**
    * Gets all rows for the Google Auto Anser Sheet
    * @returns Google Sheet Rows
    */
    sheets.getAutoAnswerSheetRows = async () => {
      const sheet = await sheets.getAutoAnswerSheet();
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
  sheets.getTeams = async (forceUpdate) => {
    const rows = await sheets.getTeamsSheetRows(forceUpdate);

    return rows.filter((row) => {
      return row.Disabled !== 'TRUE'
    }).sort((row1, row2) => {
      return row1.Display > row2.Display ? 1 : row1.Display < row2.Display ? -1 : 0;
    }).map((row) => {
      return {
        text: row.Display,
        value: row.Id,
        onSupportUsers: row.OnSupportUsers,
        slackGroup: row.SlackGroup
      };
    });
  };

  /**
 * Reads the topics from the responses google sheet returns an array of
 * topics and associated values.
 * @param teamId Optional, if provided filters results by teamId
 * @returns Array of text/values
 */
  sheets.getTopics = async (teamId) => {
    const rows = await sheets.getTopicsSheetRows();
    return rows.filter((row) => {
      return row.Disabled !== 'TRUE' && (teamId ? row.Teams.split(',').indexOf(teamId) !== -1 : true);
    }).sort((row1, row2) => {
      return row1.Topic > row2.Topic ? 1 : row1.Topic < row2.Topic ? -1 : 0;
    }).sort((row1, row2) => {
      if (row1.Sort && row2.Sort) {
        return row1.Sort > row2.Sort ? 1 : row1.Sort < row2.Sort ? -1 : 0;
      } else if (row1.Sort) {
        return -1;
      } else {
        return 0;
      }
    }).map((row, index) => {
      return {
        team: row.Teams,
        text: row.Topic,
        value: row.Id,
      };
    });
  };

  /**
   * fetches the url and returns the value of title from the html body
   * @param {url} string the url of the page to be requested
   * @returns String of HTML title from body
   */
  sheets.getPageTitle = async (url) => {
    const response = await fetch(url);
    const body = await response.text();
    return body.split('<title>')[1].split('</title>')[0];
  }

  /**
   * Reads the automatic answers from the responses google sheet returns an array of
   * automatic answers and associated values.
   * @param {topicId} optional restrict results to a topic
   * @param {teamId} optional Used in conjunction with message to filter auto-answers
   * @param {message} optional Used in conjunction with teamId to filter auto-answers
   * @returns Array of text/values
   */
   sheets.getAutoAnswers = async (topicId, teamId, message) => {
    let rows = await sheets.getAutoAnswerSheetRows(),
        answers = [];

    // Search by keyword first to find most relevent answers
    if (teamId && message) {
        rows.filter((row) => {
          return (row.TeamId === teamId || row.TopicId === topicId) && row.Keywords !== ''; 
        }).map((row) => {
          let keywords = row.Keywords.split(','),
              hasMatch = false;

          keywords.forEach((keyword) => {
            if (message.toLowerCase().indexOf(keyword.toLowerCase()) !== -1 && keyword !== '') {
              hasMatch = true;
            }
          });

          if (hasMatch) {
            answers.push(row);
          }
        });
    }

    // Search by TeamId and Topic Second
    if (topicId && teamId) {
      rows.map((row) => {
        if (row.TopicId === topicId && row.TeamId === teamId) {
          answers.push(row);
        }
      })
    }

    // If no keyword results, just return the answers for the topic if there are any
    if (topicId && answers.length < 1) {
      rows.map((row) => {
        if (row.TopicId === topicId && row.TeamId === '') answers.push(row);
      })
    }

    const promises = await answers.map( async (row) => {
      let title = await sheets.getPageTitle(row.Link);
      return {
        link: row.Link,
        topicId: row.TopicId,
        title
      };
    });
    const results = await Promise.all(promises);
    return results;
  };

  /**
   * Get team based on teamId (1-based index)
   * @param {number} teamId
   * @returns
   */
  sheets.getTeamById = async (teamId, forceUpdate) => {
    let rows = await sheets.getTeamsSheetRows(forceUpdate);

    if (rows.length < teamId) return null;

    return rows[teamId - 1];
  };

  /**
   * Get topic based on topicId (1-based index)
   * @param {number} topicId
   * @returns
   */
   sheets.getTopicById = async (topicId) => {
    const rows = await sheets.getTopicsSheetRows();
    
    if (rows.length < topicId) return null;

    return rows[topicId - 1];
  };

  /**
   * Capture form responses and saves them to the Support Responses
   * Spreadsheet.
   * @param {string} ticketId Ticket Id
   * @param {string} messageId Message Id
   * @param {string} username Current user name
   * @param {array} usersRequestingSupport Users requesting support
   * @param {string} selectedTeam Selected team
   * @param {string} selectedTopic Selected Topic
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
    selectedTopic,
    summaryDescription,
    messageLink,
    githubIssueId,
    dateTime = new Date()
  ) => {
    const sheet = await sheets.getResponsesSheet(),
          userList = usersRequestingSupport.join(', '),
          dateFormatted = moment
            .tz(dateTime, 'America/New_York')
            .format('LLLL');
    sheet.addRow({
      TicketId: ticketId,
      MessageId: messageId,
      SubmittedBy: username,
      DateTimeUTC: dateTime,
      DateTimeEST: dateFormatted,
      Users: userList,
      Team: selectedTeam,
      SuggestedTopic: selectedTopic,
      Topic: selectedTopic,
      Summary: summaryDescription,
      MessageLink: messageLink,
      GithubIssueId: githubIssueId
    });
    return;
  };

  /**
   * Capture analytic from user response to auto answer post
   * @param {JSON} analytic Ticket Id and value
   */
   sheets.captureAnswerAnalytic = async (
    analytic,
  ) => {
    const sheet = await sheets.getAnswerAnalyticsSheet();
    await sheet.addRow({
      TicketId: `msgId:${analytic.ticketId}`,
      Helpful: analytic.value
    })
  };

  /**
   * Capture form responses for on-support and saves them to the teams sheet
   * @param {string} teamId Ticket Id
   * @param {string} userId Message Id
   */
   sheets.captureOnSupport = async (
    teamId,
    userIds
  ) => {
    const sheet = await sheets.getTeamsSheet(true),
          rows = await sheet.getRows(),
          row = rows.find((row) => row.Id === teamId);

    if (row) {
      row.OnSupportUsers = userIds || '';
      await row.save();
    } else if (!row) {
      //logger.info(`Row not found for teamId: ${teamId}`);
    }
  };

  /**
   * Updates the Google Sheet with the first reply time stamp.
   * Note: Since Google Sheet is not a database, the code does a "table scan" to find
   *       the right Message ID.
   * @param {string} messageId - Message ID in Google Sheet to be updated.
   */
  sheets.updateReplyTimeStampForMessage = async (messageId, isReaction) => {
    const rows = await sheets.getResponseSheetRows();

    const row = rows.find((row) => row.MessageId === messageId);

    if (row && row.FirstReplyTimeUTC === '') {
      const dateTime = new Date(Date.now());
      row.FirstReplyTimeUTC = dateTime.toISOString();
      row.FirstReplyTimeEST = moment
        .tz(dateTime, 'America/New_York')
        .format('LLLL');
      await row.save();
    } else if (!row && !isReaction) {
      // Reactions can be added to thread messages, which would require a request to get the original message. There is no need to log this. 
      logger.info(`Row not found for messageId: ${messageId}`);
    }
  };

  /**
   * Update assigned team for the given ticket Id.
   * @param {string} ticketId Ticket Id
   * @param {string} team updated team
   */
  sheets.updateAssignedTeamForMessage = async (ticketId, team, messageRow) => {
    if (!messageRow) { 
      const rows = await sheets.getResponseSheetRows();
      messageRow = rows.find((row) => row.TicketId === ticketId);
    }

    if (messageRow) {
      messageRow.Team = team;
      await messageRow.save();
    } else {
      const rows = await sheets.getResponseSheetRows(),
          row = rows.find((row) => row.TicketId === ticketId);

      if (row) {
        row.Team = team;
        await row.save();
      } else {
        //logger.info(`Row not found for ticketId: ${ticketId}`);
      }
    }
  };

  /**
   * Get Google Sheet Row associated with Ticket Id
   * @param {string} ticketId Message Ticket Id
   * @returns Google Sheet row assocated with Ticket Id
   */
  sheets.getMessageByTicketId = async (ticketId) => {
    const rows = await sheets.getResponseSheetRows(),
          row = rows.find((row) => row.TicketId === ticketId);
    return row ? {messageId: row.MessageId.replace('msgId:', ''), messageRow: row} : null;
  };

  return sheets;
};
