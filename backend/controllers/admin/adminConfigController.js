import { getConfig, updateConfig } from "../../services/admin/adminConfigService.js";

export const getConfigController = async (req, res) => {
  try {
    const config = await getConfig();
    return res.status(200).json({ success: true, config });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateConfigController = async (req, res) => {
  try {
    const config = await updateConfig(req.body, req.files ?? {}, req.admin?.id);
    return res.status(200).json({ success: true, config });
  } catch (error) {
    if (error.status === 422) {
      return res.status(422).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};
