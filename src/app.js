// Load Environment Variables
require('dotenv').config();

// Setup Logger
const logger = require('pino')();
logger.level = process.env.LOG_LEVEL || 'info';

// Initialize Platform Support Slack Bot
const { App, AwsLambdaReceiver } = require('@slack/bolt');
const requestHandler = require('./request-handler');
const workflowHandler = require('./workflow-handler');

const awsLambdaReceiver = new AwsLambdaReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  processBeforeResponse: true
});

// Initializes bot with Slack API token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false,
  appToken: process.env.SLACK_WEB_SOCKET_APP_TOKEN,
  receiver: awsLambdaReceiver,
  processBeforeResponse: true
});

// Handles Slack Requests
requestHandler(app, logger);

// Add Slack Workflow Middleware
workflowHandler(app, logger);

/**
 * App Entry Point
 */
 module.exports.handler = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = true;
  const handler = await awsLambdaReceiver.start();
  logger.info('⚡️Platform Support Bot is running! ⚡️');
  return await handler(event, context, callback);
}
/*(async () => {
  await awsLambdaReceiver.start();

  logger.info('⚡️Platform Support Bot is running! ⚡️');
})();*/
