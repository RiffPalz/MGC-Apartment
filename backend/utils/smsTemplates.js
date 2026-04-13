export const sms = {
  // Payment
  billCreated: (category, billingMonth) =>
    `MGC: A new ${category} bill for ${fmtMonth(billingMonth)} is ready. Log in to pay.`,

  paymentVerified: (category) =>
    `MGC: Your ${category} payment has been verified. Thank you!`,

  paymentPendingVerification: (tenantName, unitNumber, category) =>
    `MGC Admin: ${truncate(tenantName, 15)} (Unit ${unitNumber}) submitted ${category} receipt.`,

  // Maintenance
  maintenanceStatusUpdated: (title, status) =>
    `MGC: Your request "${truncate(title, 25)}" is now: ${status.toUpperCase()}.`,

  maintenanceSubmitted: (tenantName, unitNumber, title) =>
    `New Maintenance request from Unit ${unitNumber} (${truncate(tenantName, 15)}): "${truncate(title, 25)}"`,

  maintenanceEdited: (tenantName, unitNumber, title) =>
    `Maintenance request "${truncate(title, 25)}" from Unit ${unitNumber} (${truncate(tenantName, 15)}) has been updated by the tenant.`,

  // Contract
  contractCreated: (unitNumber) =>
    `MGC: Your contract for Unit ${unitNumber} is ready. Please log in to review.`,

  contractFileUploaded: (unitNumber) =>
    `MGC: Your contract PDF for Unit ${unitNumber} is now available for download.`,

  contractExpiring30: (unitNumber, endDate) =>
    `MGC: Your contract (Unit ${unitNumber}) expires in 30 days (${fmtDate(endDate)}).`,

  contractExpiring5: (unitNumber, endDate) =>
    `URGENT: MGC contract (Unit ${unitNumber}) expires in 5 days (${fmtDate(endDate)}).`,

  contractExpiringSoon: (unitNumber, tenantName, daysLeft) =>
    `Unit ${unitNumber} (${truncate(tenantName, 15)}) expires in ${daysLeft} days.`,

  contractRenewed: (unitNumber, newEndDate) =>
    `MGC: Your contract for Unit ${unitNumber} is renewed until ${fmtDate(newEndDate)}.`,

  contractTerminated: (unitNumber) =>
    `MGC: Your contract for Unit ${unitNumber} has been terminated. Contact the office.`,

  // Termination request
  terminationRequestSubmitted: (tenantName, unitNumber) =>
    `${truncate(tenantName, 15)} (Unit ${unitNumber}) submitted a termination request. Review in portal.`,

  terminationRequestApproved: (unitNumber, vacateDate) =>
    `MGC: Your termination request for Unit ${unitNumber} is approved. New end date: ${fmtDate(vacateDate)}.`,

  terminationRequestRejected: (unitNumber) =>
    `MGC: Your termination request for Unit ${unitNumber} was rejected. Contact management for details.`,

  // Announcement
  announcementPosted: (title, category) =>
    `MGC [${category}]: ${truncate(title, 60)}. Log in for details.`,

  // Account
  registrationReceived: (fullName) =>
    `Hi ${truncate(fullName, 20)}, your registration is received. Review takes 2-3 business days.`,

  accountApproved: (fullName) =>
    `Hi ${truncate(fullName, 20)}! Your MGC account is approved. You can now log in.`,

  accountDeclined: (fullName) =>
    `Hi ${truncate(fullName, 20)}, your account request was declined. Contact management.`,
};

// Helpers
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
    : "N/A";

const fmtMonth = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short" })
    : "N/A";

const truncate = (str, max) =>
  str && str.length > max ? `${str.slice(0, max)}...` : str;
