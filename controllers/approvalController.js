import moment from 'moment-timezone';

let io;

export const initSocket = (socketIo) => {
    io = socketIo;

    io.on('connection', (socket) => {
        console.log('New client connected');
        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
};

const approvalHistory = [];

// Get all approvals
export const getApprovals = (req, res) => {
    res.json(approvalHistory);
};

// Add a new approval
export const addApproval = (approval) => {
    approvalHistory.push(approval);
    if (io) {
        io.emit('newApproval', approval); // Emit event to all connected clients
    }
};

// Update the status of an approval
export const updateApprovalStatus = (requestedBy, message, status) => {
    // Find the approval in the history based on the requestedBy and message
    const approval = approvalHistory.find(a => a.requestedBy === requestedBy && a.message === message);
    if (approval) {
        // Update the status and approvedOn date of the approval
        approval.status = status.charAt(0).toUpperCase() + status.slice(1);
        approval.approvedOn = moment().tz("Asia/Kolkata").format('M/D/YYYY, h:mm:ss A');
        if (io) {
            io.emit('updateApproval', approval); // Emit event to all connected clients
        }
    }
};
