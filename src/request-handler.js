const { WorkflowStep } = require('@slack/bolt');
const responseBuilder = require('./api/slack/block-kit/response-builder');

const SUPPORT_CHANNEL_ID = process.env.SLACK_SUPPORT_CHANNEL;

function requestHandler(app, logger) {
  const util = require('./util')(logger);
  const sheets = require('./api/google/sheets')(logger);

  app.event('reaction_added', async ({ payload }) => {
    try {
      if (payload.item.ts) {
        logger.debug(payload);
        const hashedMessageId = util.hashMessageId(payload.item.ts);
        logger.debug(hashedMessageId);
        sheets.updateReplyTimeStampForMessage(hashedMessageId);
      }
    } catch (error) {
      logger.error(error);
    }
  });

  app.message('hello', async ({ message, say }) => {
    try {
      logger.debug(message.user);
      await say(`Hey there <@${message.user}>!`);
    } catch (error) {
      logger.error(error);
    }
  });

  // Listens to any message
  app.message('', async ({ message }) => {
    try {
      if (message.thread_ts) {
        logger.debug(message);
        const hashedMessageId = util.hashMessageId(message.thread_ts);
        logger.debug(hashedMessageId);
        sheets.updateReplyTimeStampForMessage(hashedMessageId);
      }
    } catch (error) {
      logger.error(error);
    }
  });

  app.command('/help', async ({ ack, body, client }) => {
    // Message the user
    try {
      await ack();

      let msg = `Hey there <@${body.user_id}>!  To submit a new support request, use the /support command.  Simply type /support in the chat.`;

      await client.chat.postMessage({
        channel: body.channel_id,
        text: msg,
      });
    } catch (error) {
      logger.error(error);
    }
  });

  app.command('/support', async ({ ack, body, client }) => {
    try {
      // Acknowledge the command request
      await ack();

      logger.info('/support command invoked.');

      // Call views.open with the built-in client
      util.buildSupportModal(client, body.user_id, body.trigger_id);
    } catch (error) {
      logger.error(error);
    }
  });

  // The open_modal shortcut opens a plain old modal
  app.shortcut('support', async ({ shortcut, ack, client }) => {
    try {
      // Acknowledge shortcut request
      await ack();

      logger.info('support shortcut invoked.');

      // Call views.open with the built-in client
      util.buildSupportModal(client, shortcut.user.id, shortcut.trigger_id);
    } catch (error) {
      logger.error(error);
    }
  });

  // Handle Form Submission
  app.view('support_modal_view', async ({ ack, body, view, client }) => {
    // Message the user
    try {
      await ack();

      const { id, username: whoSubmitted } = body.user;
      const {
        users_requesting_support: users,
        topic,
        summary,
      } = view.state.values;

      const whoNeedsSupport = users.users.selected_users;
      const selectedTeam = topic.selected.selected_option.value;
      const summaryDescription = summary.value.value;

      logger.trace('whoNeedsSupport', whoNeedsSupport);
      logger.trace('selectedTeam', selectedTeam);
      logger.trace('summaryDescription', summaryDescription);

      const dateTime = new Date(Date.now());

      const postedMessage = await client.chat.postMessage({
        channel: SUPPORT_CHANNEL_ID,
        link_names: 1,
        blocks: responseBuilder.buildSupportResponse(
          id,
          selectedTeam,
          summaryDescription
        ),
        text: `Hey there <@${id}>!`,
        unfurl_links: false, // Remove Link Previews
      });

      if (!postedMessage.ok) {
        logger.error(
          `Unable to post message. ${JSON.stringify(postedMessage)}`
        );
        return;
      }

      const messageId = postedMessage.ts;

      const messageLink = util.createMessageLink(
        postedMessage.channel,
        messageId
      );

      const hashedMessageId = util.hashMessageId(messageId);

      logger.trace(postedMessage);
      logger.debug(`Posted Message ID: ${messageId}`);
      logger.debug(`Posted Message ID Hashed: ${hashedMessageId}`);

      const slackUsers = await Promise.all(
        whoNeedsSupport.map(async (id) => await util.getSlackUser(client, id))
      );

      const usernames = slackUsers.map((user) => user.user.name);

      sheets.captureResponses(
        hashedMessageId,
        whoSubmitted,
        dateTime,
        usernames,
        selectedTeam,
        summaryDescription,
        messageLink
      );
    } catch (error) {
      logger.error(error);
    }
  });

  const ws = new WorkflowStep('platform_support_request', {
    edit: async ({ ack, step, configure }) => {
      await ack();

      const blocks = [];

      /*
      const blocks = [
        {
          type: 'input',
          block_id: 'task_name_input',
          element: {
            type: 'plain_text_input',
            action_id: 'name',
            placeholder: {
              type: 'plain_text',
              text: 'Add a task name',
            },
          },
          label: {
            type: 'plain_text',
            text: 'Task name',
          },
        },
        {
          type: 'input',
          block_id: 'task_description_input',
          element: {
            type: 'plain_text_input',
            action_id: 'description',
            placeholder: {
              type: 'plain_text',
              text: 'Add a task description',
            },
          },
          label: {
            type: 'plain_text',
            text: 'Task description',
          },
        },
      ];
      */

      await configure({ blocks });
    },
    save: async ({ ack, step, view, update }) => {
      await ack();

      /*
      const { values } = view.state;
      const taskName = values.task_name_input.name;
      const taskDescription = values.task_description_input.description;

      const inputs = {
        taskName: { value: taskName.value },
        taskDescription: { value: taskDescription.value },
      };

      const outputs = [
        {
          type: 'text',
          name: 'taskName',
          label: 'Task name',
        },
        {
          type: 'text',
          name: 'taskDescription',
          label: 'Task description',
        },
      ];
      */

      // await update({ inputs, outputs });

      await update({});
    },
    execute: async (obj) => {
      console.log(JSON.stringify(obj));
      const {
        step,
        complete,
        fail,
        client,
        body,
        payload,
        event,
        logger,
      } = obj;
      const { inputs } = step;

      // const outputs = {
      //   taskName: inputs.taskName.value,
      //   taskDescription: inputs.taskDescription.value,
      // };

      const outputs = {};

      logger.info('Executing...');

      try {
        logger.info('/support command invoked.');

        logger.debug(`User Id: ${body.user_id}`);

        let msg = 'Hello, World!';

        client.chat.postMessage({
          channel: SUPPORT_CHANNEL_ID,
          text: msg,
        });

        // Call views.open with the built-in client
        //util.buildSupportModal(client, body.user_id, body.trigger_id);
      } catch (error) {
        logger.error(error);
      }

      // console.log(client);

      // try {
      //   const result = await client.views.open({
      //     type: 'modal',
      //     title: {
      //       type: 'plain_text',
      //       text: 'Gratitude Box',
      //       emoji: true,
      //     },
      //     submit: {
      //       type: 'plain_text',
      //       text: 'Submit',
      //       emoji: true,
      //     },
      //     close: {
      //       type: 'plain_text',
      //       text: 'Cancel',
      //       emoji: true,
      //     },
      //     blocks: [
      //       {
      //         type: 'input',
      //         block_id: 'my_block',
      //         element: {
      //           type: 'plain_text_input',
      //           action_id: 'my_action',
      //         },
      //         label: {
      //           type: 'plain_text',
      //           text: 'Say something nice!',
      //           emoji: true,
      //         },
      //       },
      //     ],
      //   });

      //   // Call views.open with the built-in client
      //   const result2 = await client.views.open({
      //     // // Pass a valid trigger_id within 3 seconds of receiving it
      //     // trigger_id: body.trigger_id,
      //     // View payload
      //     view: {
      //       type: 'modal',
      //       // View identifier
      //       callback_id: 'view_1',
      //       title: {
      //         type: 'plain_text',
      //         text: 'Modal title',
      //       },
      //       blocks: [
      //         {
      //           type: 'section',
      //           text: {
      //             type: 'mrkdwn',
      //             text: 'Welcome to a modal with _blocks_',
      //           },
      //           accessory: {
      //             type: 'button',
      //             text: {
      //               type: 'plain_text',
      //               text: 'Click me!',
      //             },
      //             action_id: 'button_abc',
      //           },
      //         },
      //         {
      //           type: 'input',
      //           block_id: 'input_c',
      //           label: {
      //             type: 'plain_text',
      //             text: 'What are your hopes and dreams?',
      //           },
      //           element: {
      //             type: 'plain_text_input',
      //             action_id: 'dreamy_input',
      //             multiline: true,
      //           },
      //         },
      //         {
      //           type: 'input',
      //           block_id: 'input123',
      //           label: {
      //             type: 'plain_text',
      //             text: 'Label of input',
      //           },
      //           element: {
      //             type: 'plain_text_input',
      //             action_id: 'plain_input',
      //             initial_value: `hello`,
      //           },
      //         },
      //       ],
      //       submit: {
      //         type: 'plain_text',
      //         text: 'Submit',
      //       },
      //     },
      //   });
      //   console.log(result);
      // } catch (error) {
      //   console.error(error);
      // }

      // if everything was successful
      await complete({ outputs });

      // if something went wrong
      // fail({ error: { message: "Just testing step failure!" } });
    },
  });

  app.step(ws);
}

module.exports = requestHandler;
