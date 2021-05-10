module.exports = function (logger) {
  const slack = require('../api/slack')(logger);
  const schedule = require('../api/pagerduty')(logger);
  const sheets = require('../api/google')(logger);
  const util = require('../api/slack/util')(logger);

  let routing = {};

  routing.getRoutingFromChannelTopic = async (client) => {
    return util.parseChannelTopic(await slack.getChannelTopic(client));
  };

  routing.getOnCallUser = async (client, selectedTeamId) => {
    let oncallUser = null;

    const selectedTeam = await sheets.getTeamById(selectedTeamId);

    logger.debug(selectedTeam);

    // Check Channel Topic
    const topicRouteData = await routing.getRoutingFromChannelTopic(client);
    if (topicRouteData) {
      logger.debug(topicRouteData);
      const slackUser = topicRouteData[selectedTeam.Title.toLowerCase()];
      oncallUser = slackUser ? { userId: slackUser } : null;
      logger.info(`Selected On-Call User: ${slackUser} from Channel Topic`);
    }

    // Check PagerDuty
    if (!oncallUser) {
      logger.info('User not found in Channel Topic.  Trying PagerDuty...');

      const email = await schedule.getOnCallPersonEmailForSchedule(
        selectedTeam.PagerDutySchedule
      );
      logger.info(`Found PagerDuty user email: ${email}`);
      oncallUser = await slack.getSlackUserByEmail(client, email);

      if (oncallUser) {
        logger.info(
          `Selected On-Call User: ${oncallUser.userId} from PagerDuty`
        );
      } else {
        logger.info(`Unable to find slack user with email: ${email}`);
      }
    }

    // Get Slack Group
    if (!oncallUser) {
      logger.info('User not found at PagerDuty.  Getting SlackGroup');
      oncallUser = { userId: selectedTeam.slackGroup };
    }

    return oncallUser?.userId;
  };

  return routing;
};
