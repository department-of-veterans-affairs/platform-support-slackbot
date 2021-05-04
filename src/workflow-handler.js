const { WorkflowStep } = require('@slack/bolt');
const responseBuilder = require('./api/slack/block-kit/response-builder');

const WORKFLOW_CALLBACK_ID = 'platform_support_request';
const SUPPORT_CHANNEL_ID = process.env.SLACK_SUPPORT_CHANNEL;

module.exports = function (app, logger) {
  const ws = new WorkflowStep(WORKFLOW_CALLBACK_ID, {
    /**
     * edit() gets called when a workflow administrator adds/edits
     * the platform support app's workflow step in workflow builder
     * and is used to configure this step.
     *
     * Note: Since this workflow does nothing but send a message,
     * no configuration is necessary.
     *
     * @param {object} param Slack Workflow Edit Parameter
     */
    edit: async ({ ack, configure }) => {
      try {
        await ack();

        logger.debug(`${WORKFLOW_CALLBACK_ID} workflow edit callback.`);

        const blocks = [];

        await configure({ blocks });
      } catch (error) {
        logger.error(error);
      }
    },
    /**
     * save() gets called when a workflow adminstrator saves
     * the workflow step in workflow builder.
     *
     * Note: Since this workflow does nothing but send a message,
     * no configuration is saved.
     *
     * @param {object} param Slack Workflow Save Parameter
     */
    save: async ({ ack, update }) => {
      try {
        await ack();

        logger.debug(`${WORKFLOW_CALLBACK_ID} workflow save callback.`);

        await update({});
      } catch (error) {
        logger.error(error);
      }
    },
    /**
     * execute() is called when a workflow step is executed and
     * data (inputs) from a previous step gets sent to the next
     * step (outputs).
     *
     * This workflow step posts a message to the user about how
     * to submit a platform support request.
     *
     * @param {object} param Slack Workflow Execute Parameter
     */
    execute: async ({ complete, client }) => {
      const outputs = {};

      try {
        logger.debug(`${WORKFLOW_CALLBACK_ID} workflow step executed.`);

        client.chat.postMessage({
          channel: SUPPORT_CHANNEL_ID,
          blocks: responseBuilder.buildHelpResponse(),
        });
      } catch (error) {
        logger.error(error);
      }

      await complete({ outputs });
    },
  });

  // Use Workflow Middleware
  app.step(ws);
};
