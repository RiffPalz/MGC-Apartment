import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const ApplicationRequest = sequelize.define(
  "ApplicationRequest",
  {
    ID: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: { msg: "Full name is required" } },
    },
    emailAddress: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: { msg: "Please provide a valid email address" },
        notEmpty: { msg: "Email address is required" },
      },
    },
    contactNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Contact number is required" },
        len: { args: [7, 15], msg: "Contact number must be between 7 and 15 characters" },
      },
    },
    validID: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "Cloudinary URL of uploaded valid ID",
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "",
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: "is_read",
    },
  },
  {
    tableName: "application_requests",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [{ fields: ["created_at"] }],
  }
);

export default ApplicationRequest;
