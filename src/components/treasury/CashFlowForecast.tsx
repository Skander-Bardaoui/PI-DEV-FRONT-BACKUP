// src/components/treasury/CashFlowForecast.tsx
import { useEffect } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, RefreshCw, AlertCircle, Sparkles,
  Lightbulb, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { useForecast } from '@/hooks/useForecast';

export default function CashFlowForecast() {
  const { data, loading, error, fetchForecast } = useForecast();

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  // Merge historical + forecast into one chart dataset
  const chartData = [
    ...(data?.historical ?? []).map((d) => ({
      date: d.date.slice(5),
      inflow: d.inflow,
      outflow: d.outflow,
      balance: d.balance,
      predicted: null,
    })),
    ...(data?.forecast ?? []).map((d) => ({
      date: d.date.slice(5),
      inflow: null,
      outflow: null,
      balance: null,
      predicted: d.predicted_balance,
    })),
  ];

  // Check if predicted balance goes negative in next 30 days
  const lowestPredicted = data
    ? Math.min(...data.forecast.map((d) => d.predicted_balance))
    : null;
  const isAtRisk = lowestPredicted !== null && lowestPredicted < 0;

  const avgInflow =
    data && data.historical.length > 0
      ? data.historical.reduce((s, d) => s + d.inflow, 0) / data.historical.length
      : 0;
  const avgOutflow =
    data && data.historical.length > 0
      ? data.historical.reduce((s, d) => s + d.outflow, 0) / data.historical.length
      : 0;
  const predicted30d = data?.forecast[data.forecast.length - 1]?.predicted_balance ?? 0;

  // Best and worst days
  const bestDay = data?.historical.reduce((a, b) => (a.inflow > b.inflow ? a : b), data.historical[0]);
  const worstDay = data?.historical.reduce((a, b) => (a.outflow > b.outflow ? a : b), data.historical[0]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Cash Flow Forecast</h2>
            <p className="text-xs text-gray-400">Last 90 days + 30-day AI prediction · Powered by Gemini</p>
          </div>
        </div>
        <button
          onClick={fetchForecast}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analyzing...' : 'Refresh'}
        </button>
      </div>

      {/* Risk Alert Banner */}
      {isAtRisk && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Cash Flow Risk Detected</p>
            <p className="text-xs mt-0.5">
              Your predicted balance may drop to{' '}
              <span className="font-bold">
                {lowestPredicted!.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
              </span>{' '}
              within the next 30 days. Review your upcoming expenses.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && !data && (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <div className="text-center space-y-2">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-400" />
            <p className="text-sm">AI is analyzing your transactions...</p>
          </div>
        </div>
      )}

      {data && (
        <>
          {/* Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
              />
              <Tooltip
                formatter={(value: any, name: string) => {
                  const labels: Record<string, string> = {
                    inflow: 'Inflow',
                    outflow: 'Outflow',
                    balance: 'Actual Balance',
                    predicted: 'Predicted Balance',
                  };
                  return [
                    `${Number(value).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND`,
                    labels[name] ?? name,
                  ];
                }}
                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    inflow: 'Inflow',
                    outflow: 'Outflow',
                    balance: 'Actual Balance',
                    predicted: 'Predicted Balance',
                  };
                  return labels[value] ?? value;
                }}
              />
              <Bar dataKey="inflow" fill="#10b981" opacity={0.6} radius={[2, 2, 0, 0]} />
              <Bar dataKey="outflow" fill="#f87171" opacity={0.6} radius={[2, 2, 0, 0]} />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Avg Daily Inflow</p>
              <p className="text-sm font-semibold text-green-600">
                +{avgInflow.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Avg Daily Outflow</p>
              <p className="text-sm font-semibold text-red-500">
                -{avgOutflow.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Best Day</p>
              <p className="text-sm font-semibold text-green-600">
                {bestDay?.date.slice(5)} · +{bestDay?.inflow.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Heaviest Outflow Day</p>
              <p className="text-sm font-semibold text-red-500">
                {worstDay?.date.slice(5)} · -{worstDay?.outflow.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
              </p>
            </div>
          </div>

          {/* Predicted in 30 days */}
          <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${predicted30d >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2">
              {predicted30d >= 0
                ? <CheckCircle className="h-5 w-5 text-indigo-500" />
                : <AlertTriangle className="h-5 w-5 text-red-500" />}
              <p className="text-sm font-medium text-gray-700">Predicted balance in 30 days</p>
            </div>
            <p className={`text-lg font-bold ${predicted30d >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
              {predicted30d.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
            </p>
          </div>

          {/* AI Insight */}
          {data.insight && (
            <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
              <Sparkles className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-indigo-600 mb-0.5">AI Insight</p>
                <p className="text-sm text-indigo-800">{data.insight}</p>
              </div>
            </div>
          )}

          {/* AI Advice */}
          {data.advice && data.advice.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-semibold text-gray-700">AI Financial Recommendations</p>
              </div>
              {data.advice.map((tip, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5"
                >
                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-amber-200 text-amber-700 text-xs font-bold flex items-center justify-center mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-amber-800">{tip}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
