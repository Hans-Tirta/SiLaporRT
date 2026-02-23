import { format, isSameDay, isToday, isYesterday, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { User as UserIcon, Clock, CheckCheck } from "lucide-react";
import type { User as UserProps } from "../../../types/auth.types";

type Message = {
  id: string;
  chatId: string;
  message: string;
  userId: string | undefined;
  user: {
    name: string | undefined;
    profile: string | undefined;
    role: string | undefined;
  };
  createdAt: string;
  optimistic?: boolean;
  isRead?: boolean;
};

type MessageBoxProps = {
  msg: Message;
  user: UserProps | null;
  idx: number;
  sortedMessages: Message[];
};

const MessageBox = ({ msg, user, idx, sortedMessages }: MessageBoxProps) => {
  const prev = idx > 0 ? sortedMessages[idx - 1] : null;
  const showDayDivider =
    idx === 0 || !isSameDay(parseISO(msg.createdAt), parseISO(prev!.createdAt));

  const getDayLabel = (iso: string) => {
    const d = parseISO(iso);
    if (isToday(d)) return "Hari ini";
    if (isYesterday(d)) return "Kemarin";
    return format(d, "dd MMM yyyy", { locale: id });
  };

  const getStatusText = () => {
    if (msg.userId !== user?.id) return null;

    if (msg.optimistic) {
      return <Clock className="h-3 w-3 text-white/70" />;
    }

    if (msg.isRead) {
      return <CheckCheck className="h-3 w-3 text-blue-400" />;
    }

    return <CheckCheck className="h-3 w-3 text-white/70" />;
  };

  return (
    <>
      {showDayDivider && (
        <div className="flex justify-center py-2">
          <span className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {getDayLabel(msg.createdAt)}
          </span>
        </div>
      )}

      <div
        className={`flex ${
          msg.userId === user?.id ? "justify-end" : "justify-start"
        }`}
      >
        {msg.userId === user?.id ? (
          <div className="max-w-[85%] sm:max-w-[70%] overflow-hidden">
            <div className="rounded-lg p-2 bg-primary-600 text-white">
              <div className="flex items-end gap-2">
                <p className="text-sm whitespace-pre-wrap break-all flex-1 min-w-0">
                  {msg.message}
                </p>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-[10px] text-white/70">
                    {format(parseISO(msg.createdAt), "HH:mm")}
                  </span>
                  {getStatusText()}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 max-w-[85%] sm:max-w-[70%]">
            <div className="flex-shrink-0">
              {msg.user.profile ? (
                <img
                  src={msg.user.profile}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="h-8 w-8 text-gray-400" />
              )}
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-xs font-medium mb-1 px-1 text-left text-gray-700 dark:text-gray-300 truncate w-fit max-w-[100px]">
                {msg.user.name}
              </p>

              <div className="rounded-lg p-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white max-w-full overflow-hidden">
                <div className="flex items-end gap-2">
                  <p className="text-sm whitespace-pre-wrap break-all flex-1 min-w-0">
                    {msg.message}
                  </p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {format(parseISO(msg.createdAt), "HH:mm")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MessageBox;
