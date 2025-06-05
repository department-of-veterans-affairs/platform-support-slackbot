// ───────────────────────────────────────────────────────────────
//  src/app.js   •   single source of truth for the Bolt `App`
// ───────────────────────────────────────────────────────────────

// 1.  ENV --- ensure all vars are present
require("dotenv").config();
const missing = [
  "SLACK_BOT_TOKEN",
  "SLACK_SIGNING_SECRET",
  "SLACK_WEB_SOCKET_APP_TOKEN",
  "SLACK_CHANNEL",
  "SLACK_SUPPORT_TEAM_GROUP",
  "TEAMS_SPREADSHEET_ID",
  "RESPONSES_SPREADSHEET_ID",
  "TOPICS_SPREADSHEET_ID",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_PRIVATE_KEY_ID",
].filter((v) => !process.env[v]);

if (missing.length) {
  console.error("Error: Missing environment variables:\n • " + missing.join("\n • "));
  process.exit(1);
}

// 2.  LOGGER
const logger = require("pino")();
logger.level = process.env.LOG_LEVEL || "info";

// 3.  BOLT APP  (single instance!)
const { App, LogLevel } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false,                       // using HTTPS endpoint, not websockets
  appToken: process.env.SLACK_WEB_SOCKET_APP_TOKEN,
  logLevel: LogLevel.DEBUG,               // switch to INFO in prod
});

// 4.  GLOBAL ERROR HANDLER
app.error((error) => {
  logger.error({ msg: "Bolt global error", error });
});

// 5.  HANDLERS ALREADY IN REPO
const requestHandler  = require("./request-handler");
const workflowHandler = require("./workflow-handler");
requestHandler(app, logger);
workflowHandler(app, logger);

// 6.  PR-INSPECTOR LISTENER  (new)
require("./pr-inspector")(app);           // ← nothing else needed

// 7.  Expose bot’s own bot_id for listeners that need it
(async () => {
  try {
    const { bot_id } = await app.client.auth.test({ token: process.env.SLACK_BOT_TOKEN });
    process.env.SELF_BOT_ID = bot_id;     // used by pr-inspector to ignore itself
    logger.info(`Self bot_id = ${bot_id}`);
  } catch (e) {
    logger.error("Failed to fetch bot_id with auth.test:", e);
    process.exit(1);
  }
})();

// 8.  SIMPLE HEALTH-CHECK HTTP SERVER  (unchanged)
const http = require("http");
http.createServer((_, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello, World!\n");
}).listen(process.env.PORT || 7172, () =>
  logger.info(`Health-check server on :${process.env.PORT || 7172}`)
);

// 9.  START BOLT (uses its own Express receiver underneath)
(async () => {
  await app.start(3000);                  // internal Slack events port
  logger.info("⚡️ Platform Support Bot is running! ⚡️");
})();

