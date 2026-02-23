import { Link } from "react-router-dom";
import { Card, CardContent } from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import { Calendar, Pin, Paperclip, Bell } from "lucide-react";
import { Announcement } from "../../../types/announcement.types";

function formatTime(s?: string | null) {
  if (!s) return "-";
  return new Date(s).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AnnouncementListItem({ a }: { a: Announcement }) {
  const priorityVariant = a.priority === "HIGH" ? "warning" : "default";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <Link to={`/announcements/${a.id}`}>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            {/* Main */}
            <div className="flex-1 space-y-3 min-w-0">
              {/* Title + badges */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words line-clamp-1">
                  {a.title}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {a.isPinned && (
                    <span className="inline-flex items-center gap-1 text-amber-600 text-sm font-medium">
                      <Pin className="h-3 w-3" /> Pinned
                    </span>
                  )}
                  <Badge variant="info" size="sm">
                    {a.type}
                  </Badge>
                  <Badge
                    variant={
                      priorityVariant as "danger" | "warning" | "default"
                    }
                    size="sm"
                  >
                    {a.priority}
                  </Badge>
                </div>
              </div>

              {/* Snippet */}
              <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 whitespace-pre-wrap break-words">
                {a.content}
              </p>

              {/* Meta */}
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-300">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    {formatTime(a.publishAt || a.createdAt)}
                  </span>
                  <span className="inline-flex items-center">
                    <Bell className="mr-1 h-4 w-4" />
                    {a.author?.name || "-"}
                  </span>
                  {a.attachments?.length ? (
                    <span className="inline-flex items-center">
                      <Paperclip className="mr-1 h-4 w-4" />
                      {a.attachments.length} file
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
