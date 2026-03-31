/**
 * SMS templates for MGC Building.
 * Keep messages short when possible.
 */

export const sms = {
  /* PAYMENT */

  // New bill created
  billCreated: (category, billingMonth) =>
    `MGC Building: A new ${category} bill for ${fmtMonth(billingMonth)} has been generated. Please log in to view the details.`,

  // Payment verified
  paymentVerified: (category) =>
    `MGC Building: Your ${category} payment has been verified and marked as Paid. Thank you!`,

  // Receipt submitted for verification
  paymentPendingVerification: (tenantName, unitNumber, category) =>
    `MGC Building: ${tenantName} (Unit ${unitNumber}) submitted a ${category} receipt. Please verify the payment.`,

  /* MAINTENANCE */

  // Maintenance status updated
  maintenanceStatusUpdated: (title, status) =>
    `MGC Building: Your maintenance request "${truncate(title, 40)}" is now ${status}.`,

  // New maintenance request
  maintenanceSubmitted: (tenantName, unitNumber, title) =>
    `MGC Building: New maintenance request from ${tenantName} (Unit ${unitNumber}): "${truncate(title, 40)}".`,

  /* CONTRACT */

  // Contract created
  contractCreated: (unitNumber) =>
    `MGC Building: Your tenancy contract for Unit ${unitNumber} has been created. Log in to review it.`,

  // Contract file uploaded
  contractFileUploaded: (unitNumber) =>
    `MGC Building: Your contract PDF for Unit ${unitNumber} is now available. Log in to view or download it.`,

  // Contract expires in 30 days
  contractExpiring30: (unitNumber, endDate) =>
    `MGC Building: Your contract for Unit ${unitNumber} expires on ${fmtDate(endDate)} (30 days). Please contact management for renewal.`,

  // Contract expires in 5 days
  contractExpiring5: (unitNumber, endDate) =>
    `MGC Building: REMINDER - Your contract for Unit ${unitNumber} expires on ${fmtDate(endDate)} (5 days). Act now to avoid disruption.`,

  // Contract expiring soon
  contractExpiringSoon: (unitNumber, tenantName, daysLeft, endDate) =>
    `MGC Building: Contract for Unit ${unitNumber} (${tenantName}) expires in ${daysLeft} day(s) on ${fmtDate(endDate)}.`,

  // Contract renewed
  contractRenewed: (unitNumber, newEndDate) =>
    `MGC Building: Your contract for Unit ${unitNumber} has been renewed until ${fmtDate(newEndDate)}.`,

  // Contract terminated
  contractTerminated: (unitNumber) =>
    `MGC Building: Your contract for Unit ${unitNumber} has been terminated. Please contact management for details.`,

  /* ANNOUNCEMENT */

  // New announcement posted
  announcementPosted: (title, category) =>
    `MGC Building [${category}]: ${truncate(title, 100)}. Log in to read the full announcement.`,

  /* REGISTRATION & ACCOUNT */

  // Registration received
  registrationReceived: (fullName) =>
    `MGC Building: Hi ${truncate(fullName, 30)}, your registration has been received. Please wait 2-3 business days for account approval.`,

  // Account approved
  accountApproved: (fullName) =>
    `MGC Building: Good news, ${truncate(fullName, 30)}! Your account has been approved. You can now log in to the tenant portal.`,

  // Account declined
  accountDeclined: (fullName) =>
    `MGC Building: Hi ${truncate(fullName, 30)}, your account request has been declined. Please contact management for more information.`,
};

/* HELPERS */

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    : "N/A";

const fmtMonth = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
    })
    : "N/A";

const truncate = (str, max) =>
  str && str.length > max ? `${str.slice(0, max)}…` : str;