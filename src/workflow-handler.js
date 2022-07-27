const { WorkflowStep } = require('@slack/bolt');

const WORKFLOW_CALLBACK_ID = 'platform_support_request';
const SUPPORT_CHANNEL_ID = process.env.SLACK_SUPPORT_CHANNEL;

module.exports = function (app, logger) {
  const logic = require('./logic')(logger);

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

        //logger.info(`WORKFLOW STEP: Edit - ${WORKFLOW_CALLBACK_ID}`);

        const blocks = [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Current User',
            },
            block_id: 'user_input',
            accessory: {
              type: 'users_select',
              placeholder: {
                type: 'plain_text',
                text: 'Select a user',
                emoji: true,
              },
              action_id: 'value',
            },
          },
        ];

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
    save: async ({ ack, view, update }) => {
      try {
        await ack();

        //logger.info(`WORKFLOW STEP: Save - ${WORKFLOW_CALLBACK_ID}`);

        const { values } = view.state;
        const username = values.user_input.value;

        const outputs = {};
        const inputs = {
          username: {
            value: username.selected_user,
          },
        };

        await update({ inputs, outputs });
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
    execute: async ({ step, complete, client }) => {
      const inputs = step.inputs;
      const outputs = {};

      try {
        //logger.info(`WORKFLOW STEP: execute - ${WORKFLOW_CALLBACK_ID}`);

        logic.postHelpMessageToUserOnly(
          client,
          SUPPORT_CHANNEL_ID,
          inputs.username.value
        );
      } catch (error) {
        logger.error(error);
      }

      await complete({ outputs });
    },
  });

  // Use Workflow Middleware
  app.step(ws);
};
