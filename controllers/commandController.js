import slackApp from '../app.js';

export const handleCommand = async (req, res) => {
  const { command, user_id, response_url, trigger_id } = req.body;

  if (command === '/approval-test') {
    try {
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
              }
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
      console.error('Error opening modal:', error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.status(400).send('Unknown command');
  }
};
