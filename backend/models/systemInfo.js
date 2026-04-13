import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const SystemInfo = sequelize.define(
  "SystemInfo",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    systemName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "MGC Building Management System",
    },
    version: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "1.0.0",
    },
    contactEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "mgcbuilding762@gmail.com",
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: "762 F. Gomez St., Barangay Ibaba, Santa Rosa, Laguna",
    },
  },
  {
    tableName: "system_info",
    timestamps: true,
  }
);

export default SystemInfo;
