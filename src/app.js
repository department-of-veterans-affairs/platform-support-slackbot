// Environment Variables
require('dotenv').config();

const logger = require("pino")();

logger.level = process.env.LOG_LEVEL || 'info';

const { App } = require("@slack/bolt");
const requestHandler = require('./request-handler');

// Initializes bot with Slack API token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

requestHandler(app, logger);

// Start Platform Support Slack Bot
(async () => {
  await app.start(process.env.PORT || 3000);

  logger.info("⚡️Platform Support Bot is running! ⚡️");
})();
