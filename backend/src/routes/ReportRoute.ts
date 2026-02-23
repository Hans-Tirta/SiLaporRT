import { Router } from "express";
import ReportController from "../controllers/ReportController";
import { authenticateJWT } from "../middleware/AuthMiddleware";

const router = Router();

// === CORE REPORT ROUTES ===
router.get("/", authenticateJWT, ReportController.getAllReports);
router.get("/get-recent", authenticateJWT, ReportController.getRecentReports);
router.get("/my-reports", authenticateJWT, ReportController.getUserReports);
router.get(
  "/my-reports/stats",
  authenticateJWT,
  ReportController.getUserReportStatistics,
);
router.get("/all-reports/stats", ReportController.getAllReportsStatistics);
router.get("/:reportId", ReportController.getReportById);

router.post("/add", authenticateJWT, ReportController.createReport);
router.post("/generate/category", ReportController.generateReportCategory);

// === USER REPORT MANAGEMENT ===
router.delete("/:reportId", authenticateJWT, ReportController.deleteReport);
router.put(
  "/:reportId/visibility",
  authenticateJWT,
  ReportController.toggleReportVisibility,
);

// === COMMUNITY INTERACTION ROUTES ===
router.post("/:reportId/comment", authenticateJWT, ReportController.addComment);
router.put("/:reportId/upvote", authenticateJWT, ReportController.toggleUpvote);
router.get(
  "/:reportId/upvote-status",
  authenticateJWT,
  ReportController.getUserUpvoteStatus,
);

// === ADMIN/RT ROUTES ===
router.put("/:reportId/status", authenticateJWT, ReportController.updateStatus);
router.post(
  "/:reportId/response",
  authenticateJWT,
  ReportController.addOfficialResponse,
);
router.put(
  "/:reportId/update-status",
  authenticateJWT,
  ReportController.updateReportStatus,
);

// === FILTERING ROUTES ===
router.get(
  "/category/:category",
  authenticateJWT,
  ReportController.getReportsByCategory,
);
router.get(
  "/status/:status",
  authenticateJWT,
  ReportController.getReportsByStatus,
);

export default router;
