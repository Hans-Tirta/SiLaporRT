import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Home,
  FileText,
  Megaphone,
  PlusCircle,
  User,
  LogIn,
  LogOut,
  Shield,
  Bell,
  ChevronDown,
  UserCircle,
  Paperclip,
  EyeIcon,
  MessageCircle,
} from "lucide-react";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import ThemeToggle from "../ui/ThemeToggle";
import { Role } from "../../types/auth.types";
import { cn } from "../../utils/cn";
import { useAuthContext } from "../../contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import NotificationSidebar from "./NotificationSidebar";
import { Notification } from "../../types/notification.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [notificationSidebar, setNotificationSidebar] = useState(false);

  const {
    user,
    isAuthenticated,
    isLoading,
    isLoggingOut,
    logout,
    getNotifications,
    readNotification,
    markAsReadAll,
  } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    closeUserDropdown();
    closeMobileMenu();
    logout();
    sessionStorage.removeItem("notification_prompt_shown");
    navigate("/login");
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const closeUserDropdown = () => {
    setIsUserDropdownOpen(false);
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const toggleNotification = () => {
    if (window.innerWidth < 640) setNotificationSidebar(true);
    else {
      setIsNotifOpen(!isNotifOpen);
    }
  };
  const closeNotification = () => {
    setIsNotifOpen(false);
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

  const markAllAsRead = useMutation({
    mutationFn: markAsReadAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification"] });
    },
  });

  const unreadNotifications = notification?.notification.unread ?? [];
  const readNotifications = notification?.notification.read ?? [];
  const recentNotifications = notification?.notification.recent ?? [];
  const allNotifications = notification?.notification.all ?? [];

  const unreadNotificationsCount = notification?.count.unread ?? 0;
  const readNotificationsCount = notification?.count.read ?? 0;
  const allNotificationsCount = notification?.count.total ?? 0;

  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case "REPORT":
        return (
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 text-primary-600">
            <FileText className="w-6 h-6" />
          </div>
        );
      case "ANNOUNCEMENT":
        return (
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 text-primary-600">
            <Paperclip className="w-6 h-6" />
          </div>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        closeNotification();
      }
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeUserDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getNavigationItems = () => {
    const publicItems = [{ path: "/", label: "Beranda", icon: Home }];

    if (!isAuthenticated) {
      return publicItems;
    }

    const authenticatedItems = [
      ...publicItems,
      { path: "/reports", label: "Laporan", icon: FileText },
      { path: "/announcements", label: "Pengumuman", icon: Megaphone },
      { path: "/create-report", label: "Buat Laporan", icon: PlusCircle },
    ];

    return authenticatedItems;
  };

  const navigationItems = getNavigationItems();

  const userDropdownItems = [
    { path: "/profile", label: "Profil Saya", icon: UserCircle },
    { path: "/my-reports", label: "Laporan Saya", icon: User },
    ...(user?.role === Role.RT_ADMIN
      ? [
          {
            path: "/admin",
            label: "Admin Panel",
            icon: Shield,
          },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-gray-800 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="flex items-center space-x-2 text-xl font-bold text-primary-500 hover:text-primary-700 transition-colors"
            >
              <img src="/assets/logo.webp" alt="Logo" className="h-8 w-8" />
              <span>
                SiLapor<span className="text-primary-700">RT</span>
              </span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center space-x-1">
            {!isLoading &&
              navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary-50 text-primary-700 dark:bg-gray-700 dark:text-orange-300"
                        : "text-gray-600 dark:text-gray-300 hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-gray-700 dark:hover:text-gray-100",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            {isLoading && (
              <div className="flex items-center space-x-2 rounded-md px-3 py-2">
                <div className="h-4 w-4 animate-pulse bg-gray-300 rounded"></div>
                <div className="h-4 w-16 animate-pulse bg-gray-300 rounded"></div>
              </div>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {isAuthenticated && (
              <>
                <button
                  onClick={() => navigate("/chat")}
                  className="relative p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors hover:cursor-pointer"
                  title="Chat"
                >
                  <MessageCircle className="h-5 w-5" />
                </button>

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
                  <AnimatePresence>
                    {isNotifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 mt-3 w-96 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-xs  z-50"
                      >
                        <div className="p-3 border-b border-gray-100 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-200 flex items-center justify-between">
                          <div>
                            <span className="mr-2">Notifications</span>
                          </div>
                          {unreadNotificationsCount > 0 && (
                            <div
                              className="flex gap-1 hover:cursor-pointer text-primary-600 hover:text-primary-700"
                              onClick={() => markAllAsRead.mutate()}
                            >
                              <EyeIcon className=" w-5 h-5" />
                              <div className="text-[13px]">
                                Mark all as read
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                          {recentNotifications.length > 0 ? (
                            recentNotifications.map((n: Notification) => (
                              <div
                                key={n.id}
                                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors flex items-center"
                                onClick={() => handleNotificationClick(n)}
                              >
                                <div className="mr-2">
                                  {renderCategoryIcon(n.category)}
                                </div>
                                <div>
                                  <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                                    {n.title}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDistanceToNow(
                                      new Date(n.createdAt),
                                      {
                                        addSuffix: true,
                                        locale: id,
                                      },
                                    )}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                              No recent notifications
                            </div>
                          )}
                        </div>

                        <button
                          className="flex items-center justify-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 py-2 w-full border-t border-gray-200 dark:border-gray-700 transition-colors hover:cursor-pointer"
                          onClick={() => setNotificationSidebar(true)}
                        >
                          <ChevronDown className="w-4 h-4" />
                          Lihat Semua
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}

            {isLoading ? (
              <div className="hidden lg:flex items-center space-x-3 rounded-md px-3 py-2">
                <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="space-y-1">
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-2 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ) : isAuthenticated ? (
              <div className="hidden lg:block relative" ref={dropdownRef}>
                <button
                  onClick={toggleUserDropdown}
                  disabled={isLoggingOut}
                  className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-600 overflow-hidden">
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
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
                      {user?.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.role === Role.RT_ADMIN ? "Admin RT" : "Warga"}
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-gray-400 transition-transform",
                      isUserDropdownOpen && "rotate-180",
                    )}
                  />
                </button>

                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black dark:ring-gray-700 ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-600 overflow-hidden">
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
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {user?.email}
                            </p>
                            <Badge
                              variant={
                                user?.role === Role.RT_ADMIN
                                  ? "info"
                                  : "default"
                              }
                              size="sm"
                              className="mt-1"
                            >
                              {user?.role === Role.RT_ADMIN
                                ? "Admin RT"
                                : "Warga"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {userDropdownItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={closeUserDropdown}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Icon className="h-4 w-4 mr-3" />
                            {item.label}
                          </Link>
                        );
                      })}

                      <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <LogOut
                          className={cn(
                            "h-4 w-4 mr-3",
                            isLoggingOut && "animate-spin",
                          )}
                        />
                        {isLoggingOut ? "Keluar..." : "Keluar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" disabled={isLoading}>
                    <LogIn className="h-4 w-4 mr-1" />
                    Masuk
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" disabled={isLoading}>
                    Daftar
                  </Button>
                </Link>
              </div>
            )}

            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-2 space-y-1">
            {!isLoading &&
              navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={cn(
                      "flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium transition-colors",
                      isActive
                        ? "bg-primary-50 text-primary-700 dark:bg-gray-700 dark:text-gray-100"
                        : "text-gray-600 dark:text-gray-300 hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-gray-700 dark:hover:text-gray-100",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

            {isLoading && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-3 rounded-md px-3 py-2"
                  >
                    <div className="h-5 w-5 animate-pulse bg-gray-300 rounded"></div>
                    <div className="h-4 w-20 animate-pulse bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

            {!isLoading && isAuthenticated ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-3 px-3 py-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-base font-medium text-primary-600 overflow-hidden">
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
                    <Badge
                      variant={
                        user?.role === Role.RT_ADMIN ? "info" : "default"
                      }
                      size="sm"
                      className="mt-1"
                    >
                      {user?.role === Role.RT_ADMIN ? "Admin RT" : "Warga"}
                    </Badge>
                  </div>
                </div>

                {userDropdownItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex w-full items-center space-x-3 rounded-md px-3 py-2 text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut
                    className={cn("h-5 w-5", isLoggingOut && "animate-spin")}
                  />
                  <span>{isLoggingOut ? "Keluar..." : "Keluar"}</span>
                </button>
              </div>
            ) : !isLoading ? (
              <div className="space-y-1">
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <LogIn className="h-5 w-5" />
                  <span>Masuk</span>
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span>Daftar</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-3 rounded-md px-3 py-2"
                  >
                    <div className="h-5 w-5 animate-pulse bg-gray-300 rounded"></div>
                    <div className="h-4 w-16 animate-pulse bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
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
        sidebarLocation="right"
      />
    </header>
  );
};

export default Header;
