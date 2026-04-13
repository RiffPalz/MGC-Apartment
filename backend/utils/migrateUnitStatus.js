import dotenv from "dotenv";
dotenv.config();

import { sequelize } from "../config/database.js";
import { QueryTypes } from "sequelize";

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log("DB connected.");

    const queryInterface = sequelize.getQueryInterface();
    const tableDesc = await queryInterface.describeTable("units");

    if (tableDesc.status) {
      console.log("`status` column already exists. Nothing to do.");
    } else {
      await sequelize.query(
        `ALTER TABLE units ADD COLUMN status ENUM('Vacant','Occupied','Under Maintenance','Disabled') NOT NULL DEFAULT 'Vacant'`,
        { type: QueryTypes.RAW }
      );
      console.log("`status` column added successfully.");

      const [updated] = await sequelize.query(
        `UPDATE units SET status = 'Disabled' WHERE is_active = 0`,
        { type: QueryTypes.RAW }
      );
      console.log(`Back-filled ${updated} disabled units.`);
    }
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

run();
