import React, { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Megaphone,
  LogOut,
  Menu,
  X,
  UserCircle,
  ChevronDown,
  ChevronRight,
  FilePlus,
  Bell,
  MessageCircle,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { useAuthContext } from "../../contexts/AuthContext";
import ThemeToggle from "../ui/ThemeToggle";
import { AnimatePresence } from "framer-motion";
import { Notification } from "../../types/notification.types";
import { useQuery } from "@tanstack/react-query";
import { getNotifications } from "../../services/authService";
import NotificationSidebar from "./NotificationSidebar";
import { hasUnread } from "../../services/chatService";

interface SidebarProps {
  className?: string;
}

interface SubMenuItem {
  path: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  notification?: boolean;
}

interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  submenu?: SubMenuItem[];
  notification?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationSidebar, setNotificationSidebar] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { readNotification, isAuthenticated } = useAuthContext();

  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggingOut, logout } = useAuthContext();

  const { data: chatHasUnread } = useQuery({
    queryKey: ["chatHasUnread"],
    queryFn: hasUnread,
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const toggleNotification = () => {
    if (window.innerWidth < 640) setNotificationSidebar(true);
    else {
      setNotificationSidebar(!notificationSidebar);
    }
  };
  const closeNotification = () => {
    setNotificationSidebar(false);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.isRead) {
      window.location.href = `${notification.clickUrl}`;
      closeNotification();
    } else {
      window.location.href = `${notification.clickUrl}`;
      closeNotification();
      await readNotification(notification.id);
    }
  };

  const { data: notification } = useQuery({
    queryKey: ["notification"],
    queryFn: getNotifications,
    enabled: isAuthenticated,
    refetchInterval: 60000,
  });

  const unreadNotifications = notification?.notification.unread ?? [];
  const readNotifications = notification?.notification.read ?? [];
  const allNotifications = notification?.notification.all ?? [];

  const unreadNotificationsCount = notification?.count.unread ?? 0;
  const readNotificationsCount = notification?.count.read ?? 0;
  const allNotificationsCount = notification?.count.total ?? 0;

  const menuItems: MenuItem[] = [
    {
      path: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      path: "/admin/reports",
      label: "Kelola Laporan",
      icon: FileText,
      submenu: [
        {
          path: "/admin/reports",
          label: "Daftar Laporan",
          icon: FileText,
        },
        {
          path: "/admin/reports/create",
          label: "Buat Laporan",
          icon: FilePlus,
        },
      ],
    },
    {
      path: "/admin/announcements",
      label: "Kelola Pengumuman",
      icon: Megaphone,
      submenu: [
        {
          path: "/admin/announcements",
          label: "Daftar Pengumuman",
          icon: Megaphone,
        },
        {
          path: "/admin/announcements/create",
          label: "Buat Pengumuman",
          icon: FilePlus,
        },
      ],
    },
    {
      path: "/admin/chat",
      label: "Chat Laporan",
      icon: MessageCircle,
      notification: chatHasUnread?.data === true,
    },
  ];

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const isParentActive = (item: MenuItem) => {
    if (item.submenu) {
      return item.submenu.some((sub) => location.pathname.startsWith(sub.path));
    }
    return location.pathname === item.path;
  };

  const toggleMenu = (path: string) => {
    setOpenMenus((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
    );
  };

  const handleLogout = async () => {
    logout();
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-8 right-8 z-50 p-2 rounded-md bg-white dark:bg-gray-800 shadow-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-30 lg:hidden transition-opacity duration-300"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 w-64",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
          className,
        )}
      >
        {/* Header/Logo Section */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <Link
            to="/admin"
            className="flex items-center space-x-2 text-xl font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            <img src="/assets/logo.webp" alt="Logo" className="h-8 w-8" />
            <span>
              SiLapor<span className="text-primary-700">RT</span>
            </span>
          </Link>
        </div>

        {/* Admin Badge */}
        <div className="px-4 py-3 bg-primary-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wide">
                Admin Panel
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                RT Administrator
              </div>
            </div>
            <div
              className="relative"
              onClick={toggleNotification}
              ref={notifRef}
            >
              <button className="relative p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors hover:cursor-pointer">
                <Bell className="h-5 w-5" />
                {unreadNotificationsCount > 0 &&
                  unreadNotificationsCount < 100 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[11px] font-semibold text-white flex items-center justify-center">
                      {unreadNotificationsCount}
                    </span>
                  )}
                {unreadNotificationsCount >= 100 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[11px] font-semibold text-white flex items-center justify-center">
                    99+
                  </span>
                )}
              </button>
              <AnimatePresence></AnimatePresence>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isOpen = openMenus.includes(item.path);
            const isParentItemActive = isParentActive(item);

            return (
              <div key={item.path}>
                {/* Main Menu Item */}
                {hasSubmenu ? (
                  <button
                    onClick={() => toggleMenu(item.path)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isParentItemActive
                        ? "bg-primary-50 text-primary-700 dark:bg-gray-700 dark:text-gray-100"
                        : "text-gray-600 dark:text-gray-300 hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-gray-700 dark:hover:text-gray-100",
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary-50 text-primary-700 dark:bg-gray-700 dark:text-gray-100"
                        : "text-gray-600 dark:text-gray-300 hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-gray-700 dark:hover:text-gray-100",
                    )}
                  >
                    <div className="relative">
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {item.notification && (
                        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                      )}
                    </div>
                    <span>{item.label}</span>
                  </Link>
                )}

                {/* Submenu */}
                {hasSubmenu && isOpen && (
                  <div className="mt-1 ml-4 space-y-1">
                    {item.submenu!.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = isActivePath(subItem.path);

                      return (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center space-x-3 rounded-md px-3 py-2 text-sm transition-all duration-200",
                            isSubActive
                              ? "bg-primary-50 text-primary-700 dark:bg-gray-700 dark:text-gray-100 font-medium"
                              : "text-gray-600 dark:text-gray-300 hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-gray-700 dark:hover:text-gray-100",
                          )}
                        >
                          {SubIcon && (
                            <SubIcon className="h-4 w-4 flex-shrink-0" />
                          )}
                          <span>{subItem.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700" />

        {/* Bottom Section - User & Actions */}
        <div className="p-3 space-y-2">
          {/* Profile and Theme Toggle Row */}
          <div className="flex items-center gap-2">
            <Link
              to="/admin/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex-1 flex items-center space-x-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActivePath("/admin/profile")
                  ? "bg-primary-50 text-primary-700 dark:bg-gray-700 dark:text-gray-100"
                  : "text-gray-600 dark:text-gray-300 hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-gray-700 dark:hover:text-gray-100",
              )}
            >
              <UserCircle className="h-5 w-5 flex-shrink-0" />
              <span>Profil Saya</span>
            </Link>
            <ThemeToggle />
          </div>

          {/* User Info */}
          {user && (
            <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded-md">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 text-sm font-medium text-primary-600 dark:text-primary-400 overflow-hidden flex-shrink-0">
                {user?.profile ? (
                  <img
                    src={user?.profile}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user?.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center space-x-3 rounded-md px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut
              className={cn(
                "h-5 w-5 flex-shrink-0",
                isLoggingOut && "animate-spin",
              )}
            />
            <span>{isLoggingOut ? "Keluar..." : "Keluar"}</span>
          </button>
        </div>
      </aside>
      <NotificationSidebar
        isOpen={notificationSidebar}
        onClose={() => setNotificationSidebar(false)}
        notifications={allNotifications}
        unreadNotifications={unreadNotifications}
        readNotifications={readNotifications}
        notificationCount={allNotificationsCount}
        unreadNotificationCount={unreadNotificationsCount}
        readNotificationCount={readNotificationsCount}
        onNotificationClick={(n: Notification) => handleNotificationClick(n)}
        sidebarLocation="left"
      />
    </>
  );
};

export default Sidebar;
