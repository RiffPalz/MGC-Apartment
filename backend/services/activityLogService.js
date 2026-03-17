import ActivityLog from "../models/activityLog.js";

/* CREATE ACTIVITY LOG */
export const createActivityLog = async ({
    userId = null,
    role,
    action,
    description,
    referenceId = null,
    referenceType = null
}) => {

    return await ActivityLog.create({
        user_id: userId,
        role,
        action,
        description,
        reference_id: referenceId,
        reference_type: referenceType
    });

};