const { WorkflowStep } = require('@slack/bolt');

const WORKFLOW_CALLBACK_ID = 'platform_support_request';
const SUPPORT_CHANNEL_ID = process.env.SLACK_SUPPORT_CHANNEL;

module.exports = function (app, logger) {
  const ws = new WorkflowStep(WORKFLOW_CALLBACK_ID, {
    edit: async ({ ack, step, configure }) => {
      await ack();

      logger.info(`${WORKFLOW_CALLBACK_ID} workflow edit callback.`);

      const blocks = [];

      await configure({ blocks });
    },
    save: async ({ ack, step, view, update }) => {
      await ack();

      logger.info(`${WORKFLOW_CALLBACK_ID} workflow save callback.`);

      await update({});
    },
    execute: async (obj) => {
      //   console.log(JSON.stringify(obj));
      const { step, complete, fail, client, body, payload, event } = obj;
      const { inputs } = step;

      const outputs = {};

      logger.info('Executing...');

      try {
        //U01T9CL8PEK
        logger.info(`${WORKFLOW_CALLBACK_ID} workflow step executed.`);

        client.chat.postMessage({
          channel: SUPPORT_CHANNEL_ID,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `Hey there! You can create a support request by clicking on the button below.`,
              },
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    emoji: true,
                    text: 'Platform Support Request',
                  },
                  style: 'primary',
                  value: 'click_me_123',
                },
              ],
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text:
                  'You can also create a support request by typing `/support` in the message field.',
              },
            },
          ],
        });

        // Call views.open with the built-in client
        //util.buildSupportModal(client, body.user_id, body.trigger_id);
      } catch (error) {
        logger.error(error);
      }

      // if everything was successful
      await complete({ outputs });

      // if something went wrong
      // fail({ error: { message: "Just testing step failure!" } });
    },
  });

  // Use Workflow Middleware
  app.step(ws);
};
