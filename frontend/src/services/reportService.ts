import { request } from "./api";
import {
  Attachment,
  CreateReportFormData,
  Report,
  ReportCategory,
} from "../types/report.types";
import { CloudinaryFile } from "../types/announcement.types";
import { classifyFile } from "../utils/classifyFile";

export interface CreateReportPayload {
  title: string;
  description: string;
  isAnonymous: boolean;
  isPublic: boolean;
  category: ReportCategory | null;
  userId?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    rt: string;
    rw: string;
    kelurahan?: string;
    kecamatan?: string;
  };
  attachments?: {
    filename: string;
    url: string;
    fileType: string;
    provider?: string;
    publicId?: string;
    resourceType?: string;
    format?: string;
    bytes?: number;
    width?: number;
    height?: number;
  }[];
}

export async function createReport(
  formData: CreateReportFormData,
): Promise<Report> {
  if (!formData.location) {
    throw new Error("Lokasi wajib ditentukan");
  }

  try {
    // Prepare the payload
    const payload: CreateReportPayload = {
      title: formData.title,
      description: formData.description,
      isAnonymous: formData.isAnonymous,
      category: formData.category,
      isPublic: formData.isPublic,
      location: {
        latitude: formData.location.latitude,
        longitude: formData.location.longitude,
        address: formData.location.address,
        rt: formData.location.rt,
        rw: formData.location.rw,
        kelurahan: formData.location.kelurahan,
        kecamatan: formData.location.kecamatan,
      },
      attachments: formData.attachments.map((file) => {
        const extendedFile = file as CloudinaryFile & { fileType?: string };
        return {
          filename: file.original_filename || "file",
          url: file.secure_url,
          fileType: extendedFile.fileType || classifyFile(file),
          provider: "cloudinary",
          publicId: file.public_id,
          resourceType: file.resource_type,
          format: file.format,
          bytes: file.bytes,
          width: file.width,
          height: file.height,
        };
      }),
    };

    console.log("Sending JSON payload with cloudinary attachments");

    const res = await request("/reports/add", {
      method: "POST",
      data: payload,
    });
    return res.data;
  } catch (error) {
    console.error("Error creating report:", error);
    throw error instanceof Error ? error : new Error("Gagal membuat laporan");
  }
}

export async function getReportList(params: {
  page?: number;
  pageSize: number;
  q: string;
  category: string;
  status: string;
  sortBy?: string;
  upvoteDateFrom?: string;
  upvoteDateTo?: string;
}) {
  const res = await request("/reports", { method: "GET", params });
  return res.data;
}

export async function getReportDetails(id: string) {
  const res = await request(`/reports/${id}`, { method: "GET" });
  return res.data;
}

export async function getRecentReports() {
  const res = await request("/reports/get-recent", { method: "GET" });
  return res.data;
}

export async function toggleUpvote(id: string) {
  const res = await request(`/reports/${id}/upvote`, { method: "PUT" });
  return res.data;
}

export async function addComment(reportId: string, content: string) {
  const res = await request(`/reports/${reportId}/comment`, {
    method: "POST",
    data: { content },
  });
  return res.data;
}

export async function getUserUpvoteStatus(reportId: string) {
  const res = await request(`/reports/${reportId}/upvote-status`, {
    method: "GET",
  });
  return res.data;
}

// Get user's own reports
export async function getUserReports(params: {
  page?: number;
  pageSize?: number;
  q?: string;
  category?: string;
  status?: string;
  sortBy?: string;
  upvoteDateFrom?: string;
  upvoteDateTo?: string;
}) {
  const res = await request("/reports/my-reports", {
    method: "GET",
    params,
  });
  return res.data;
}

// Delete user's own report
export async function deleteUserReport(reportId: string) {
  const res = await request(`/reports/${reportId}`, { method: "DELETE" });
  return res.data;
}

// Toggle report visibility (public/private)
export async function toggleReportVisibility(reportId: string) {
  const res = await request(`/reports/${reportId}/visibility`, {
    method: "PUT",
  });
  return res.data;
}

// Get user report statistics
export async function getUserReportStatistics() {
  const res = await request("/reports/my-reports/stats", { method: "GET" });
  return res.data;
}

export async function getAllReportsStatistic() {
  const res = await request("/reports/all-reports/stats", { method: "GET" });
  return res.data;
}

export async function updateReportStat(
  reportId: string,
  attachments?: Attachment[],
  message?: string,
) {
  try {
    const res = await request(`/reports/${reportId}/update-status`, {
      method: "PUT",
      data: { attachments, message },
    });
    return res;
  } catch (error) {
    console.error("❌ Error calculating dashboard stats:", error);
    throw error;
  }
}

// Dashboard Statistics Interface and Functions
export interface DashboardStats {
  totalReports: number;
  pendingReports: number;
  inProgressReports: number;
  resolvedReports: number;
  rejectedReports: number;
  activeUsers: number;
  categoryStats: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}

export async function getReportsByStatus(status: string): Promise<Report[]> {
  try {
    const res = await request(`/reports/status/${status}`, {
      method: "GET",
    });

    const statusData = res.data;
    if (statusData && statusData.reports && Array.isArray(statusData.reports)) {
      return statusData.reports;
    } else {
      console.warn(
        "Unexpected API response structure for status:",
        status,
        res,
      );
      return [];
    }
  } catch (error) {
    console.error(`Error fetching reports by status ${status}:`, error);
    return [];
  }
}

