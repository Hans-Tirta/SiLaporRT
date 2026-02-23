import ReportRepository from "../repositories/ReportRepository";
import { ReportStatus, ReportCategory, Role, Attachment } from "@prisma/client";
import { CreateReportData } from "../types/reportTypes";
import { generateCategory } from "../utils/llm";
import { NotificationService } from "./NotificationService";
import { AuthRepository } from "../repositories/AuthRepository";
import { validateUpload } from "../config/uploadPolicy";

interface UserContext {
  id: string;
  role: Role;
}

class ReportService {
  static async createReport(data: CreateReportData) {
    try {
      // Validate attachments against upload policy
      if (data.attachments && data.attachments.length > 0) {
        for (const att of data.attachments) {
          validateUpload("reports", {
            resourceType: att.resourceType,
            format: att.format,
            bytes: att.bytes,
          });
        }
      }

      // bruh gemini ada limit sekarang
      // const category = await generateCategory(data.title, data.description);
      // console.log(category);

      // if (!category) {
      //   throw new Error("Category could not be determined.");
      // }

      const report = await ReportRepository.createReport(data);

      const baseUrl = process.env.FRONTEND_URL_PROD ?? process.env.FRONTEND_URL;
      const url = `${baseUrl}/admin/reports/${report.id}`;

      const RT = await AuthRepository.getRtAdminByUserId(report.userId!);

      if (!RT) {
        throw new Error("RT Admin not found for this user");
      }

      const rtAdminIds = RT.map((admin) => admin.id);

      await NotificationService.sendNotificationByUserId(
        rtAdminIds,
        `Laporan "${report.title}" Telah Dibuat!`,
        `laporan baru telah diajukan. Silakan diproses lebih lanjut.`,
        url,
        "https://res.cloudinary.com/dgnedkivd/image/upload/v1757562088/silaporrt/dev/logo/logo_lnenhb.png",
        "REPORT",
      );
      return report;
    } catch (error) {
      throw new Error(`Failed to create report: ${error}`);
    }
  }

  static async generateReportCategory(data: CreateReportData) {
    try {
      const category = await generateCategory(data.title, data.description);
      if (!category) {
        throw new Error("AI IS NOT WORKING");
      }
      // console.log({ category });

      // const category = "INFRASTRUCTURE";
      // console.log(category);
      // throw new Error("Force catch block");

      return category;
    } catch (error) {
      throw new Error(`Failed to generate report category: ${error}`);
    }
  }

