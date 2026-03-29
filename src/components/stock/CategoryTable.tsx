// src/components/stock/CategoryTable.tsx
import { Edit, Trash2, Tag } from 'lucide-react';
import { Category } from '../../types/category';

interface CategoryTableProps {
  categories: Category[];
}

export default function CategoryTable({ categories }: CategoryTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Catégorie</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Description</th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">Statut</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Date de création</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Tag className="h-5 w-5 text-indigo-600" />
                    </div>
                    <span className="font-medium text-gray-900">{category.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {category.description || '—'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                    category.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {category.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {new Date(category.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
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
