// Reusable skeleton components for stock pages

export function StockCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gray-200"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-24"></div>
            <div className="h-2 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-12"></div>
    </div>
  );
}

export function StockMovementRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-28"></div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
          <div className="h-6 bg-gray-200 rounded-full w-24"></div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-full max-w-xs"></div>
      </td>
    </tr>
  );
}

export function LowStockProductSkeleton() {
  return (
    <div className="p-4 hover:bg-gray-50 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 rounded w-40"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="text-right space-y-2">
          <div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div>
          <div className="h-3 bg-gray-200 rounded w-16 ml-auto"></div>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3"></div>
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-full"></div>
        <div className="flex items-center gap-2">
          <div className="h-8 bg-gray-200 rounded flex-1"></div>
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}

export function RecentMovementSkeleton() {
  return (
    <div className="p-4 flex items-center justify-between hover:bg-gray-50 animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-36"></div>
        <div className="h-3 bg-gray-200 rounded w-24"></div>
      </div>
      <div className="text-right space-y-2">
        <div className="h-6 bg-gray-200 rounded-full w-28 ml-auto"></div>
        <div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div>
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="space-y-2 mb-4">
        <div className="h-5 bg-gray-200 rounded w-48"></div>
        <div className="h-3 bg-gray-200 rounded w-64"></div>
      </div>
      <div className="h-64 bg-gray-100 rounded-lg"></div>
    </div>
  );
}
