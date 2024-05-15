import axios from 'axios';

export const getUserInfo = async (req, res) => {
    const accessToken = process.env.SLACK_ACCESS_TOKEN;

    try {
        // Fetch user information from Slack API
        const userInfoResponse = await axios.get('https://slack.com/api/users.profile.get', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        console.log('User info response:', userInfoResponse.data);

        // Fetch workspace information from Slack API
        const workspaceInfoResponse = await axios.get('https://slack.com/api/team.info', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        console.log('Workspace info response:', workspaceInfoResponse.data);

        if (userInfoResponse.data.ok && workspaceInfoResponse.data.ok) {
            const userInfo = userInfoResponse.data.profile;
            const workspaceInfo = workspaceInfoResponse.data.team;

            // Send user information as JSON response
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
};
