/* ──────────────────────────────────────────────
   src/logic/form-support.js   (full file)
   ────────────────────────────────────────────── */
const responseBuilder = require('../ui/messages');
const { getPRSummary } = require('../lib/pr-summary');   // ← NEW
const SUPPORT_CHANNEL_ID = process.env.SLACK_SUPPORT_CHANNEL;

/* regex to recognise a PR link in the summary */
const PR_REGEX =
  /https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)(?=\D|$)/;

module.exports = function (logger) {
  const slack  = require('../api/slack')(logger);
  const sheets = require('../api/google')(logger);

  const formSupport = {};        // object we export

  /* ─────────────────────────
     EXTRACT-DATA HELPERS  (unchanged)
     ───────────────────────── */
  formSupport.extractSupportFormData   = async (client, body, view, teamData) => { /* …unchanged… */ };
  formSupport.extractOnSupportFormData = async (client, body, view)           => { /* …unchanged… */ };
  formSupport.extractReassignFormData  = async (view)                         => { /* …unchanged… */ };

  /* ─────────────────────────
     POST TICKET HEADER
     ───────────────────────── */
  formSupport.postSupportTicketMessage = async (
    client,
    ticketId,
    formData,
    oncallUser,
    githubIssue
  ) => {
    /* 1️⃣  root message ---------------------------------------------------- */
    const header = await client.chat.postMessage({
      channel: SUPPORT_CHANNEL_ID,
      link_names: 1,
      blocks: await responseBuilder.buildSupportResponse(   // <-- add await
        ticketId,
        formData.submittedBy.id,
        formData.selectedTeam.name,
        formData.selectedTopic.name,
        formData.summaryDescription,
        oncallUser,
        formData.selectedTeam.name,
        githubIssue
      ),
      text: `Hey there ${oncallUser}, you have a new Platform Support ticket!`,
      unfurl_links: false,
    });

    if (!header.ok) {
      logger.error(`Unable to post message. ${JSON.stringify(header)}`);
      return { messageId: null, channel: null, error: 'Error Posting Message' };
    }

    /* 2️⃣  threaded PR-status reply --------------------------------------- */
    const match = PR_REGEX.exec(formData.summaryDescription);
    if (match) {
      const [, owner, repo, num] = match;
      let summaryText;
      try {
        summaryText = await getPRSummary(owner, repo, Number(num));
      } catch (err) {
        summaryText = '⚠️ Could not fetch PR status at this time.';
        logger.error(`getPRSummary failed: ${err}`);
      }

      await client.chat.postMessage({
        channel: SUPPORT_CHANNEL_ID,
        thread_ts: header.ts,
        text: summaryText,
        mrkdwn: true,
        unfurl_links: false,
      });
    }

    /* 3️⃣  return for caller (auto-answer is handled elsewhere) ------------ */
    return { messageId: header.ts, channel: header.channel };
  };

  /* ─────────────────────────
     OTHER POST HELPERS  (all original)
     ───────────────────────── */
  formSupport.postAutoAnswerMessage = async (client, thread, autoResponses) => { /* unchanged */ };
  formSupport.postAdditionalContextMessage = async (client, thread, autoResp) => { /* unchanged */ };
  formSupport.postSurveyMessage     = async (client, thread)               => { /* unchanged */ };
  formSupport.postOnSupportMessage  = async (formData, client)             => { /* unchanged */ };

  /* export the helper collection */
  return formSupport;
};

