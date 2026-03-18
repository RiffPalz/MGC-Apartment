import Contract from "../models/contract.js";
import Unit from "../models/unit.js";
import User from "../models/user.js";

export const getUserContracts = async (userId) => {
  const contracts = await Contract.findAll({
    include: [
      {
        model: User,
        as: "tenants",
        required: true,
        where: { ID: userId },
        attributes: []
      },
      {
        model: Unit,
        as: "unit",
        attributes: ["unit_number", "floor"],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  return contracts;
};