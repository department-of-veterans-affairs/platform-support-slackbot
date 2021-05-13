# Platform Support Slack Bot

## Launching Platform Support Slack Bot

Install dependencies:

`$ yarn install`

To start the slack bot locally:

`$ yarn start`

Note: In order for Slack to communicate with the slack bot, you must either deploy it or use a tunneling tool like ngrok.

## Running Unit Tests

To run unit tests:

`$ yarn test`

### Randomizing Unit Tests

To run tests in random order, install `coreutils`.

`$ brew install coreutils`

Then run the unit tests in random order:

`$ yarn test:random`

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

# Docker

A Docker image is built to containerize the application. Download and install Docker from [here](https://www.docker.com/get-started).

First build the Docker image and run it using the following commands:

Building a docker image

```
$ docker build -t plaform_support_slackbot:1.0 .
```

Then run the docker image by using this command:

```
docker run --env-file=.env plaform_support_slackbot:1.0
```

If you want to run it in the background (local only):

```
docker run -d --read-only -v "$PWD:$PWD" -w "$PWD" plaform_support_slackbot:1.0
```

Note: Using the `.env` file with docker run does not work since multiline environment variables doesn't seem to work passed this way.

```
docker run -d --env-file=.env.docker plaform_support_slackbot:1.0
```

! Does Not Work! Future: look at using Docker Compose.

Check for Docker background processes:

```
docker ps
```

Stop Docker container by passing in the Container Id from `docker ps`.

```
docker stop [CONTAINER ID]
```
