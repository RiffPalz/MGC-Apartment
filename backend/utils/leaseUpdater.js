import User from "../models/user.js";
import { Op } from "sequelize";

export const updateExpiredLeases = async () => {
  const today = new Date().toISOString().split("T")[0];

  await User.update(
    { leaseStatus: "Expired" },
    {
      where: {
        leaseStatus: "Active",
        leaseEndDate: { [Op.lt]: today },
      },
    }
  );
};
