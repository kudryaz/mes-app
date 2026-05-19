import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

function getDefaultPath(role: string, workshop: string | null, canSwitch: boolean): string {
  if (role === "admin") return "/admin/dashboard";
  const prefix = canSwitch ? "/mzhk" : (workshop ? `/${workshop}` : "");
  switch (role) {
    case "technologist": return `${prefix}/technologist/recipes`;
    case "foreman": return `${prefix}/foreman/batches`;
    case "boiler_operator": return `${prefix}/boiler/batches`;
    case "machine_operator": return `${prefix}/machine/dashboard`;
    case "sorter": return "/sorter/tasks";
    case "quality_control": return "/qc/dashboard";
    case "workshop_master": return `${prefix}/master/dashboard`;
    case "mechanic": return "/mechanic/dashboard";
    default: return "/home";
  }
}

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    if (!user) { fetchMe(); return; }
    const currentPath = window.location.pathname;
    const expectedPath = getDefaultPath(user.role, user.workshop, user.can_switch_workshop);
    if (currentPath === "/" || currentPath === "/dashboard" || currentPath === "/home") {
      navigate(expectedPath);
    }
  }, [token, user, fetchMe, navigate]);

  if (!token || !user) return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;

  return <>{children}</>;
}
