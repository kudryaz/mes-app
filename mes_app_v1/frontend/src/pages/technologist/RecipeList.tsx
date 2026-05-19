import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { recipesApi, type Recipe } from "../../services/api-client";
import { useAuthStore } from "../../store/authStore";
import { Plus, FileText, ChevronDown, ChevronRight, Trash2 } from "lucide-react";

const weightLabels: Record<string, string> = {
  "250": "250 мг",
  "700": "700 мг",
  "1350": "1350 мг",
  "1630": "1630 мг",
};

export default function RecipeList() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const getWorkshopFromUrl = () => {
    if (location.pathname.startsWith("/mzhk/")) return "mzhk";
    if (location.pathname.startsWith("/tzhk/")) return "tzhk";
    return user?.workshop || null;
  };

  const load = () => {
    const ws = getWorkshopFromUrl();
    const params: { active_only: boolean; workshop?: string } = { active_only: true };
    if (ws) params.workshop = ws;
    recipesApi.list(params).then(({ data }) => {
      setRecipes(data);
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

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Удалить рецептуру "${name}"?`)) {
      await recipesApi.delete(id);
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setRecipes((prev) => prev.filter((r) => r.id !== id));
    }
  };

  if (loading) return <div className="text-center py-8">Загрузка...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Рецептуры МЖК</h2>
        <Link
          to="/technologist/recipes/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Новая рецептура
        </Link>
      </div>

      {recipes.length === 0 && (
        <div className="bg-white rounded-lg p-8 text-center text-gray-500 border">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Нет рецептур. Создайте первую.</p>
        </div>
      )}

      <div className="space-y-2">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="bg-white rounded-lg border shadow-sm">
            <button
              onClick={() => toggleExpand(recipe.id)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-3">
                {expandedIds.has(recipe.id) ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <p className="font-medium">{recipe.name}</p>
                  <p className="text-sm text-gray-500">
                    {weightLabels[recipe.capsule_weight]} • Соотношение: {recipe.capsule_ratio} • v{recipe.version}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                  {new Date(recipe.updated_at).toLocaleDateString("ru-RU")}
                </span>
              </div>
            </button>

            {expandedIds.has(recipe.id) && (
              <div className="px-4 pb-4 border-t pt-3">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Желатиновая масса</h4>
                    <table className="w-full text-sm">
                      <thead className="text-gray-500">
                        <tr>
                          <th className="text-left py-1">Наименование</th>
                          <th className="text-right py-1">%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recipe.gelatin_components.map((c, i) => (
                          <tr key={i}>
                            <td className="py-1">{c.name}</td>
                            <td className="text-right py-1">{c.percentage.toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-medium">
                          <td className="py-1">Итого</td>
                          <td className="text-right py-1">
                            {recipe.gelatin_components.reduce((s, c) => s + c.percentage, 0).toFixed(2)}%
                          </td>
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
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recipe.filling_components.map((c, i) => (
                          <tr key={i}>
                            <td className="py-1">{c.name}</td>
                            <td className="text-right py-1">{c.percentage.toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-medium">
                          <td className="py-1">Итого</td>
                          <td className="text-right py-1">
                            {recipe.filling_components.reduce((s, c) => s + c.percentage, 0).toFixed(2)}%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                {recipe.description && (
                  <p className="text-sm text-gray-500 mt-3">{recipe.description}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <Link
                    to={`/technologist/recipes/${recipe.id}/edit`}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Редактировать
                  </Link>
                  <Link
                    to={`/technologist/recipes/${recipe.id}/new-version`}
                    className="text-sm text-green-600 hover:text-green-800 font-medium"
                  >
                    Новая версия
                  </Link>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(recipe.id, recipe.name); }}
                    className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Удалить
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
