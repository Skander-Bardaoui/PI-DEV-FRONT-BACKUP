// src/pages/platform-admin/AiPricingAssistant.tsx
import { useState } from 'react';
import {
  Sparkles,
  DollarSign,
  TrendingUp,
  Users,
  Target,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { generatePricingSuggestion, AiPricingRequest, AiPricingResponse } from '../../api/ai-pricing.api';
import toast from 'react-hot-toast';

export default function AiPricingAssistant() {
  const [formData, setFormData] = useState<AiPricingRequest>({
    targetRevenue: 100000,
    tenants: 50,
    growthRate: 20,
    currentPrice: 49.99,
  });

  const [result, setResult] = useState<AiPricingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.targetRevenue <= 0 || formData.tenants <= 0 || formData.currentPrice <= 0) {
      toast.error('Please enter valid positive numbers');
      return;
    }

    if (formData.growthRate < 0 || formData.growthRate > 100) {
      toast.error('Growth rate must be between 0 and 100');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await generatePricingSuggestion(formData);
      setResult(response);
      toast.success('AI pricing suggestion generated!');
    } catch (error: any) {
      console.error('Error generating pricing suggestion:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate pricing suggestion';
      toast.error(errorMessage);
      
      // Log full error for debugging
      console.error('Full error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    handleSubmit(new Event('submit') as any);
  };

  const getRetentionBadgeColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (rate >= 80) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (rate >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Pricing Assistant</h1>
              <p className="text-gray-600">Optimize your pricing strategy using AI insights</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Target className="h-6 w-6 text-blue-600" />
              Input Parameters
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Target Revenue */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    Target Annual Revenue ($)
                  </div>
                </label>
                <input
                  type="number"
                  name="targetRevenue"
                  value={formData.targetRevenue}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="100000"
                  required
                />
              </div>

              {/* Number of Tenants */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    Number of Tenants
                  </div>
                </label>
                <input
                  type="number"
                  name="tenants"
                  value={formData.tenants}
                  onChange={handleInputChange}
                  min="1"
                  step="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="50"
                  required
                />
              </div>

              {/* Growth Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                    Expected Growth Rate (%)
                  </div>
                </label>
                <input
                  type="number"
                  name="growthRate"
                  value={formData.growthRate}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="20"
                  required
                />
              </div>

              {/* Current Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    Current Monthly Price ($)
                  </div>
                </label>
                <input
                  type="number"
                  name="currentPrice"
                  value={formData.currentPrice}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="49.99"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Generate AI Suggestion
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right: Results */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 flex flex-col items-center justify-center">
                <Loader2 className="h-16 w-16 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600 text-lg font-medium">Analyzing your data...</p>
                <p className="text-gray-400 text-sm mt-2">This may take a few seconds</p>
              </div>
            ) : result ? (
              <>
                {/* Results Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">AI Recommendations</h2>
                      <p className="text-blue-100">Based on your input parameters</p>
                    </div>
                    <button
                      onClick={handleRegenerate}
                      className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
                      title="Regenerate suggestion"
                    >
                      <RefreshCw className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Monthly Price */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm font-medium">Monthly Price</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">
                      {formatCurrency(result.monthlyPrice)}
                    </p>
                  </div>

                  {/* Annual Price */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm font-medium">Annual Price</span>
                    </div>
                    <p className="text-3xl font-bold text-indigo-600">
                      {formatCurrency(result.annualPrice)}
                    </p>
                  </div>
                </div>

                {/* Revenue & Retention */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Predicted Revenue */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-medium">Predicted Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(result.predictedRevenue)}
                    </p>
                  </div>

                  {/* Retention Rate */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Retention Rate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-gray-900">
                        {result.retentionRate}%
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getRetentionBadgeColor(result.retentionRate)}`}>
                        {result.retentionRate >= 90 ? 'Excellent' : result.retentionRate >= 80 ? 'Good' : result.retentionRate >= 70 ? 'Fair' : 'Low'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    AI Reasoning
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {result.explanation}
                  </p>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
                <div className="p-4 bg-blue-50 rounded-full mb-4">
                  <Sparkles className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Optimize</h3>
                <p className="text-gray-600">
                  Fill in the parameters and click "Generate AI Suggestion" to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
