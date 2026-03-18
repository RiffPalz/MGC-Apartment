import { getUserContracts } from "../services/userContractService.js";

export const getUserContractsController = async (req, res) => {
  try {
    const userId = req.auth.id;

    const contracts = await getUserContracts(userId);

    return res.status(200).json({
      success: true,
      count: contracts.length,
      contracts,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch contracts",
    });
  }
};