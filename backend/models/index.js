import Maintenance from "./maintenance.js";
import User from "./user.js";
import Unit from "./unit.js";
import Contract from "./contract.js";
import ContractTenant from "./contractTenant.js";
import Payment from "./payment.js";
import SystemConfig from "./systemConfig.js";

/* User ↔ Maintenance */
User.hasMany(Maintenance, {
  foreignKey: "userId",
  as: "maintenanceRequests",
});

Maintenance.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

/* Unit ↔ Contract */
Unit.hasMany(Contract, {
  foreignKey: "unit_id",
  as: "contracts",
});

Contract.belongsTo(Unit, {
  foreignKey: "unit_id",
  as: "unit",
});

/* Contract ↔ User (Many-to-Many) */
Contract.belongsToMany(User, {
  through: ContractTenant,
  foreignKey: "contract_id",
  as: "tenants",
});

User.belongsToMany(Contract, {
  through: ContractTenant,
  foreignKey: "user_id",
  as: "contracts",
});

/* Contract ↔ Payments */
Contract.hasMany(Payment, {
  foreignKey: "contract_id",
  as: "payments",
});

Payment.belongsTo(Contract, {
  foreignKey: "contract_id",
  as: "contract",
});

export {
  User,
  Maintenance,
  Unit,
  Contract,
  ContractTenant,
  Payment,
  SystemConfig,
};