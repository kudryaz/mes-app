import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { recipesApi } from "../../services/api-client";
import { useAuthStore } from "../../store/authStore";
import { Plus, Trash2, Save, ArrowLeft, AlertTriangle } from "lucide-react";

const WEIGHT_OPTIONS = [
  { value: "250", label: "250 мг", ratio: "80/170" },
  { value: "700", label: "700 мг", ratio: "200/500" },
  { value: "1350", label: "1350 мг", ratio: "350/1000" },
  { value: "1630", label: "1630 мг", ratio: "430/1200" },
];

interface ComponentItem {
  name: string;
  percentage: string;
}

const pct = (arr: ComponentItem[]) => arr.reduce((s, c) => s + (parseFloat(c.percentage) || 0), 0);

const PercentInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-28 px-3 py-2 border rounded-md text-right font-mono"
    placeholder="0.00"
    inputMode="decimal"
  />
);

const SumIndicator = ({ sum }: { sum: number }) => {
  const ok = sum > 0 && Math.abs(sum - 100) < 0.01;
  return (
    <span className={`text-sm px-2 py-0.5 rounded flex items-center gap-1 ${
      ok ? "bg-green-100 text-green-700" : sum > 0 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"
    }`}>
      {!ok && sum > 0 && <AlertTriangle className="w-3.5 h-3.5" />}
      Сумма: {sum.toFixed(2)}%
      {sum > 0 && !ok && <span className="text-xs opacity-75">(не 100%)</span>}
    </span>
  );
};

