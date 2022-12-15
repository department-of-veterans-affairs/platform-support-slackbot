const { Octokit } = require('octokit');
const { createAppAuth } = require('@octokit/auth-app');

module.exports = (logger) => {
    const octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
            appId: process.env.GITHUB_APP_ID,
            privateKey: process.env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n'),
            installationId: process.env.GITHUB_APP_INSTALLATION_ID
        }
    });
    
    let github = {
        authenticate: async () => {
            const { data: { slug }} = await octokit.rest.apps.getAuthenticated();
        },

        createIssue: async (title, summary, label) => {
            github.authenticate();

            let response = await octokit.rest.issues.create({
                owner: process.env.GITHUB_OWNER,
                repo: process.env.GITHUB_ISSUE_REPO,
                title,
                body: summary,
                labels: label ? [process.env.GITHUB_SUPPORT_LABEL, label] : [process.env.GITHUB_SUPPORT_LABEL]
            });
            return response;
        },

        commentOnIssue: async ( issue_number, body ) => {
            github.authenticate();

            let response = await octokit.rest.issues.createComment({
                owner: process.env.GITHUB_OWNER,
                repo: process.env.GITHUB_ISSUE_REPO,
                issue_number,
                body
            });

            return response;
        }


    };

    return github;
}