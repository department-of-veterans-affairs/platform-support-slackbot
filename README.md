# Platform Support Slack Bot

## Launching Platform Support Slack Bot

Install dependencies:

`$ yarn install`

or

`$ npm install`

To start the slack bot locally:

`$ yarn start`

or

`$ npm run start`

Note: In order for Slack to communicate with the slack bot, you must either deploy it or use a tunneling tool like ngrok.

## Running Unit Tests

To run unit tests:

`$ yarn test`

or

`$ npm run test`

### Randomizing Unit Tests

To run tests in random order, install `coreutils`.

`$ brew install coreutils`

Then run the unit tests in random order:

`$ yarn test:random`

or

`$ npm run test:random`

## Local Development with ngrok

ngrok exposes a external URL and tunnels HTTP requests to your local machine for development so you don't have to stand up a server for development.

To set up an account, click [here](https://ngrok.com).

If you have ngrok setup, start the localhost tunnel by using the following command after `yarn start` or `npm start`.

```
$ ngrok http 3000
```

A script is built to execute ngrok. Launch a separate terminal window and execute:

```
$ ./ngrok.sh
```

#### 💡NOTE Each time you restart `ngrok`, a new URL will be generated. 💡

Here's an example:

```
Forwarding http://3b37c79cdbf2.ngrok.io -> http:/localhost:3000
Forwarding https://3b37c79cdbf2.ngrok.io -> http:/localhost:3000
```

#### Updating Slack API Portal

Using the ngrok URL, make sure you append `/slack/events` to the forwarded URL like so:

```
https://3b37c79cdbf2.ngrok.io/slack/events
```

Take the URL above and update the [Slack API Portal](https://api.slack.com) at these spots:

- Event Subscriptions
- Slack Commands (All of them)
- Interactivity and Shortcuts

# Logging

Log levels are defined [here](https://getpino.io/#/docs/api?id=levels)

| Level | Number |
| ----- | ------ |
| trace | 10     |
| debug | 20     |
| info  | 30     |
| warn  | 40     |
| error | 50     |
| fatal | 60     |

To set the current log level, set the environment variable: `LOG_LEVEL`.

```
$ export LOG_LEVEL=debug  # Set log level to trace
```

Note: By default the log level is `info` if not provided.

# Google Sheets Setup

TODO:

- Setting up a Service Account with Google Developer Console
- Getting the Spreadsheet ID and setting it up as an environment variable
- Top row is the header row, ideally don't use spaces since they become JavaScript properties

## Giving Permissions

To give the service account permissions, create a new Google sheet in your account and give the following account `edit` permission access.

```
platform-support-bot@platform-support-bot-312013.iam.gserviceaccount.com
```

This is the service account created for the Platform Service Bot. Google Sheets will ask you if you want to give write permissions to this spreadsheet outside of the organization. Click Yes.
