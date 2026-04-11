import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import Unit from "./unit.js";

const Contract = sequelize.define(
    "Contract",
    {
        ID: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },

        unit_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
                model: Unit,
                key: "ID",
            },
        },

        rent_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0,
            },
        },

        start_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },

        end_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            validate: {
                isAfterStart(value) {
                    if (new Date(value) <= new Date(this.start_date)) {
                        throw new Error("End date must be after start date.");
                    }
                },
            },
        },

        status: {
            type: DataTypes.ENUM("Active", "Completed", "Terminated"),
            allowNull: false,
            defaultValue: "Active",
        },

        tenancy_rules: {
            type: DataTypes.TEXT,
            allowNull: false,
        },

        termination_renewal_conditions: {
            type: DataTypes.TEXT,
            allowNull: false,
        },

        contract_file: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },

        termination_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },

        termination_pdf: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    },
    {
        tableName: "contracts",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                fields: ["unit_id"],
            },
            {
                fields: ["status"],
            },
        ],
    }
);

export default Contract;