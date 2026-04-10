import cron from "node-cron";
import { Op } from "sequelize";

import Contract from "../models/contract.js";
import Payment from "../models/payment.js";
import User from "../models/user.js";
import Unit from "../models/unit.js";
import ContractTenant from "../models/contractTenant.js";
import { sendSMS, sendSMSBulk } from "./sms.js";
import { sms } from "./smsTemplates.js";

export const startSystemCron = () => {

  // Runs every day at midnight
  cron.schedule("0 0 * * *", async () => {

    console.log("Running system cron tasks...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const day = today.getDate();

    /* ── Post-termination cleanup: deactivate tenants after 3 days ── */
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    const expiredTerminations = await Contract.findAll({
      where: {
        status: "Terminated",
        termination_date: { [Op.lte]: threeDaysAgo.toISOString().split("T")[0] },
      },
      include: [
        { model: Unit, as: "unit", attributes: ["ID", "unit_number"] },
        { model: User, as: "tenants", attributes: ["ID", "fullName", "contactNumber", "status"], through: { attributes: [] } },
      ],
    });

    for (const contract of expiredTerminations) {
      for (const tenant of contract.tenants) {
        if (tenant.status !== "Declined") {
          await User.update({ status: "Declined" }, { where: { ID: tenant.ID } });
          console.log(`[Cron] Deactivated tenant ${tenant.ID} (${tenant.fullName}) after 3-day grace period.`);
        }
      }
    }

    /* ── Contract expiration: auto-complete ── */
    await Contract.update(
      { status: "Completed" },
      { where: { end_date: { [Op.lt]: today }, status: "Active" } }
    );

    /* ── Contract expiry SMS reminders (30 days & 5 days) ── */
    const in30 = new Date(today); in30.setDate(today.getDate() + 30);
    const in5  = new Date(today); in5.setDate(today.getDate() + 5);

    const expiringContracts = await Contract.findAll({
      where: {
        status: "Active",
        end_date: { [Op.in]: [
          in30.toISOString().split("T")[0],
          in5.toISOString().split("T")[0],
        ]},
      },
      include: [
        { model: Unit, as: "unit", attributes: ["unit_number"] },
        { model: User, as: "tenants", attributes: ["ID", "fullName", "contactNumber"], through: { attributes: [] } },
      ],
    });

    // Fetch admin & caretaker contacts once
    const staffUsers = await User.findAll({
      where: { role: { [Op.in]: ["admin", "caretaker"] } },
      attributes: ["contactNumber"],
    });
    const staffContacts = staffUsers.map((u) => u.contactNumber).filter(Boolean);

    for (const contract of expiringContracts) {
      const unitNumber = contract.unit?.unit_number ?? "";
      const endDate    = contract.end_date;
      const diffDays   = Math.ceil((new Date(endDate) - today) / (1000 * 60 * 60 * 24));
      const tenantContacts = contract.tenants.map((t) => t.contactNumber);
      const tenantNames    = contract.tenants.map((t) => t.fullName).join(", ");

      if (diffDays === 30) {
        // Tenant SMS
        sendSMSBulk(tenantContacts, sms.contractExpiring30(unitNumber, endDate));
        // Admin/Caretaker SMS
        sendSMSBulk(staffContacts, sms.contractExpiringSoon(unitNumber, tenantNames, 30, endDate));
      }

      if (diffDays === 5) {
        // Tenant SMS
        sendSMSBulk(tenantContacts, sms.contractExpiring5(unitNumber, endDate));
        // Admin/Caretaker SMS
        sendSMSBulk(staffContacts, sms.contractExpiringSoon(unitNumber, tenantNames, 5, endDate));
      }
    }

    /* ── Generate monthly rent bill ── */
    const contracts = await Contract.findAll({
      where: {
        start_date: { [Op.lte]: today },
        end_date:   { [Op.gte]: today },
        status: "Active",
      },
    });

    for (const contract of contracts) {

      const billingDay = new Date(contract.start_date).getDate();

      if (billingDay === day) {

        const billingMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          billingDay
        );

        const existing = await Payment.findOne({
          where: { contract_id: contract.ID, category: "Rent", billing_month: billingMonth },
        });

        if (!existing) {
          await Payment.create({
            contract_id:   contract.ID,
            category:      "Rent",
            billing_month: billingMonth,
            amount:        contract.rent_amount,
            due_date:      billingMonth,
          });

          // SMS → tenants for auto-generated rent bill
          const tenants = await User.findAll({
            include: [{
              model: Contract,
              as: "contracts",
              where: { ID: contract.ID },
              through: { attributes: [] },
              required: true,
            }],
            attributes: ["contactNumber"],
          });
          sendSMSBulk(tenants.map((t) => t.contactNumber), sms.billCreated("Rent", billingMonth));

          console.log(`Rent bill created for contract ${contract.ID}`);
        }
      }
    }

    /* ── Mark overdue payments ── */
    await Payment.update(
      { status: "Overdue" },
      { where: { due_date: { [Op.lt]: today }, status: "Unpaid" } }
    );

    console.log("Cron tasks completed");
  });

};
