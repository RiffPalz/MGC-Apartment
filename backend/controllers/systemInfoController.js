import { getSystemInfo, updateSystemInfo } from "../services/systemInfoService.js";

export const getSystemInfoController = async (req, res) => {
  try {
    const info = await getSystemInfo();
    return res.status(200).json({ success: true, systemInfo: info });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSystemInfoController = async (req, res) => {
  try {
    const info = await updateSystemInfo(req.body);
    return res.status(200).json({ success: true, message: "System info updated.", systemInfo: info });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
