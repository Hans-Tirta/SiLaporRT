import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Calendar, AlertTriangle, Paperclip } from "lucide-react";
import Input from "../../../components/ui/Input";
import Textarea from "../../../components/ui/Textarea";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";
import { Card, CardContent } from "../../../components/ui/Card";
import {
  Announcement,
  AnnouncementType,
  Priority,
  CloudinaryFile,
} from "../../../types/announcement.types";
import {
  createAnnouncement,
  updateAnnouncement,
  UpsertAnnouncementPayload,
} from "../../../services/announcementAdminService";
import CloudinaryUpload from "../../../components/upload/CloudinaryUpload";
import { classifyFile } from "../../../utils/classifyFile";
import { useToast } from "../../../hooks/useToast";

type Props = {
  initial?: Announcement | null;
  onSuccess?: (a: Announcement) => void;
};

const typeOptions = [
  { value: AnnouncementType.GENERAL, label: "Umum" },
  { value: AnnouncementType.EVENT, label: "Acara" },
  { value: AnnouncementType.MAINTENANCE, label: "Pemeliharaan" },
  { value: AnnouncementType.REGULATION, label: "Peraturan" },
];

const priorityOptions = [
  { value: Priority.LOW, label: "Rendah" },
  { value: Priority.NORMAL, label: "Normal" },
  { value: Priority.HIGH, label: "Tinggi" },
];

