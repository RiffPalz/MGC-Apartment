import Contract from "../models/contract.js";
import Unit from "../models/unit.js";
import User from "../models/user.js";
import { Op } from "sequelize";
import { createNotification } from "./notificationService.js";

const getViewUrl = (storedUrl) => storedUrl || null;
const getDownloadUrl = (storedUrl) => storedUrl || null;

/* Auto-expire any Active contracts whose end_date has passed.
   Called on every contract fetch so status is always accurate,
   regardless of when the nightly cron last ran. */
const autoExpireContracts = async (contractIds) => {
  if (!contractIds.length) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const toExpire = await Contract.findAll({
    where: {
      ID: { [Op.in]: contractIds },
      status: "Active",
      end_date: { [Op.lte]: todayStr },
    },
    include: [
      { model: Unit, as: "unit", attributes: ["unit_number"] },
      { model: User, as: "tenants", attributes: ["ID", "fullName"], through: { attributes: [] } },
    ],
  });

  for (const contract of toExpire) {
    await contract.update({ status: "Expired" });

    const unitNumber = contract.unit?.unit_number ?? "";
    const endDate = contract.end_date;
    const fmtDate = (d) =>
      new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

    for (const tenant of contract.tenants) {
      await createNotification({
        userId: tenant.ID,
        role: "tenant",
        type: "contract expired",
        title: "Contract Expired",
        message: `Your contract for Unit ${unitNumber} has expired as of ${fmtDate(endDate)}.`,
        referenceId: contract.ID,
        referenceType: "contract",
      });
    }

    await createNotification({
      role: "admin",
      type: "contract expired",
      title: "Contract Expired",
      message: `Contract for Unit ${unitNumber} has expired as of ${fmtDate(endDate)}.`,
      referenceId: contract.ID,
      referenceType: "contract",
    });

    console.log(`[Auto-Expire] Contract ${contract.ID} (Unit ${unitNumber}) marked Expired.`);
  }
};

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

  // Auto-expire before returning — ensures status is always current
  await autoExpireContracts(contracts.map((c) => c.ID));

  // Re-fetch after potential status update so the response reflects the new status
  const fresh = await Contract.findAll({
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

  return fresh.map((c) => {
    const json = c.toJSON();
    json.contract_file = getViewUrl(json.contract_file);
    json.contract_file_download = getDownloadUrl(c.contract_file);
    return json;
  });
};
