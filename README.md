# Platform Support Slack Bot

The Slackbot is written with JavaScript using the bolt.js framework. Bolt.js is a framework created by Slack to make it easier to build Slack applications.

[General Documentation](https://vfs.atlassian.net/wiki/spaces/FTT/pages/1883406342/Platform+Support+Bot)
[Toubleshooting Documentation](https://vfs.atlassian.net/wiki/spaces/FTT/pages/1912569969/Troubleshooting+Support+Bot)

- Bolt.js Documentation
  https://slack.dev/bolt-js/tutorial/getting-started

- Bolt.js GitHub Page
  https://github.com/slackapi/bolt-js

Bolt.js is entirely a backend framework. There are no frontend components in the Slack bot application.

## Software Requirements

The Slack bot was written specifically with these tools:

- **Node.js**
  Version: 14.15.0
- **Yarn**
  Version: 1.21.1

## Dependencies

These are the dependencies that are used in the Slack bot and a description of where it is used.

- **@pagerduty/pdjs** - PagerDuty client to access on-call schedules - [Repo](https://github.com/PagerDuty/pdjs)
- **@slack/bolt** - Bolt.js - Slack SDK for Slack App Development. - [Docs](https://slack.dev/bolt-js/tutorial/getting-started) - [Repo](https://github.com/SlackAPI/bolt-js)
- **dotenv** - Handling of environment variables - [Repo](https://github.com/motdotla/dotenv#readme)
- **googleapis / google-spreadsheet** - Google Sheets library for accessing and updating Google Sheets (Teams and Support Forms). [Docs](https://theoephraim.github.io/node-google-spreadsheet/#/).
- **moment / moment-timezone** - Timezone conversion used for saving date time to EST. Library link - [Docs](https://momentjs.com/)
- **nanoid** - Used for generating ticket id for the reassignment feature to reference a support ticket in the Google Sheet. - [Repo](https://github.com/ai/nanoid)
- **pino** - Logging library for node. Displays in JSON format by default. Log level is specified as an environment variable. - [Repo](https://github.com/pinojs/pino)
- **pino-pretty** - Used for prettifying pino logs output. - [Repo](https://github.com/pinojs/pino-pretty)

## Project Structure

The following is a high level overview of application code:

- **app.js** - Application Entry Point and Configuration
- **request-handler.js** - Handles all events from Slack
- **workflow-handler.js** - Setup the Workflow middleware. Only used to display a help message.
- **api/google** - Google Sheets Client
- **api/pagerduty** - PagerDuty API Client
- **api/slack** - Slack API
- **api/slack/util** - Misc. utilities related to Slack
- **logic/index.js** - Entry point for business logic
- **logic/form-support.js** - Business logic related to form submissions. (Support Request and Reassignment modals)
- **routing.js** - Business logic related to determining the oncall user.
- **ui/messages.js** - Build message responses to the user using Slack’s Block Kit. Find our more about Block Kit by clicking [here](https://api.slack.com/block-kit).
- **ui/modals.js** - Build modal responses to the user using Slack’s Block Kit.

## Launching Platform Support Slack Bot

Install dependencies:

`$ yarn install`

To start the slack bot locally:

`$ yarn start`

## Running Unit Tests

To run unit tests:

`$ yarn test`

### Randomizing Unit Tests

To run tests in random order, install `coreutils`. (Instructions for MacOS)

`$ brew install coreutils`

Then run the unit tests in random order:

`$ yarn test:random`

## Environment Variables

To configure the Slackbot, the following environment variables are used:

- **SLACK_BOT_TOKEN** - The OAuth token at https://api.slack.com/ when the Platform Support app was initially configured.
- **SLACK_SIGNING_SECRET** - The signing secret for Slack to verify the authenticity of calls.
- **SLACK_WEB_SOCKET_APP_TOKEN** - Token used by the Slack bot when connecting to Slack using Socket Mode. This Slack bot is using Socket Mode to communicate with Slack and does not need to expose an external IP.
- **SLACK_SUPPORT_CHANNEL** - The id of the Platform Support channel used for the default location where the slack bot will post messages. See below regarding how to get the channel id.
- **TEAMS_SPREADSHEET_ID** - The id of the Google sheet where teams and associated information is stored. This is for the team drop down selection. See below regarding how to get a Google sheet id.
- **RESPONSES_SPREADSHEET_ID** - The id of the Google sheet where the responses are stored and written to. See below regarding how to get a Google sheet id.
- **LOG_LEVEL** - The level for application logs. See below for more details.
- **PAGER_DUTY_API_KEY** - The API key to access data in the PagerDuty application.
- **GOOGLE_CLIENT_ID** - Google Client Id used for accessing Google Sheets
- **GOOGLE_PRIVATE_KEY** - Certificate used for accessing Google Sheets
- **GOOGLE_PRIVATE_KEY_ID** - Certificate Id used for accessing Google Sheets

## Logging

To set the current log level, set the environment variable: `LOG_LEVEL`.

```
$ export LOG_LEVEL=debug  # Set log level to debug
$ export LOG_LEVEL=trace  # Set log level to trace
```

Log levels are defined [here](https://getpino.io/#/docs/api?id=levels)

| Level | Number |
| ----- | ------ |
| trace | 10     |
| debug | 20     |
| info  | 30     |
| warn  | 40     |
| error | 50     |
| fatal | 60     |

Note: By default the log level is `info` if not provided.

To pretty print logs, run the following command:

```
$ node src/app.js | pino-pretty
```

Running `npm start` does the same.

## Google Sheets

The two spreadsheets can be found here:

- [Platform Teams Google Sheet](https://docs.google.com/spreadsheets/d/1k9P921Hdo654631HmX9WovGaYRIFAhO3QRg3EN3F9gI)
- [Platform Support Responses Sheet](https://docs.google.com/spreadsheets/d/1TItdfPMH_TiXEhgMKEqxIW2e5EaMKy4cHaBhaeQ7drU)

Please contact James Chasia to get access to these sheets.

**Service Account**

There is a service account set up to write to the Google Sheet.

Login to the [Google Cloud Console](https://console.cloud.google.com/).

Select the project "Platform Support Bot" under the "ADHOCTEAM.US" organization. Click on APIs and Services > Credentials. Here's a direct [link](https://console.cloud.google.com/apis/credentials?project=platform-support-bot-312013) to the Credentials page.

Here's a direct link to the [service account](https://console.cloud.google.com/iam-admin/serviceaccounts?project=platform-support-bot-312013).

**Granting Sheet Permissions To Slack Bot**

To give the service account permissions, create a new Google sheet in your account and give the following account `edit` permission access.

```
platform-support-bot@platform-support-bot-312013.iam.gserviceaccount.com
```

This is the service account created for the Platform Service Bot. Google Sheets will ask you if you want to give write permissions to this spreadsheet outside of the organization. Click Yes.

**Google Authentication**

_google_client.json_

A file client_secret.json for credential information was downloaded from the Google Cloud console. However, due to the sensitive nature of the content, the sensitive information was extracted into environment variables and renamed from client_secret.json to google_client.json. The environment variables **GOOGLE_CLIENT_ID**, **GOOGLE_PRIVATE_KEY** and **GOOGLE_PRIVATE_KEY_ID** have been extracted from client_secret.json.

If a new key needs to be generated, click on the service account link above and generate a new key. You will need to download client_secret.json and extract the sensitive variables as necessary.

## Docker

A Docker image is built to containerize the application. Download and install Docker from [here](https://www.docker.com/get-started).

First build the Docker image and run it using the following commands:

**Building the Docker Image**

Build the Docker image by running the following command:

```
$ docker build -t plaform_support_slackbot:1.0 .
```

**Starting the Container**

Then run the docker image by using this command:

```
docker run --env-file=.env plaform_support_slackbot:1.0
```

If you want to run it in the background (local only):

```
docker run -d --read-only -v "$PWD:$PWD" -w "$PWD" plaform_support_slackbot:1.0
```

_Note:_ the above command will allow the container to get read only access to the local path so that it may access the `.env` file. Ideally, we would want to use `docker run -d --env-file=.env plaform_support_slackbot:1.0` but multiline environment variables do not seem to work properly.

<!--
Note: Using the `.env` file with docker run does not work since multiline environment variables doesn't seem to work passed this way.

```
docker run -d --env-file=.env plaform_support_slackbot:1.0
```

! Does Not Work! Future: look at using Docker Compose.
-->

**Other Helpful Commands**

Check for Docker background processes:

```
docker ps
```

Stop Docker container by passing in the Container Id from `docker ps`.

```
docker stop [CONTAINER ID]
```

## Deployment

### Heroku

Currently, the Slack bot is deployed on Heroku as a worker dyno on dsva-support-bot. Contact Michael Fleet to access. [Heroku Dashboard](https://dashboard.heroku.com/apps/dsva-support-bot)

Please note this is temporary.

1. Install the Heroku CLI. Click [here](https://devcenter.heroku.com/articles/heroku-cli).
2. Login to Heroku using this command: `heroku login`.
3. Make sure the changes are in GIT.
4. Push to Heroku to deploy: `git push heroku master`.

### AWS Elastic Kubernetes Service

This is the long term solution for the Slack bot deployment. The docker image has been created. All that needs to happen for deployment are the environment variables need to be set. See above for the list of environment variables.

## Additional Documentation

Additional high level documentation can be found [here](https://docs.google.com/document/d/1loKKQCD1gqlvIdxucsYAjDbd_tSCnqvxs-W-nVxzwGM/).
