import cron from "node-cron";
import { Op } from "sequelize";

import Contract from "../models/contract.js";
import Payment from "../models/payment.js";
import User from "../models/user.js";
import Unit from "../models/unit.js";
import { sendSMS, sendSMSBulk } from "./sms.js";
import { sms } from "./smsTemplates.js";
import { createNotification } from "../services/notificationService.js";

export const startSystemCron = () => {
  // Runs every day at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("Running system cron tasks...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];
    const day = today.getDate();

    // ── 1. AUTO-EXPIRE contracts whose end_date has passed ──────────────────
    // Covers both natural expiry AND early termination (vacate_date was set as end_date on approval)
    const expiredContracts = await Contract.findAll({
      where: {
        status: "Active",
        end_date: { [Op.lte]: todayStr },
      },
      include: [
        { model: Unit, as: "unit", attributes: ["ID", "unit_number"] },
        {
          model: User,
          as: "tenants",
          attributes: ["ID", "fullName", "contactNumber"],
          through: { attributes: [] },
        },
      ],
    });

    for (const contract of expiredContracts) {
      await contract.update({ status: "Expired" });
      console.log(`[Cron] Contract ${contract.ID} (Unit ${contract.unit?.unit_number}) expired.`);

      const unitNumber = contract.unit?.unit_number ?? "";
      const endDate = contract.end_date;

      for (const tenant of contract.tenants) {
        // In-app notification
        await createNotification({
          userId: tenant.ID,
          role: "tenant",
          type: "contract expired",
          title: "Contract Expired",
          message: `Your contract for Unit ${unitNumber} has expired as of ${new Date(endDate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}.`,
          referenceId: contract.ID,
          referenceType: "contract",
        });
      }

      // Admin notification
      await createNotification({
        role: "admin",
        type: "contract expired",
        title: "Contract Expired",
        message: `Contract for Unit ${unitNumber} has expired as of ${new Date(endDate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}.`,
        referenceId: contract.ID,
        referenceType: "contract",
      });

      // SMS to tenants
      const tenantContacts = contract.tenants.map((t) => t.contactNumber).filter(Boolean);
      if (tenantContacts.length) {
        sendSMSBulk(tenantContacts, sms.contractExpired(unitNumber, endDate));
      }
    }

    // ── 2. DEACTIVATE tenants 3 days after contract Terminated OR Expired ───
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);
    const threeDaysAgoStr = threeDaysAgo.toISOString().split("T")[0];

    // Terminated: use termination_date
    const expiredTerminations = await Contract.findAll({
      where: {
        status: "Terminated",
        termination_date: { [Op.lte]: threeDaysAgoStr },
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
          console.log(`[Cron] Deactivated tenant ${tenant.ID} (${tenant.fullName}) — 3-day grace after termination.`);
        }
      }
    }

    // Expired: use end_date as the effective end
    const expiredGrace = await Contract.findAll({
      where: {
        status: "Expired",
        end_date: { [Op.lte]: threeDaysAgoStr },
      },
      include: [
        {
          model: User,
          as: "tenants",
          attributes: ["ID", "fullName", "contactNumber", "status"],
          through: { attributes: [] },
        },
      ],
    });

    for (const contract of expiredGrace) {
      for (const tenant of contract.tenants) {
        if (tenant.status !== "Declined") {
          await User.update({ status: "Declined" }, { where: { ID: tenant.ID } });
          console.log(`[Cron] Deactivated tenant ${tenant.ID} (${tenant.fullName}) — 3-day grace after expiry.`);
        }
      }
    }

    // ── 3. CONTRACT EXPIRY SMS REMINDERS (30 days & 5 days) ─────────────────
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
      const tenantContacts = contract.tenants.map((t) => t.contactNumber).filter(Boolean);
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

    // ── 4. GENERATE MONTHLY RENT BILLS ───────────────────────────────────────
    const activeContracts = await Contract.findAll({
      where: {
        start_date: { [Op.lte]: today },
        end_date: { [Op.gte]: today },
        status: "Active",
      },
    });

    for (const contract of activeContracts) {
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

    // ── 5. PAYMENT OVERDUE MARKING & SMS ─────────────────────────────────────
    const offsetDate = (days) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    const in3 = offsetDate(3);

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

    // Due in 3 days — reminder
    const dueSoonPayments = await Payment.findAll({
      where: { due_date: in3, status: "Unpaid" },
      include: paymentInclude,
    });
    for (const p of dueSoonPayments) {
      const contacts = p.contract?.tenants?.map((t) => t.contactNumber).filter(Boolean) ?? [];
      if (contacts.length) sendSMSBulk(contacts, sms.paymentDueSoon(p.category, p.due_date));
    }

    // Due today — alert
    const dueTodayPayments = await Payment.findAll({
      where: { due_date: todayStr, status: "Unpaid" },
      include: paymentInclude,
    });
    for (const p of dueTodayPayments) {
      const contacts = p.contract?.tenants?.map((t) => t.contactNumber).filter(Boolean) ?? [];
      if (contacts.length) sendSMSBulk(contacts, sms.paymentDueToday(p.category, p.due_date));
    }

    // Mark overdue and send SMS
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
