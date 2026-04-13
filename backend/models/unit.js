import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Unit = sequelize.define(
  "Unit",
  {
    ID: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    unit_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    floor: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    max_capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2,
      validate: { min: 1 },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    status: {
      type: DataTypes.ENUM("Vacant", "Occupied", "Under Maintenance", "Disabled"),
      allowNull: false,
      defaultValue: "Vacant",
    },
  },
  {
    tableName: "units",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Unit;
