import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import Contract from "./contract.js";
import User from "./user.js";

const ContractTenant = sequelize.define(
  "ContractTenant",
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
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: User, key: "ID" },
    },
  },
  {
    tableName: "contract_tenants",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      { unique: true, fields: ["contract_id", "user_id"] },
      { fields: ["contract_id"] },
      { fields: ["user_id"] },
    ],
  }
);

export default ContractTenant;
