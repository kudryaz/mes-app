import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { recipesApi, batchesApi } from "../../services/api-client";
import { useAuthStore } from "../../store/authStore";
import { ArrowLeft, Package, AlertTriangle } from "lucide-react";

const WEIGHT_OPTIONS = [
  { value: "250", label: "250 мг", ratio: "80/170" },
  { value: "700", label: "700 мг", ratio: "200/500" },
  { value: "1350", label: "1350 мг", ratio: "350/1000" },
  { value: "1630", label: "1630 мг", ratio: "430/1200" },
];

const CAPSULE_RATIOS: Record<string, [number, number]> = {
  "250": [80, 170],
  "700": [200, 500],
  "1350": [350, 1000],
  "1630": [430, 1200],
};

export default function BatchForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const [recipes, setRecipes] = useState<{ id: number; name: string; capsule_weight: string; gelatin_components: { name: string; percentage: number }[]; filling_components: { name: string; percentage: number }[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [batchNumber, setBatchNumber] = useState("");
  const [capsuleCount, setCapsuleCount] = useState("");
  const [preview, setPreview] = useState<null | {
    totalMassKg: number;
    gelatinMassKg: number;
    fillingMassKg: number;
    gelatinComponents: { name: string; percentage: number; kg: number }[];
    fillingComponents: { name: string; percentage: number; kg: number }[];
  }>(null);

  const getWorkshopFromUrl = () => {
    if (location.pathname.startsWith("/mzhk/")) return "mzhk";
    if (location.pathname.startsWith("/tzhk/")) return "tzhk";
    return user?.workshop || "mzhk";
  };

  useEffect(() => {
    const ws = getWorkshopFromUrl();
    recipesApi.list({ workshop: ws, active_only: true }).then(({ data }) => {
      setRecipes(data);
      setLoading(false);
    });
  }, [location.pathname]);

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId);

  useEffect(() => {
    if (!selectedRecipe || !capsuleCount) {
      setPreview(null);
      return;
    }
    const count = parseInt(capsuleCount);
    if (isNaN(count) || count <= 0) {
      setPreview(null);
      return;
    }

    const weightMg = parseFloat(selectedRecipe.capsule_weight);
    const totalMassKg = (weightMg / 1_000_000) * count;
    const ratio = CAPSULE_RATIOS[selectedRecipe.capsule_weight];
    const gelPart = ratio[0];
    const fillPart = ratio[1];
    const totalParts = gelPart + fillPart;
    const gelatinMassKg = totalMassKg * gelPart / totalParts;
    const fillingMassKg = totalMassKg * fillPart / totalParts;

    setPreview({
      totalMassKg: Math.round(totalMassKg * 1000) / 1000,
      gelatinMassKg: Math.round(gelatinMassKg * 1000) / 1000,
      fillingMassKg: Math.round(fillingMassKg * 1000) / 1000,
      gelatinComponents: selectedRecipe.gelatin_components.map((c) => ({
        name: c.name,
        percentage: c.percentage,
        kg: Math.round((gelatinMassKg * c.percentage / 100) * 1000) / 1000,
      })),
      fillingComponents: selectedRecipe.filling_components.map((c) => ({
        name: c.name,
        percentage: c.percentage,
        kg: Math.round((fillingMassKg * c.percentage / 100) * 1000) / 1000,
      })),
    });
  }, [selectedRecipe, capsuleCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipeId || !capsuleCount || !batchNumber.trim()) return;

    try {
      const { data } = await batchesApi.create({
        batch_number: batchNumber.trim(),
        recipe_id: selectedRecipeId,
        capsule_count: parseInt(capsuleCount),
      });
      navigate(`/foreman/batches/${data.id}`);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Ошибка создания партии");
    }
  };

  const selectedRatio = selectedRecipe
    ? WEIGHT_OPTIONS.find((w) => w.value === selectedRecipe.capsule_weight)?.ratio || ""
    : "";

  if (loading) return <div className="text-center py-8">Загрузка...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold">Новая партия</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg p-4 border space-y-4">
          <h3 className="font-medium">Параметры партии</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Номер партии</label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Например: П-001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Рецептура</label>
              <select
                value={selectedRecipeId || ""}
                onChange={(e) => setSelectedRecipeId(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">Выберите рецептуру</option>
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Количество капсул</label>
              <input
                type="number"
                value={capsuleCount}
                onChange={(e) => setCapsuleCount(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Например: 1000000"
                required
                min="1"
              />
            </div>
          </div>
          {selectedRecipe && (
            <div className="text-sm text-gray-600 bg-gray-50 rounded-md p-3">
              Вес капсулы: {WEIGHT_OPTIONS.find((w) => w.value === selectedRecipe.capsule_weight)?.label} • Соотношение: {selectedRatio}
            </div>
          )}
        </div>

        {preview && (
          <>
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium">Расчёт сырья</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 rounded-md p-3 text-center">
                  <p className="text-xs text-blue-600">Общая масса</p>
                  <p className="text-lg font-bold text-blue-800">{preview.totalMassKg.toFixed(2)} кг</p>
                </div>
                <div className="bg-orange-50 rounded-md p-3 text-center">
                  <p className="text-xs text-orange-600">Желатин</p>
                  <p className="text-lg font-bold text-orange-800">{preview.gelatinMassKg.toFixed(2)} кг</p>
                </div>
                <div className="bg-purple-50 rounded-md p-3 text-center">
                  <p className="text-xs text-purple-600">Наполнитель</p>
                  <p className="text-lg font-bold text-purple-800">{preview.fillingMassKg.toFixed(2)} кг</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Желатиновая масса</h4>
                  <table className="w-full text-sm">
                    <thead className="text-gray-500">
                      <tr>
                        <th className="text-left py-1">Наименование</th>
                        <th className="text-right py-1">%</th>
                        <th className="text-right py-1">кг</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {preview.gelatinComponents.map((c, i) => (
                        <tr key={i}>
                          <td className="py-1">{c.name}</td>
                          <td className="text-right py-1">{c.percentage.toFixed(2)}%</td>
                          <td className="text-right py-1 font-mono font-medium">{c.kg.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-medium bg-gray-50">
                        <td className="py-1">Итого</td>
                        <td className="text-right py-1">
                          {preview.gelatinComponents.reduce((s, c) => s + c.percentage, 0).toFixed(2)}%
                        </td>
                        <td className="text-right py-1 font-mono">{preview.gelatinMassKg.toFixed(3)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Наполнение</h4>
                  <table className="w-full text-sm">
                    <thead className="text-gray-500">
                      <tr>
                        <th className="text-left py-1">Наименование</th>
                        <th className="text-right py-1">%</th>
                        <th className="text-right py-1">кг</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {preview.fillingComponents.map((c, i) => (
                        <tr key={i}>
                          <td className="py-1">{c.name}</td>
                          <td className="text-right py-1">{c.percentage.toFixed(2)}%</td>
                          <td className="text-right py-1 font-mono font-medium">{c.kg.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-medium bg-gray-50">
                        <td className="py-1">Итого</td>
                        <td className="text-right py-1">
                          {preview.fillingComponents.reduce((s, c) => s + c.percentage, 0).toFixed(2)}%
                        </td>
                        <td className="text-right py-1 font-mono">{preview.fillingMassKg.toFixed(3)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {(() => {
              const gelSum = preview.gelatinComponents.reduce((s, c) => s + c.percentage, 0);
              const fillSum = preview.fillingComponents.reduce((s, c) => s + c.percentage, 0);
              const ok = Math.abs(gelSum - 100) < 0.01 && Math.abs(fillSum - 100) < 0.01;
              if (!ok) {
                return (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm text-yellow-700">
                      Сумма компонентов не равна 100%. Проверьте рецептуру.
                    </span>
                  </div>
                );
              }
              return null;
            })()}
          </>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!preview}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Package className="w-4 h-4" />
            Создать партию
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
