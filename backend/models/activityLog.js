import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const ActivityLog = sequelize.define(
  "ActivityLog",
  {
    ID: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM("admin", "caretaker", "tenant"),
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reference_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    reference_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    tableName: "activity_logs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

export default ActivityLog;
