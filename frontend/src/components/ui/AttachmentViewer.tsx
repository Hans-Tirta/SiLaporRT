import React, { useState } from "react";
import { Download } from "lucide-react";
import AttachmentModal from "./AttachmentModal";
import FileTypeIcon from "./FileTypeIcon";

interface Attachment {
  id: string;
  filename: string;
  url: string;
  fileType: "image" | "video" | "audio" | "document";
  format?: string;
  bytes?: number;
}

interface AttachmentViewerProps {
  attachments: Attachment[];
  title?: string;
  className?: string;
  showTitle?: boolean;
  gridCols?: 1 | 2 | 3 | 4 | 5;
}

const AttachmentViewer: React.FC<AttachmentViewerProps> = ({
  attachments,
  title = "Lampiran",
  className = "",
  showTitle = true,
  gridCols = 2,
}) => {
  const [selectedAttachment, setSelectedAttachment] =
    useState<Attachment | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  }[gridCols];

  const handleAttachmentClick = (attachment: Attachment) => {
    setSelectedAttachment(attachment);
  };

  const handleModalNavigate = (attachment: Attachment) => {
    setSelectedAttachment(attachment);
  };

  const handleImageError = (attachmentId: string) => {
    setImageErrors((prev) => new Set(prev).add(attachmentId));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const kb = bytes / 1024;
    const mb = kb / 1024;

    if (mb >= 1) {
      return `${mb.toFixed(1)} MB`;
    } else {
      return `${kb.toFixed(0)} KB`;
    }
  };

  const renderAttachmentCard = (attachment: Attachment) => {
    const isImage = attachment.fileType === "image";
    const isVideo = attachment.fileType === "video";
    const isAudio = attachment.fileType === "audio";
    const isDocument = attachment.fileType === "document";
    const hasImageError = imageErrors.has(attachment.id);

    return (
      <div
        key={attachment.id}
        onClick={() => handleAttachmentClick(attachment)}
        className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer"
      >
        {/* Preview Area */}
        <div className="aspect-square bg-gray-50 dark:bg-gray-900 flex items-center justify-center relative overflow-hidden">
          {/* Image Preview */}
          {isImage && !hasImageError && (
            <img
              src={attachment.url}
              alt={attachment.filename}
              className="w-full h-full object-cover"
              style={{
                backgroundColor: "#f9fafb",
                imageRendering: "auto",
              }}
              loading="eager"
              onError={() => handleImageError(attachment.id)}
            />
          )}

          {/* Video Preview */}
          {isVideo && (
            <div className="flex flex-col items-center justify-center space-y-2 p-4 text-gray-500 dark:text-gray-400">
              <FileTypeIcon
                fileType="video"
                format={attachment.format}
                filename={attachment.filename}
                size="lg"
              />
              <div className="text-center">
                <p className="text-xs font-medium uppercase tracking-wide">
                  {attachment.format?.toUpperCase() || "VIDEO"}
                </p>
              </div>
            </div>
          )}

          {/* Audio Preview */}
          {isAudio && (
            <div className="flex flex-col items-center justify-center space-y-2 p-4 text-gray-500 dark:text-gray-400">
              <FileTypeIcon
                fileType="audio"
                format={attachment.format}
                filename={attachment.filename}
                size="lg"
              />
              <div className="text-center">
                <p className="text-xs font-medium uppercase tracking-wide">
                  {attachment.format?.toUpperCase() || "AUDIO"}
                </p>
              </div>
            </div>
          )}

          {/* Fallback for documents or failed images */}
          {(isDocument || (isImage && hasImageError)) && (
            <div className="flex flex-col items-center justify-center space-y-2 p-4 text-gray-500 dark:text-gray-400">
              <FileTypeIcon
                fileType={
                  isImage && hasImageError ? "image" : attachment.fileType
                }
                format={attachment.format}
                filename={attachment.filename}
                size="lg"
              />
              <div className="text-center">
                <p className="text-xs font-medium uppercase tracking-wide">
                  {isImage && hasImageError
                    ? "Preview failed"
                    : (attachment.format || attachment.fileType)?.toUpperCase()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                {attachment.filename}
              </h4>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  {attachment.fileType}
                </span>
                {attachment.bytes && (
                  <>
                    <span className="text-xs text-gray-300 dark:text-gray-600">
                      •
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(attachment.bytes)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Quick download button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const link = document.createElement("a");
                link.href = attachment.url;
                link.download = attachment.filename;
                link.click();
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* File type badge */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-90 text-gray-700 dark:text-gray-300 shadow-sm">
            <FileTypeIcon
              fileType={attachment.fileType}
              format={attachment.format}
              filename={attachment.filename}
              size="sm"
              className="mr-1"
            />
            {attachment.fileType.toUpperCase()}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {attachments.length} file{attachments.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      <div className={`grid ${gridClass} gap-4`}>
        {attachments.map(renderAttachmentCard)}
      </div>

      {/* Modal */}
      <AttachmentModal
        attachment={selectedAttachment}
        attachments={attachments}
        onClose={() => setSelectedAttachment(null)}
        onNavigate={handleModalNavigate}
      />
    </div>
  );
};

export default AttachmentViewer;
