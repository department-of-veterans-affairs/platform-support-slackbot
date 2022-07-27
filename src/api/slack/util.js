module.exports = function (logger) {
  let util = {};

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
    return `msgId:${messageId ?? ''}`;
  };

  /**
   * Generates a Slack Message Link
   * @param {string} channelId
   * @param {string} messageId
   * @returns
   */
  util.createMessageLink = (host, channel, messageId) => {
    if (!channel || !host || !messageId) return '';

    const updatedId = messageId.replace('.', '');
    return `https://${host}/archives/${channel}/p${updatedId}`;
  };
  return util;
};
