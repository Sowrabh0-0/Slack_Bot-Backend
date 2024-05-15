import slackApp from '../app.js';

// Function to handle incoming messages
export const handleMessage = async ({ event, client }) => {
    try {
        // Check if the event is not a subtype or a bot message
        if (event.subtype === undefined || event.subtype === 'bot_message') {
            // Post a message to the channel with the text of the incoming message
            await client.chat.postMessage({
                channel: event.channel,
                text: `You said: ${event.text}`
            });
        }
    } catch (error) {
        console.error('Error posting message:', error);
    }
};
