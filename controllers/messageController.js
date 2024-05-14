import slackApp from '../app.js';

export const handleMessage = async ({ event, client }) => {
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
};
