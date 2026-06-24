import { sequelize } from "../config/database.js";
import { QueryTypes } from "sequelize";

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to database");

    const rows = await sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :dbName AND TABLE_NAME = 'users' AND COLUMN_NAME = 'sex'",
      { replacements: { dbName: process.env.DB_NAME }, type: QueryTypes.SELECT }
    );

    if (rows.length > 0) {
      await sequelize.query("ALTER TABLE users DROP COLUMN sex");
      console.log("Dropped column 'sex' from users table");
    } else {
      console.log("Column 'sex' does not exist — nothing to do");
    }

    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

run();