export default function RecipeForm({ mode }: { mode: "create" | "edit" | "new-version" }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(mode !== "create");

  const [name, setName] = useState("");
  const [capsuleWeight, setCapsuleWeight] = useState("250");
  const [description, setDescription] = useState("");
  const [gelatinComponents, setGelatinComponents] = useState<ComponentItem[]>([{ name: "", percentage: "" }]);
  const [fillingComponents, setFillingComponents] = useState<ComponentItem[]>([{ name: "", percentage: "" }]);

  const gelatinSum = pct(gelatinComponents);
  const fillingSum = pct(fillingComponents);

  useEffect(() => {
    if (mode === "create") return;
    if (!id) return;
    recipesApi.get(parseInt(id)).then(({ data }) => {
      setName(data.name);
      setCapsuleWeight(data.capsule_weight);
      setDescription(data.description || "");
      if (data.gelatin_components.length > 0) {
        setGelatinComponents(data.gelatin_components.map((c) => ({ name: c.name, percentage: String(c.percentage) })));
      }
      if (data.filling_components.length > 0) {
        setFillingComponents(data.filling_components.map((c) => ({ name: c.name, percentage: String(c.percentage) })));
      }
      setLoading(false);
    });
  }, [id, mode]);

  const addComponent = (type: "gelatin" | "filling") => {
    const item = { name: "", percentage: "" };
    if (type === "gelatin") setGelatinComponents([...gelatinComponents, item]);
    else setFillingComponents([...fillingComponents, item]);
  };

  const removeComponent = (type: "gelatin" | "filling", index: number) => {
    if (type === "gelatin") setGelatinComponents(gelatinComponents.filter((_, i) => i !== index));
    else setFillingComponents(fillingComponents.filter((_, i) => i !== index));
  };

  const updateComponent = (type: "gelatin" | "filling", index: number, field: keyof ComponentItem, value: string) => {
    if (type === "gelatin") {
      const next = [...gelatinComponents];
      next[index] = { ...next[index], [field]: value };
      setGelatinComponents(next);
    } else {
      const next = [...fillingComponents];
      next[index] = { ...next[index], [field]: value };
      setFillingComponents(next);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      workshop: user?.workshop || "mzhk",
      name,
      capsule_weight: capsuleWeight,
      description,
      gelatin_components: gelatinComponents.filter((c) => c.name.trim()).map((c) => ({ name: c.name, percentage: parseFloat(c.percentage) || 0 })),
      filling_components: fillingComponents.filter((c) => c.name.trim()).map((c) => ({ name: c.name, percentage: parseFloat(c.percentage) || 0 })),
    };

    try {
      if (mode === "create") {
        await recipesApi.create(data);
      } else if (mode === "edit") {
        await recipesApi.update(parseInt(id!), {
          name,
          description,
          gelatin_components: data.gelatin_components,
          filling_components: data.filling_components,
        });
      } else {
        await recipesApi.newVersion(parseInt(id!), {
          name,
          description,
          gelatin_components: data.gelatin_components,
          filling_components: data.filling_components,
        });
      }
      navigate("/technologist/recipes");
    } catch (err: any) {
      alert(err.response?.data?.detail?.[0]?.msg || "Ошибка сохранения");
    }
  };

  if (loading) return <div className="text-center py-8">Загрузка...</div>;

  const selectedRatio = WEIGHT_OPTIONS.find((w) => w.value === capsuleWeight)?.ratio || "";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold">
          {mode === "create" ? "Новая рецептура" : mode === "edit" ? `Редактирование: ${name}` : `Новая версия: ${name}`}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg p-4 border space-y-4">
          <h3 className="font-medium">Основная информация</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Название рецептуры</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
                placeholder="Например: Витамин D3 250мг"
              />
            </div>
            {mode === "create" && (
              <div>
                <label className="block text-sm font-medium mb-1">Вес капсулы</label>
                <select
                  value={capsuleWeight}
                  onChange={(e) => setCapsuleWeight(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {WEIGHT_OPTIONS.map((w) => (
                    <option key={w.value} value={w.value}>{w.label} (соотношение {w.ratio})</option>
                  ))}
                </select>
              </div>
            )}
            {mode !== "create" && (
              <div>
                <label className="block text-sm font-medium mb-1">Вес капсулы</label>
                <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-600">
                  {WEIGHT_OPTIONS.find((w) => w.value === capsuleWeight)?.label} (соотношение {selectedRatio})
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              rows={2}
              placeholder="Дополнительные заметки..."
            />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Желатиновая масса</h3>
            <SumIndicator sum={gelatinSum} />
          </div>
          <div className="space-y-2">
            {gelatinComponents.map((comp, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="text-gray-400 text-sm w-6">{i + 1}</span>
                <input
                  type="text"
                  value={comp.name}
                  onChange={(e) => updateComponent("gelatin", i, "name", e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md"
                  placeholder="Наименование"
                  required
                />
                <PercentInput
                  value={comp.percentage}
                  onChange={(v) => updateComponent("gelatin", i, "percentage", v)}
                />
                <span className="text-gray-500">%</span>
                {gelatinComponents.length > 1 && (
                  <button type="button" onClick={() => removeComponent("gelatin", i)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addComponent("gelatin")}
            className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <Plus className="w-4 h-4" />
            Добавить компонент
          </button>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Наполнение</h3>
            <SumIndicator sum={fillingSum} />
          </div>
          <div className="space-y-2">
            {fillingComponents.map((comp, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="text-gray-400 text-sm w-6">{i + 1}</span>
                <input
                  type="text"
                  value={comp.name}
                  onChange={(e) => updateComponent("filling", i, "name", e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md"
                  placeholder="Наименование"
                  required
                />
                <PercentInput
                  value={comp.percentage}
                  onChange={(v) => updateComponent("filling", i, "percentage", v)}
                />
                <span className="text-gray-500">%</span>
                {fillingComponents.length > 1 && (
                  <button type="button" onClick={() => removeComponent("filling", i)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addComponent("filling")}
            className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <Plus className="w-4 h-4" />
            Добавить компонент
          </button>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium"
          >
            <Save className="w-4 h-4" />
            {mode === "create" ? "Создать" : mode === "edit" ? "Сохранить" : "Создать версию"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border rounded-md hover:bg-gray-50"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
