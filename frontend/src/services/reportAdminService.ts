import { request } from "./api";
import { Report } from "../types/report.types";

// Admin-specific report list with additional filters and admin-only data
export async function adminListReports(params: {
  page?: number;
  pageSize?: number;
  q?: string;
  category?: string;
  priority?: string;
  status?: string;
  visibility?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  upvoteDateFrom?: string;
  upvoteDateTo?: string;
  sortOrder?: "asc" | "desc";
}) {
  const queryParams: Record<string, string | number | boolean | undefined> = {
    ...params,
    // Admin can see all reports including non-public ones by default
    includePrivate: true,
  };

  // Handle visibility filter
  if (params.visibility === "public") {
    queryParams.isPublic = "true";
    delete queryParams.includePrivate;
  } else if (params.visibility === "private") {
    queryParams.isPublic = "false";
    delete queryParams.includePrivate;
  }

  // Remove visibility from query params as it's converted to isPublic
  delete queryParams.visibility;

  const res = await request("/reports", {
    method: "GET",
    params: queryParams,
  });
  return res.data;
}

// Update report status with optional message/reason
export async function updateReportStatus(
  reportId: string,
  status: string,
  message?: string,
) {
  const res = await request(`/reports/${reportId}/status`, {
    method: "PUT",
    data: {
      status,
      message,
    },
  });
  return res.data;
}

// Add official response from admin
export async function addOfficialResponse(
  reportId: string,
  message: string,
  attachments?: string[],
) {
  const res = await request(`/reports/${reportId}/response`, {
    method: "POST",
    data: {
      message,
      attachments,
    },
  });
  return res.data;
}

// Get reports by status (admin view)
export async function getReportsByStatus(status: string) {
  const res = await request(`/reports/status/${status}`, {
    method: "GET",
  });
  return res.data;
}

// Get reports by category (admin view)
export async function getReportsByCategory(category: string) {
  const res = await request(`/reports/category/${category}`, {
    method: "GET",
  });
  return res.data;
}

// Get report statistics for admin dashboard
export async function getReportStatistics() {
  // Get counts for each status by calling the endpoint with different status filters
  const [pendingRes, inProgressRes, resolvedRes, rejectedRes, closedRes] =
    await Promise.all([
      request("/reports", {
        method: "GET",
        params: { status: "PENDING", pageSize: 1 },
      }),
      request("/reports", {
        method: "GET",
        params: { status: "IN_PROGRESS", pageSize: 1 },
      }),
      request("/reports", {
        method: "GET",
        params: { status: "RESOLVED", pageSize: 1 },
      }),
      request("/reports", {
        method: "GET",
        params: { status: "REJECTED", pageSize: 1 },
      }),
      request("/reports", {
        method: "GET",
        params: { status: "CLOSED", pageSize: 1 },
      }),
    ]);

  return {
    PENDING: pendingRes.data.total || 0,
    IN_PROGRESS: inProgressRes.data.total || 0,
    RESOLVED: resolvedRes.data.total || 0,
    REJECTED: rejectedRes.data.total || 0,
    CLOSED: closedRes.data.total || 0,
    TOTAL:
      (pendingRes.data.total || 0) +
      (inProgressRes.data.total || 0) +
      (resolvedRes.data.total || 0) +
      (rejectedRes.data.total || 0) +
      (closedRes.data.total || 0),
  };
}

export type { Report };
