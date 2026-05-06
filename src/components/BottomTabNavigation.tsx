import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/api";
import {
  Home,
  Package,
  Users,
  BarChart3,
  CheckCircle,
  PenTool,
  User,
  LogOut,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect, useMemo } from "react";
import { NotificationBell } from "./NotificationBell";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";

export function BottomTabNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const animationRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Determinar tabs baseado no role - memoizado para não recalcular a cada render
  const tabs = useMemo(() => {
    return user?.role === "customer"
      ? [
          { to: "/customer", icon: Home, label: "Página Inicial", color: "#3b82f6", bgColor: "#dbeafe" },
          { to: "/customer/chat", icon: MessageSquare, label: "Chat", color: "#6366f1", bgColor: "#e0e7ff" },
          { to: "/profiles", icon: Users, label: "Perfis", color: "#8b5cf6", bgColor: "#ede9fe" },
        ]
      : user?.role === "employee"
      ? [
          { to: "/employee", icon: Home, label: "Página Inicial", color: "#3b82f6", bgColor: "#dbeafe" },
          { to: "/employee/products", icon: Package, label: "Produtos", color: "#ec4899", bgColor: "#fce7f3" },
          { to: "/employee/tasks", icon: CheckCircle, label: "Tarefas", color: "#10b981", bgColor: "#d1fae5" },
          { to: "/employee/chat", icon: MessageSquare, label: "Chat", color: "#6366f1", bgColor: "#e0e7ff" },
          { to: "/profiles", icon: Users, label: "Perfis", color: "#8b5cf6", bgColor: "#ede9fe" },
        ]
      : [
          { to: "/manager", icon: Home, label: "Página Inicial", color: "#3b82f6", bgColor: "#dbeafe" },
          { to: "/manager/products", icon: Package, label: "Produtos", color: "#ec4899", bgColor: "#fce7f3" },
          { to: "/manager/employees", icon: Users, label: "Funcionários", color: "#f59e0b", bgColor: "#fef3c7" },
          { to: "/manager/statistics", icon: BarChart3, label: "Estatísticas", color: "#06b6d4", bgColor: "#cffafe" },
          { to: "/manager/tasks", icon: CheckCircle, label: "Tarefas", color: "#10b981", bgColor: "#d1fae5" },
          { to: "/manager/chat", icon: MessageSquare, label: "Chat", color: "#6366f1", bgColor: "#e0e7ff" },
          { to: "/profiles", icon: Users, label: "Perfis", color: "#8b5cf6", bgColor: "#ede9fe" },
          { to: "/manager/map-editor", icon: PenTool, label: "Mapa", color: "#6366f1", bgColor: "#e0e7ff" },
        ];
  }, [user?.role]);

  // Função para calcular o tab ativo
  const getActiveTabIndex = (currentPath: string, currentTabs: typeof tabs) => {
    const activeIndex = currentTabs.findIndex((tab) => {
      if (currentPath === tab.to) return true;
      if (currentPath.startsWith(tab.to) && 
          tab.to !== "/customer" && 
          tab.to !== "/employee" && 
          tab.to !== "/manager" &&
          tab.to !== "/profile") {
        return true;
      }
      return false;
    });
    return activeIndex !== -1 ? activeIndex : 0;
  };

  // Inicializar com o tab ativo correto
  const [activeTab, setActiveTab] = useState<number>(() => 
    getActiveTabIndex(location.pathname, tabs)
  );

  // Atualizar quando pathname muda
  useEffect(() => {
    const newActiveIndex = getActiveTabIndex(location.pathname, tabs);
    setActiveTab(newActiveIndex);
  }, [location.pathname, tabs]);

  const handleTabClick = (index: number, path: string) => {
    setActiveTab(index);
    navigate(path);
  };

  const currentTab = tabs[activeTab];

  return (
    <>
      {/* Mobile Top Header - Logo + Bell + Profile */}
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-[hsl(215_45%_12%)] border-b border-slate-200 dark:border-slate-700 z-50 md:hidden">
        <div className="flex items-center justify-between h-14 px-4">
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">MarketFind</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title={theme === "dark" ? "Modo claro" : "Modo escuro"}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-slate-600" />
              )}
            </button>
            <NotificationBell />
            <button
              onClick={() => navigate("/profile")}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Perfil"
            >
              {user?.avatar ? (
                <img
                  src={`${API_URL.replace('/api', '')}${user.avatar}`}
                  alt="Avatar"
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile top spacer */}
      <div className="h-14 md:hidden" />

      {/* Bottom Navigation Bar - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[hsl(215_45%_12%)] border-t border-slate-200 dark:border-slate-700 shadow-lg z-50 md:hidden">
        <div className="flex items-center justify-around h-16 px-1 gap-0.5">
          {tabs.map((tab, index) => {
            const active = index === activeTab;
            const Icon = tab.icon;

            return (
              <button
                key={tab.to}
                onClick={() => handleTabClick(index, tab.to)}
                ref={(el) => {
                  animationRefs.current[index] = el;
                }}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full py-1.5 px-1 rounded-t-xl transition-all duration-300",
                  "hover:bg-slate-50 dark:hover:bg-slate-700/50 active:scale-95",
                  active ? "text-white" : "text-slate-600 dark:text-slate-400"
                )}
                style={active ? { backgroundColor: tab.color } : undefined}
                title={tab.label}
              >
                <Icon className={cn("h-5 w-5 transition-all", active && "scale-105")} />
                {active && (
                  <span
                    className="text-xs font-bold mt-0.5 transform transition-all duration-300 origin-bottom line-clamp-1"
                    style={{
                      animation: "slideInUp 0.3s ease-out",
                    }}
                  >
                    {tab.label}
                  </span>
                )}
              </button>
            );
          })}
          
          {/* Logout Button Mobile */}
          <button
            onClick={handleLogout}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full py-1.5 px-1 rounded-t-xl transition-all duration-300",
              "hover:bg-destructive/10 active:scale-95 text-destructive"
            )}
            title="Logout"
          >
            <LogOut className="h-5 w-5 transition-all" />
          </button>
        </div>
      </nav>

      {/* Desktop Navigation */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 bg-white dark:bg-[hsl(215_45%_12%)] border-b border-slate-200 dark:border-slate-700 z-50 items-center justify-between px-6 h-16">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">MarketFind</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-amber-400" />
            ) : (
              <Moon className="h-5 w-5 text-slate-600" />
            )}
          </button>
          <NotificationBell />
          <button
            onClick={() => navigate("/profile")}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            {user?.avatar ? (
              <img
                src={`${API_URL.replace('/api', '')}${user.avatar}`}
                alt="Avatar"
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-slate-600" />
            )}
          </button>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Desktop Tab Navigation */}
      <nav className="hidden md:flex fixed top-16 left-0 right-0 bg-slate-50 dark:bg-[hsl(215_42%_14%)] border-b border-slate-200 dark:border-slate-700 z-40 justify-center gap-2 px-6 py-3">
        {tabs.map((tab, index) => {
          const active = index === activeTab;
          const Icon = tab.icon;

          return (
            <button
              key={tab.to}
              onClick={() => handleTabClick(index, tab.to)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300",
                active
                  ? "text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
              style={active ? { backgroundColor: tab.color } : undefined}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Espaçador desktop */}
      <div className="hidden md:block h-28" />

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

