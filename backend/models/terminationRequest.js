import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import Contract from "./contract.js";
import User from "./user.js";

const TerminationRequest = sequelize.define(
    "TerminationRequest",
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
        lessee_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        lessee_address: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        vacate_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        request_pdf: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
            allowNull: false,
            defaultValue: "Pending",
        },
    },
    {
        tableName: "termination_requests",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        indexes: [
            { fields: ["contract_id"] },
            { fields: ["user_id"] },
            { fields: ["status"] },
        ],
    }
);

export default TerminationRequest;
