
const logger = require('pino')();
logger.level = process.env.LOG_LEVEL || 'info';
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

 const app = new App({
     token: botToken,
     signingSecret: slackSecret,
     socketMode: true,
     appToken: appToken,
 });

    app.event('message', async ({ event, client, logger }) => {
        console.log("Message")
        try {
            // Call chat.postMessage with the built-in client
            const result = await client.chat.postMessage({
                channel:slackChannelId,
                text: `Welcome to the team, <@${event.user.id}>! 🎉 You can introduce yourself in this channel.`
            });
            logger.info(result);
        }
        catch (error) {
            logger.error(error);
        }
    });

 // Handles Slack Requests
// requestHandler(app, logger);
 // Add Slack Workflow Middleware
 //workflowHandler(app, logger);

 (async () => {
  await app.start();
  console.log('⚡️ Bolt app started');
 })();

}

