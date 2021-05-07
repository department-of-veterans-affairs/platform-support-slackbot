const responseBuilder = require('./block-kit/response-builder');

const SUPPORT_CHANNEL_ID = process.env.SLACK_SUPPORT_CHANNEL;

module.exports = function (logger) {
  const schedule = require('../pagerduty/schedule')(logger);
  const util = require('./util')(logger);
  const sheets = require('../google/sheets')(logger);

  let formSupport = {};

  formSupport.getChannelTopic = async (client) => {
    logger.trace('getChannelTopic()');

    const info = await client.conversations.info({
      channel: SUPPORT_CHANNEL_ID,
    });

    logger.debug(info.channel.topic.value);

    return info.channel.topic.value;
  };

  formSupport.parseChannelTopic = async (topic) => {
    logger.info(topic);
    const supportList = topic
      .split(/\r?\n/)
      .filter((line) => line.includes(':'))
      .map((line) => line.split(':'))
      .map((ar) => {
        return [ar[0], ar[1].trim()];
      });

    const onCall = Object.fromEntries(supportList);

    logger.info(onCall);

    logger.info(onCall['BE']);
    logger.info(onCall['FE']);
    logger.info(onCall['OPS']);
    logger.info(onCall['Analytics']);
    logger.info(onCall['Collab Cycle']);

    return onCall;
  };

  /**
   * Takes a form submission and extracts the data into a form
   * object.
   * @param {object} client Slack Client
   * @param {object} body Slack Body
   * @param {object} view Slack View
   * @returns Form Data Object
   */
  formSupport.extractSupportFormData = async (client, body, view) => {
    const { id, username } = body.user;
    const {
      users_requesting_support: users,
      topic,
      summary,
    } = view.state.values;

    const selectedTeamId = topic.selected.selected_option.value;
    const whoNeedsSupportUserIds = users.users.selected_users;
    const summaryDescription = summary.value.value;

    const whoNeedsSupport = (
      await util.getSlackUsers(client, whoNeedsSupportUserIds)
    ).map((user) => {
      return { id: user.user.id, username: user.user.name };
    });

    const teamData = await sheets.getTeamById(selectedTeamId);

    const selectedTeam = teamData
      ? {
          id: teamData.Title,
          name: teamData.Display,
          pagerDutySchedule: teamData.PagerDutySchedule,
          slackGroup: teamData.SlackGroup,
        }
      : {};

    return {
      submittedBy: {
        id,
        username,
      },
      whoNeedsSupport,
      selectedTeam,
      summaryDescription,
    };
  };

  /**
   * Post a Support Ticket to the Platform Support Channel
   * @param {object} client Slack Client
   * @param {string} ticketId Ticket Id (for Reassignment)
   * @param {object} formData Form Data Object
   * @param {object} routeData Route Data Object
   * @returns Posted Message Id and Channel
   */
  formSupport.postSupportTicketMessage = async (
    client,
    ticketId,
    formData,
    routeData
  ) => {
    const postedMessage = await client.chat.postMessage({
      channel: SUPPORT_CHANNEL_ID,
      link_names: 1,
      blocks: responseBuilder.buildSupportResponse(
        ticketId,
        formData.submittedBy.id,
        formData.selectedTeam.name,
        formData.summaryDescription,
        routeData.oncallUser ?? routeData.slackGroup,
        formData.selectedTeam.name
      ),
      text: `Hey there <@${formData.submittedBy.id}>, you have a new Platform Support ticket!`,
      unfurl_links: false, // Remove Link Previews
    });

    logger.trace(postedMessage);

    if (!postedMessage.ok) {
      logger.error(`Unable to post message. ${JSON.stringify(postedMessage)}`);
      return {
        messageId: null,
        channel: null,
        error: 'Error Posting Message',
      };
    }

    return {
      messageId: postedMessage.ts,
      channel: postedMessage.channel,
    };
  };

  /**
   * Build a support route based on:
   * 1. PagerDuty (if available)
   * 2. Slack group
   * @param {object} client Slack Client
   * @param {object} formData Form Data Object
   * @returns Route Data Object
   */
  formSupport.buildSupportRoute = async (client, formData) => {
    let oncallUser = null;

    // Attempt to check PagerDuty API
    if (formData.selectedTeam.pagerDutySchedule) {
      const email = await schedule.getOnCallPersonEmailForSchedule(
        formData.selectedTeam.pagerDutySchedule
      );
      logger.info('Oncall Email');
      logger.info(email);
      oncallUser = await util.getSlackUserByEmail(client, email);
      logger.info('Route To User');
      logger.info(oncallUser);
    }

    return {
      oncallUser: oncallUser?.userId,
      slackGroup: formData.selectedTeam.slackGroup,
    };
  };

  return formSupport;
};
