import createDefaultAdmin from "../seeders/defaultAdmin.js";
import createDefaultCaretaker from "../seeders/defaultCaretaker.js";
import createDefaultUnits from "../seeders/defaultUnits.js";
import { createDefaultSystemConfig } from "../seeders/defaultSystemConfig.js";

const runSeeders = async () => {
  await createDefaultAdmin();
  await createDefaultCaretaker();
  await createDefaultUnits();
  await createDefaultSystemConfig();
};

export default runSeeders;