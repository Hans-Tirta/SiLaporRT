import React, { useState, useRef } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  User,
  ThumbsUp,
  MessageCircle,
  Send,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Textarea from "../../components/ui/Textarea";
import Breadcrumb from "../../components/ui/Breadcrumb";
import AttachmentViewer from "../../components/ui/AttachmentViewer";
import {
  getReportDetails,
  toggleUpvote,
  addComment,
  getUserUpvoteStatus,
} from "../../services/reportService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Attachment, Response, ReportComment } from "../../types/report.types";
import ReportDetailSkeleton from "./components/ReportDetailSkeleton";
import { useAuthContext } from "../../contexts/AuthContext";
import {
  GoogleMap,
  Libraries,
  LoadScript,
  Marker,
} from "@react-google-maps/api";

const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user, isAuthenticated } = useAuthContext();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const libraries: Libraries = ["places"];

  const lastUpvoteTime = useRef<number>(0);
  const UPVOTE_COOLDOWN = 500;

  const isFromAdmin =
    location.state?.from === "admin" ||
    location.pathname.includes("/admin") ||
    document.referrer.includes("/admin/reports");

  const isFromMyReports =
    location.state?.from === "my-reports" ||
    document.referrer.includes("/my-reports");

  const {
    data: report,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["report", id],
    queryFn: () => getReportDetails(id!),
  });

  const { data: upvoteStatus } = useQuery({
    queryKey: ["upvote-status", id],
    queryFn: () => getUserUpvoteStatus(id!),
    enabled: !!id && isAuthenticated,
  });

  const hasUpvoted = upvoteStatus?.data?.result || false;

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: { variant: "warning" as const, label: "Menunggu" },
      IN_PROGRESS: { variant: "info" as const, label: "Dalam Proses" },
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
      OTHER: "Lainnya",
    };
    return labels[category as keyof typeof labels] || category;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: idLocale,
    }).replace(/^sekitar /i, "");
  };

  const handleMapClick = () => {
    window.open(
      `https://www.google.com/maps?q=${report.location.latitude},${report.location.longitude}`,
      "_blank",
    );
  };

  const handleUpvote = useMutation({
    mutationKey: ["upvote", id],
    mutationFn: () => toggleUpvote(report!.id),
    onSuccess: () => {
      // Refetch data from server
      queryClient.invalidateQueries({ queryKey: ["report", id] });
      queryClient.invalidateQueries({ queryKey: ["upvote-status", id] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["recent-reports"] });
    },
    onError: (error) => {
      console.error("Error toggling upvote:", error);
    },
  });

  const handleUpvoteClick = () => {
    const now = Date.now();

    if (now - lastUpvoteTime.current < UPVOTE_COOLDOWN) {
      return;
    }

    if (!handleUpvote.isPending) {
      lastUpvoteTime.current = now;
      handleUpvote.mutate();
    }
  };

  // const handleUpvote = () => {
  //   setHasUpvoted(!hasUpvoted);
  //   // In real app, call API to toggle upvote
  // };

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => addComment(report!.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["recent-reports"] });
      setCommentText("");
    },
    onError: (error) => {
      console.error("Error adding comment:", error);
    },
  });

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText);
  };

  if (isLoading) return <ReportDetailSkeleton />;

  if (isError || !report) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 dark:text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {!report ? "Laporan Tidak Ditemukan" : "Gagal Memuat Laporan"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {!report
              ? "Laporan yang Anda cari tidak ditemukan atau mungkin sudah dihapus."
              : "Terjadi kesalahan saat memuat detail laporan. Silakan coba lagi."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isError && (
              <Button
                variant="outline"
                onClick={() => refetch()}
                loading={isFetching}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Coba Lagi
              </Button>
            )}
            <Link to="/reports">
              <Button>Kembali ke Daftar Laporan</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }
  const statusInfo = getStatusBadge(report.status);

  // Dynamic breadcrumb
  const breadcrumbItems = isFromAdmin
    ? [
        { label: "Kelola Laporan", href: "/admin/reports" },
        { label: report.title },
      ]
    : isFromMyReports
      ? [
          { label: "Laporan Saya", href: "/my-reports" },
          { label: report.title },
        ]
      : [{ label: "Laporan", href: "/reports" }, { label: report.title }];

  return (
    <div className="space-y-6">
      <Breadcrumb items={breadcrumbItems} />

      {/* Report Header*/}
      <Card>
        <CardHeader>
          {/* Title */}
          <CardTitle className="text-2xl text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
            {report.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Map */}
          <div className="rounded-lg overflow-hidden h-64 sm:h-80 lg:h-96">
            <LoadScript
              googleMapsApiKey={import.meta.env.VITE_API_GOOGLE_MAP}
              libraries={libraries}
            >
              <GoogleMap
                zoom={15}
                center={{
                  lat: report.location.latitude,
                  lng: report.location.longitude,
                }}
                onClick={handleMapClick}
                mapContainerClassName="w-full h-full cursor-pointer"
              >
                <Marker
                  position={{
                    lat: report.location.latitude,
                    lng: report.location.longitude,
                  }}
                />
              </GoogleMap>
            </LoadScript>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center min-w-0">
              <User className="mr-1.5 h-4 w-4 flex-shrink-0" />
              <span className="truncate max-w-[150px] sm:max-w-[200px]">
                {report.isAnonymous
                  ? "Anonim"
                  : report.user?.isDeleted
                    ? "Pengguna Terhapus"
                    : report.user?.name}
              </span>
            </div>
            {isAuthenticated && (
              <Button
                variant={hasUpvoted ? "primary" : "outline"}
                size="sm"
                onClick={handleUpvoteClick}
                disabled={handleUpvote.isPending}
                className={
                  hasUpvoted
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : ""
                }
              >
                <ThumbsUp
                  className={`mr-1 h-4 w-4 ${hasUpvoted ? "fill-current" : ""}`}
                />
                {report.upvoteCount}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Deskripsi + Info Laporan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Laporan */}
        <div className="lg:order-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Info Laporan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Status
                </label>
                <div className="mt-1">
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Kategori
                </label>
                <div className="mt-1">
                  <Badge variant="default">
                    {getCategoryLabel(report.category)}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Lokasi
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {report.location.address}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  RT {report.location.rt} RW {report.location.rw}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Dilaporkan
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {formatDateTime(report.createdAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deskripsi Laporan */}
        <div className="lg:col-span-2 lg:order-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Deskripsi Laporan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap break-words">
                {report.description
                  .split("\n")
                  .map((paragraph: string, index: number) => (
                    <p
                      key={index}
                      className="mb-4 last:mb-0 text-gray-600 dark:text-gray-300 leading-relaxed"
                    >
                      {paragraph}
                    </p>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lampiran */}
      {report.attachments.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <AttachmentViewer
              attachments={report.attachments.map((attachment: Attachment) => ({
                id: attachment.id,
                filename: attachment.filename,
                url: attachment.url,
                fileType: attachment.fileType as
                  | "image"
                  | "video"
                  | "audio"
                  | "document",
                format: attachment.filename.split(".").pop()?.toLowerCase(),
              }))}
              title="Lampiran"
              gridCols={3}
            />
          </CardContent>
        </Card>
      )}

      {/* Tanggapan Resmi RT */}
      {report.responseCount > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tanggapan Resmi RT</CardTitle>
              <Badge variant={statusInfo.variant} size="sm">
                {statusInfo.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.responses.map((response: Response, index: number) => (
                <div
                  key={response.id}
                  className={`rounded-lg p-4  ${
                    index === 0
                      ? " bg-primary-50 dark:bg-gray-700 border  border-gray-200 dark:border-gray-600"
                      : "bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-sm font-medium mr-3 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                        {response.responder.profile ? (
                          <img
                            src={response.responder.profile}
                            alt={response.responder.name
                              .charAt(0)
                              .toUpperCase()}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          response.responder.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {response.responder.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Admin RT
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatRelativeTime(response.createdAt)}
                    </span>
                  </div>

                  {response.message && (
                    <p className="text-gray-600 dark:text-gray-300 ml-11 mb-3">
                      {response.message}
                    </p>
                  )}

                  {response.attachments && response.attachments.length > 0 && (
                    <div className="ml-11 mt-2">
                      <AttachmentViewer
                        attachments={response.attachments.map(
                          (att: Attachment) => ({
                            id: att.id,
                            filename: att.filename,
                            url: att.url,
                            fileType: att.fileType as
                              | "image"
                              | "video"
                              | "audio"
                              | "document",
                            format: att.filename
                              .split(".")
                              .pop()
                              ?.toLowerCase(),
                          }),
                        )}
                        showTitle={false}
                        gridCols={5}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diskusi & Komentar */}
      <div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-6 w-6 dark:text-white" />
              <CardTitle>Diskusi & Komentar</CardTitle>
              <span className="text-lg font-bold text-gray-500 dark:text-gray-400">
                {report.commentCount}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {/* Comment Form */}
            {isAuthenticated ? (
              <div className="mb-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center overflow-hidden justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                      {user!.profile ? (
                        <img
                          src={user!.profile}
                          alt={user!.name.charAt(0)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user!.name.charAt(0)
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Tulis komentar Anda..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      limit={250}
                      showCounter
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmitComment();
                        }
                      }}
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        onClick={handleSubmitComment}
                        disabled={
                          !commentText.trim() || addCommentMutation.isPending
                        }
                        loading={addCommentMutation.isPending}
                      >
                        <Send className="mr-1 h-4 w-4" />
                        Kirim
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  Silakan masuk untuk bergabung dalam diskusi
                </p>
                <Link to="/login">
                  <Button size="sm">Masuk</Button>
                </Link>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {report.reportComments.map((comment: ReportComment) => (
                <div key={comment.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-sm font-medium ${
                        comment.user.role === "RT_ADMIN"
                          ? "bg-primary-600 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {comment.user.isDeleted ? (
                        <User className="h-4 w-4" />
                      ) : comment.user.profile ? (
                        <img
                          src={comment.user.profile}
                          alt={comment.user.name.charAt(0).toUpperCase()}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        comment.user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-1">
                      <span
                        className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[150px] sm:max-w-[200px]"
                        title={
                          comment.user.isDeleted
                            ? "Pengguna Terhapus"
                            : comment.user.name
                        }
                      >
                        {comment.user.isDeleted
                          ? "Pengguna Terhapus"
                          : comment.user.name}
                      </span>
                      {comment.user.role === "RT_ADMIN" && (
                        <Badge variant="info" size="sm">
                          Admin RT
                        </Badge>
                      )}
                      {comment.user.id === report.user.id &&
                        !report.isAnonymous && (
                          <Badge variant="success" size="sm">
                            Penulis
                          </Badge>
                        )}
                      <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {report.reportComments.length === 0 && (
              <div className="text-center py-8">
                <MessageCircle className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">
                  Belum ada komentar
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportDetailPage;
