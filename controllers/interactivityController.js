import slackApp from '../app.js';
import { addApproval, updateApprovalStatus } from './approvalController.js';

export const handleInteractivity = async (req, res) => {
    const payload = JSON.parse(req.body.payload);

    if (payload.type === 'view_submission' && payload.view.callback_id === 'approval_modal') {
        const approverId = payload.view.state.values.approver_block.approver_select.selected_user;
        const approvalText = payload.view.state.values.text_block.approval_text.value;
        const requesterId = payload.user.id;

        try {
            // Fetch the requester's information
            const requesterInfoResponse = await slackApp.client.users.info({ user: requesterId });
            const requesterName = requesterInfoResponse.user.profile.display_name || requesterInfoResponse.user.real_name;

            // Fetch the approver's information
            const approverInfoResponse = await slackApp.client.users.info({ user: approverId });
            const approverName = approverInfoResponse.user.profile.display_name || approverInfoResponse.user.real_name;

            // Send a message to the approver
            await slackApp.client.chat.postMessage({
                channel: approverId,
                text: `Approval Request from ${requesterName}: ${approvalText}`,
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `Approval Request from ${requesterName}: ${approvalText}`
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
                requestedBy: requesterName, // Use name instead of ID
                approvedBy: approverName // Use name instead of ID
            });

        } catch (error) {
            console.error('Error sending approval request:', error.response ? error.response.data : error.message);
        }
    } else if (payload.type === 'block_actions') {
        const action = payload.actions[0];
        const actionText = action.value === 'approve' ? 'approved' : 'rejected';

        // Extract requester name from the message text
        const messageText = payload.message.text;
        const requesterNameMatch = messageText.match(/Approval Request from (.*?):/);
        if (!requesterNameMatch || !requesterNameMatch[1]) {
            console.error('Error extracting requester name from message text:', messageText);
            res.status(500).send('Error extracting requester name from message text');
            return;
        }
        const requesterName = requesterNameMatch[1];

        try {
            // Fetch the action performer's information
            const performerInfoResponse = await slackApp.client.users.info({ user: payload.user.id });
            const performerName = performerInfoResponse.user.profile.display_name || performerInfoResponse.user.real_name;

            // Check if the requester is the same as the user who performed the action
            if (requesterName === performerName) {
                await slackApp.client.chat.postMessage({
                    channel: payload.channel.id,
                    text: `You cannot ${actionText} your own request.`,
                });
            } else {
                // Update the message with the approval status
                await slackApp.client.chat.update({
                    channel: payload.channel.id,
                    ts: payload.message.ts,
                    text: `Approval Request from ${requesterName}: ${payload.message.blocks[0].text.text.split(": ")[1]}`,
                    blocks: [
                        {
                            type: 'section',
                            text: {
                                type: 'mrkdwn',
                                text: `Approval Request from ${requesterName}: ${payload.message.blocks[0].text.text.split(": ")[1]}`
                            }
                        },
                        {
                            type: 'context',
                            elements: [
                                {
                                    type: 'mrkdwn',
                                    text: `:white_check_mark: This request has been ${actionText} by ${performerName}.`
                                }
                            ]
                        }
                    ]
                });

                // Send a message to the requester
                await slackApp.client.chat.postMessage({
                    channel: payload.user.id,
                    text: `Your approval request has been ${actionText} by ${performerName}.`
                });

                // Update the approval status in the database
                updateApprovalStatus(requesterName, payload.message.blocks[0].text.text.split(": ")[1], actionText);
            }
        } catch (error) {
            console.error('Error processing approval action:', error.response ? error.response.data : error.message);
        }
    }

    res.send('');
};
