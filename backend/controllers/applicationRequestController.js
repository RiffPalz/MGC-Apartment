import { createApplicationRequest, checkApplicationStatus } from "../services/applicationRequestService.js";


/* SUBMIT APPLICATION REQUEST */
export const submitApplicationRequestController = async (req, res) => {
    try {

        const {
            fullName,
            emailAddress,
            contactNumber,
            message
        } = req.body;

        const validID = req.file?.path;

        const application = await createApplicationRequest({
            fullName,
            emailAddress,
            contactNumber,
            validID,
            message
        });

        return res.status(201).json({
            success: true,
            message: "Application request submitted successfully",
            application
        });

    } catch (error) {
        console.error("Submit Application Error:", error);
        return res.status(400).json({
            success: false,
            message: error.message
        });

    }
};

/* CHECK APPLICATION STATUS */
export const checkApplicationStatusController = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ success: false, message: "Email is required" });

        const result = await checkApplicationStatus(email);
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        return res.status(404).json({ success: false, message: error.message });
    }
};