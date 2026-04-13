import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Announcement = sequelize.define(
  "Announcement",
  {
    ID: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    announcementTitle: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    announcementMessage: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM("Electrical", "Water", "Renovation", "General"),
      allowNull: false,
      defaultValue: "General",
    },
    createdBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
  },
  {
    tableName: "announcements",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Announcement;
