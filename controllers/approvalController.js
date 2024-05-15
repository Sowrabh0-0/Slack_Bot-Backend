const approvalHistory = [];

// Get all approvals
export const getApprovals = (req, res) => {
    res.json(approvalHistory);
};

// Add a new approval
export const addApproval = (approval) => {
    approvalHistory.push(approval);
};

// Update the status of an approval
export const updateApprovalStatus = (requestedBy, message, status) => {
    // Find the approval in the history based on the requestedBy and message
    const approval = approvalHistory.find(a => a.requestedBy === requestedBy && a.message === message);
    if (approval) {
        // Update the status and approvedOn date of the approval
        approval.status = status.charAt(0).toUpperCase() + status.slice(1);
        approval.approvedOn = new Date().toLocaleString();
    }
};
