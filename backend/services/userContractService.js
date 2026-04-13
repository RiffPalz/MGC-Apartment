import Contract from "../models/contract.js";
import Unit from "../models/unit.js";
import User from "../models/user.js";

const getViewUrl = (storedUrl) => storedUrl || null;
const getDownloadUrl = (storedUrl) => storedUrl || null;

export const getUserContracts = async (userId) => {
  const contracts = await Contract.findAll({
    include: [
      {
        model: User,
        as: "tenants",
        required: true,
        where: { ID: userId },
        attributes: [],
      },
      {
        model: Unit,
        as: "unit",
        attributes: ["unit_number", "floor"],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  return contracts.map((c) => {
    const json = c.toJSON();
    json.contract_file = getViewUrl(json.contract_file);
    json.contract_file_download = getDownloadUrl(c.contract_file);
    return json;
  });
};
