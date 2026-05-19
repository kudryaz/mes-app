import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Package,
  Repeat,
} from "lucide-react";
import { useEffect, useState } from "react";

const roleLabels: Record<string, string> = {
  admin: "Администратор",
  foreman: "Бригадир",
  technologist: "Технолог",
  boiler_operator: "Варщик",
  machine_operator: "Оператор",
  sorter: "Отбраковка",
  quality_control: "ОТК",
  workshop_master: "Мастер цеха",
  mechanic: "Механик",
};

const workshopLabels: Record<string, string> = {
  mzhk: "МЖК",
  tzhk: "ТЖК",
};

type WorkshopKey = "mzhk" | "tzhk";
const WORKSHOPS: WorkshopKey[] = ["mzhk", "tzhk"];

interface MenuItem {
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

function getWorkshopMenu(workshop: WorkshopKey, role: string): MenuGroup {
  const prefix = `/${workshop}`;
  const wsLabel = workshopLabels[workshop];

  const items: MenuItem[] = [];

  if (role === "admin" || role === "technologist") {
    items.push(
      { label: `${wsLabel} — Рецептуры`, icon: BookOpen, path: `${prefix}/technologist/recipes` },
      { label: `${wsLabel} — Новая рецептура`, icon: BookOpen, path: `${prefix}/technologist/recipes/new` }
    );
  }
  if (role === "admin" || role === "foreman") {
    items.push(
      { label: `${wsLabel} — Партии`, icon: Package, path: `${prefix}/foreman/batches` },
      { label: `${wsLabel} — Новая партия`, icon: Package, path: `${prefix}/foreman/batches/new` }
    );
  }
  if (role === "workshop_master") {
    items.push(
      { label: `${wsLabel} — Партии`, icon: Package, path: `${prefix}/master/batches` },
      { label: `${wsLabel} — Рецептуры`, icon: BookOpen, path: `${prefix}/master/recipes` }
    );
  }

  return { label: wsLabel, items };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [activeWorkshop, setActiveWorkshop] = useState<WorkshopKey | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.can_switch_workshop) {
      const stored = localStorage.getItem("active_workshop") as WorkshopKey | null;
      if (stored && WORKSHOPS.includes(stored)) {
        setActiveWorkshop(stored);
      } else {
        setActiveWorkshop("mzhk");
      }
    } else if (user.workshop) {
      setActiveWorkshop(user.workshop);
    }
  }, [user]);

  if (!user || !activeWorkshop) return null;

  const toggleGroup = (key: string) => {
    const next = new Set(expandedGroups);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpandedGroups(next);
  };

  const handleWorkshopSwitch = (ws: WorkshopKey) => {
    setActiveWorkshop(ws);
    localStorage.setItem("active_workshop", ws);
    const currentPath = location.pathname;
    const newPrefix = `/${ws}`;
    const oldPrefix = currentPath.startsWith("/mzhk") ? "/mzhk" : currentPath.startsWith("/tzhk") ? "/tzhk" : null;
    if (oldPrefix) {
      navigate(currentPath.replace(oldPrefix, newPrefix));
    }
  };

  const menuItems: (MenuItem | MenuGroup)[] = [];

  if (user.role === "admin") {
    menuItems.push(
      { label: "Главная", icon: LayoutDashboard, path: "/admin/dashboard" },
      { label: "Пользователи", icon: Users, path: "/admin/users" },
      { label: "Настройки", icon: Settings, path: "/admin/settings" }
    );
    if (user.can_switch_workshop) {
      menuItems.push(...WORKSHOPS.map((ws) => getWorkshopMenu(ws, user.role)));
    } else {
      menuItems.push(getWorkshopMenu(activeWorkshop, user.role));
    }
  } else if (user.can_switch_workshop) {
    menuItems.push(...WORKSHOPS.map((ws) => getWorkshopMenu(ws, user.role)));
  } else {
    menuItems.push(getWorkshopMenu(activeWorkshop, user.role));
  }

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderMenuItem = (item: MenuItem) => (
    <Link
      key={item.path}
      to={item.path}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive(item.path)
          ? "bg-blue-50 text-blue-700"
          : "text-gray-700 hover:bg-gray-100"
      }`}
      onClick={() => setSidebarOpen(false)}
    >
      <item.icon className="w-5 h-5" />
      {item.label}
    </Link>
  );

  const allItems = menuItems.flatMap((m) => "items" in m ? m.items : [m]);
  const currentItem = allItems.find((i) => isActive(i.path));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">MES Капсулы</h1>
          <button className="lg:hidden p-1" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {user.can_switch_workshop && (
          <div className="p-3 border-b border-gray-100">
            <div className="flex rounded-md overflow-hidden border">
              {WORKSHOPS.map((ws) => (
                <button
                  key={ws}
                  onClick={() => handleWorkshopSwitch(ws)}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeWorkshop === ws
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {workshopLabels[ws]}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
          {menuItems.map((entry) => {
            if ("items" in entry) {
              const groupKey = entry.label;
              const isExpanded = expandedGroups.has(groupKey);
              return (
                <div key={groupKey}>
                  <button
                    onClick={() => toggleGroup(groupKey)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    {entry.label}
                  </button>
                  {isExpanded && (
                    <div className="ml-2 space-y-1 mt-1">
                      {entry.items.map(renderMenuItem)}
                    </div>
                  )}
                </div>
              );
            }
            return renderMenuItem(entry);
          })}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-700 font-medium text-sm">{user.name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                {roleLabels[user.role]}
                {user.can_switch_workshop && <Repeat className="w-3 h-3" />}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4">
          <button className="lg:hidden p-2 mr-3" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            {activeWorkshop && (
              <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                {workshopLabels[activeWorkshop]}
              </span>
            )}
            <h2 className="text-lg font-semibold text-gray-900">
              {currentItem?.label || "MES Капсулы"}
            </h2>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
