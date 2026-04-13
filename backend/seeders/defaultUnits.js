import Unit from "../models/unit.js";

const createDefaultUnits = async () => {
  try {
    const existingUnits = await Unit.count();

    if (existingUnits > 0) {
      console.log("Units already initialized.");
      return;
    }

    const floorConfig = {
      1: [101, 102, 103, 104, 105, 106, 107],
      2: [201, 202, 203, 204, 205, 206],
      3: [301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316],
      4: [401, 402, 403, 404, 405, 406, 407, 408],
    };

    const units = [];
    for (const floor in floorConfig) {
      floorConfig[floor].forEach((unitNumber) => {
        units.push({ unit_number: unitNumber, floor: parseInt(floor), max_capacity: 2 });
      });
    }

    await Unit.bulkCreate(units);
    console.log("Default units seeded successfully.");
  } catch (error) {
    console.error("Unit seeding failed:", error.message);
  }
};

export default createDefaultUnits;
