import { useEffect, useState } from "react";
import { usersApi, type User } from "../../services/api-client";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";

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

const roleOptions = Object.entries(roleLabels).map(([value, label]) => ({ value, label }));

const workshopOptions = [
  { value: "mzhk", label: "МЖК" },
  { value: "tzhk", label: "ТЖК" },
];

const ROLES_WITH_WORKSHOP = ["foreman", "technologist", "boiler_operator", "machine_operator", "sorter", "quality_control", "workshop_master", "mechanic"];

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  const [form, setForm] = useState({
    login: "",
    password: "",
    name: "",
    role: "machine_operator",
    workshop: null as string | null,
    can_switch_workshop: false,
    is_active: true,
  });

  const load = () => {
    usersApi.list().then(({ data }) => {
      setUsers(data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await usersApi.update(editing.id, {
        login: form.login || undefined,
        password: form.password || undefined,
        name: form.name,
        role: form.role,
        workshop: form.workshop,
        can_switch_workshop: form.can_switch_workshop,
        is_active: form.is_active,
      });
    } else {
      await usersApi.create({
        login: form.login,
        password: form.password,
        name: form.name,
        role: form.role,
        workshop: form.workshop,
        can_switch_workshop: form.can_switch_workshop,
        is_active: form.is_active,
      });
    }
    setShowForm(false);
    setEditing(null);
    setForm({ login: "", password: "", name: "", role: "machine_operator", workshop: null, can_switch_workshop: false, is_active: true });
    load();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Удалить этого пользователя?")) {
      await usersApi.delete(id);
      load();
    }
  };

  const handleEdit = (u: User) => {
    setEditing(u);
    setForm({
      login: u.login,
      password: "",
      name: u.name,
      role: u.role,
      workshop: u.workshop,
      can_switch_workshop: u.can_switch_workshop,
      is_active: u.is_active,
    });
    setShowForm(true);
  };

  const togglePassword = (id: number) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return <div className="text-center py-8">Загрузка...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Пользователи</h2>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm({ login: "", password: "", name: "", role: "machine_operator", workshop: null, can_switch_workshop: false, is_active: true }); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Новый пользователь
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Логин</label>
              <input
                type="text"
                value={form.login}
                onChange={(e) => setForm({ ...form, login: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
                placeholder={editing ? "Оставьте пустым, чтобы не менять" : ""}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {editing ? "Новый пароль" : "Пароль"}
              </label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required={!editing}
                placeholder={editing ? "Оставьте пустым, чтобы не менять" : ""}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ФИО</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Роль</label>
              <select
                value={form.role}
                onChange={(e) => {
                  const r = e.target.value;
                  setForm({ ...form, role: r, workshop: ROLES_WITH_WORKSHOP.includes(r) ? form.workshop : null });
                }}
                className="w-full px-3 py-2 border rounded-md"
              >
                {roleOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {ROLES_WITH_WORKSHOP.includes(form.role) && (
              <div>
                <label className="block text-sm font-medium mb-1">Цех</label>
                <select
                  value={form.workshop || ""}
                  onChange={(e) => setForm({ ...form, workshop: e.target.value || null })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Не назначен</option>
                  {workshopOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}
            {ROLES_WITH_WORKSHOP.includes(form.role) && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="can_switch_workshop"
                  checked={form.can_switch_workshop}
                  onChange={(e) => setForm({ ...form, can_switch_workshop: e.target.checked })}
                />
                <label htmlFor="can_switch_workshop" className="text-sm">Может переключать цеха</label>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              <label htmlFor="is_active" className="text-sm">Активен</label>
            </div>
            <div className={`flex gap-2 ${ROLES_WITH_WORKSHOP.includes(form.role) ? "md:col-span-1" : "md:col-span-2"}`}>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium">
                {editing ? "Обновить" : "Создать"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null); }}
                className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-2">ФИО</th>
              <th className="text-left px-4 py-2">Логин</th>
              <th className="text-left px-4 py-2">Пароль</th>
              <th className="text-left px-4 py-2">Роль</th>
              <th className="text-left px-4 py-2">Цех</th>
              <th className="text-left px-4 py-2">Переключение</th>
              <th className="text-left px-4 py-2">Статус</th>
              <th className="text-left px-4 py-2">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{u.name}</td>
                <td className="px-4 py-2 text-gray-500">{u.login}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs">
                      {showPasswords[u.id] ? u.password : "••••••••"}
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePassword(u.id)}
                      className="p-0.5 hover:bg-gray-100 rounded"
                    >
                      {showPasswords[u.id] ? (
                        <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-2">{roleLabels[u.role]}</td>
                <td className="px-4 py-2 text-gray-500">
                  {u.workshop ? (u.workshop === "mzhk" ? "МЖК" : "ТЖК") : "-"}
                </td>
                <td className="px-4 py-2">
                  {u.can_switch_workshop ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">Оба цеха</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">Статично</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${u.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {u.is_active ? "Активен" : "Неактивен"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(u)} className="p-1 hover:bg-gray-100 rounded">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="p-1 hover:bg-gray-100 rounded text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
