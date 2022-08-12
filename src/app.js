// Load Environment Variables
require('dotenv').config();

// Setup Logger
const logger = require('pino')();
logger.level = process.env.LOG_LEVEL || 'info';

// Initialize Platform Support Slack Bot
const { App, AwsLambdaReceiver } = require('@slack/bolt');
const requestHandler = require('./request-handler');
const workflowHandler = require('./workflow-handler');

SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET
SLACK_WEB_SOCKET_APP_TOKEN = process.env.SLACK_WEB_SOCKET_APP_TOKEN
SLACK_CHANNEL = process.env.SLACK_CHANNEL
TEAMS_SPREADSHEET_ID = process.env.TEAMS_SPREADSHEET_ID
RESPONSES_SPREADSHEET_ID=process.env.RESPONSES_SPREADSHEET_ID
TOPICS_SPREADSHEET_ID=process.env.TOPICS_SPREADSHEET_ID

PAGER_DUTY_API_KEY= process.env.PAGER_DUTY_API_KEY
GOOGLE_CLIENT_ID= process.env.GOOGLE_CLIENT_ID
GOOGLE_PRIVATE_KEY_ID= process.env.GOOGLE_PRIVATE_KEY_ID


if (SLACK_CHANNEL === undefined || SLACK_WEB_SOCKET_APP_TOKEN === undefined || SLACK_SIGNING_SECRET === undefined || SLACK_BOT_TOKEN === undefined
|| TEAMS_SPREADSHEET_ID === undefined || RESPONSES_SPREADSHEET_ID === undefined || TOPICS_SPREADSHEET_ID === undefined
    || PAGER_DUTY_API_KEY === undefined || GOOGLE_CLIENT_ID === undefined || GOOGLE_PRIVATE_KEY_ID === undefined ) {
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
  const awsLambdaReceiver = new AwsLambdaReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    processBeforeResponse: true
  });

  // Initializes bot with Slack API token and signing secret
  const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    receiver: awsLambdaReceiver,
  });

  // Handles Slack Requests
  requestHandler(app, logger);

  // Add Slack Workflow Middleware
  workflowHandler(app, logger);

  app.error((error) => {
    console.error(JSON.stringify(error));
    throw new Error(error.mesage);
  });

  /**
   * App Entry Point
   */
  module.exports.handler = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = true;
    const handler = await awsLambdaReceiver.start();
    logger.info('⚡️Platform Support Bot is running! ⚡️');
    return await handler(event, context, callback);
  }
}