function toLocalInput(dt?: string | null) {
  if (!dt) return "";
  const d = new Date(dt);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

export default function AdminAnnouncementForm({ initial, onSuccess }: Props) {
  const isEdit = !!initial?.id;
  const qc = useQueryClient();
  const toast = useToast();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [type, setType] = useState<AnnouncementType>(
    (initial?.type as AnnouncementType) ?? AnnouncementType.GENERAL,
  );
  const [priority, setPriority] = useState<Priority>(
    (initial?.priority as Priority) ?? Priority.NORMAL,
  );
  const [isPinned, setIsPinned] = useState<boolean>(initial?.isPinned ?? false);
  const [isActive, setIsActive] = useState<boolean>(initial?.isActive ?? true);
  const [publishAt, setPublishAt] = useState<string>(
    toLocalInput(initial?.publishAt),
  );
  const [expireAt, setExpireAt] = useState<string>(
    toLocalInput(initial?.expireAt),
  );

  // Extended type for form attachments (supports both DB and new uploads)
  type FormAttachment = {
    id?: string; // Database ID for existing attachments
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
  };

  // Attachments
  const [attachments, setAttachments] = useState<FormAttachment[]>([]);

  // Sync state when initial changes
  useEffect(() => {
    setTitle(initial?.title ?? "");
    setContent(initial?.content ?? "");
    setType((initial?.type as AnnouncementType) ?? AnnouncementType.GENERAL);
    setPriority((initial?.priority as Priority) ?? Priority.NORMAL);
    setIsPinned(initial?.isPinned ?? false);
    setIsActive(initial?.isActive ?? true);
    setPublishAt(toLocalInput(initial?.publishAt));
    setExpireAt(toLocalInput(initial?.expireAt));

    // Only reset attachments if this is a new form (create mode) or a different announcement
    if (!initial || !initial.id) {
      // Create mode - reset to empty
      setAttachments([]);
    } else {
      // Edit mode - only set initial attachments on first load of this announcement
      setAttachments((prev) => {
        // If we don't have any attachments yet, or if it's a different announcement, use initial data
        if (!prev || prev.length === 0) {
          // Convert database Attachment[] to form's expected format
          const convertedAttachments = (initial?.attachments ?? []).map(
            (att) => {
              return {
                id: att.id, // Keep database ID
                filename: att.filename,
                url: att.url,
                fileType: att.fileType as
                  | "image"
                  | "video"
                  | "audio"
                  | "document",
                provider: "cloudinary" as const,
                publicId: att.id, // Still use ID as publicId for compatibility
                resourceType: "",
                format: "",
                bytes: 0,
                width: undefined,
                height: undefined,
              };
            },
          );
          return convertedAttachments;
        }
        // Otherwise, keep current attachments to preserve user edits
        return prev;
      });
    }
  }, [initial]);

  const scheduleError = useMemo(() => {
    if (publishAt && expireAt) {
      const start = new Date(publishAt);
      const end = new Date(expireAt);
      if (end <= start)
        return "Tanggal berakhir harus setelah tanggal mulai tayang.";
    }
    return "";
  }, [publishAt, expireAt]);

  const nowIso = new Date().toISOString();
  const willBeHidden = !!expireAt && new Date(expireAt).toISOString() < nowIso;
  const notYetLive = !!publishAt && new Date(publishAt).toISOString() > nowIso;

  const payload: UpsertAnnouncementPayload = useMemo(
    () => ({
      title,
      content,
      type,
      priority,
      isPinned,
      isActive,
      publishAt: publishAt ? new Date(publishAt).toISOString() : null,
      expireAt: expireAt ? new Date(expireAt).toISOString() : null,
      attachments: attachments.map((att) => ({
        filename: att.filename,
        url: att.url,
        fileType: att.fileType,
        provider: att.provider,
        publicId: att.publicId,
        resourceType: att.resourceType,
        format: att.format,
        bytes: att.bytes,
        width: att.width,
        height: att.height,
      })),
    }),
    [
      title,
      content,
      type,
      priority,
      isPinned,
      isActive,
      publishAt,
      expireAt,
      attachments,
    ],
  );

  const mutCreate = useMutation({
    mutationFn: () => createAnnouncement(payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Pengumuman berhasil dibuat", "Berhasil");
      onSuccess?.(res);
      // Reset form for new creation
      setTitle("");
      setContent("");
      setType(AnnouncementType.GENERAL);
      setPriority(Priority.NORMAL);
      setIsPinned(false);
      setIsActive(true);
      setPublishAt("");
      setExpireAt("");
      setAttachments([]);
    },
    onError: (error) => {
      toast.error(error?.message || "Gagal membuat pengumuman", "Error");
    },
  });

  const mutUpdate = useMutation({
    mutationFn: () => updateAnnouncement(initial!.id, payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      qc.invalidateQueries({ queryKey: ["announcements"] });
      qc.invalidateQueries({ queryKey: ["announcement", initial!.id] });
      qc.invalidateQueries({ queryKey: ["admin-announcement", initial!.id] });
      toast.success("Pengumuman berhasil diperbarui", "Berhasil");
      onSuccess?.(res);
    },
    onError: (error) => {
      toast.error(error?.message || "Gagal memperbarui pengumuman", "Error");
    },
  });

  const isSubmitting = mutCreate.isPending || mutUpdate.isPending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !!scheduleError) return;
    if (isEdit) mutUpdate.mutate();
    else mutCreate.mutate();
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setType(AnnouncementType.GENERAL);
    setPriority(Priority.NORMAL);
    setIsPinned(false);
    setIsActive(true);
    setPublishAt("");
    setExpireAt("");
    setAttachments([]);
  };

  function onUploaded(files: CloudinaryFile[]) {
    const mapped = files.map((f) => {
      const fileType = classifyFile(f);
      const baseName = f.original_filename || "file";
      const ext = f.format ? `.${f.format}` : "";
      const filename = baseName.endsWith(ext) ? baseName : `${baseName}${ext}`;
      return {
        filename,
        url: f.secure_url,
        fileType,
        provider: "cloudinary" as const,
        publicId: f.public_id || "",
        resourceType: f.resource_type || "",
        format: f.format || "",
        bytes: f.bytes || 0,
        width: f.width,
        height: f.height,
      };
    });
    setAttachments((prev) => [...(prev || []), ...mapped]);
  }

  const removeAttachment = (identifier: string) => {
    setAttachments((prev) => {
      const currentAttachments = prev || [];
      return currentAttachments.filter(
        (a) => a.id !== identifier && a.publicId !== identifier,
      );
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {(willBeHidden || notYetLive) && (
        <div className="flex items-start gap-2 rounded-md border border-primary-100 bg-primary-50 p-3 text-sm text-primary-700">
          <Calendar className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            {notYetLive && (
              <div>
                Pengumuman akan mulai tayang pada <b>{publishAt}</b>.
              </div>
            )}
            {willBeHidden && (
              <div>
                Pengumuman akan berakhir pada <b>{expireAt}</b>.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <Input
          label="Judul Pengumuman"
          placeholder="Masukkan judul pengumuman yang jelas..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          limit={100}
          showCounter
          required
          error={!title.trim() && isSubmitting ? "Judul harus diisi" : ""}
        />

        <Textarea
          label="Konten Pengumuman"
          placeholder="Tulis detail pengumuman untuk warga..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          limit={500}
          showCounter
          rows={5}
          required
          error={!content.trim() && isSubmitting ? "Konten harus diisi" : ""}
          helperText="Gunakan bahasa yang jelas dan mudah dipahami warga"
        />
      </div>

      {/* Type and Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Jenis Pengumuman"
          options={typeOptions}
          value={type}
          onChange={(e) => setType(e.target.value as AnnouncementType)}
          helperText="Pilih jenis sesuai kategori pengumuman"
        />

        <Select
          label="Tingkat Prioritas"
          options={priorityOptions}
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          helperText="Prioritaskan sesuai urgensi pengumuman"
        />
      </div>

      {/* Scheduling */}
      <div className="space-y-4">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-300 mr-2" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Jadwal Pengumuman
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Mulai Tayang
            </label>
            <input
              type="datetime-local"
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-300">
              Kosongkan untuk langsung tayang
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Berakhir Pada
            </label>
            <input
              type="datetime-local"
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
              value={expireAt}
              onChange={(e) => setExpireAt(e.target.value)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-300">
              Kosongkan jika tidak ada tanggal berakhir
            </p>
          </div>
        </div>

        {!!scheduleError && (
          <div className="mt-3 text-sm text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {scheduleError}
          </div>
        )}
      </div>

      {/* Attachments - Updated Section */}
      <Card className="border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center mb-3">
            <Paperclip className="h-4 w-4 text-gray-600 dark:text-gray-300 mr-2" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Lampiran
            </h3>
          </div>

          <CloudinaryUpload
            folder="announcements"
            multiple
            accept=".jpg,.jpeg,.png,.mp3,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            maxFiles={5}
            attachments={attachments}
            onUploaded={onUploaded}
            onRemove={removeAttachment}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={!!scheduleError || !title.trim() || !content.trim()}
        >
          <Save className="mr-2 h-4 w-4" />
          {isEdit ? "Simpan Perubahan" : "Buat Pengumuman"}
        </Button>

        {!isEdit && (
          <Button type="button" variant="secondary" onClick={resetForm}>
            Reset
          </Button>
        )}
      </div>

      {/* Error messages from mutations */}
      {(mutCreate.isError || mutUpdate.isError) && (
        <div className="text-sm text-red-600">
          {mutCreate.error?.message ||
            mutUpdate.error?.message ||
            "Terjadi kesalahan saat menyimpan."}
        </div>
      )}
    </form>
  );
}
