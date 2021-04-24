# Platform Support Slack Bot

To start the slack bot locally:

`$ yarn start`

or

`$ npm run start`

Note: In order for Slack to communicate with the slack bot, you must either deploy it or use a tunneling tool like ngrok.

## Local Development with ngrok

ngrok exposes a external URL and tunnels HTTP requests to your local machine for development so you don't have to stand up a server for development.

To set up an account, click [here](https://ngrok.com).

If you have ngrok setup, start the localhost tunnel by using the following command after `yarn start` or `npm start`.

```
$ ngrok http 3000
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

* Event Subscriptions
* Slack Commands (All of them)
* Interactivity and Shortcuts
