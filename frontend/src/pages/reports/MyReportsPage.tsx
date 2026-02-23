import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Eye,
  EyeOff,
  TrendingUp,
  MessageCircle,
  ThumbsUp,
  Clock,
  AlertTriangle,
  MapPin,
  Paperclip,
  HatGlasses,
  CheckCircle,
  XCircle,
  Pause,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import Pagination from "../../components/ui/Pagination";
import { useAuthContext } from "../../contexts/AuthContext";
import AdvancedFilter, {
  FilterField,
} from "../../components/common/AdvancedFilter";
import {
  getUserReports,
  deleteUserReport,
  toggleReportVisibility,
  getUserReportStatistics,
} from "../../services/reportService";
import { Report } from "../../types/report.types";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

const MyReportsPage: React.FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");

  // Clear cache when user changes (fixes cache issue when switching accounts)
  useEffect(() => {
    if (user?.id) {
      qc.invalidateQueries({ queryKey: ["user-reports"] });
    }
  }, [user?.id, qc]);

  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!event.target) return;

      const target = event.target as Element;
      const isDropdownClick =
        target.closest("[data-dropdown]") ||
        target.closest("button[data-dropdown-toggle]");

      if (!isDropdownClick) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper to calculate date range from period
  const getDateRangeFromPeriod = (period: string) => {
    const from = new Date();
    const to = new Date();

    switch (period) {
      case "hari-ini":
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "kemarin":
        from.setDate(from.getDate() - 1);
        from.setHours(0, 0, 0, 0);
        to.setDate(to.getDate() - 1);
        to.setHours(23, 59, 59, 999);
        break;
      case "minggu-ini": {
        const dayOfWeek = from.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        from.setDate(from.getDate() - diff);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      }
      case "bulan-ini":
        from.setDate(1);
        from.setHours(0, 0, 0, 0);
        to.setMonth(to.getMonth() + 1, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "tahun-ini":
        from.setMonth(0, 1);
        from.setHours(0, 0, 0, 0);
        to.setMonth(11, 31);
        to.setHours(23, 59, 59, 999);
        break;
      default:
        return {};
    }

    return {
      from: from.toISOString().split("T")[0],
      to: to.toISOString().split("T")[0],
    };
  };

  // Query for user's reports
  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      "user-reports",
      user?.id,
      {
        page,
        pageSize,
        q: searchTerm,
        selectedCategory,
        selectedStatus,
        sortBy,
        selectedPeriod,
      },
    ],
    queryFn: () => {
      const upvoteDateRange = selectedPeriod
        ? getDateRangeFromPeriod(selectedPeriod)
        : {};
      return getUserReports({
        page,
        pageSize,
        q: searchTerm || undefined,
        category: selectedCategory || undefined,
        status: selectedStatus || undefined,
        sortBy,
        upvoteDateFrom: upvoteDateRange.from,
        upvoteDateTo: upvoteDateRange.to,
      });
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Query for user's report statistics (total counts by status)
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ["user-reports-stats", user?.id],
    queryFn: () => getUserReportStatistics(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Mutation for deleting reports
  const deleteMutation = useMutation({
    mutationFn: deleteUserReport,
    onMutate: async (reportId: string) => {
      // Cancel any outgoing refetches
      await qc.cancelQueries({ queryKey: ["user-reports"] });

      // Snapshot the previous value
      const previousUserReports = qc.getQueryData([
        "user-reports",
        user?.id,
        page,
        searchTerm,
        selectedStatus,
        selectedCategory,
      ]);

      // Optimistically update by removing the report
      qc.setQueryData(
        [
          "user-reports",
          user?.id,
          page,
          searchTerm,
          selectedStatus,
          selectedCategory,
        ],
        (old: unknown) => {
          if (!old || typeof old !== "object") return old;
          const reportData = old as { items: Report[]; total: number };
          return {
            ...reportData,
            items: reportData.items.filter(
              (report: Report) => report.id !== reportId,
            ),
            total: reportData.total - 1,
          };
        },
      );

      return { previousUserReports };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousUserReports) {
        qc.setQueryData(
          [
            "user-reports",
            user?.id,
            page,
            searchTerm,
            selectedStatus,
            selectedCategory,
          ],
          context.previousUserReports,
        );
      }
    },
    onSuccess: () => {
      // Invalidate user reports and general reports to keep data consistent
      qc.invalidateQueries({ queryKey: ["user-reports"] });
      qc.invalidateQueries({ queryKey: ["user-reports-stats"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["recent-reports"] });
    },
  });

  // Mutation for toggling visibility
  const visibilityMutation = useMutation({
    mutationFn: toggleReportVisibility,
    onMutate: async (reportId: string) => {
      // Cancel any outgoing refetches
      await qc.cancelQueries({ queryKey: ["user-reports"] });

      // Snapshot the previous value
      const previousUserReports = qc.getQueryData([
        "user-reports",
        user?.id,
        page,
        searchTerm,
        selectedStatus,
        selectedCategory,
      ]);

      // Optimistically update by toggling the visibility
      qc.setQueryData(
        [
          "user-reports",
          user?.id,
          page,
          searchTerm,
          selectedStatus,
          selectedCategory,
        ],
        (old: unknown) => {
          if (!old || typeof old !== "object") return old;
          const reportData = old as { items: Report[]; total: number };
          return {
            ...reportData,
            items: reportData.items.map((report: Report) =>
              report.id === reportId
                ? { ...report, isPublic: !report.isPublic }
                : report,
            ),
          };
        },
      );

      return { previousUserReports };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousUserReports) {
        qc.setQueryData(
          [
            "user-reports",
            user?.id,
            page,
            searchTerm,
            selectedStatus,
            selectedCategory,
          ],
          context.previousUserReports,
        );
      }
    },
    onSuccess: () => {
      // Invalidate user reports and general reports to keep data consistent
      qc.invalidateQueries({ queryKey: ["user-reports"] });
      qc.invalidateQueries({ queryKey: ["user-reports-stats"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["recent-reports"] });
    },
  });

  const reports = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Statistics calculation from API (accurate counts from database)
  const stats = {
    total: statsData?.total ?? 0,
    pending: statsData?.pending ?? 0,
    inProgress: statsData?.inProgress ?? 0,
    resolved: statsData?.resolved ?? 0,
    rejected: statsData?.rejected ?? 0,
  };

  const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "PENDING", label: "Menunggu" },
    { value: "IN_PROGRESS", label: "Dalam Proses" },
    { value: "RESOLVED", label: "Selesai" },
    { value: "REJECTED", label: "Ditolak" },
  ];

  const categoryOptions = [
    { value: "", label: "Semua Kategori" },
    { value: "INFRASTRUCTURE", label: "Infrastruktur" },
    { value: "CLEANLINESS", label: "Kebersihan" },
    { value: "LIGHTING", label: "Penerangan" },
    { value: "SECURITY", label: "Keamanan" },
    { value: "SUGGESTION", label: "Saran" },
  ];

  const sortByOptions = [
    { value: "", label: "Terbaru" },
    { value: "oldest", label: "Terlama" },
    { value: "most_liked", label: "Paling Banyak Disukai" },
  ];

  const periodOptions = [
    { value: "", label: "Semua Waktu" },
    { value: "hari-ini", label: "Hari Ini" },
    { value: "kemarin", label: "Kemarin" },
    { value: "minggu-ini", label: "Minggu Ini" },
    { value: "bulan-ini", label: "Bulan Ini" },
    { value: "tahun-ini", label: "Tahun Ini" },
  ];

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedStatus) count++;
    if (selectedCategory) count++;
    if (sortBy) count++;
    if (sortBy === "most_liked" && selectedPeriod) count++;
    return count;
  }, [selectedStatus, selectedCategory, sortBy, selectedPeriod]);

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedStatus("");
    setSelectedCategory("");
    setSortBy("");
    setSelectedPeriod("");
    setPage(1);
  };

  // Filter fields configuration
  const filterFields: FilterField[] = [
    {
      name: "status",
      label: "Status",
      type: "select",
      value: selectedStatus,
      onChange: (value) => {
        setSelectedStatus(value as string);
        setPage(1);
      },
      options: statusOptions,
    },
    {
      name: "sortBy",
      label: "Urutkan Berdasarkan",
      type: "select",
      value: sortBy,
      onChange: (value) => {
        setSortBy(value as string);
        if (value !== "most_liked") {
          setSelectedPeriod("");
        }
        setPage(1);
      },
      options: sortByOptions,
    },
    ...(sortBy === "most_liked"
      ? [
          {
            name: "period",
            label: "Periode Waktu",
            type: "select" as const,
            value: selectedPeriod,
            onChange: (value: string | { from?: string; to?: string }) => {
              setSelectedPeriod(value as string);
              setPage(1);
            },
            options: periodOptions,
          },
        ]
      : []),
    {
      name: "category",
      label: "Kategori",
      type: "select",
      value: selectedCategory,
      onChange: (value) => {
        setSelectedCategory(value as string);
        setPage(1);
      },
      options: categoryOptions,
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: { variant: "warning" as const, label: "Menunggu" },
      IN_PROGRESS: { variant: "info" as const, label: "Proses" },
      RESOLVED: { variant: "success" as const, label: "Selesai" },
      REJECTED: { variant: "danger" as const, label: "Ditolak" },
    };
    return variants[status as keyof typeof variants] || variants.PENDING;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      INFRASTRUCTURE: "Infrastruktur",
      LIGHTING: "Penerangan",
      CLEANLINESS: "Kebersihan",
      SECURITY: "Keamanan",
      UTILITIES: "Utilitas",
      ENVIRONMENT: "Lingkungan",
      SUGGESTION: "Saran",
      EVENT: "Kegiatan",
    };
    return labels[category as keyof typeof labels] || category;
  };

  const handleDeleteReport = (reportId: string) => {
    if (window.confirm("Yakin ingin menghapus laporan ini?")) {
      deleteMutation.mutate(reportId);
    }
  };

  const handleToggleVisibility = (reportId: string) => {
    visibilityMutation.mutate(reportId);
  };

  const handleCardClick = (reportId: string) => {
    navigate(`/reports/${reportId}`, {
      state: { from: "my-reports" },
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when page size changes
  };

  // No client-side filtering needed since API handles it
  const filteredReports = reports;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400">
            Laporan Saya
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Kelola dan pantau semua laporan yang telah Anda buat • {total}{" "}
            laporan
          </p>
        </div>

        <Link to="/create-report">
          <Button className="w-full sm:w-auto">
            Buat Laporan
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {isStatsLoading ? (
          // Loading skeleton for statistics
          [...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="p-3 rounded-full bg-gray-200 w-12 h-12"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Laporan Menunggu
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.pending}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-yellow-100">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Laporan Dalam Proses
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.inProgress}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-primary-100">
                    <Pause className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Laporan Selesai
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.resolved}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-green-100">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Laporan Ditolak
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.rejected}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-red-100">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500 z-10" />
              <Input
                placeholder="Cari laporan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </form>

            <AdvancedFilter
              fields={filterFields}
              activeFilterCount={activeFilterCount}
              onReset={handleResetFilters}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(pageSize)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="flex gap-2 mb-2">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-400 dark:text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Gagal Memuat Laporan
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error?.message || "Terjadi kesalahan saat memuat laporan Anda"}
            </p>
            <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
          </CardContent>
        </Card>
      ) : filteredReports.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {searchTerm || selectedStatus || selectedCategory
                ? "Tidak Ada Laporan yang Sesuai"
                : "Belum Ada Laporan"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || selectedStatus || selectedCategory
                ? "Coba ubah filter pencarian Anda"
                : "Mulai berkontribusi dengan membuat laporan pertama Anda"}
            </p>
            {!searchTerm && !selectedStatus && !selectedCategory && (
              <Link to="/create-report">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Buat Laporan Pertama
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report: Report) => {
            const statusInfo = getStatusBadge(report.status);

            return (
              <Card
                key={report.id}
                className="hover:shadow-md transition-shadow cursor-pointer relative flex flex-col"
                onClick={() => handleCardClick(report.id)}
              >
                <CardContent className="p-6 flex flex-col h-full">
                  {/* Header with actions */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="default" size="sm">
                        {getCategoryLabel(report.category)}
                      </Badge>
                      <Badge variant={statusInfo.variant} size="sm">
                        {statusInfo.label}
                      </Badge>
                    </div>

                    {/* Action Menu */}
                    <div className="relative flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        data-dropdown-toggle
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          setOpenDropdown(
                            openDropdown === report.id ? null : report.id,
                          );
                        }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>

                      {/* Dropdown Menu */}
                      {openDropdown === report.id && (
                        <div
                          className="absolute right-0 top-8 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10"
                          data-dropdown
                        >
                          <div className="py-1">
                            <button
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleVisibility(report.id);
                                setOpenDropdown(null);
                              }}
                            >
                              {report.isPublic ? (
                                <>
                                  <EyeOff className="mr-2 h-4 w-4" />
                                  Jadikan Privat
                                </>
                              ) : (
                                <>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Jadikan Publik
                                </>
                              )}
                            </button>
                            <button
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteReport(report.id);
                                setOpenDropdown(null);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus Laporan
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Main content - grows to fill available space */}
                  <div className="flex-1 flex flex-col">
                    {/* Title and Description */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1 whitespace-pre-wrap break-words">
                      {report.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 break-words whitespace-pre-wrap mb-4">
                      {report.description}
                    </p>
                  </div>

                  {/* Bottom section - always at bottom */}
                  <div className="mt-auto space-y-3">
                    {/* Location */}
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {report.location.address}
                      </span>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <ThumbsUp className="mr-1 h-4 w-4" />
                          {report.upvoteCount}
                        </span>
                        <span className="flex items-center">
                          <MessageCircle className="mr-1 h-4 w-4" />
                          {report.commentCount}
                        </span>
                        {report.attachments.length > 0 && (
                          <span className="flex items-center">
                            <Paperclip className="mr-1 h-4 w-4" />
                            {report.attachments.length}
                          </span>
                        )}
                        {report.isAnonymous && (
                          <span
                            className="flex items-center"
                            title="Laporan Anonim"
                          >
                            <HatGlasses className="h-4 w-4" />
                          </span>
                        )}
                        {!report.isPublic && (
                          <span
                            className="flex items-center"
                            title="Laporan Privat"
                          >
                            <EyeOff className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex flex-col gap-1 text-xs text-gray-400 dark:text-gray-500">
                        <div className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(report.createdAt), {
                              addSuffix: true,
                              locale: id,
                            })}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Dilaporkan oleh: Anda
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !isError && totalPages > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={total}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={[
            { value: "6", label: "Tampilkan 6" },
            { value: "12", label: "Tampilkan 12" },
            { value: "18", label: "Tampilkan 18" },
            { value: "24", label: "Tampilkan 24" },
            { value: "30", label: "Tampilkan 30" },
          ]}
          showPageSizeSelector={true}
          className="mt-6"
        />
      )}
    </div>
  );
};

export default MyReportsPage;
