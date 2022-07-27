const responseBuilder = require('../ui/messages');

const SUPPORT_CHANNEL_ID = process.env.SLACK_SUPPORT_CHANNEL;

module.exports = function (logger) {
  const slack = require('../api/slack')(logger);
  const sheets = require('../api/google')(logger);

  let formSupport = {};

  /**
   * Takes a form submission and extracts the data into a form
   * object.
   * @param {object} client Slack Client
   * @param {object} body Slack Body
   * @param {object} view Slack View
   * @returns Form Data Object
   */
  formSupport.extractSupportFormData = async (client, body, view, teamData) => {
    const { id, username } = body.user,
          {
            users_requesting_support: users,
            team,
            topic,
            summary,
          } = view.state.values,
          selectedTeamId = team.selected.selected_option.value,
          selectedTopicId = topic.selected.selected_option.value;
          whoNeedsSupportUserIds = users?.users?.selected_users ?? [],
          summaryDescription = summary.value.value,
          whoNeedsSupport = (
            await slack.getSlackUsers(client, whoNeedsSupportUserIds)
          ).map((user) => {
            return { id: user.user.id, username: user.user.name };
          }),
          selectedTeam = teamData
            ? {
              id: selectedTeamId,
              title: teamData.Title,
              name: teamData.Display,
              pagerDutySchedule: teamData.PagerDutySchedule,
              slackGroup: teamData.SlackGroup,
            }
            : {},

          topicData = await sheets.getTopicById(selectedTopicId),
          selectedTopic = topicData
            ? {
              id: selectedTopicId,
              name: topicData
            }
            : {};

    return {
      submittedBy: {
        id,
        username,
      },
      whoNeedsSupport,
      selectedTeam,
      selectedTopic,
      summaryDescription,
    };
  };


  /**
     * Takes a form submission and extracts the data into a form
     * object.
     * @param {object} client Slack Client
     * @param {object} body Slack Body
     * @param {object} view Slack View
     * @returns Form Data Object
     */
  formSupport.extractOnSupportFormData = async (client, body, view) => {
    const { id, username } = body.user,
          {
            team,
            user
          } = view.state.values

          selectedTeamId = team.selected.selected_option.value,
          teamData = await sheets.getTeamById(selectedTeamId),

          selectedTeam = teamData
            ? {
              id: selectedTeamId,
              title: teamData.Title,
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
      selectedTeam,
      user
    };
  };


  /**
   * Extracts selected team from the Support Ticket Reassignment form
   * @param {object} view Slack View Object
   * @returns Selected Team Object
   */
  formSupport.extractReassignFormData = async (view) => {
    const { topic } = view.state.values,
          selectedValue = topic.selected.selected_option.value,
          team = await sheets.getTeamById(selectedValue);

    return {
      id: selectedValue,
      title: team.Title,
      display: team.Display,
    };
  };

  /**
   * Post a Support Ticket to the Platform Support Channel
   * @param {object} client Slack Client
   * @param {string} ticketId Ticket Id (for Reassignment)
   * @param {object} formData Form Data Object
   * @param {object} oncallUser On Call Slack User Id
   * @returns Posted Message Id and Channel
   */
  formSupport.postSupportTicketMessage = async (
    client,
    ticketId,
    formData,
    oncallUser
  ) => {
    const postedMessage = await client.chat.postMessage({
      channel: SUPPORT_CHANNEL_ID,
      link_names: 1,
      blocks: responseBuilder.buildSupportResponse(
        ticketId,
        formData.submittedBy.id,
        formData.selectedTeam.name,
        formData.selectedTopic.name,
        formData.summaryDescription,
        oncallUser,
        formData.selectedTeam.name
      ),
      text: `Hey there ${oncallUser}, you have a new Platform Support ticket!`,
      unfurl_links: false, // Remove Link Previews
    });

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

  formSupport.postOnSupportMessage = async (
    formData,
    client
  ) => {
    const routing = require('../logic/index')(logger); 
    const teams = await sheets.getTeams();
    const text = await routing.getTeamsAssignmentText(client, teams);
    const postedMessage = await client.chat.postMessage({
      channel: SUPPORT_CHANNEL_ID,
      link_names: 1,
      blocks: await responseBuilder.buildOnSupportResponse(
        formData.submittedBy.id,
        text
      ),
      text: `On-support assignments updated!`,
      unfurl_links: false, // Remove Link Previews
    });

    if (!postedMessage.ok) {
      logger.error(`Unable to post message. ${JSON.stringify(postedMessage)}`);
      return {
        messageId: null,
        channel: null,
        error: 'Error Posting Message',
      };
    }

    const pins = await client.pins.list({
      channel: SUPPORT_CHANNEL_ID
    })
    
    pins.items.forEach((pin) => {
      if (pin.message.text.indexOf('On-call assignments updated!') !== -1) {
        client.pins.remove({
          channel: SUPPORT_CHANNEL_ID,
          timestamp: pin.message.ts
        })
      }
    });

    client.pins.add({
      channel: SUPPORT_CHANNEL_ID,
      timestamp: postedMessage.ts
    });
    return postedMessage;
  };

  return formSupport;
};
