import { Router, Request, Response } from "express";
import multer from "multer";
import { analyzePortfolio } from "../utils/portfolio-analyzer";

// Create router
const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * API endpoint to upload and analyze portfolio data
 * Accepts CSV, Excel, or other portfolio export formats from various brokers
 */
router.post("/analyze", upload.single("file"), async (req: Request, res: Response) => {
  try {
    // Verify file and broker type are provided
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const brokerType = req.body.brokerType;
    if (!brokerType) {
      return res.status(400).json({ message: "Broker type is required" });
    }

    // Get file buffer and convert to string
    const fileContent = req.file.buffer.toString("utf-8");

    // Analyze the portfolio
    const analysisResult = analyzePortfolio(fileContent, brokerType);

    // Return the analysis results
    return res.status(200).json(analysisResult);
  } catch (error) {
    console.error("Error analyzing portfolio:", error);
    return res.status(500).json({ 
      message: "Failed to analyze portfolio data",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * API endpoint to fetch a list of supported brokers
 */
router.get("/supported-brokers", (req: Request, res: Response) => {
  // List of supported brokers with their status
  const supportedBrokers = [
    { id: "zerodha", name: "Zerodha", status: "active" },
    { id: "groww", name: "Groww", status: "active" },
    { id: "upstox", name: "Upstox", status: "active" },
    { id: "angel", name: "Angel One", status: "active" },
    { id: "hdfc", name: "HDFC Securities", status: "active" },
    { id: "icici", name: "ICICI Direct", status: "active" },
    { id: "5paisa", name: "5Paisa", status: "coming_soon" },
    { id: "kotak", name: "Kotak Securities", status: "coming_soon" },
    { id: "manual", name: "Manual Portfolio (Excel/CSV)", status: "active" }
  ];
  
  return res.status(200).json(supportedBrokers);
});

export default router;