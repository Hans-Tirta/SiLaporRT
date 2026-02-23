import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Pin,
  PinOff,
  Eye,
  EyeOff,
  Edit3,
  Megaphone,
  AlertTriangle,
} from "lucide-react";
import {
  adminListAnnouncements,
  setActive,
  setPinned,
} from "../../services/announcementAdminService";
import Button from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Pagination from "../../components/ui/Pagination";
import AnnouncementManageTableSkeleton from "./components/AnnouncementManageTableSkeleton";
import { Announcement } from "../../types/announcement.types";
import AdvancedFilter, {
  FilterField,
} from "../../components/common/AdvancedFilter";

export default function ManageAnnouncementsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>(
    {},
  );
  const [sortBy, setSortBy] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "admin-announcements",
      {
        page,
        pageSize,
        showInactiveOnly,
        selectedType,
        selectedPriority,
        dateRange,
        sortBy,
      },
    ],
    queryFn: () =>
      adminListAnnouncements({
        page,
        pageSize,
        showInactiveOnly,
        pinnedFirst: true,
        type: selectedType,
        priority: selectedPriority,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        sortBy,
      }),
    staleTime: 0,
  });

  const mutPin = useMutation({
    mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) =>
      setPinned(id, isPinned),
    onMutate: async ({ id, isPinned }) => {
      // Cancel outgoing refetches to prevent overwriting optimistic updates
      await qc.cancelQueries({ queryKey: ["admin-announcements"] });

      // Snapshot the previous value for rollback
      const previousData = qc.getQueryData([
        "admin-announcements",
        {
          page,
          pageSize,
          showInactiveOnly,
          selectedType,
          selectedPriority,
          dateRange,
        },
      ]);

      // Optimistically update the cache
      qc.setQueryData(
        [
          "admin-announcements",
          {
            page,
            pageSize,
            showInactiveOnly,
            selectedType,
            selectedPriority,
            dateRange,
          },
        ],
        (old: unknown) => {
          if (!old || typeof old !== "object") return old;
          const data = old as { items: Announcement[]; total: number };
          return {
            ...data,
            items: data.items.map((item: Announcement) =>
              item.id === id ? { ...item, isPinned } : item,
            ),
          };
        },
      );

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        qc.setQueryData(
          [
            "admin-announcements",
            {
              page,
              pageSize,
              showInactiveOnly,
              selectedType,
              selectedPriority,
              dateRange,
            },
          ],
          context.previousData,
        );
      }
    },
    onSettled: (_, __, variables) => {
      // Always refetch to ensure data consistency
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      qc.invalidateQueries({ queryKey: ["announcements"] });
      qc.invalidateQueries({ queryKey: ["announcement", variables.id] });
      qc.invalidateQueries({ queryKey: ["admin-announcement", variables.id] });
    },
  });

  const mutActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setActive(id, isActive),
    onMutate: async ({ id, isActive }) => {
      // Cancel outgoing refetches to prevent overwriting optimistic updates
      await qc.cancelQueries({ queryKey: ["admin-announcements"] });

      // Snapshot the previous value for rollback
      const previousData = qc.getQueryData([
        "admin-announcements",
        {
          page,
          pageSize,
          showInactiveOnly,
          selectedType,
          selectedPriority,
          dateRange,
        },
      ]);

      // Optimistically update the cache
      qc.setQueryData(
        [
          "admin-announcements",
          {
            page,
            pageSize,
            showInactiveOnly,
            selectedType,
            selectedPriority,
            dateRange,
          },
        ],
        (old: unknown) => {
          if (!old || typeof old !== "object") return old;
          const data = old as { items: Announcement[]; total: number };
          return {
            ...data,
            items: data.items.map((item: Announcement) =>
              item.id === id ? { ...item, isActive } : item,
            ),
          };
        },
      );

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        qc.setQueryData(
          [
            "admin-announcements",
            {
              page,
              pageSize,
              showInactiveOnly,
              selectedType,
              selectedPriority,
              dateRange,
            },
          ],
          context.previousData,
        );
      }
    },
    onSettled: (_, __, variables) => {
      // Always refetch to ensure data consistency
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      qc.invalidateQueries({ queryKey: ["announcements"] });
      qc.invalidateQueries({ queryKey: ["announcement", variables.id] });
      qc.invalidateQueries({ queryKey: ["admin-announcement", variables.id] });
    },
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const getTypeBadge = (type: string) => {
    const variants = {
      GENERAL: { variant: "default" as const, label: "Umum" },
      EVENT: { variant: "info" as const, label: "Acara" },
      MAINTENANCE: { variant: "warning" as const, label: "Pemeliharaan" },
      REGULATION: { variant: "info" as const, label: "Peraturan" },
    };
    return variants[type as keyof typeof variants] || variants.GENERAL;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      LOW: { variant: "default" as const, label: "Rendah" },
      NORMAL: { variant: "default" as const, label: "Normal" },
      HIGH: { variant: "warning" as const, label: "Tinggi" },
    };
    return variants[priority as keyof typeof variants] || variants.NORMAL;
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

  const handleEditClick = (announcement: Announcement) => {
    navigate(`/admin/announcements/edit/${announcement.id}`);
  };

  const handleViewClick = (announcement: Announcement) => {
    navigate(`/admin/announcements/${announcement.id}`);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleResetFilters = () => {
    setSelectedType("");
    setSelectedPriority("");
    setShowInactiveOnly(false);
    setDateRange({});
    setSortBy("");
    setPage(1);
  };

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedType) count++;
    if (selectedPriority) count++;
    if (showInactiveOnly) count++;
    if (dateRange.from || dateRange.to) count++;
    if (sortBy) count++;
    return count;
  }, [selectedType, selectedPriority, showInactiveOnly, dateRange, sortBy]);

  // Define filter fields for AdvancedFilter
  const filterFields: FilterField[] = [
    {
      name: "type",
      label: "Jenis",
      type: "select",
      value: selectedType,
      onChange: (value) => {
        setSelectedType(value as string);
        setPage(1);
      },
      options: [
        { value: "", label: "Semua Jenis" },
        { value: "GENERAL", label: "Umum" },
        { value: "EVENT", label: "Acara" },
        { value: "MAINTENANCE", label: "Pemeliharaan" },
        { value: "REGULATION", label: "Peraturan" },
      ],
    },
    {
      name: "priority",
      label: "Prioritas",
      type: "select",
      value: selectedPriority,
      onChange: (value) => {
        setSelectedPriority(value as string);
        setPage(1);
      },
      options: [
        { value: "", label: "Semua Prioritas" },
        { value: "LOW", label: "Rendah" },
        { value: "NORMAL", label: "Normal" },
        { value: "HIGH", label: "Tinggi" },
      ],
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      value: showInactiveOnly ? "inactive" : "active",
      onChange: (value) => {
        setShowInactiveOnly(value === "inactive");
        setPage(1);
      },
      options: [
        { value: "active", label: "Aktif" },
        { value: "inactive", label: "Tidak Aktif" },
      ],
    },
    {
      name: "sortBy",
      label: "Urutkan Berdasarkan",
      type: "select",
      value: sortBy,
      onChange: (value) => {
        setSortBy(value as string);
        setPage(1);
      },
      options: [
        { value: "", label: "Terbaru" },
        { value: "oldest", label: "Terlama" },
      ],
    },
    {
      name: "dateRange",
      label: "Rentang Tanggal Tayang",
      type: "daterange",
      value: dateRange,
      onChange: (value) => {
        setDateRange(value as { from?: string; to?: string });
        setPage(1);
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-600">
          Kelola Pengumuman
        </h1>
        <p className="text-gray-600 dark:text-gray-200 mt-1">
          Buat dan atur pengumuman untuk warga RT
        </p>
      </div>

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <CardTitle>Daftar Pengumuman</CardTitle>
              <Badge variant="default" size="sm">
                {total} total
              </Badge>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <AdvancedFilter
                fields={filterFields}
                activeFilterCount={activeFilterCount}
                onReset={handleResetFilters}
                dropdownClassName="left-0 lg:left-auto lg:right-0"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <AnnouncementManageTableSkeleton />
          ) : isError ? (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-8 w-8 text-red-400 mb-2" />
              <p className="text-red-600">Gagal memuat pengumuman</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Belum ada pengumuman
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Buat pengumuman pertama untuk warga RT
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full table-fixed">
                  <colgroup>
                    <col className="w-35/100" /> {/* Pengumuman - 35% */}
                    <col className="w-1/10" /> {/* Jenis - 10% */}
                    <col className="w-1/10" /> {/* Prioritas - 10% */}
                    <col className="w-1/10" /> {/* Status - 10% */}
                    <col className="w-2/10" /> {/* Tanggal - 20% */}
                    <col className="w-15/100" /> {/* Aksi - 15% */}
                  </colgroup>
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-4 pr-6 text-sm font-medium text-gray-600 dark:text-gray-300">
                        Pengumuman
                      </th>
                      <th className="text-left py-4 pr-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                        Jenis
                      </th>
                      <th className="text-left py-4 pr-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                        Prioritas
                      </th>
                      <th className="text-left py-4 pr-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                        Status
                      </th>
                      <th className="text-left py-4 pr-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                        Tanggal
                      </th>
                      <th className="text-left py-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((announcement: Announcement) => {
                      const typeBadge = getTypeBadge(announcement.type);
                      const priorityBadge = getPriorityBadge(
                        announcement.priority,
                      );

                      return (
                        <tr
                          key={announcement.id}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                          onClick={() => handleViewClick(announcement)}
                        >
                          <td className="py-5 pr-6">
                            <div className="flex items-start space-x-3">
                              {announcement.isPinned && (
                                <Pin className="h-4 w-4 text-yellow-500 mt-1 flex-shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p
                                  className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 leading-5"
                                  title={announcement.title}
                                >
                                  {announcement.title.length > 50
                                    ? announcement.title.substring(0, 50) +
                                      "..."
                                    : announcement.title}
                                </p>
                                <p
                                  className="text-sm text-gray-500 dark:text-gray-300 line-clamp-2 leading-5 mt-1"
                                  title={announcement.content}
                                >
                                  {announcement.content.length > 50
                                    ? announcement.content.substring(0, 50) +
                                      "..."
                                    : announcement.content}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 pr-4">
                            <Badge variant={typeBadge.variant} size="sm">
                              <span className="block truncate text-xs">
                                {typeBadge.label}
                              </span>
                            </Badge>
                          </td>
                          <td className="py-5 pr-4">
                            <Badge variant={priorityBadge.variant} size="sm">
                              <span className="block truncate text-xs">
                                {priorityBadge.label}
                              </span>
                            </Badge>
                          </td>
                          <td className="py-5 pr-4">
                            <Badge
                              variant={
                                announcement.isActive ? "success" : "default"
                              }
                              size="sm"
                            >
                              <span className="block truncate text-xs">
                                {announcement.isActive ? "Aktif" : "Nonaktif"}
                              </span>
                            </Badge>
                          </td>
                          <td className="py-5 pr-4">
                            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                              <p className="font-medium">
                                {formatDate(announcement.createdAt)}
                              </p>
                              {announcement.publishAt && (
                                <p className="text-gray-500 dark:text-gray-300 truncate">
                                  Tayang: {formatDate(announcement.publishAt)}
                                </p>
                              )}
                              {announcement.expireAt && (
                                <p className="text-gray-500 dark:text-gray-300 truncate">
                                  Berakhir: {formatDate(announcement.expireAt)}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-5">
                            <div className="flex items-center space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="p-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  mutPin.mutate({
                                    id: announcement.id,
                                    isPinned: !announcement.isPinned,
                                  });
                                }}
                                title={announcement.isPinned ? "Unpin" : "Pin"}
                              >
                                {announcement.isPinned ? (
                                  <PinOff className="h-4 w-4" />
                                ) : (
                                  <Pin className="h-4 w-4" />
                                )}
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="p-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  mutActive.mutate({
                                    id: announcement.id,
                                    isActive: !announcement.isActive,
                                  });
                                }}
                                title={
                                  announcement.isActive
                                    ? "Nonaktifkan"
                                    : "Aktifkan"
                                }
                              >
                                {announcement.isActive ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="p-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(announcement);
                                }}
                                title="Edit"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
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
                {items.map((announcement: Announcement) => {
                  const typeBadge = getTypeBadge(announcement.type);
                  const priorityBadge = getPriorityBadge(announcement.priority);

                  return (
                    <Card
                      key={announcement.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewClick(announcement)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                {announcement.isPinned && (
                                  <Pin className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                                )}
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 whitespace-pre-wrap break-words">
                                  {announcement.title}
                                </h3>
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-300 line-clamp-2 whitespace-pre-wrap break-words">
                                {announcement.content}
                              </p>
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={typeBadge.variant} size="sm">
                              <span className="flex items-center">
                                <span className="ml-1">{typeBadge.label}</span>
                              </span>
                            </Badge>
                            <Badge variant={priorityBadge.variant} size="sm">
                              {priorityBadge.label}
                            </Badge>
                            <Badge
                              variant={
                                announcement.isActive ? "success" : "default"
                              }
                              size="sm"
                            >
                              {announcement.isActive ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </div>

                          {/* Date */}
                          <div className="text-xs text-gray-500 dark:text-gray-300">
                            <p>Dibuat: {formatDate(announcement.createdAt)}</p>
                            {announcement.publishAt && (
                              <p>
                                Tayang: {formatDate(announcement.publishAt)}
                              </p>
                            )}
                            {announcement.expireAt && (
                              <p>
                                Berakhir: {formatDate(announcement.expireAt)}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex justify-between pt-2 border-t border-gray-100">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  mutPin.mutate({
                                    id: announcement.id,
                                    isPinned: !announcement.isPinned,
                                  });
                                }}
                              >
                                {announcement.isPinned ? "Unpin" : "Pin"}
                              </Button>

                              <Button
                                size="sm"
                                variant={
                                  announcement.isActive ? "danger" : "primary"
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  mutActive.mutate({
                                    id: announcement.id,
                                    isActive: !announcement.isActive,
                                  });
                                }}
                              >
                                {announcement.isActive
                                  ? "Nonaktifkan"
                                  : "Aktifkan"}
                              </Button>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(announcement);
                              }}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Enhanced Pagination */}
              <div className="pt-6">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={data?.total ?? 0}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  showPageSizeSelector={true}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
