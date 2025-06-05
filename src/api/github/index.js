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

        closeIssue: async (issue_number) => {
            github.authenticate();

            let response = await octokit.rest.issues.update({
                owner: process.env.GITHUB_OWNER,
                repo: process.env.GITHUB_ISSUE_REPO,
                issue_number: issue_number,
                state: 'closed'
            })
            
            return response;
        },

        removeLabelsFromIssue: async (issue_number) => {
            github.authenticate();

            let response = await octokit.rest.issues.removeAllLabels({
                owner: process.env.GITHUB_OWNER,
                repo: process.env.GITHUB_ISSUE_REPO,
                issue_number: issue_number,
            })
            
            return response;
        },

        labelReassignedIssue: async (issue_number, label) => {
            github.authenticate();

            let response = await octokit.rest.issues.addLabels({
                owner: process.env.GITHUB_OWNER,
                repo: process.env.GITHUB_ISSUE_REPO,
                issue_number: issue_number,
                labels: label ? [process.env.GITHUB_SUPPORT_LABEL, label] : [process.env.GITHUB_SUPPORT_LABEL]
            })

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
