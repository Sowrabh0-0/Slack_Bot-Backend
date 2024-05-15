import dotenv from 'dotenv';
import pkg from '@slack/bolt';

const { App } = pkg; 

dotenv.config();

// Create a new instance of the Slack app
const slackApp = new App({
    token: process.env.SLACK_ACCESS_TOKEN, // Set the Slack access token from environment variables
    signingSecret: process.env.SLACK_SIGNING_SECRET // Set the Slack signing secret from environment variables
});

export default slackApp;