export async function getReportsByCategory(
  category: string,
): Promise<Report[]> {
  try {
    console.log(`🔄 Fetching reports for category: ${category}`);

    const res = await request(`/reports/category/${category}`, {
      method: "GET",
    });

    const categoryData = res.data;
    if (
      categoryData &&
      categoryData.reports &&
      Array.isArray(categoryData.reports)
    ) {
      console.log(
        `✅ Found ${categoryData.reports.length} reports for category ${category}`,
      );
      return categoryData.reports;
    } else {
      console.warn(
        "⚠️ Unexpected API response structure for category:",
        category,
        res,
      );
      return [];
    }
  } catch (error) {
    console.error(`❌ Error fetching reports by category ${category}:`, error);
    return [];
  }
}

export async function generateReportCategory(data: Record<string, unknown>) {
  try {
    const response = await request(`/reports/generate/category`, {
      method: "POST",
      data,
    });
    return response;
  } catch (error) {
    console.error("Error generating report status:", error);
    return null;
  }
}

export async function getDashboardStats(
  daysBack?: number,
): Promise<DashboardStats> {
  try {
    console.log("🚀 Starting dashboard stats calculation...");
    console.log(
      "📅 Time period filter:",
      daysBack ? `${daysBack} days` : "All time",
    );

    // Fetch status data (exclude CLOSED reports)
    const [
      pendingReports,
      inProgressReports,
      resolvedReports,
      rejectedReports,
    ] = await Promise.all([
      getReportsByStatus("PENDING"),
      getReportsByStatus("IN_PROGRESS"),
      getReportsByStatus("RESOLVED"),
      getReportsByStatus("REJECTED"),
      // Note: CLOSED reports are intentionally excluded from dashboard stats
    ]);

    // Apply time filtering if specified
    let filteredPending = pendingReports;
    let filteredInProgress = inProgressReports;
    let filteredResolved = resolvedReports;
    let filteredRejected = rejectedReports;

    if (daysBack) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);
      console.log("📅 Filtering reports after:", cutoffDate.toISOString());

      filteredPending = pendingReports.filter(
        (r) => new Date(r.createdAt) >= cutoffDate,
      );
      filteredInProgress = inProgressReports.filter(
        (r) => new Date(r.createdAt) >= cutoffDate,
      );
      filteredResolved = resolvedReports.filter(
        (r) => new Date(r.createdAt) >= cutoffDate,
      );
      filteredRejected = rejectedReports.filter(
        (r) => new Date(r.createdAt) >= cutoffDate,
      );
    }

    console.log("📊 Status data fetched (excluding CLOSED):");
    console.log("- Pending:", filteredPending.length);
    console.log("- In Progress:", filteredInProgress.length);
    console.log("- Resolved:", filteredResolved.length);
    console.log("- Rejected:", filteredRejected.length);

    // Combine all active reports (non-CLOSED) for category calculation
    const allActiveReports = [
      ...filteredPending,
      ...filteredInProgress,
      ...filteredResolved,
      ...filteredRejected,
    ];

    // Calculate category stats from active reports only (ignore CLOSED status)
    const categoryCount = allActiveReports.reduce(
      (acc: Record<string, number>, report: Report) => {
        if (report && report.category) {
          acc[report.category] = (acc[report.category] || 0) + 1;
        }
        return acc;
      },
      {},
    );

    const statusSum =
      filteredPending.length +
      filteredInProgress.length +
      filteredResolved.length +
      filteredRejected.length;
    const totalReports = statusSum; // Use status sum as authoritative total

    console.log("✅ Using total reports (excluding CLOSED):", totalReports);

    // Create category stats showing ALL categories (even if count is 0)
    const allCategories = [
      "INFRASTRUCTURE",
      "CLEANLINESS",
      "LIGHTING",
      "SECURITY",
      "UTILITIES",
      "ENVIRONMENT",
      "SUGGESTION",
      "OTHER",
    ];

    const categoryStats = allCategories
      .map((category) => {
        const count = categoryCount[category] || 0;
        return {
          category,
          count,
          percentage:
            totalReports > 0 ? Math.round((count / totalReports) * 100) : 0,
        };
      })
      .filter((item) => item.count > 0); // Only show categories that have reports

    // Get unique users from all active reports
    console.log("👥 Calculating active users...");

    // Filter reports that have user data (non-anonymous) and role CITIZEN only
    const reportsWithCitizens = allActiveReports.filter(
      (r) => r && r.user && r.user.id && r.user.role === "CITIZEN",
    );
    console.log("- Reports with citizen data:", reportsWithCitizens.length);

    // Extract unique citizen user IDs
    const userIds = reportsWithCitizens.map((r) => r.user!.id);
    const uniqueUsers = new Set(userIds);
    console.log("- Active citizens count:", uniqueUsers.size);

    const stats: DashboardStats = {
      totalReports,
      pendingReports: filteredPending.length,
      inProgressReports: filteredInProgress.length,
      resolvedReports: filteredResolved.length,
      rejectedReports: filteredRejected.length,
      activeUsers: uniqueUsers.size,
      categoryStats,
    };

    console.log("🎯 Final dashboard stats (CLOSED reports excluded):", stats);

    return stats;
  } catch (error) {
    console.error("❌ Error calculating dashboard stats:", error);
    throw error;
  }
}
