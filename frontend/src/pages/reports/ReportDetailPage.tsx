import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  ThumbsUp,
  MessageCircle,
  Send,
  Paperclip,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Textarea from "../../components/ui/Textarea";
import { useAuth } from "../../hooks/useAuth";

const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  // Mock report data - in real app, fetch by ID
  const mockReport = {
    id: id || "1",
    title: "Jalan berlubang besar di RT 05 RW 02",
    description: `Jalan di depan rumah nomor 45 terdapat lubang besar yang membahayakan pengendara motor dan mobil. Sudah beberapa kali ada kecelakaan kecil karena lubang ini.

Lubang tersebut berukuran sekitar 50cm x 30cm dengan kedalaman sekitar 15cm. Sangat berbahaya terutama saat malam hari karena tidak terlihat jelas.

Mohon segera diperbaiki karena ini adalah jalan utama yang dilalui banyak warga setiap hari.`,
    category: "INFRASTRUCTURE",
    status: "PENDING",
    isPublic: true,
    isAnonymous: false,
    upvoteCount: 12,
    commentCount: 5,
    responseCount: 0,
    location: {
      address: "Jl. Mawar No. 45, RT 05 RW 02",
      rt: "05",
      rw: "02",
      latitude: -6.2088,
      longitude: 106.8456,
    },
    user: {
      id: "user1",
      name: "Budi Santoso",
      role: "CITIZEN",
    },
    attachments: [
      {
        id: "1",
        filename: "lubang-jalan-1.jpg",
        url: "#",
        fileType: "image",
      },
      {
        id: "2",
        filename: "lubang-jalan-2.jpg",
        url: "#",
        fileType: "image",
      },
    ],
    createdAt: "2024-01-20T08:30:00Z",
    updatedAt: "2024-01-20T08:30:00Z",
  };

  // Mock comments data
  const mockComments = [
    {
      id: "1",
      content:
        "Betul sekali, saya juga hampir terjatuh kemarin karena lubang ini. Tolong segera diperbaiki.",
      user: {
        id: "user2",
        name: "Siti Aminah",
        role: "CITIZEN",
      },
      createdAt: "2024-01-20T10:15:00Z",
    },
    {
      id: "2",
      content:
        "Sudah saya laporkan ke ketua RW, akan segera dikomunikasikan ke dinas terkait.",
      user: {
        id: "admin1",
        name: "Pak RT",
        role: "RT_ADMIN",
      },
      createdAt: "2024-01-20T11:30:00Z",
    },
    {
      id: "3",
      content: "Terima kasih pak RT. Semoga cepat ditindaklanjuti.",
      user: {
        id: "user3",
        name: "Ahmad Wijaya",
        role: "CITIZEN",
      },
      createdAt: "2024-01-20T12:45:00Z",
    },
  ];

  // Mock responses (official responses from RT_ADMIN)
  const mockResponses = [];

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

  const handleUpvote = () => {
    setHasUpvoted(!hasUpvoted);
    // In real app, call API to toggle upvote
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    // Simulate API call
    setTimeout(() => {
      setCommentText("");
      setIsSubmittingComment(false);
      // In real app, refresh comments data
    }, 1000);
  };

  if (!mockReport) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Laporan Tidak Ditemukan
        </h2>
        <p className="text-gray-600 mb-6">
          Laporan yang Anda cari tidak ditemukan atau mungkin sudah dihapus.
        </p>
        <Link to="/reports">
          <Button>Kembali ke Daftar Laporan</Button>
        </Link>
      </div>
    );
  }

  const statusInfo = getStatusBadge(mockReport.status);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      </div>

      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="default">
                  {getCategoryLabel(mockReport.category)}
                </Badge>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                {mockReport.isAnonymous && (
                  <Badge variant="default">Anonim</Badge>
                )}
                {!mockReport.isPublic && (
                  <Badge variant="default">
                    <EyeOff className="mr-1 h-3 w-3" />
                    Privat
                  </Badge>
                )}
              </div>

              <CardTitle className="text-2xl text-gray-900 mb-4">
                {mockReport.title}
              </CardTitle>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <User className="mr-1 h-4 w-4" />
                  <span>
                    {mockReport.isAnonymous ? "Anonim" : mockReport.user.name}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  <span>{formatDateTime(mockReport.createdAt)}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="mr-1 h-4 w-4" />
                  <span>{mockReport.location.address}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <Button
                  variant={hasUpvoted ? "primary" : "outline"}
                  size="sm"
                  onClick={handleUpvote}
                  className="flex items-center"
                >
                  <ThumbsUp className="mr-1 h-4 w-4" />
                  {mockReport.upvoteCount + (hasUpvoted ? 1 : 0)}
                </Button>
              )}

              <div className="flex items-center text-sm text-gray-500">
                <MessageCircle className="mr-1 h-4 w-4" />
                <span>{mockReport.commentCount} komentar</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Report Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Deskripsi Laporan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {mockReport.description.split("\n").map((paragraph, index) => (
                  <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {mockReport.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Lampiran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {mockReport.attachments.map((attachment) => (
                    <div key={attachment.id} className="relative group">
                      {attachment.fileType === "image" ? (
                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                          <div className="text-center">
                            <Paperclip className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600">
                              {attachment.filename}
                            </p>
                            <p className="text-xs text-gray-400">Gambar</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-center">
                            <Paperclip className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {attachment.filename}
                              </p>
                              <p className="text-xs text-gray-500">
                                {attachment.fileType.toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Official Responses */}
          {mockResponses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tanggapan Resmi RT</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockResponses.map((response: any) => (
                    <div
                      key={response.id}
                      className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                            {response.responder.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {response.responder.name}
                            </p>
                            <p className="text-sm text-gray-600">Admin RT</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDateTime(response.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700 ml-11">{response.message}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle>Diskusi & Komentar</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Comment Form */}
              {isAuthenticated ? (
                <div className="mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                        {user?.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Tulis komentar Anda..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows={3}
                      />
                      <div className="flex justify-end mt-2">
                        <Button
                          size="sm"
                          onClick={handleSubmitComment}
                          disabled={!commentText.trim() || isSubmittingComment}
                          loading={isSubmittingComment}
                        >
                          <Send className="mr-1 h-4 w-4" />
                          Kirim
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-600 mb-2">
                    Silakan masuk untuk bergabung dalam diskusi
                  </p>
                  <Link to="/login">
                    <Button size="sm">Masuk</Button>
                  </Link>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {mockComments.map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          comment.user.role === "RT_ADMIN"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {comment.user.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {comment.user.name}
                        </span>
                        {comment.user.role === "RT_ADMIN" && (
                          <Badge variant="info" size="sm">
                            Admin RT
                          </Badge>
                        )}
                        <span className="text-sm text-gray-500">
                          {formatDateTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {mockComments.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-500">Belum ada komentar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Report Info */}
          <Card>
            <CardHeader>
              <CardTitle>Info Laporan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Status
                </label>
                <div className="mt-1">
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Kategori
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {getCategoryLabel(mockReport.category)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Lokasi
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {mockReport.location.address}
                </p>
                <p className="text-xs text-gray-500">
                  RT {mockReport.location.rt} RW {mockReport.location.rw}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Dilaporkan
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDateTime(mockReport.createdAt)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Dukungan
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {mockReport.upvoteCount + (hasUpvoted ? 1 : 0)} warga
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {user?.role === "RT_ADMIN" && (
            <Card>
              <CardHeader>
                <CardTitle>Aksi Admin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Ubah Status
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Berikan Tanggapan
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportDetailPage;
