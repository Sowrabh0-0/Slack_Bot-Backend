import slackApp from '../app.js';
import axios from 'axios'; 

export const handleCommand = async (req, res) => {
    const { command, user_id, response_url, trigger_id } = req.body;

    if (command === '/approval-test') {
        try {
            // Open a modal view for requesting approval
            await slackApp.client.views.open({
                trigger_id,
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
                            },
                            optional: false
                        }
                    ],
                    submit: {
                        type: 'plain_text',
                        text: 'Submit'
                    }
                }
            });
            res.send('');
        } catch (error) {
            console.error('Error opening modal:', error.response ? JSON.stringify(error.response.data) : error.message);
            // Sending an error message back to the user via response_url
            axios.post(response_url, {
                response_type: 'ephemeral', // Only visible to the user
                text: "Sorry, there was a problem opening the approval request."
            });
            res.status(500).send('Internal Server Error');
        }
    } else {
        // Handle unknown command
        res.status(400).send('Unknown command');
    }
};
