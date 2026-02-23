import { Request, Response } from "express";
import ReportService from "../services/ReportService";

class ReportController {
  static async createReport(req: Request, res: Response) {
    try {
      const user = req.user as { id: string };
      const data = req.body;
      if (!user) {
        throw new Error("User not found");
      }

      if (!data.title || !data.description || !data.location) {
        throw new Error("Title, description, and location are required");
      }

      const dataWithUser = { ...data, userId: user.id };

      const result = await ReportService.createReport(dataWithUser);
      res.status(201).json({
        success: true,
        message: "Report created successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error in createReport controller:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async generateReportCategory(req: Request, res: Response) {
    try {
      const data = req.body;

      const result = await ReportService.generateReportCategory(data);

      res.status(201).json({
        success: true,
        message: "Report created successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getAllReports(req: Request, res: Response) {
    try {
      const user = req.user as { id: string; rtId?: string };
      const reports = await ReportService.getAllReports(
        req.query,
        user?.rtId,
        user?.id,
      );
      res.json({
        success: true,
        message: `Retrieved ${reports.total} reports`,
        data: reports,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch reports",
      });
    }
  }

  static async getReportById(req: Request, res: Response) {
    try {
      const { reportId } = req.params;

      if (!reportId) {
        return res.status(400).json({
          success: false,
          message: "Report ID is required",
        });
      }

      const report = await ReportService.getReportById(reportId);

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Report not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Report retrieved successfully",
        data: report,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch report",
      });
    }
  }

  static async addComment(req: Request, res: Response) {
    try {
      const { reportId } = req.params;
      const { content } = req.body;
      const user = req.user as { id: string };

      console.log(reportId, user.id, content);
      if (!reportId || !user.id || !content?.trim()) {
        throw new Error("Report ID, user ID, and content are required");
      }

      const comment = await ReportService.addComment(
        reportId,
        user.id,
        content,
      );
      res.json({
        success: true,
        message: "Comment added successfully",
        data: comment,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to add comment",
      });
    }
  }

  static async toggleUpvote(req: Request, res: Response) {
    try {
      const { reportId } = req.params;
      const user = req.user as { id: string };
      console.log("User:", user);

      if (!reportId || !user.id) {
        throw new Error("Report ID and user ID are required");
      }

      const result = await ReportService.toggleUpvote(reportId, user.id);
      res.json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to toggle upvote",
      });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const { reportId } = req.params;
      const { status } = req.body;
      const user = req.user as { id: string };

      if (!reportId || !status) {
        throw new Error("Report ID and status are required");
      }

      // if(req.user?.role !== Role.ADMIN && req.user?.id !== adminId) {
      //   throw new Error("You don't have permission to update this report");
      // }

      const result = await ReportService.updateStatus(reportId, status);

      res.json({
        success: true,
        message: `Report status updated to ${status}`,
        data: result,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || "Failed to update status",
      });
    }
  }

  static async addOfficialResponse(req: Request, res: Response) {
    try {
      const { reportId } = req.params;
      const { message, attachments } = req.body;
      const user = req.user as { id: string };

      if (!reportId || !user?.id || !message?.trim()) {
        throw new Error("Report ID, user ID, and message are required");
      }

      const response = await ReportService.addOfficialResponse(
        reportId,
        user.id,
        message,
        attachments,
      );
      res.json({
        success: true,
        data: response,
        message: "Official response added successfully",
      });
    } catch (error) {
      const statusCode =
        error instanceof Error && error.message.includes("permission")
          ? 403
          : 400;
      res.status(statusCode).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to add official response",
      });
    }
  }

  static async getReportsByCategory(req: Request, res: Response) {
    const { category } = req.params;
    const user = req.user as { id: string; rtId?: string };
    const rtId = user?.rtId;

    if (!category)
      return res
        .status(400)
        .json({ success: false, message: "Category is required" });

    try {
      const reports = await ReportService.getReportsByCategory(category, rtId);
      res.json({
        success: true,
        data: reports,
        message: `Retrieved ${reports.count} reports for category ${category}`,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch reports by category",
      });
    }
  }

  static async getReportsByStatus(req: Request, res: Response) {
    const { status } = req.params;
    const user = req.user as { id: string; rtId?: string };
    const rtId = user?.rtId;

    if (!status)
      return res
        .status(400)
        .json({ success: false, message: "Status is required" });

    try {
      const reports = await ReportService.getReportsByStatus(status, rtId);
      res.json({
        success: true,
        data: reports,
        message: `Retrieved ${reports.count} reports with status ${status}`,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch reports by status",
      });
    }
  }

  static async getUserUpvoteStatus(req: Request, res: Response) {
    const { reportId } = req.params;
    const user = req.user as { id: string };

    if (!reportId || !user.id)
      return res.status(400).json({
        success: false,
        message: "Report ID and user authentication required",
      });

    try {
      const result = await ReportService.getUserUpvoteStatus(reportId, user.id);
      res.json({
        success: true,
        data: { result },
        message: "Upvote status retrieved successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to get upvote status",
      });
    }
  }

  static async getRecentReports(req: Request, res: Response) {
    try {
      const user = req.user as { id: string; rtId?: string };
      const reports = await ReportService.getRecentReports(user?.rtId);
      res.json({
        success: true,
        data: reports,
        message: "Recent reports retrieved successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to get recent reports",
      });
    }
  }

  static async getUserReports(req: Request, res: Response) {
    try {
      const user = req.user as { id: string };
      const params = { ...req.query, userId: user.id };

      const reports = await ReportService.getMyReports(params);
      res.json({
        success: true,
        message: `Retrieved ${reports.total} user reports`,
        data: reports,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch user reports",
      });
    }
  }

  static async deleteReport(req: Request, res: Response) {
    try {
      const user = req.user as { id: string };
      const { reportId } = req.params;

      const result = await ReportService.deleteReport(reportId, user.id);
      res.json({
        success: true,
        message: "Report deleted successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete report",
      });
    }
  }

  static async toggleReportVisibility(req: Request, res: Response) {
    try {
      const user = req.user as { id: string };
      const { reportId } = req.params;

      const result = await ReportService.toggleVisibility(reportId, user.id);
      res.json({
        success: true,
        message: "Report visibility updated successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update report visibility",
      });
    }
  }

  static async getUserReportStatistics(req: Request, res: Response) {
    try {
      const user = req.user as { id: string };

      const stats = await ReportService.getUserReportStatistics(user.id);
      res.json({
        success: true,
        message: "User report statistics retrieved successfully",
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch user report statistics",
      });
    }
  }

  static async getAllReportsStatistics(req: Request, res: Response) {
    try {
      const stats = await ReportService.getAllReportsStatistics();
      res.json({
        success: true,
        message: "All reports statistics retrieved successfully",
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch all reports statistics",
      });
    }
  }
  static async updateReportStatus(req: Request, res: Response) {
    try {
      const { reportId } = req.params;
      const { attachments, message } = req.body;
      const user = req.user as { id: string };

      if (!reportId || !user.id) {
        throw new Error("Report ID, status, and user ID are required");
      }

      await ReportService.updateReportStatus(
        reportId,
        user.id,
        attachments,
        message,
      );
      res.json({
        success: true,
        message: "Report status updated successfully",
        // data: result,
      });
    } catch (error: any) {
      console.log("error", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update report status",
      });
    }
  }
}

export default ReportController;
