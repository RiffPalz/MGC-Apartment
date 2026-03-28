import ApplicationRequest from "../models/applicationRequest.js";
import User from "../models/user.js";
import { sendMail } from "../utils/mailer.js";
import { applicationReceivedTemplate } from "../utils/emailTemplate.js";
import { createNotification } from "../services/notificationService.js";


/* CREATE APPLICATION REQUEST */
export const createApplicationRequest = async ({
    fullName,
    emailAddress,
    contactNumber,
    validID,
    message
}) => {

    if (!fullName || !emailAddress || !contactNumber || !validID) {
        throw new Error("All required fields must be provided");
    }

    const application = await ApplicationRequest.create({
        fullName,
        emailAddress,
        contactNumber,
        validID,
        message
    });

    /* SEND CONFIRMATION EMAIL */
    await sendMail({
        to: emailAddress,
        subject: "Application Received - MGC Building",
        html: applicationReceivedTemplate(fullName)
    });

    /* NOTIFY ADMIN */
    await createNotification({
        role: "admin",
        type: "application request",
        title: "New Application Request",
        message: `${fullName} (${emailAddress}) submitted an application request.`,
        referenceId: application.ID,
        referenceType: "application"
    });

    return application;
};


/* CHECK APPLICATION STATUS BY EMAIL — registered users only */
export const checkApplicationStatus = async (email) => {
    const user = await User.findOne({ where: { emailAddress: email, role: "tenant" } });

    if (!user) {
        throw new Error("No registered account found with this email address.");
    }

    return {
        found: true,
        type: "account",
        fullName: user.fullName,
        status: user.status,
        submittedAt: user.created_at,
    };
};
