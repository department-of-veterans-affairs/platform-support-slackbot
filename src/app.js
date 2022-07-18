// Load Environment Variables
require('dotenv').config();

// Setup Logger
const logger = require('pino')();
logger.level = process.env.LOG_LEVEL || 'info';

// Initialize Platform Support Slack Bot
const { App } = require('@slack/bolt');
const requestHandler = require('./request-handler');
const workflowHandler = require('./workflow-handler');

botToken = process.env.SLACK_BOT_TOKEN
slackSecret = process.env.SLACK_SIGNING_SECRET
appToken = process.env.SLACK_WEB_SOCKET_APP_TOKEN
slackChannelId = process.env.SLACK_CHANNEL


if (botToken === undefined || slackSecret === undefined || appToken === undefined || slackChannelId === undefined) {
  console.log("Error: Missing Environment Variables ! Verify the following: ")
  console.log(" - SLACK_SIGNING_SECRET")
  console.log(" - SLACK_BOT_TOKEN")
  console.log(" - SLACK_WEB_SOCKET_APP_TOKEN")
  console.log(" - SLACK_CHANNEL")

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
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('Hello, World!\n');
    });
    server.listen(7172);
    console.log('Server running on port 7172');
    await app.start();

    logger.info('⚡️Platform Support Bot is running! ⚡️');
  })();

}
