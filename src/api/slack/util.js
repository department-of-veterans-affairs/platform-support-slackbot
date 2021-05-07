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
