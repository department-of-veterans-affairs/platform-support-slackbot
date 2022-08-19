// Load Environment Variables
require('dotenv').config();

// Setup Logger
const logger = require('pino')();
logger.level = process.env.LOG_LEVEL || 'info';

// Initialize Platform Support Slack Bot
const { App } = require('@slack/bolt');
const requestHandler = require('./request-handler');
const workflowHandler = require('./workflow-handler');

SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET
SLACK_WEB_SOCKET_APP_TOKEN = process.env.SLACK_WEB_SOCKET_APP_TOKEN
SLACK_CHANNEL = process.env.SLACK_CHANNEL
SLACK_SUPPORT_TEAM_GROUP = process.env.SLACK_SUPPORT_TEAM_GROUP
TEAMS_SPREADSHEET_ID = process.env.TEAMS_SPREADSHEET_ID
RESPONSES_SPREADSHEET_ID = process.env.RESPONSES_SPREADSHEET_ID
TOPICS_SPREADSHEET_ID = process.env.TOPICS_SPREADSHEET_ID

PAGER_DUTY_API_KEY = process.env.PAGER_DUTY_API_KEY
GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
GOOGLE_PRIVATE_KEY_ID = process.env.GOOGLE_PRIVATE_KEY_ID


if (SLACK_CHANNEL === undefined || SLACK_WEB_SOCKET_APP_TOKEN === undefined || SLACK_SIGNING_SECRET === undefined || SLACK_BOT_TOKEN === undefined
  || TEAMS_SPREADSHEET_ID === undefined || RESPONSES_SPREADSHEET_ID === undefined || TOPICS_SPREADSHEET_ID === undefined
  || PAGER_DUTY_API_KEY === undefined || GOOGLE_CLIENT_ID === undefined || GOOGLE_PRIVATE_KEY_ID === undefined || SLACK_SUPPORT_TEAM_GROUP === undefined) {
  console.log("Error: Missing Environment Variables ! Verify the following: ")
  console.log(" - SLACK_SIGNING_SECRET")
  console.log(" - SLACK_BOT_TOKEN")
  console.log(" - SLACK_WEB_SOCKET_APP_TOKEN")
  console.log(" - SLACK_CHANNEL")
  console.log(" - TEAMS_SPREADSHEET_ID")
  console.log(" - TOPICS_SPREADSHEET_ID")
  console.log(" - RESPONSES_SPREADSHEET_ID")
  console.log(" - PAGER_DUTY_API_KEY")
  console.log(" - GOOGLE_CLIENT_ID")
  console.log(" - GOOGLE_PRIVATE_KEY_ID")

} else {

  // Initializes bot with Slack API token and signing secret
  const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_WEB_SOCKET_APP_TOKEN,
  });

  // Handles Slack Requests
  requestHandler(app, logger);

  // Add Slack Workflow Middleware
  workflowHandler(app, logger);

  /**
   * App Entry Point
   */
  (async () => {
    console.log("ENTRY === here -- ")
    let http = require('http');
    let server = http.createServer(function (req, res) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Hello, World!\n');
    });
    server.listen(process.env.PORT || 7172);
    console.log(`Server running on port ${process.env.PORT || 7172}`);
    await app.start();

    let postStartup = async () => {
      let authorized = {};
      try {
        authorized = await app.client.auth.test({token: SLACK_BOT_TOKEN});
      } catch (error) {
        authorized.ok = false;
      }
      
      console.log('App authorization status', authorized);
      if (authorized.ok) {
        await app.client.chat.postMessage({
          channel: SLACK_CHANNEL,
          token: SLACK_BOT_TOKEN,
          text: `Platform Support Slack-bot server is running ${new Date()}`,
          parse: 'full',
          blocks: [{
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Platform Support Slack-bot server is running ${new Date()}`
            }
          }]
        })
      } else {
        setTimeout(postStartup, 5000);
      }
    }
    await postStartup();

    let warnProcessStop = async () => {
      await app.client.chat.postMessage({
        channel: SLACK_CHANNEL,
        token: SLACK_BOT_TOKEN,
        text: `${SLACK_SUPPORT_TEAM_GROUP} Platform Support Slack-bot server is offline ${new Date()}`,
        parse: 'full',
        blocks: [{
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${SLACK_SUPPORT_TEAM_GROUP} Platform Support Slack-bot server is offline ${new Date()}`
          }
        }]
      })
      return;
    }

    logger.info('⚡️Platform Support Bot is running! ⚡️');

    process.on('SIGTERM', warnProcessStop)
    process.on('SIGINT', warnProcessStop)
    process.on('exit', warnProcessStop)
  })();

}
