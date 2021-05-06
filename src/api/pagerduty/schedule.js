const { api } = require('@pagerduty/pdjs');

module.exports = function (logger) {
  let schedule = {};

  schedule.getApiInstance = function () {
    return api({ token: process.env.PAGER_DUTY_API_KEY });
  };

  schedule.getScheduleForDate = async function (pd, scheduleId, date) {
    logger.trace('getScheduleForDate()');

    const encodedDate = encodeURI(date.toISOString());

    return await pd.get(
      `/schedules/${scheduleId}?since=${encodedDate}&until=${encodedDate}&overflow=true`
    );
  };

  schedule.getUserById = async function (pd, userId) {
    logger.trace('getUserById()');

    return await pd.get(`/users/${userId}`);
  };

  schedule.getOnCallPersonEmailForSchedule = async function (scheduleId) {
    logger.trace('getOnCallPersonEmailForSchedule()');

    const api = this.getApiInstance();

    const currentDate = new Date();

    const currentScheduleResponse = await this.getScheduleForDate(
      api,
      scheduleId,
      currentDate
    );

    const currentSchedule = currentScheduleResponse?.data?.schedule;

    const entries = currentSchedule?.final_schedule?.rendered_schedule_entries;

    if (!entries || entries.length == 0) return null;

    const oncallUser = entries[0].user;

    const userResponse = await this.getUserById(api, oncallUser.id);

    return userResponse?.data?.user?.email;
  };

  return schedule;
};
