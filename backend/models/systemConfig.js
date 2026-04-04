import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const SystemConfig = sequelize.define(
    "SystemConfig",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        mgc_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        address: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        monthly_rate: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        monthly_rate_description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        deposit_terms: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        deposit_terms_description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        gallery_images: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
        },
    },
    {
        tableName: "system_configs",
        timestamps: true,
    }
);

export default SystemConfig;
