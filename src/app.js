// Load Environment Variables
require('dotenv').config();

// Setup Logger
const logger = require('pino')();
logger.level = process.env.LOG_LEVEL || 'info';

// Initialize Platform Support Slack Bot
const { App } = require('@slack/bolt');
const requestHandler = require('./request-handler');
const workflowHandler = require('./workflow-handler');

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
  server.listen(process.env.PORT || 7172);
  console.log(`Server running on port ${process.env.PORT || 7172}`);
  await app.start();

  logger.info('⚡️Platform Support Bot is running! ⚡️');
})();
