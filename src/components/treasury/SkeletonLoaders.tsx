// Reusable skeleton components for treasury pages

export function SummaryCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 bg-gray-200 rounded-xl w-10 h-10"></div>
        <div className="h-3 bg-gray-200 rounded w-24"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-32 mb-1"></div>
      <div className="h-3 bg-gray-200 rounded w-12"></div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-5 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-5 whitespace-nowrap">
        <div className="h-6 bg-gray-200 rounded-lg w-28"></div>
      </td>
      <td className="px-6 py-5">
        <div className="h-4 bg-gray-200 rounded w-48"></div>
      </td>
      <td className="px-6 py-5 whitespace-nowrap">
        <div className="h-5 bg-gray-200 rounded-lg w-20"></div>
      </td>
      <td className="px-6 py-5 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-5 whitespace-nowrap text-right">
        <div className="h-4 bg-gray-200 rounded w-28 ml-auto"></div>
      </td>
      <td className="px-6 py-5 text-center">
        <div className="h-6 bg-gray-200 rounded-lg w-16 mx-auto"></div>
      </td>
      <td className="px-6 py-5 text-center">
        <div className="h-6 bg-gray-200 rounded-lg w-20 mx-auto"></div>
      </td>
    </tr>
  );
}

export function AccountCardSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gray-200"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-12"></div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-28"></div>
          <div className="h-3 bg-gray-200 rounded w-36"></div>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="h-4 bg-gray-200 rounded w-28 ml-auto"></div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32 ml-auto"></div>
          <div className="h-3 bg-gray-200 rounded w-24 ml-auto"></div>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="h-6 bg-gray-200 rounded-full w-16 mx-auto"></div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="h-8 w-8 bg-gray-200 rounded-lg ml-auto"></div>
      </td>
    </tr>
  );
}

export function MemberCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-200"></div>
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-28"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-6 bg-gray-200 rounded-lg w-20"></div>
        </div>
      </div>
      
      <div className="flex gap-2 pt-4 border-t">
        <div className="h-9 bg-gray-200 rounded-lg flex-1"></div>
        <div className="h-9 bg-gray-200 rounded-lg flex-1"></div>
      </div>
    </div>
  );
}

export function RecurringInvoiceRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-28"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200 rounded-lg w-20"></div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="h-5 bg-gray-200 rounded w-28 ml-auto"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="h-6 bg-gray-200 rounded-full w-16 mx-auto"></div>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="h-9 bg-gray-200 rounded-lg w-32 mx-auto"></div>
      </td>
    </tr>
  );
}
