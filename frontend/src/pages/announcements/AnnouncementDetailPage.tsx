import { useParams, useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAnnouncement } from "../../services/announcementService";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Breadcrumb from "../../components/ui/Breadcrumb";
import Button from "../../components/ui/Button";
import AttachmentViewer from "../../components/ui/AttachmentViewer";
import AnnouncementDetailSkeleton from "./components/AnnouncementDetailSkeleton";
import { Pin, Calendar, Bell, AlertCircle, RefreshCw } from "lucide-react";

function formatDateTime(s?: string | null) {
  if (!s) return "-";
  return new Date(s).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  // Detect where user came from based on location state or current URL context
  const isFromAdmin =
    location.state?.from === "admin" ||
    location.pathname.includes("/admin") ||
    document.referrer.includes("/admin/announcements");

  const {
    data: a,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["announcement", id],
    queryFn: () => getAnnouncement(id!),
  });

  if (isLoading) return <AnnouncementDetailSkeleton />;

  if (isError || !a) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {!a ? "Pengumuman Tidak Ditemukan" : "Gagal Memuat Pengumuman"}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {!a
              ? "Pengumuman yang Anda cari tidak ditemukan atau mungkin sudah dihapus."
              : "Terjadi kesalahan saat memuat detail pengumuman. Silakan coba lagi."}
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
            <Link to={isFromAdmin ? "/admin/announcements" : "/announcements"}>
              <Button>Kembali ke Daftar Pengumuman</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const priorityVariant = a.priority === "HIGH" ? "warning" : "default";

  // Dynamic breadcrumb based on where user came from
  const breadcrumbItems = isFromAdmin
    ? [
        { label: "Kelola Pengumuman", href: "/admin/announcements" },
        { label: a.title },
      ]
    : [{ label: "Pengumuman", href: "/announcements" }, { label: a.title }];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                {a.isPinned && (
                  <span className="inline-flex items-center gap-1 text-amber-600 text-sm font-medium">
                    <Pin className="h-3 w-3" /> Pinned
                  </span>
                )}
                <Badge variant="info">{a.type}</Badge>
                <Badge
                  variant={priorityVariant as "danger" | "warning" | "default"}
                >
                  {a.priority}
                </Badge>
              </div>

              <CardTitle className="text-2xl text-gray-900 dark:text-gray-100 mb-4 whitespace-pre-wrap break-words">
                {a.title}
              </CardTitle>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                <span className="inline-flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  {formatDateTime(a.publishAt || a.createdAt)}
                </span>
                <span className="inline-flex items-center">
                  <Bell className="mr-1 h-4 w-4" />
                  {a.author?.name || "-"}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Informasi + Isi Pengumuman */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informasi - mobile first, desktop right */}
        <div className="lg:order-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Informasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-200">
                  Status Tayang
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {a.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-200">
                  Mulai Tayang
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDateTime(a.publishAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-200">
                  Berakhir
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDateTime(a.expireAt)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Isi Pengumuman - mobile second, desktop left */}
        <div className="lg:col-span-2 lg:order-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Isi Pengumuman</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300">
                {a.content}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lampiran */}
      {a.attachments?.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <AttachmentViewer
              attachments={a.attachments.map((att) => ({
                id: att.id,
                filename: att.filename,
                url: att.url,
                fileType: att.fileType as
                  | "image"
                  | "video"
                  | "audio"
                  | "document",
                format: att.filename.split(".").pop()?.toLowerCase(),
              }))}
              title="Lampiran"
              gridCols={3}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
