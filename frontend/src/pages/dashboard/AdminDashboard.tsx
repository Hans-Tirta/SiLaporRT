import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  ArrowRight,
  Megaphone,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import StatusDonutChart from "./components/StatusDonutChart";
import CategoryBarChart from "./components/CategoryBarChart";
import AdminDashboardSkeleton from "./components/AdminDashboardSkeleton";
import AdvancedFilter, {
  FilterField,
} from "../../components/common/AdvancedFilter";
import { useAuthContext } from "../../contexts/AuthContext";
import {
  getDashboardStats,
  type DashboardStats,
} from "../../services/reportService";
import { getAnnouncementsCount } from "../../services/announcementService";

const AdminDashboard: React.FC = () => {
  const { user } = useAuthContext();
  const [selectedPeriod, setSelectedPeriod] = useState("bulan-ini");
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>(
    {}
  );
  const [displayDateRange, setDisplayDateRange] = useState<{
    from?: string;
    to?: string;
  }>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(
    null
  );
  const [totalAnnouncements, setTotalAnnouncements] = useState<number>(0);

  const getDateRangeForPeriod = (
    period: string
  ): { from: string; to: string } | null => {
    const today = new Date();

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    switch (period) {
      case "hari-ini": {
        return { from: formatDate(today), to: formatDate(today) };
      }
      case "kemarin": {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { from: formatDate(yesterday), to: formatDate(yesterday) };
      }
      case "minggu-ini": {
        const firstDayOfWeek = new Date(today);
        const lastDayOfWeek = new Date(today);
        const dayOfWeek = today.getDay();

        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; 
        firstDayOfWeek.setDate(today.getDate() - diff);

        const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
        lastDayOfWeek.setDate(today.getDate() + daysUntilSunday);

        return {
          from: formatDate(firstDayOfWeek),
          to: formatDate(lastDayOfWeek),
        };
      }
      case "bulan-ini": {
        const firstDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );
        const lastDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        );
        return {
          from: formatDate(firstDayOfMonth),
          to: formatDate(lastDayOfMonth),
        };
      }
      case "tahun-ini": {
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
        const lastDayOfYear = new Date(today.getFullYear(), 11, 31);
        return {
          from: formatDate(firstDayOfYear),
          to: formatDate(lastDayOfYear),
        };
      }
      case "custom":
        return null; 
      default:
        return null;
    }
  };

  const getActiveDateRange = () => {
    if (selectedPeriod === "custom") {
      return dateRange.from && dateRange.to ? dateRange : null;
    }
    return getDateRangeForPeriod(selectedPeriod);
  };

  useEffect(() => {
    if (selectedPeriod !== "custom") {
      const calculatedRange = getDateRangeForPeriod(selectedPeriod);
      if (calculatedRange) {
        setDisplayDateRange(calculatedRange);
      }
    } else {
      setDisplayDateRange(dateRange);
    }
  }, [selectedPeriod, dateRange]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const activeDateRange = getActiveDateRange();

      let daysBack: number | undefined = undefined;
      if (activeDateRange?.from && activeDateRange?.to) {
        const fromDate = new Date(activeDateRange.from);
        const toDate = new Date(activeDateRange.to);
        const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
        daysBack = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      }

      const [stats, announcementsCount] = await Promise.all([
        getDashboardStats(daysBack),
        getAnnouncementsCount(daysBack),
      ]);

      setDashboardData(stats);
      setTotalAnnouncements(announcementsCount);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, dateRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStats = () => {
    if (!dashboardData) return [];

    return [
      {
        title: "Total Laporan",
        value: dashboardData.totalReports.toString(),
        icon: FileText,
        color: "text-primary-600",
        bgColor: "bg-primary-100",
        href: "/admin/reports",
      },
      {
        title: "Menunggu Tindakan",
        value: dashboardData.pendingReports.toString(),
        icon: Clock,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        href: "/admin/reports",
      },
      {
        title: "Total Pengumuman",
        value: totalAnnouncements.toString(),
        icon: Megaphone,
        color: "text-green-600",
        bgColor: "bg-green-100",
        href: "/admin/announcements",
      },
      {
        title: "Warga Aktif",
        value: dashboardData.activeUsers.toString(),
        icon: Users,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
        href: "/admin/users",
      },
    ];
  };

  const getStatusChartData = () => {
    if (!dashboardData) return [];

    return [
      {
        name: "Pending",
        value: dashboardData.pendingReports,
        color: "#f59e0b",
        bgColor: "bg-yellow-100",
      },
      {
        name: "Proses",
        value: dashboardData.inProgressReports || 0,
        color: "#3b82f6",
        bgColor: "bg-primary-100",
      },
      {
        name: "Selesai",
        value: dashboardData.resolvedReports,
        color: "#10b981",
        bgColor: "bg-green-100",
      },
      {
        name: "Ditolak",
        value: dashboardData.rejectedReports || 0,
        color: "#ef4444",
        bgColor: "bg-red-100",
      },
    ];
  };

  const getCategoryChartData = () => {
    if (!dashboardData) return [];

    const categoryColors = {
      INFRASTRUCTURE: "#3b82f6",
      CLEANLINESS: "#10b981",
      LIGHTING: "#f59e0b",
      SECURITY: "#ef4444",
      UTILITIES: "#8b5cf6",
      ENVIRONMENT: "#06b6d4",
      SUGGESTION: "#f97316",
      OTHER: "#6b7280",
    };

    const categoryLabels = {
      INFRASTRUCTURE: "Infrastruktur",
      CLEANLINESS: "Kebersihan",
      LIGHTING: "Penerangan",
      SECURITY: "Keamanan",
      UTILITIES: "Utilitas",
      ENVIRONMENT: "Lingkungan",
      SUGGESTION: "Saran",
      OTHER: "Lainnya",
    };

    return dashboardData.categoryStats.map((item) => ({
      name:
        categoryLabels[item.category as keyof typeof categoryLabels] ||
        item.category,
      count: item.count,
      color:
        categoryColors[item.category as keyof typeof categoryColors] ||
        "#6b7280",
    }));
  };

  // Mock recent activities - simplified
  const recentActivities = [
    {
      id: "1",
      type: "NEW_REPORT",
      message: 'Laporan baru: "Jalan berlubang di RT 05"',
      user: "Budi Santoso",
      time: "2 jam lalu",
      icon: FileText,
    },
    {
      id: "2",
      type: "STATUS_UPDATE",
      message: 'Laporan "Lampu jalan mati" selesai ditindaklanjuti',
      user: "Admin RT",
      time: "4 jam lalu",
      icon: CheckCircle,
    },
    {
      id: "3",
      type: "NEW_ANNOUNCEMENT",
      message: 'Pengumuman baru: "Rapat Bulanan RT"',
      user: "Admin RT",
      time: "6 jam lalu",
      icon: Megaphone,
    },
    {
      id: "4",
      type: "NEW_COMMENT",
      message: "Komentar baru pada laporan infrastruktur",
      user: "Siti Aminah",
      time: "1 hari lalu",
      icon: MessageSquare,
    },
  ];

  const periodOptions = [
    { value: "hari-ini", label: "Hari Ini" },
    { value: "kemarin", label: "Kemarin" },
    { value: "minggu-ini", label: "Minggu Ini" },
    { value: "bulan-ini", label: "Bulan Ini" },
    { value: "tahun-ini", label: "Tahun Ini" },
    { value: "custom", label: "Lainnya" },
  ];

  // Calculate active filter count
  const activeFilterCount = (() => {
    let count = 0;
    if (selectedPeriod && selectedPeriod !== "bulan-ini") count++; // bulan-ini is default
    if (selectedPeriod === "custom" && (dateRange.from || dateRange.to))
      count++;
    return count;
  })();

  const filterFields: FilterField[] = [
    {
      name: "period",
      label: "Periode Waktu",
      type: "select",
      value: selectedPeriod,
      onChange: (value) => {
        setSelectedPeriod(value as string);
        if (value !== "custom") {
          setDateRange({});
        }
      },
      options: periodOptions,
    },
    {
      name: "dateRange",
      label: "Rentang Tanggal",
      type: "daterange" as const,
      value: selectedPeriod === "custom" ? dateRange : displayDateRange,
      onChange: (value: string | { from?: string; to?: string }) => {
        if (selectedPeriod === "custom") {
          setDateRange(value as { from?: string; to?: string });
        }
      },
      disabled: selectedPeriod !== "custom",
    },
  ];

  const handleResetFilters = () => {
    setSelectedPeriod("bulan-ini");
    setDateRange({});
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-600">
            Dashboard Admin RT
          </h1>
          <p className="text-gray-600 dark:text-gray-200 mt-1">
            Selamat datang, {user?.name}. Overview sistem RT Anda.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <AdvancedFilter
            fields={filterFields}
            activeFilterCount={activeFilterCount}
            onReset={handleResetFilters}
          />
        </div>
      </div>

      {loading && (
        <>
          <AdminDashboardSkeleton />
        </>
      )}

      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600 dark:text-red-400">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>Terjadi kesalahan saat memuat data: {error}</p>
              <Button className="mt-4" onClick={() => window.location.reload()}>
                Muat Ulang
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && dashboardData && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {getStats().map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Link key={index} to={stat.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                            {stat.title}
                          </p>
                          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                            {stat.value}
                          </p>
                        </div>
                        <div className={`p-3 rounded-full ${stat.bgColor}`}>
                          <Icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mt-8">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-primary-500" />
                  Status Laporan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatusDonutChart data={getStatusChartData()} />
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-blue-500" />
                  Kategori Laporan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryBarChart data={getCategoryChartData()} />
              </CardContent>
            </Card>

            <Card className="xl:col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-green-500" />
                  Aktivitas Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  {recentActivities.slice(0, 4).map((activity) => {
                    const Icon = activity.icon;

                    return (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-3"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <Icon className="h-4 w-4 text-gray-600 dark:text-gray-200" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-gray-100 mb-1">
                            {activity.message}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-200">
                            <span>{activity.user}</span>
                            <span className="mx-1">•</span>
                            <span>{activity.time}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-2 border-t border-gray-100">
                  <Link to="/admin/activities">
                    <Button variant="ghost" size="sm" className="w-full">
                      Lihat Semua Aktivitas
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
