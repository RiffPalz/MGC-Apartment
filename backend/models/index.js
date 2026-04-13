import Maintenance from "./maintenance.js";
import User from "./user.js";
import Unit from "./unit.js";
import Contract from "./contract.js";
import ContractTenant from "./contractTenant.js";
import Payment from "./payment.js";
import SystemConfig from "./systemConfig.js";
import SystemInfo from "./systemInfo.js";
import TerminationRequest from "./terminationRequest.js";

// User ↔ Maintenance
User.hasMany(Maintenance, { foreignKey: "userId", as: "maintenanceRequests" });
Maintenance.belongsTo(User, { foreignKey: "userId", as: "user" });

// Unit ↔ Contract
Unit.hasMany(Contract, { foreignKey: "unit_id", as: "contracts" });
Contract.belongsTo(Unit, { foreignKey: "unit_id", as: "unit" });

// Contract ↔ User (Many-to-Many)
Contract.belongsToMany(User, { through: ContractTenant, foreignKey: "contract_id", as: "tenants" });
User.belongsToMany(Contract, { through: ContractTenant, foreignKey: "user_id", as: "contracts" });

// Contract ↔ Payment
Contract.hasMany(Payment, { foreignKey: "contract_id", as: "payments" });
Payment.belongsTo(Contract, { foreignKey: "contract_id", as: "contract" });

// Contract ↔ TerminationRequest
Contract.hasMany(TerminationRequest, { foreignKey: "contract_id", as: "terminationRequests" });
TerminationRequest.belongsTo(Contract, { foreignKey: "contract_id", as: "contract" });

// User ↔ TerminationRequest
User.hasMany(TerminationRequest, { foreignKey: "user_id", as: "terminationRequests" });
TerminationRequest.belongsTo(User, { foreignKey: "user_id", as: "tenant" });

export {
  User,
  Maintenance,
  Unit,
  Contract,
  ContractTenant,
  Payment,
  SystemConfig,
  SystemInfo,
  TerminationRequest,
};
