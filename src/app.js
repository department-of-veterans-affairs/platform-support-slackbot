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
});

// Handles Slack Requests
requestHandler(app, logger);

// Add Slack Workflow Middleware
workflowHandler(app, logger);

/**
 * App Entry Point
 */
(async () => {
  await app.start(process.env.PORT || 3000);

  logger.info('⚡️Platform Support Bot is running! ⚡️');
})();
