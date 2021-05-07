const responseBuilder = require('../../ui/messages');

const SUPPORT_CHANNEL_ID = process.env.SLACK_SUPPORT_CHANNEL;

module.exports = function (logger) {
  const slack = require('../slack')(logger);
  const schedule = require('../pagerduty')(logger);
  const util = require('./util')(logger);
  const sheets = require('../google')(logger);

  let formSupport = {};

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
      await slack.getSlackUsers(client, whoNeedsSupportUserIds)
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
      oncallUser = await slack.getSlackUserByEmail(client, email);
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
