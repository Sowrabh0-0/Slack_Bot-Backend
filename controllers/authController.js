import axios from 'axios';
import slackApp from '../app.js';

// Function to handle OAuth redirect
export const oauthRedirect = async (req, res) => {
    const code = req.query.code;

    try {
        // Make a GET request to Slack API for OAuth access
        const response = await axios.get('https://slack.com/api/oauth.v2.access', {
            params: {
                client_id: process.env.SLACK_CLIENT_ID,
                client_secret: process.env.SLACK_CLIENT_SECRET,
                code: code,
                redirect_uri: process.env.SLACK_REDIRECT_URI
            }
        });

        if (response.data.ok) {
            const accessToken = response.data.access_token;
            slackApp.token = accessToken;

            // Redirect to the frontend approval history page
            res.redirect(process.env.FRONTEND_URL + '/approvalhistory');
        } else {
            // If installation of Slack app fails, send a 500 error response
            res.status(500).send('Failed to install Slack app');
        }
    } catch (error) {
        // Handle errors during OAuth process
        console.error('Error during OAuth process:', error.response ? error.response.data : error.message);
        res.status(500).send('Internal Server Error');
    }
};
