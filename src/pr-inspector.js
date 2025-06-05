// ───────────────────────────────────────────────
//  src/pr-inspector.js  –  PR-inspector listener
// ───────────────────────────────────────────────
const { Octokit }            = require("@octokit/rest");
const { google }             = require("googleapis");
const { LRUCache }           = require("lru-cache");
const { DateTime, Interval } = require("luxon");

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const sheets  = google.sheets("v4");
const codeOwnerCache = new LRUCache({ max: 100, ttl: 1000 * 60 * 60 }); // 1-h TTL

module.exports = function registerPRInspector(app) {
  console.log("🔍 PR-inspector loaded");

  app.event("message", async ({ event, client, logger }) => {
    /* -------- choose correct payload (plain vs. message_changed) -------- */
    const container =
      event.subtype === "message_changed" ? event.message : event;

    /* -------- debug breadcrumbs -------- */
    logger.debug("pr-inspector: incoming", {
      subtype: event.subtype,
      bot_id: container.bot_id,
    });

    /* -------- rebuild visible text (plain text + block-kit) -------- */
    const text =
      (container.text || "") +
      "\n" +
      (container.blocks || [])
        .map((b) => (b.text ? b.text.text : ""))
        .join("\n");

    logger.debug("pr-inspector: combined text", text);

    /* -------- skip our own bot’s msgs unless they have a PR link -------- */
    const hasPR  = /github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(text);
    const isSelf =
      container.bot_id && container.bot_id === process.env.SELF_BOT_ID;
    if (isSelf && !hasPR) {
      logger.debug("pr-inspector: skipped self-msg without PR");
      return;
    }

    /* -------- extract PR URLs -------- */
    const prRegex =
      /https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)(?=\D|$)/g;
    const matches = [...text.matchAll(prRegex)];
    logger.debug("pr-inspector: regex matches", matches);

    if (!matches.length) return;

    for (const [, owner, repo, num] of matches) {
      try {
        await handlePR({
          owner,
          repo,
          number: Number(num),
          channel: event.channel,
          threadTs: (event.thread_ts || event.ts),
          client,
          logger,
        });
      } catch (err) {
        logger.error("pr-inspector error", err);
      }
    }
  });
};

/* ──────────────────────────────────────────
   helper functions (unchanged from before)
   ────────────────────────────────────────── */

async function getCodeOwners(owner, repo) {
  const key = `${owner}/${repo}`;
  if (codeOwnerCache.has(key)) return codeOwnerCache.get(key);

  for (const path of [".github/CODEOWNERS", "docs/CODEOWNERS", "CODEOWNERS"]) {
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path });
      if (!Array.isArray(data) && data.content) {
        const owners = new Set(
          Buffer.from(data.content, "base64")
            .toString()
            .split("\n")
            .filter((l) => l && !l.startsWith("#"))
            .flatMap((l) => l.trim().split(/\s+/).slice(1))
            .map((o) => o.replace(/^@/, ""))
        );
        codeOwnerCache.set(key, owners);
        return owners;
      }
    } catch (_) {}   // ignore 404
  }
  return new Set();
}

function workingHours(start, end) {
  let hrs = 0;
  for (let t = start; t < end; t = t.plus({ hours: 1 })) {
    if (t.weekday < 6 && t.hour >= 9 && t.hour < 17) hrs++;
  }
  return hrs;
}

async function handlePR({ owner, repo, number, channel, threadTs, client }) {
  /* 1. PR details */
  const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number: number });

  /* 2. Checks */
  const { data: checks } = await octokit.checks.listForRef({
    owner,
    repo,
    ref: pr.head.sha,
  });
  const failed = checks.check_runs
    .filter((c) => c.conclusion !== "success")
    .map((c) => c.name);

  /* 3. Code-owner info */
  const codeOwners = await getCodeOwners(owner, repo);
  const { data: rr } = await octokit.pulls.listRequestedReviewers({
    owner,
    repo,
    pull_number: number,
  });
  const codeOwnerRequested = rr.users.some((u) => codeOwners.has(u.login));

  /* 4. Non-owner approvals */
  const { data: reviews } = await octokit.pulls.listReviews({
    owner,
    repo,
    pull_number: number,
  });
  const nonOwnerApprovals = reviews
    .filter((r) => r.state === "APPROVED" && !codeOwners.has(r.user.login))
    .map((r) => r.user.login);

  /* 5. Timing */
  const created = DateTime.fromISO(pr.created_at, { zone: "America/New_York" });
  const now     = DateTime.now().setZone("America/New_York");
  const hrs     = workingHours(created, now);

  /* 6. Compose Slack message */
  const msg = [
    codeOwnerRequested
      ? "🔔 *Code-owner review requested.*"
      : "🕓 No code-owner requested.",
    nonOwnerApprovals.length
      ? `✅ Approved by non-owners: ${nonOwnerApprovals.join(", ")}`
      : "⏳ No non-owner approvals yet.",
    failed.length
      ? `❌ Failed checks: ${failed.join(", ")}`
      : "✅ All required checks passed.",
    `⏱️ ${hrs > 24 ? "*Over*" : "Under"} 24 working hours across ${Interval
      .fromDateTimes(created, now)
      .length("days")
      .toFixed(0)} day(s).`,
  ].join("\n");

  await client.chat.postMessage({ channel, thread_ts: threadTs, text: msg });

  /* 7. Optional Google Sheets log */
  if (process.env.SPREADSHEET_ID) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "Sheet1!A2",
      valueInputOption: "RAW",
      requestBody: { values: [[pr.user.login, repo, number, now.toISO()]] },
      // auth: oauth2Client, // supply if you use Sheets
    });
  }
}

