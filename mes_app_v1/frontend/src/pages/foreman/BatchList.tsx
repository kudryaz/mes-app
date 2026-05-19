import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { batchesApi, type Batch, type BatchStatus } from "../../services/api-client";
import { useAuthStore } from "../../store/authStore";
import { Plus, ChevronDown, ChevronRight, ArrowRight, AlertCircle } from "lucide-react";

const statusLabels: Record<BatchStatus, string> = {
  planned: "Планируется",
  in_progress: "В работе",
  gelatin_ready: "Желатин готов",
  filling_ready: "Начинка готова",
  completed: "Завершена",
  cancelled: "Отменена",
};

const statusColors: Record<BatchStatus, string> = {
  planned: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  gelatin_ready: "bg-orange-100 text-orange-800",
  filling_ready: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const weightLabels: Record<string, string> = {
  "250": "250 мг",
  "700": "700 мг",
  "1350": "1350 мг",
  "1630": "1630 мг",
};

const statusOrder: Record<BatchStatus, number> = {
  planned: 0,
  in_progress: 1,
  gelatin_ready: 2,
  filling_ready: 3,
  completed: 4,
  cancelled: 5,
};

const validTransitions: Record<BatchStatus, BatchStatus[]> = {
  planned: ["in_progress", "cancelled"],
  in_progress: ["gelatin_ready", "cancelled"],
  gelatin_ready: ["filling_ready", "cancelled"],
  filling_ready: ["completed"],
  completed: [],
  cancelled: [],
};

export default function BatchList() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const getWorkshopFromUrl = () => {
    if (location.pathname.startsWith("/mzhk/")) return "mzhk";
    if (location.pathname.startsWith("/tzhk/")) return "tzhk";
    return user?.workshop || null;
  };

  const load = () => {
    const ws = getWorkshopFromUrl();
    batchesApi.list({ workshop: ws || undefined }).then(({ data }) => {
      setBatches(data.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]));
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [location.pathname]);

  const toggleExpand = (id: number) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const handleStatusChange = async (batchId: number, newStatus: BatchStatus) => {
    await batchesApi.updateStatus(batchId, newStatus);
    load();
  };

  const navigate = useNavigate();
  const handleNewBatch = () => {
    navigate("new");
  };

  if (loading) return <div className="text-center py-8">Загрузка...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Партии</h2>
        <button
          onClick={handleNewBatch}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Новая партия
        </button>
      </div>

      {batches.length === 0 && (
        <div className="bg-white rounded-lg p-8 text-center text-gray-500 border">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Нет партий. Создайте первую.</p>
        </div>
      )}

      <div className="space-y-2">
        {batches.map((batch) => {
          const transitions = validTransitions[batch.status];
          return (
            <div key={batch.id} className="bg-white rounded-lg border shadow-sm">
              <button
                onClick={() => toggleExpand(batch.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  {expandedIds.has(batch.id) ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium">
                      <span className="text-blue-700 font-semibold">{batch.batch_number}</span>
                      <span className="text-gray-400 mx-1">—</span>
                      {batch.recipe_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {weightLabels[batch.capsule_weight]} • {batch.capsule_count.toLocaleString("ru-RU")} шт • {batch.total_mass_kg.toFixed(1)} кг
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColors[batch.status]}`}>
                    {statusLabels[batch.status]}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(batch.created_at).toLocaleDateString("ru-RU")}
                  </span>
                </div>
              </button>

              {expandedIds.has(batch.id) && (
                <div className="px-4 pb-4 border-t pt-3">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Желатиновая масса ({batch.gelatin_mass_kg.toFixed(2)} кг)</h4>
                      <table className="w-full text-sm">
                        <thead className="text-gray-500">
                          <tr>
                            <th className="text-left py-1">Наименование</th>
                            <th className="text-right py-1">%</th>
                            <th className="text-right py-1">кг</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {batch.components
                            .filter((c) => c.type === "gelatin")
                            .sort((a, b) => a.order_index - b.order_index)
                            .map((c) => (
                              <tr key={c.id}>
                                <td className="py-1">{c.name}</td>
                                <td className="text-right py-1">{c.percentage.toFixed(2)}%</td>
                                <td className="text-right py-1 font-mono">{c.required_kg.toFixed(3)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Наполнение ({batch.filling_mass_kg.toFixed(2)} кг)</h4>
                      <table className="w-full text-sm">
                        <thead className="text-gray-500">
                          <tr>
                            <th className="text-left py-1">Наименование</th>
                            <th className="text-right py-1">%</th>
                            <th className="text-right py-1">кг</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {batch.components
                            .filter((c) => c.type === "filling")
                            .sort((a, b) => a.order_index - b.order_index)
                            .map((c) => (
                              <tr key={c.id}>
                                <td className="py-1">{c.name}</td>
                                <td className="text-right py-1">{c.percentage.toFixed(2)}%</td>
                                <td className="text-right py-1 font-mono">{c.required_kg.toFixed(3)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {transitions.length > 0 && (
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-sm text-gray-500">Перевести в:</span>
                      {transitions.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(batch.id, s)}
                          className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${
                            s === "cancelled"
                              ? "text-red-600 hover:bg-red-50"
                              : "text-blue-600 hover:bg-blue-50"
                          }`}
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          {statusLabels[s]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
