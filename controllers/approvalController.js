const approvalHistory = [];

export const getApprovals = (req, res) => {
  res.json(approvalHistory);
};

export const addApproval = (approval) => {
  approvalHistory.push(approval);
};

export const updateApprovalStatus = (requestedBy, message, status) => {
  const approval = approvalHistory.find(a => a.requestedBy === requestedBy && a.message === message);
  if (approval) {
    approval.status = status.charAt(0).toUpperCase() + status.slice(1);
    approval.approvedOn = new Date().toLocaleString();
  }
};
