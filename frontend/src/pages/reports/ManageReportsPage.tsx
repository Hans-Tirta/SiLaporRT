import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FileText,
  Search,
  MapPin,
  MessageCircle,
  ThumbsUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pause,
  X,
} from "lucide-react";
import {
  adminListReports,
  updateReportStatus,
} from "../../services/reportAdminService";
import Button from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Pagination from "../../components/ui/Pagination";
import Input from "../../components/ui/Input";
import { Report, Role } from "../../types/report.types";
import AdvancedFilter, {
  FilterField,
} from "../../components/common/AdvancedFilter";
import ReportManageTableSkeleton from "./components/ReportManageTableSkeleton";
import { updateReportStat } from "../../services/reportService";
import CloudinaryUpload from "../../components/upload/CloudinaryUpload";
import { CloudinaryFile } from "../../types/announcement.types";
import { classifyFile } from "../../utils/classifyFile";
import { useToast } from "../../hooks/useToast";
import Textarea from "../../components/ui/Textarea";

export default function ManageReportsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [q, setQ] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(
    searchParams.get("status") || "",
  );
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>(
    {},
  );
  const [selectedVisibility, setSelectedVisibility] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const rejectDialogRef = useRef<HTMLDivElement>(null);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [dialogAttachments, setDialogAttachments] = useState<
    {
      id: string;
      filename: string;
      url: string;
      fileType: "image" | "video" | "audio" | "document";
      provider?: "cloudinary";
      publicId?: string;
      resourceType?: string;
      format?: string;
      bytes?: number;
      width?: number;
      height?: number;
      createdAt: string;
    }[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isResponseLoading, setIsResponseLoading] = useState(false);
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam && statusParam !== selectedStatus) {
      setSelectedStatus(statusParam);
    }
  }, [searchParams, selectedStatus]);

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

  const closeDialog = () => {
    document.body.style.overflow = "auto";
    setIsDialogOpen(false);
    setMessage(undefined);
    setDialogAttachments([]);
    setCurrentReportId(null);
    setCurrentReport(null);
    setImageError(null);
    setResponseError(null);
  };

  const closeRejectModal = () => {
    setIsRejectModalOpen(false);
    setRejectionReason("");
    setRejectionError(null);
  };

  const cancelRejection = useCallback(() => {
    setIsRejectModalOpen(false);
    setRejectionReason("");
    setRejectionError(null);
    document.body.style.overflow = "hidden";
    setIsDialogOpen(true);
  }, []);

  const openDialog = (report: Report) => {
    setCurrentReport(report);
    setCurrentReportId(report.id);
    document.body.style.overflow = "hidden";
    setIsDialogOpen(true);
  };

  const openRejectModal = () => {
    setIsDialogOpen(false);
    document.body.style.overflow = "hidden";
    setIsRejectModalOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(event.target as Node)
      ) {
        closeDialog();
      }
      if (
        rejectDialogRef.current &&
        !rejectDialogRef.current.contains(event.target as Node)
      ) {
        cancelRejection();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [cancelRejection]);

  const handleDialogUploaded = (files: CloudinaryFile[]) => {
    const mapped = files.map((f) => ({
      id: f.public_id,
      filename: f.original_filename || "file",
      url: f.secure_url,
      fileType: classifyFile(f),
      provider: "cloudinary" as const,
      publicId: f.public_id,
      resourceType: f.resource_type,
      format: f.format,
      bytes: f.bytes,
      width: f.width,
      height: f.height,
      createdAt: new Date().toISOString(),
    }));
    setDialogAttachments((prev) => [...prev, ...mapped]);
  };

  const handleDialogRemove = (identifier: string) => {
    setDialogAttachments((prev) => prev.filter((a) => a.id !== identifier));
  };

  const handleSubmitResponse = async () => {
    setIsResponseLoading(true);
    try {
      if (!currentReportId) return;

      if (message === undefined) {
        setResponseError("Pesan harus diisi");
        return;
      }

      if (dialogAttachments.length === 0) {
        setImageError("Lampiran harus diisi");
        return;
      }
      await updateReportStat(currentReportId, dialogAttachments, message);
      closeDialog();
      toast.success("Tanggapan berhasil dikirim", "Berhasil");
      qc.invalidateQueries({ queryKey: ["admin-reports"] });
    } catch (error) {
      toast.error("Terjadi kesalahan saat mengirim tanggapan", "Gagal");
      console.error(error);
    } finally {
      setIsResponseLoading(false);
    }
  };

  const handleAcceptReport = async () => {
    setIsResponseLoading(true);
    try {
      if (!currentReportId) return;

      // Update status to IN_PROGRESS with response message
      // Backend will create response entry and send notification
      await updateReportStatus(
        currentReportId,
        "IN_PROGRESS",
        "Laporan ini akan diproses"
      );

      closeDialog();
      toast.success("Laporan berhasil diterima", "Berhasil");
      qc.invalidateQueries({ queryKey: ["admin-reports"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["report", currentReportId] });
    } catch (error) {
      toast.error("Terjadi kesalahan saat menerima laporan", "Gagal");
      console.error("Accept report error:", error);
    } finally {
      setIsResponseLoading(false);
    }
  };

  const handleSubmitRejection = async () => {
    setIsResponseLoading(true);
    setRejectionError(null);
    try {
      if (!currentReportId) return;

      if (!rejectionReason.trim()) {
        setRejectionError("Alasan penolakan harus diisi");
        setIsResponseLoading(false);
        return;
      }

      // Update status to REJECTED with rejection reason as response message
      // Backend will create response entry and send notification
      await updateReportStatus(currentReportId, "REJECTED", rejectionReason);
      
      closeRejectModal();
      closeDialog();
      document.body.style.overflow = "auto";
      toast.success("Laporan berhasil ditolak", "Berhasil");
      qc.invalidateQueries({ queryKey: ["admin-reports"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["report", currentReportId] });
    } catch (error) {
      toast.error("Terjadi kesalahan saat menolak laporan", "Gagal");
      console.error(error);
    } finally {
      setIsResponseLoading(false);
    }
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "admin-reports",
      {
        page,
        pageSize,
        q,
        selectedCategory,
        selectedStatus,
        selectedVisibility,
        dateRange,
        sortBy,
        selectedPeriod,
      },
    ],
    queryFn: () => {
      const upvoteDateRange = selectedPeriod
        ? getDateRangeFromPeriod(selectedPeriod)
        : {};
      return adminListReports({
        page,
        pageSize,
        q,
        category: selectedCategory,
        status: selectedStatus,
        visibility: selectedVisibility,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        sortBy,
        upvoteDateFrom: upvoteDateRange.from,
        upvoteDateTo: upvoteDateRange.to,
      });
    },
    staleTime: 0,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const categoryOptions = [
    { value: "", label: "Semua Kategori" },
    { value: "INFRASTRUCTURE", label: "Infrastruktur" },
    { value: "CLEANLINESS", label: "Kebersihan" },
    { value: "LIGHTING", label: "Penerangan" },
    { value: "SECURITY", label: "Keamanan" },
    { value: "UTILITIES", label: "Utilitas" },
    { value: "ENVIRONMENT", label: "Lingkungan" },
    { value: "SUGGESTION", label: "Saran" },
    { value: "OTHER", label: "Lainnya" },
  ];

  const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "PENDING", label: "Menunggu" },
    { value: "IN_PROGRESS", label: "Dalam Proses" },
    { value: "RESOLVED", label: "Selesai" },
    { value: "REJECTED", label: "Ditolak" },
    { value: "CLOSED", label: "Ditutup" },
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

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: { variant: "warning" as const, label: "Menunggu", icon: Clock },
      IN_PROGRESS: { variant: "info" as const, label: "Proses", icon: Pause },
      RESOLVED: {
        variant: "success" as const,
        label: "Selesai",
        icon: CheckCircle,
      },
      REJECTED: { variant: "danger" as const, label: "Ditolak", icon: XCircle },
      CLOSED: { variant: "default" as const, label: "Ditutup", icon: XCircle },
    };
    return variants[status as keyof typeof variants] || variants.PENDING;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      INFRASTRUCTURE: "Infrastruktur",
      CLEANLINESS: "Kebersihan",
      LIGHTING: "Penerangan",
      SECURITY: "Keamanan",
      UTILITIES: "Utilitas",
      ENVIRONMENT: "Lingkungan",
      SUGGESTION: "Saran",
      OTHER: "Lainnya",
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      PENDING: "Menunggu",
      IN_PROGRESS: "Diproses",
      RESOLVED: "Selesai",
      REJECTED: "Ditolak",
      CLOSED: "Ditutup",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewClick = (report: Report) => {
    navigate(`/admin/reports/${report.id}`);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
  };

  const handleResetFilters = () => {
    setSelectedCategory("");
    setSelectedStatus("");
    setSelectedVisibility("");
    setDateRange({});
    setSortBy("");
    setSelectedPeriod("");
    setPage(1);
  };

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory) count++;
    if (selectedStatus) count++;
    if (selectedVisibility) count++;
    if (dateRange.from || dateRange.to) count++;
    if (sortBy) count++;
    if (sortBy === "most_liked" && selectedPeriod) count++;
    return count;
  }, [
    selectedCategory,
    selectedStatus,
    selectedVisibility,
    dateRange,
    sortBy,
    selectedPeriod,
  ]);

  // Define filter fields for AdvancedFilter
  const filterFields: FilterField[] = [
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
      name: "visibility",
      label: "Visibilitas",
      type: "select",
      value: selectedVisibility,
      onChange: (value) => {
        setSelectedVisibility(value as string);
        setPage(1);
      },
      options: [
        { value: "", label: "Semua" },
        { value: "public", label: "Publik" },
        { value: "private", label: "Privat" },
      ],
    },
    {
      name: "dateRange",
      label: "Rentang Tanggal",
      type: "daterange",
      value: dateRange,
      onChange: (value) => {
        setDateRange(value as { from?: string; to?: string });
        setPage(1);
      },
    },
  ];

  return (
    <div className={`space-y-6`}>
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-600">Kelola Laporan</h1>
        <p className="text-gray-600 dark:text-gray-200 mt-1">
          Kelola dan tanggapi laporan dari warga RT
        </p>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <CardTitle>Daftar Laporan</CardTitle>
              <Badge variant="default" size="sm">
                {total} total
              </Badge>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Cari laporan..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full md:w-64"
                />
                <Button type="submit" variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              <AdvancedFilter
                fields={filterFields}
                activeFilterCount={activeFilterCount}
                onReset={handleResetFilters}
                dropdownClassName="left-0 md:left-auto md:right-0"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <ReportManageTableSkeleton />
          ) : isError ? (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-8 w-8 text-red-400 mb-2" />
              <p className="text-red-600">Gagal memuat laporan</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Tidak ada laporan
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Belum ada laporan yang sesuai dengan filter yang dipilih
              </p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full table-fixed">
                  <colgroup>
                    <col className="w-[32%]" /> {/* Laporan */}
                    <col className="w-[13%]" /> {/* Kategori */}
                    <col className="w-[12%]" /> {/* Visibilitas */}
                    <col className="w-[17%]" /> {/* Tanggal */}
                    <col className="w-[13%]" /> {/* Status */}
                    <col className="w-[13%]" /> {/* Action */}
                  </colgroup>
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-4 pr-6 text-sm font-medium text-gray-600 dark:text-gray-300">
                        Laporan
                      </th>
                      <th className="text-left py-4 pr-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                        Kategori
                      </th>
                      <th className="text-left py-4 pr-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                        Visibilitas
                      </th>
                      <th className="text-left py-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                        Tanggal
                      </th>
                      <th className="text-left py-4 pr-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                        Status
                      </th>
                      <th className="text-left py-4 pr-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((report: Report) => {
                      return (
                        <tr
                          key={report.id}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                          onClick={() => handleViewClick(report)}
                        >
                          <td className="py-5 pr-6">
                            <div className="min-w-0 flex-1">
                              <p
                                className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 leading-5"
                                title={report.title}
                              >
                                {report.title.length > 50
                                  ? report.title.substring(0, 50) + "..."
                                  : report.title}
                              </p>
                              <p
                                className="text-sm text-gray-500 dark:text-gray-300 line-clamp-1 leading-5 mt-1"
                                title={report.description}
                              >
                                {report.description.length > 50
                                  ? report.description.substring(0, 50) + "..."
                                  : report.description}
                              </p>
                              <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-300">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span
                                  className="truncate"
                                  title={report.location.address}
                                >
                                  {report.location.address.length > 50
                                    ? report.location.address.substring(0, 50) +
                                      "..."
                                    : report.location.address}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 pr-4">
                            <Badge variant="default" size="sm">
                              <span className="block truncate text-xs">
                                {getCategoryLabel(report.category)}
                              </span>
                            </Badge>
                          </td>
                          <td className="py-5 pr-4">
                            <Badge
                              variant={report.isPublic ? "success" : "warning"}
                              size="sm"
                            >
                              <span className="block truncate text-xs">
                                {report.isPublic ? "Publik" : "Privat"}
                              </span>
                            </Badge>
                          </td>
                          <td className="py-5 max-w-0">
                            <div className="text-xs text-gray-600 dark:text-gray-300 w-full">
                              <p className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                {formatDate(report.createdAt)}
                              </p>
                              {report.user && !report.isAnonymous && (
                                <p className="text-gray-500 dark:text-gray-300 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                                  oleh {report.user.name}
                                </p>
                              )}
                              {report.isAnonymous && (
                                <p className="text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                  Anonim
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-5 pr-4">
                            <Badge variant="default" size="sm">
                              <span className="block truncate text-xs">
                                {getStatusLabel(report.status)}
                              </span>
                            </Badge>
                          </td>
                          <td className="py-5 pr-4">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDialog(report);
                                }}
                                disabled={report.status === "RESOLVED" || report.status === "REJECTED"}
                              >
                                Tanggapi
                              </Button>
                              {report.status === "IN_PROGRESS" &&
                                report.user?.role === Role.CITIZEN && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate("/admin/chat", {
                                        state: { reportId: report.id },
                                      });
                                    }}
                                    title="Buka Chat"
                                    className="ml-2"
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                  </Button>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {items.map((report: Report) => {
                  return (
                    <Card
                      key={report.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewClick(report)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 whitespace-pre-wrap break-words">
                              {report.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-300 line-clamp-2 mt-1 whitespace-pre-wrap break-words">
                              {report.description}
                            </p>
                          </div>

                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-300">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="truncate">
                              {report.location.address}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="default" size="sm">
                              {getCategoryLabel(report.category)}
                            </Badge>
                            <Badge
                              variant={getStatusBadge(report.status).variant}
                              size="sm"
                            >
                              {getStatusBadge(report.status).label}
                            </Badge>
                            <Badge
                              variant={report.isPublic ? "success" : "warning"}
                              size="sm"
                            >
                              {report.isPublic ? "Publik" : "Privat"}
                            </Badge>
                          </div>

                          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-300">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center">
                                <ThumbsUp className="h-3 w-3 mr-1" />
                                <span>{report.upvoteCount}</span>
                              </div>
                              <div className="flex items-center">
                                <MessageCircle className="h-3 w-3 mr-1" />
                                <span>{report.commentCount}</span>
                              </div>
                            </div>
                            <div>
                              <p>{formatDate(report.createdAt)}</p>
                              {report.user && !report.isAnonymous && (
                                <p>oleh {report.user.name}</p>
                              )}
                              {report.isAnonymous && <p>Anonim</p>}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-gray-100 dark:border-gray-600 flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDialog(report);
                              }}
                              disabled={report.status === "RESOLVED" || report.status === "REJECTED"}
                            >
                              Tanggapi
                            </Button>
                            {report.status === "IN_PROGRESS" &&
                              report.user?.role === Role.CITIZEN && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate("/admin/chat", {
                                      state: { reportId: report.id },
                                    });
                                  }}
                                  title="Buka Chat"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                              )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="pt-6">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={total}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  showPageSizeSelector={true}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {isDialogOpen && currentReport && (
        <>
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40 mb-0" />

          {currentReport.status === "PENDING" ? (
            // Modal for PENDING status - Accept/Reject
            <Card
              ref={dialogRef}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[600px] bg-gray-50 dark:bg-gray-800 rounded-3xl max-h-[85vh] overflow-y-auto"
            >
              <CardHeader className="flex flex-row justify-between">
                <CardTitle>Tanggapi Laporan</CardTitle>
                <X
                  className="w-5 h-5 hover:cursor-pointer"
                  onClick={closeDialog}
                />
              </CardHeader>

              <CardContent>
                <div className="flex flex-col gap-4">
                  {/* Report Details */}
                  <div className="space-y-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
                    <h3 className="text-base font-bold text-gray-800 dark:text-white mb-3 pb-2 border-b border-gray-300 dark:border-gray-600">
                      Detail Laporan
                    </h3>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">
                        Judul
                      </h3>
                      <p className="text-base text-gray-900 dark:text-white">
                        {currentReport.title}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">
                        Deskripsi
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                        {currentReport.description}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">
                        Kategori
                      </h3>
                      <Badge variant="default" size="sm">
                        {getCategoryLabel(currentReport.category)}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">
                        Lokasi
                      </h3>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                        <p className="text-sm text-gray-700 dark:text-gray-200">
                          {currentReport.location.address}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">
                        Tanggal Dibuat
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-200">
                        {formatDate(currentReport.createdAt)}
                      </p>
                    </div>
                    {currentReport.attachments &&
                      currentReport.attachments.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
                            Lampiran
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                            {currentReport.attachments.map((attachment) => (
                              <img
                                key={attachment.id}
                                src={attachment.url}
                                alt={attachment.filename}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Accept/Reject Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      className="flex-1"
                      variant="primary"
                      onClick={handleAcceptReport}
                      loading={isResponseLoading}
                      disabled={isResponseLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Terima Laporan
                    </Button>
                    <Button
                      className="flex-1"
                      variant="danger"
                      onClick={openRejectModal}
                      disabled={isResponseLoading}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Tolak Laporan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Modal for IN_PROGRESS status - Response with message and attachments
            <Card
              ref={dialogRef}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[500px] bg-gray-50 dark:bg-gray-800 rounded-3xl max-h-[85vh] overflow-y-auto"
            >
              <CardHeader className="flex flex-row justify-between">
                <CardTitle>Tanggapi Laporan</CardTitle>
                <X
                  className="w-5 h-5 hover:cursor-pointer"
                  onClick={closeDialog}
                />
              </CardHeader>

              <CardContent>
                <div className="flex flex-col gap-4">
                  <Textarea
                    label="Pesan Tanggapan"
                    showCounter
                    limit={200}
                    placeholder="Isi Tanggapan Anda"
                    error={responseError}
                    onChange={(e) => setMessage(e.target.value)}
                  />

                  <CloudinaryUpload
                    folder="reports"
                    multiple
                    accept="image/jpeg,image/png,image/jpg"
                    maxFiles={3}
                    attachments={dialogAttachments}
                    onUploaded={handleDialogUploaded}
                    onRemove={handleDialogRemove}
                    onUploadingChange={setIsUploading}
                    error={imageError}
                  />

                  <Button
                    onClick={handleSubmitResponse}
                    disabled={
                      isUploading || (!message && dialogAttachments.length === 0)
                    }
                    loading={isResponseLoading}
                  >
                    {isUploading ? "Mengunggah..." : "Kirim Tanggapan"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Rejection Reason Modal */}
      {isRejectModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40 mb-0" />

          <Card
            ref={rejectDialogRef}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[500px] bg-gray-50 dark:bg-gray-800 rounded-3xl max-h-[85vh] overflow-y-auto"
          >
            <CardHeader className="flex flex-row justify-between">
              <CardTitle>Alasan Penolakan</CardTitle>
              <X
                className="w-5 h-5 hover:cursor-pointer"
                onClick={cancelRejection}
              />
            </CardHeader>

            <CardContent>
              <div className="flex flex-col gap-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Mohon berikan alasan mengapa laporan ini ditolak.
                </p>

                <Textarea
                  label="Alasan Penolakan"
                  showCounter
                  limit={500}
                  placeholder="Masukkan alasan penolakan laporan"
                  value={rejectionReason}
                  error={rejectionError}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />

                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={cancelRejection}
                    disabled={isResponseLoading}
                  >
                    Batal
                  </Button>
                  <Button
                    className="flex-1"
                    variant="danger"
                    onClick={handleSubmitRejection}
                    loading={isResponseLoading}
                    disabled={isResponseLoading || !rejectionReason.trim()}
                  >
                    Tolak Laporan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