  static async getAllReports(
    params: {
      page?: any;
      pageSize?: any;
      q?: string;
      category?: string;
      priority?: string;
      status?: string;
      includePrivate?: string | boolean;
      isPublic?: string | boolean;
      dateFrom?: string;
      dateTo?: string;
      userId?: string;
      sortBy?: string;
      upvoteDateFrom?: string;
      upvoteDateTo?: string;
    },
    rtId?: string,
    requestingUserId?: string,
  ) {
    const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(params.pageSize ?? "10", 10) || 10),
    );
    try {
      const { total, items } = await ReportRepository.getAllReports({
        page,
        pageSize,
        q: params.q,
        category: params.category,
        priority: params.priority,
        status: params.status,
        userId: params.userId,
        includePrivate:
          params.includePrivate === true || params.includePrivate === "true",
        isPublic: params.isPublic,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        sortBy: params.sortBy,
        upvoteDateFrom: params.upvoteDateFrom,
        upvoteDateTo: params.upvoteDateTo,
        rtId,
        requestingUserId,
      });
      return { page, pageSize, total, items };
    } catch (error) {
      throw new Error(`Failed to fetch reports: ${error}`);
    }
  }

  static async getMyReports(
    params: {
      page?: any;
      pageSize?: any;
      q?: string;
      category?: string;
      priority?: string;
      status?: string;
      includePrivate?: string | boolean;
      isPublic?: string | boolean;
      dateFrom?: string;
      dateTo?: string;
      userId?: string;
      sortBy?: string;
      upvoteDateFrom?: string;
      upvoteDateTo?: string;
    },
    rtId?: string,
  ) {
    const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(params.pageSize ?? "10", 10) || 10),
    );
    try {
      const { total, items } = await ReportRepository.getMyReports({
        page,
        pageSize,
        q: params.q,
        category: params.category,
        priority: params.priority,
        status: params.status,
        userId: params.userId,
        includePrivate:
          params.includePrivate === true || params.includePrivate === "true",
        isPublic: params.isPublic,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        sortBy: params.sortBy,
        upvoteDateFrom: params.upvoteDateFrom,
        upvoteDateTo: params.upvoteDateTo,
        rtId,
      });
      return { page, pageSize, total, items };
    } catch (error) {
      throw new Error(`Failed to fetch reports: ${error}`);
    }
  }

  static async getReportById(id: string) {
    try {
      const report = await ReportRepository.getReportById(id);

      return report;
    } catch (error) {
      throw new Error(`Failed to fetch report: ${error}`);
    }
  }

  static async addComment(reportId: string, userId: string, content: string) {
    try {
      const comment = await ReportRepository.addComment(
        reportId,
        userId,
        content.trim(),
      );
      return comment;
    } catch (error) {
      throw new Error(`Failed to add comment: ${error}`);
    }
  }

  static async toggleUpvote(reportId: string, userId: string) {
    try {
      const result = await ReportRepository.toggleUpvote(reportId, userId);
      return result;
    } catch (error) {
      throw new Error(`Failed to toggle upvote: ${error}`);
    }
  }

  static async updateStatus(reportId: string, status: ReportStatus) {
    try {
      const updatedReport = await ReportRepository.updateStatus(
        reportId,
        status,
      );

      const baseUrl = process.env.FRONTEND_URL_PROD || process.env.FRONTEND_URL;
      const url = `${baseUrl}/reports/${updatedReport.id}`;
      await NotificationService.sendNotificationByUserId(
        [updatedReport.userId!],
        `Laporan "${updatedReport.title}" Telah Diperbarui!`,
        `Status laporan kamu kini berubah menjadi ${updatedReport.status}`,
        url,
        "https://res.cloudinary.com/dgnedkivd/image/upload/v1757562088/silaporrt/dev/logo/logo_lnenhb.png",
        "REPORT",
      );
      return updatedReport;
    } catch (error) {
      throw new Error(`Failed to update status: ${error}`);
    }
  }

  static async addOfficialResponse(
    reportId: string,
    userId: string,
    message: string,
    attachments?: string[],
  ) {
    try {
      const response = await ReportRepository.addOfficialResponse(
        reportId,
        userId,
        message.trim(),
        attachments,
      );

      const baseUrl = process.env.FRONTEND_URL_PROD || process.env.FRONTEND_URL;

      const url = `${baseUrl}/reports/${reportId}`;

      await NotificationService.sendNotificationByUserId(
        [response?.report.userId!],
        `Laporan "${response?.report.title}" Telah Diperbarui!`,
        `Laporan anda telah diresponse oleh ${response?.responder.name}, silahkan cek laporan anda`,
        url,
        "https://res.cloudinary.com/dgnedkivd/image/upload/v1757562088/silaporrt/dev/logo/logo_lnenhb.png",
        "REPORT",
      );

      return {
        success: true,
        data: response,
        message: "Official response added successfully",
      };
    } catch (error) {
      throw new Error(`Failed to add official response: ${error}`);
    }
  }

  static async getReportsByCategory(category: string, rtId?: string) {
    try {
      const reports = await ReportRepository.getReportsByCategory(
        category,
        rtId,
      );
      return { reports, count: reports.length };
    } catch (error) {
      throw new Error(`Failed to fetch reports by category: ${error}`);
    }
  }

  static async getReportsByStatus(status: string, rtId?: string) {
    try {
      const reports = await ReportRepository.getReportsByStatus(
        status as ReportStatus,
        rtId,
      );
      return {
        reports,
        count: reports.length,
      };
    } catch (error) {
      throw new Error(`Failed to fetch reports by status: ${error}`);
    }
  }

  static async getUserUpvoteStatus(reportId: string, userId: string) {
    try {
      const hasUpvoted = await ReportRepository.getUserUpvoteStatus(
        reportId,
        userId,
      );
      return { hasUpvoted };
    } catch (error) {
      throw new Error(`Failed to get upvote status: ${error}`);
    }
  }

  static async getRecentReports(rtId?: string) {
    const { items } = await ReportRepository.getRecentReports(rtId);
    return { items };
  }

  static async deleteReport(reportId: string, userId: string) {
    try {
      const result = await ReportRepository.deleteReport(reportId, userId);
      return result;
    } catch (error) {
      throw new Error(`Failed to delete report: ${error}`);
    }
  }

  static async toggleVisibility(reportId: string, userId: string) {
    try {
      const result = await ReportRepository.toggleVisibility(reportId, userId);
      return result;
    } catch (error) {
      throw new Error(`Failed to toggle visibility: ${error}`);
    }
  }

  static async getUserReportStatistics(userId: string) {
    try {
      const stats = await ReportRepository.getUserReportStatistics(userId);
      return stats;
    } catch (error) {
      throw new Error(`Failed to fetch user report statistics: ${error}`);
    }
  }

  static async getAllReportsStatistics() {
    try {
      const stats = await ReportRepository.getAllReportsStatistics();
      return stats;
    } catch (error) {
      throw new Error(`Failed to fetch all reports statistics: ${error}`);
    }
  }

  static async updateReportStatus(
    reportId: string,
    responderId: string,
    attachments?: Attachment[],
    message?: string,
  ) {
    try {
      const updatedReport = await ReportRepository.updateReportStatus(
        reportId,
        responderId,
        attachments,
        message,
      );

      const baseUrl = process.env.FRONTEND_URL_PROD ?? process.env.FRONTEND_URL;
      const url = `${baseUrl}/reports/${updatedReport.id}`;

      if (updatedReport) {
        NotificationService.sendNotificationByUserId(
          [updatedReport.userId!],
          `Laporan "${updatedReport.title}" Telah Diperbarui!`,
          `Status laporan kamu kini berubah menjadi ${updatedReport.status}`,
          url,
          "https://res.cloudinary.com/dgnedkivd/image/upload/v1757562088/silaporrt/dev/logo/logo_lnenhb.png",
          "REPORT",
        );
      }
      return updatedReport;
    } catch (error) {
      throw new Error(`Failed to update report status: ${error}`);
    }
  }
}

export default ReportService;
