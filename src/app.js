// Environment Variables
require('dotenv').config();

const { App } = require("@slack/bolt");
const requestHandler = require('./request-handler');

// Initializes bot with Slack API token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

requestHandler(app);

// Start Slack bot
(async () => {
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
