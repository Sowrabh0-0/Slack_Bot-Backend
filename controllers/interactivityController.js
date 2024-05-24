import slackApp from '../app.js';
import { addApproval, updateApprovalStatus } from './approvalController.js';

export const handleInteractivity = async (req, res) => {
    const payload = JSON.parse(req.body.payload);

    console.log("Payload received:", JSON.stringify(payload, null, 2));

    // Check if the payload type is 'view_submission' and the callback ID is 'approval_modal'
    if (payload.type === 'view_submission' && payload.view.callback_id === 'approval_modal') {
        const approver = payload.view.state.values.approver_block.approver_select.selected_user;
        const approvalText = payload.view.state.values.text_block.approval_text.value;

        console.log("Approver ID:", approver);

        try {
            // Send a message to the approver
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

            // Add the approval to the database
            addApproval({
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
            // Check if the requester is the same as the user who performed the action
            if (requester === payload.user.id) {
                await slackApp.client.chat.postMessage({
                    channel: payload.channel.id,
                    text: `You cannot ${actionText} your own request.`,
                });
            } else {
                // Update the message with the approval status
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

                // Send a message to the requester
                await slackApp.client.chat.postMessage({
                    channel: requester,
                    text: `Your approval request has been ${actionText} by <@${payload.user.id}>.`
                });

                // Update the approval status in the database
                updateApprovalStatus(requester, payload.message.blocks[0].text.text.split(": ")[1], actionText);
            }
        } catch (error) {
            console.error('Error processing approval action:', error.response ? error.response.data : error.message);
        }
    }

    res.send('');
};
