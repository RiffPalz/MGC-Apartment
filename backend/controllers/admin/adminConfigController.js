import { getConfig, updateConfig } from "../../services/admin/adminConfigService.js";

/* GET CONFIG */
export const getConfigController = async (req, res) => {
  try {
    const config = await getConfig();
    return res.status(200).json({ success: true, config });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* UPDATE CONFIG */
export const updateConfigController = async (req, res) => {
  try {
    const config = await updateConfig(req.body, req.files ?? {});
    return res.status(200).json({ success: true, config });
  } catch (error) {
    if (error.status === 422) {
      return res.status(422).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};
