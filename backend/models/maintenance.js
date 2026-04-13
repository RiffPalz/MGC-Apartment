import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Maintenance = sequelize.define(
  "Maintenance",
  {
    ID: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM(
        "Electrical Maintenance",
        "Water Interruptions",
        "Floor Renovation",
        "Other"
      ),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    dateRequested: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("Pending", "Approved", "In Progress", "Done"),
      allowNull: false,
      defaultValue: "Pending",
    },
    followedUp: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "maintenance_requests",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Maintenance;
