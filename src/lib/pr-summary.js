/*
  Build a one-liner summary of a GitHub PR:
    • failing / passing checks
    • has / missing CODEOWNER reviewer
    • list of non-owner approvals
*/

const { Octokit } = require('@octokit/rest');
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

function icon(ok) { return ok ? '✅' : '❌'; }

async function getPRSummary(owner, repo, number) {
  /* ── 1. basic PR info ─────────────────────────────── */
  const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number: number });

  /* ── 2. check-runs result ─────────────────────────── */
  const { data: checks } = await octokit.checks.listForRef({
    owner,
    repo,
    ref: pr.head.sha,
  });

  const failedChecks = checks.check_runs
    .filter(c => c.conclusion !== 'success')
    .map(c => c.name);

  const checksLine =
    failedChecks.length === 0
      ? `${icon(true)} All required checks passed`
      : `${icon(false)} Failed checks: ${failedChecks.join(', ')}`;

  /* ── 3. CODEOWNERS vs requested reviewers ─────────── */
  const owners = await fetchCodeOwners(owner, repo);

  const { data: rr } = await octokit.pulls.listRequestedReviewers({
    owner,
    repo,
    pull_number: number,
  });
  const requested = rr.users.map(u => u.login);
  const ownerRequested = requested.some(r => owners.has(r));

  /* ── 4. approvals by non-owners ───────────────────── */
  const { data: reviews } = await octokit.pulls.listReviews({
    owner,
    repo,
    pull_number: number,
  });

  const nonOwnerApprovals = reviews
    .filter(r => r.state === 'APPROVED' && !owners.has(r.user.login))
    .map(r => r.user.login);

  /* ── 5. final mrkdwn line ─────────────────────────── */
  const pieces = [
    checksLine,
    ownerRequested
      ? '🔔 Code-owner review **requested**'
      : '🕓 No code-owner reviewer yet',
    nonOwnerApprovals.length
      ? `👍 Approved by: ${nonOwnerApprovals.join(', ')}`
      : '⏳ No non-owner approvals',
    `<${pr.html_url}|View PR #${number}>`,
  ];

  return pieces.join('   •  ');
}

/* helper – minimal CODEOWNERS parser (cached in memory) */
const cache = new Map();
async function fetchCodeOwners(owner, repo) {
  const key = `${owner}/${repo}`;
  if (cache.has(key)) return cache.get(key);

  const paths = ['.github/CODEOWNERS', 'docs/CODEOWNERS', 'CODEOWNERS'];
  for (const path of paths) {
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path });
      if (!Array.isArray(data) && 'content' in data) {
        const decoded = Buffer.from(data.content, 'base64').toString();
        const owners = new Set(
          decoded
            .split('\n')
            .filter(l => l && !l.startsWith('#'))
            .flatMap(l => l.trim().split(/\s+/).slice(1))
            .map(o => o.replace(/^@/, ''))
        );
        cache.set(key, owners);
        return owners;
      }
    } catch {
      /* ignore 404 and try next path */
    }
  }
  const empty = new Set();
  cache.set(key, empty);
  return empty;
}

module.exports = { getPRSummary };

