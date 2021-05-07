const modalBuilder = require('./block-kit/modal-builder');

module.exports = function (logger) {
  const sheets = require('../google')(logger);

  let util = {};

  /**
   * Build Support Modal
   * @param {object} client Slack Client Object
   * @param {string} user Current User Id
   * @param {string} trigger_id Trigger Id to generate modal
   */
  util.buildSupportModal = async (client, user, trigger_id) => {
    logger.debug('buildSupportModal()');

    const options = await sheets.getTeams();

    const view = modalBuilder.buildSupportModal(user, options);

    const result = await client.views.open({
      trigger_id,
      view,
    });

    logger.debug(`user: ${user}`);
    logger.trace(result);
  };

  util.buildReassignmentModal = async (client, trigger_id, ticketId) => {
    logger.debug('buildReassignmentModal()');

    const options = await sheets.getTeams();

    const view = modalBuilder.buildReassignmentModal(options, ticketId);

    const result = await client.views.open({
      trigger_id,
      view,
    });

    logger.debug(`ticketId: ${ticketId}`);
    logger.trace(result);
  };

  /**
   * Returns Slack User from Slack User Id
   * @param {object} client Slack Client Object
   * @param {string} userId Slack User Id
   * @returns Slack userName
   */
  util.getSlackUser = async (client, userId) => {
    try {
      // Call the users.info method using client
      return await client.users.info({
        user: userId,
      });
    } catch (error) {
      logger.error(error);

      // If it fails to retreive the username, just return the user Id
      return userId;
    }
  };

  /**
   * Returns an Array of Slack Users from an Array of Slack User Ids
   * @param {object} client Slack Client Object
   * @param {string} userIds Array of Slack User Ids
   */
  util.getSlackUsers = async (client, userIds) => {
    try {
      return await Promise.all(
        userIds.map(async (id) => await util.getSlackUser(client, id))
      );
    } catch (error) {
      logger.error(error);

      // If it fails, just return an array of user objects with no
      // usernames.
      return userIds.map((id) => {
        return { id, name: '' };
      });
    }
  };

  /**
   * Returns Slack Username and Id from Email
   * @param {object} client Slack Client Object
   * @param {string} email Email Address
   * @returns object with userId and userName properties
   */
  util.getSlackUserByEmail = async (client, email) => {
    try {
      const { user } = await client.users.lookupByEmail({
        email,
      });
      logger.debug('getSlackUserByEmail');
      return {
        userId: user.id,
        userName: user.name,
      };
    } catch (error) {
      logger.error(error);
    }
  };

  /**
   * Converts a Slack message id to store in Google Sheet.
   *
   * Note: Message Id is double and causes issues
   * when referencing the Id.  Convert it to a string
   * for better comparison.
   * @param {string} messageId Message Id
   * @returns string Message Id String
   */
  util.stringifyMessageId = (messageId) => {
    return `msgId:${messageId}`;
  };

  /**
   * Generates a Slack Message Link
   * @param {string} channelId
   * @param {string} messageId
   * @returns
   */
  util.createMessageLink = (channel, messageId) => {
    if (!channel || !messageId) return '';

    const updatedId = messageId.replace('.', '');
    return `https://adhoc.slack.com/archives/${channel}/p${updatedId}`;
  };

  return util;
};
