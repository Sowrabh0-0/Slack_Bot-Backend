import dotenv from 'dotenv';
import pkg from '@slack/bolt';
const { App } = pkg; 

dotenv.config();

const slackApp = new App({
  token: process.env.SLACK_ACCESS_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

export default slackApp;
