import cron from "node-cron";
import { Op } from "sequelize";

import Contract from "../models/contract.js";
import Payment from "../models/payment.js";
import User from "../models/user.js";
import Unit from "../models/unit.js";
import { sendSMS, sendSMSBulk } from "./sms.js";
import { sms } from "./smsTemplates.js";

export const startSystemCron = () => {
  // Runs every day at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("Running system cron tasks...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = today.getDate();

    // Deactivate tenants 3 days after contract termination
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    const expiredTerminations = await Contract.findAll({
      where: {
        status: "Terminated",
        termination_date: { [Op.lte]: threeDaysAgo.toISOString().split("T")[0] },
      },
      include: [
        { model: Unit, as: "unit", attributes: ["ID", "unit_number"] },
        {
          model: User,
          as: "tenants",
          attributes: ["ID", "fullName", "contactNumber", "status"],
          through: { attributes: [] },
        },
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

    // Auto-complete expired active contracts
    await Contract.update(
      { status: "Completed" },
      { where: { end_date: { [Op.lt]: today }, status: "Active" } }
    );

    // Contract expiry SMS reminders (30 days & 5 days)
    const in30 = new Date(today);
    in30.setDate(today.getDate() + 30);
    const in5 = new Date(today);
    in5.setDate(today.getDate() + 5);

    const expiringContracts = await Contract.findAll({
      where: {
        status: "Active",
        end_date: {
          [Op.in]: [
            in30.toISOString().split("T")[0],
            in5.toISOString().split("T")[0],
          ],
        },
      },
      include: [
        { model: Unit, as: "unit", attributes: ["unit_number"] },
        {
          model: User,
          as: "tenants",
          attributes: ["ID", "fullName", "contactNumber"],
          through: { attributes: [] },
        },
      ],
    });

    const staffUsers = await User.findAll({
      where: { role: { [Op.in]: ["admin", "caretaker"] } },
      attributes: ["contactNumber"],
    });
    const staffContacts = staffUsers.map((u) => u.contactNumber).filter(Boolean);

    for (const contract of expiringContracts) {
      const unitNumber = contract.unit?.unit_number ?? "";
      const endDate = contract.end_date;
      const diffDays = Math.ceil((new Date(endDate) - today) / (1000 * 60 * 60 * 24));
      const tenantContacts = contract.tenants.map((t) => t.contactNumber);
      const tenantNames = contract.tenants.map((t) => t.fullName).join(", ");

      if (diffDays === 30) {
        sendSMSBulk(tenantContacts, sms.contractExpiring30(unitNumber, endDate));
        sendSMSBulk(staffContacts, sms.contractExpiringSoon(unitNumber, tenantNames, 30, endDate));
      }

      if (diffDays === 5) {
        sendSMSBulk(tenantContacts, sms.contractExpiring5(unitNumber, endDate));
        sendSMSBulk(staffContacts, sms.contractExpiringSoon(unitNumber, tenantNames, 5, endDate));
      }
    }

    // Generate monthly rent bills
    const contracts = await Contract.findAll({
      where: {
        start_date: { [Op.lte]: today },
        end_date: { [Op.gte]: today },
        status: "Active",
      },
    });

    for (const contract of contracts) {
      const billingDay = new Date(contract.start_date).getDate();

      if (billingDay === day) {
        const billingMonth = new Date(today.getFullYear(), today.getMonth(), billingDay);

        const existing = await Payment.findOne({
          where: { contract_id: contract.ID, category: "Rent", billing_month: billingMonth },
        });

        if (!existing) {
          await Payment.create({
            contract_id: contract.ID,
            category: "Rent",
            billing_month: billingMonth,
            amount: contract.rent_amount,
            due_date: billingMonth,
          });

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

    // Mark overdue payments and send SMS notifications
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    // Helper: compute date string N days from today
    const offsetDate = (days) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    const in3 = offsetDate(3);

    // Fetch payments for SMS — only Unpaid/Overdue, with tenant contact info
    const paymentInclude = [{
      model: Contract,
      as: "contract",
      include: [{
        model: User,
        as: "tenants",
        attributes: ["contactNumber"],
        through: { attributes: [] },
      }],
    }];

    // 1. Due in 3 days — send reminder
    const dueSoonPayments = await Payment.findAll({
      where: { due_date: in3, status: "Unpaid" },
      include: paymentInclude,
    });
    for (const p of dueSoonPayments) {
      const contacts = p.contract?.tenants?.map((t) => t.contactNumber).filter(Boolean) ?? [];
      if (contacts.length) sendSMSBulk(contacts, sms.paymentDueSoon(p.category, p.due_date));
    }

    // 2. Due today — send due-now alert
    const dueTodayPayments = await Payment.findAll({
      where: { due_date: todayStr, status: "Unpaid" },
      include: paymentInclude,
    });
    for (const p of dueTodayPayments) {
      const contacts = p.contract?.tenants?.map((t) => t.contactNumber).filter(Boolean) ?? [];
      if (contacts.length) sendSMSBulk(contacts, sms.paymentDueToday(p.category, p.due_date));
    }

    // 3. Mark overdue (past due date, still Unpaid) and send overdue SMS
    const overduePayments = await Payment.findAll({
      where: { due_date: { [Op.lt]: todayStr }, status: "Unpaid" },
      include: paymentInclude,
    });
    for (const p of overduePayments) {
      p.status = "Overdue";
      await p.save();
      const contacts = p.contract?.tenants?.map((t) => t.contactNumber).filter(Boolean) ?? [];
      if (contacts.length) sendSMSBulk(contacts, sms.paymentOverdue(p.category, p.due_date));
    }

    console.log("Cron tasks completed");
  });
};
