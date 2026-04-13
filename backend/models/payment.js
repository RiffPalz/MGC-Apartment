import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import Contract from "./contract.js";

const Payment = sequelize.define(
  "Payment",
  {
    ID: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    contract_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: Contract, key: "ID" },
    },
    category: {
      type: DataTypes.ENUM("Rent", "Utilities"),
      allowNull: false,
    },
    billing_month: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    payment_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    receipt_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    paymentType: {
      type: DataTypes.ENUM("Cash", "GCash"),
      allowNull: true,
    },
    referenceNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    arNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    utility_bill_file: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("Unpaid", "Pending Verification", "Paid", "Overdue"),
      allowNull: false,
      defaultValue: "Unpaid",
    },
  },
  {
    tableName: "payments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["contract_id"] },
      { fields: ["status"] },
      { fields: ["billing_month"] },
    ],
  }
);

export default Payment;
