import { sequelize } from "../config/database.js";
import "dotenv/config";

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to database.");

    const qi = sequelize.getQueryInterface();
    const tableDesc = await qi.describeTable("payments");

    if (!tableDesc.is_deleted) {
      await qi.addColumn("payments", "is_deleted", {
        type: "TINYINT(1)",
        allowNull: false,
        defaultValue: 0,
        after: "status",
      });
      console.log("✓ Added column: is_deleted");
    } else {
      console.log("— Column already exists: is_deleted");
    }

    if (!tableDesc.deleted_at) {
      await qi.addColumn("payments", "deleted_at", {
        type: "DATETIME",
        allowNull: true,
        after: "is_deleted",
      });
      console.log("✓ Added column: deleted_at");
    } else {
      console.log("— Column already exists: deleted_at");
    }

    console.log("\nMigration complete. You can now restart the server.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  }
};

run();
