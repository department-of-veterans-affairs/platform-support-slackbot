const modalBuilder = require('./api/slack/block-kit/modal-builder');
const { createHash } = require('crypto');

module.exports = function (logger) {
  const sheets = require('./api/google/sheets')(logger);

  let util = {};

  /**
   * Build Support Modal
   * @param {*} client Slack Client Object
   * @param {*} user Current User Id
   * @param {*} trigger_id Trigger Id to generate modal
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

  util.buildReassignmentModal = async (client, trigger_id) => {
    logger.debug('buildReassignmentModal()');

    const options = await sheets.getTeams();

    const view = modalBuilder.buildReassignmentModal(options);

    const result = await client.views.open({
      trigger_id,
      view,
    });

    logger.trace(result);
  };

  /**
   * Returns Slack Username from Slack User Id
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
      // If it fails to retreive the username, just return the user Id
      logger.error(error);

      return userId;
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
   * Hash a message id to store in Google Sheet.
   *
   * Note: Message Id is double and causes issues
   * when referencing the Id.  Convert it to a string
   * for better comparison.
   * @param {string} messageId Message Id
   * @returns hashed string
   */
  util.hashMessageId = (messageId) => {
    const hash = createHash('md5');
    return hash.update(messageId).digest('hex');
  };

  /**
   * Generates a Slack Message Link
   * @param {string} channelId
   * @param {string} messageId
   * @returns
   */
  util.createMessageLink = (channel, messageId) => {
    const updatedId = messageId.replace('.', '');
    return `https://adhoc.slack.com/archives/${channel}/p${updatedId}`;
  };

  return util;
};
