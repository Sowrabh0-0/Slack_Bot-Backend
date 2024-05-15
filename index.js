require('dotenv').config();
const express = require('express');
const { App } = require('@slack/bolt');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');  // Import cors package

let accessToken = process.env.SLACK_ACCESS_TOKEN;

const slackApp = new App({
  token: accessToken,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());  // Use cors middleware

// In-memory storage for approval history
let approvalHistory = [];

// Endpoint to handle OAuth redirect
app.get('/slack/oauth_redirect', async (req, res) => {
    const code = req.query.code;

    try {
      const response = await axios.get('https://slack.com/api/oauth.v2.access', {
        params: {
          client_id: process.env.SLACK_CLIENT_ID,
          client_secret: process.env.SLACK_CLIENT_SECRET,
          code: code,
          redirect_uri: process.env.SLACK_REDIRECT_URI
        }
      });

      if (response.data.ok) {
        // Save the access token
        accessToken = response.data.access_token;
        slackApp.token = accessToken;

        res.redirect('http://localhost:3000/approvalhistory');
      } else {
        res.status(500).send('Failed to install Slack app');
      }
    } catch (error) {
      console.error('Error during OAuth process:', error.response ? error.response.data : error.message);
      res.status(500).send('Internal Server Error');
    }
  });

// Endpoint to fetch user and workspace information
app.get('/api/userinfo', async (req, res) => {
  try {
    const userInfoResponse = await axios.get('https://slack.com/api/users.profile.get', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log('User info response:', userInfoResponse.data);

    const workspaceInfoResponse = await axios.get('https://slack.com/api/team.info', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log('Workspace info response:', workspaceInfoResponse.data);

    if (userInfoResponse.data.ok && workspaceInfoResponse.data.ok) {
      const userInfo = userInfoResponse.data.profile;
      const workspaceInfo = workspaceInfoResponse.data.team;

      res.json({
        real_name: userInfo.real_name,
        email: userInfo.email,
        avatar: userInfo.image_32,
        workspace: workspaceInfo.name
      });
    } else {
      console.error('Failed to fetch user or workspace information:', {
        userInfo: userInfoResponse.data,
        workspaceInfo: workspaceInfoResponse.data
      });
      res.status(500).send('Failed to fetch user or workspace information');
    }
  } catch (error) {
    console.error('Error fetching user or workspace information:', error.response ? error.response.data : error.message);
    res.status(500).send('Internal Server Error');
  }
});

// Event listener for messages
slackApp.event('message', async ({ event, client }) => {
  try {
    if (event.subtype === undefined || event.subtype === 'bot_message') {
      await client.chat.postMessage({
        channel: event.channel,
        text: `You said: ${event.text}`
      });
    }
  } catch (error) {
    console.error('Error posting message:', error);
  }
});

// Endpoint to handle slash command
app.post('/slack/commands', async (req, res) => {
  const { command, user_id, response_url } = req.body;

  if (command === '/approval-test') {
    try {
      await slackApp.client.views.open({
        trigger_id: req.body.trigger_id,
        view: {
          type: 'modal',
          callback_id: 'approval_modal',
          title: {
            type: 'plain_text',
            text: 'Request Approval'
          },
          blocks: [
            {
              type: 'input',
              block_id: 'approver_block',
              label: {
                type: 'plain_text',
                text: 'Select Approver'
              },
              element: {
                type: 'users_select',
                action_id: 'approver_select'
              }
            },
            {
              type: 'input',
              block_id: 'text_block',
              label: {
                type: 'plain_text',
                text: 'Approval Text'
              },
              element: {
                type: 'plain_text_input',
                action_id: 'approval_text'
              }
            }
          ],
          submit: {
            type: 'plain_text',
            text: 'Submit'
          }
        }
      });
    } catch (error) {
      console.error('Error opening modal:', error);
    }
  }

  res.send('');
});

// Endpoint to handle interactive components
app.post('/slack/interactivity', async (req, res) => {
  console.log('Interactivity request received:', req.body);
  const payload = JSON.parse(req.body.payload);

  if (payload.type === 'view_submission' && payload.view.callback_id === 'approval_modal') {
    const approver = payload.view.state.values.approver_block.approver_select.selected_user;
    const approvalText = payload.view.state.values.text_block.approval_text.value;

    try {
      await slackApp.client.chat.postMessage({
        channel: approver,
        text: `Approval Request from <@${payload.user.id}>: ${approvalText}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Approval Request from <@${payload.user.id}>: ${approvalText}`
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Approve'
                },
                style: 'primary',
                value: 'approve',
                action_id: 'approve_button'
              },
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Reject'
                },
                style: 'danger',
                value: 'reject',
                action_id: 'reject_button'
              }
            ]
          }
        ]
      });
      console.log('Approval request sent to approver:', approver);

      // Store approval request
      approvalHistory.push({
        requestDate: new Date().toLocaleString(),
        status: 'Pending',
        approvedOn: '',
        message: approvalText,
        requestedBy: payload.user.id,
        approvedBy: approver
      });

    } catch (error) {
      console.error('Error sending approval request:', error.response ? error.response.data : error.message);
    }
  } else if (payload.type === 'block_actions') {
    const action = payload.actions[0];
    const requester = payload.message.text.match(/<@(.*?)>/)[1];
    const actionText = action.value === 'approve' ? 'approved' : 'rejected';

    try {
      // Update the original message to disable the buttons
      await slackApp.client.chat.update({
        channel: payload.channel.id,
        ts: payload.message.ts,
        text: `Approval Request from <@${requester}>: ${payload.message.blocks[0].text.text.split(": ")[1]}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Approval Request from <@${requester}>: ${payload.message.blocks[0].text.text.split(": ")[1]}`
              }
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `:white_check_mark: This request has been ${actionText} by <@${payload.user.id}>.`
                }
              ]
            }
          ]
        });

      // Notify the requester
      await slackApp.client.chat.postMessage({
        channel: requester,
        text: `Your approval request has been ${actionText} by <@${payload.user.id}>.`
      });

      // Update approval history
      const approval = approvalHistory.find(a => a.requestedBy === requester && a.message === payload.message.blocks[0].text.text.split(": ")[1]);
      if (approval) {
        approval.status = actionText.charAt(0).toUpperCase() + actionText.slice(1);
        approval.approvedOn = new Date().toLocaleString();
      }

      console.log('Approval action processed:', action.value);
    } catch (error) {
      console.error('Error processing approval action:', error.response ? error.response.data : error.message);
    }
  }

  res.send('');
});

// Endpoint to serve approval history data
app.get('/api/approvals', (req, res) => {
  res.json(approvalHistory);
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/build')));

// All other requests should return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});


