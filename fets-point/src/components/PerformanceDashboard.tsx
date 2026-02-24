import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Activity,
  Zap,
  HardDrive,
  Globe,
  BarChart3,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import {
  usePerformanceMonitoring,
  useBundleAnalysis,
} from "../hooks/usePerformanceMonitoring";
import { RealtimeIndicator, RealtimeStatusCard } from "./RealtimeIndicators";
import { useRealtimeDashboard } from "../hooks/useRealtime";

interface PerformanceDashboardProps {
  onClose?: () => void;
}

export function PerformanceDashboard({ onClose }: PerformanceDashboardProps) {
  const {
    currentMetrics,
    swMetrics,
    getPerformanceScore,
    getRecommendations,
    refreshMetrics,
  } = usePerformanceMonitoring();

  const bundleInfo = useBundleAnalysis();
  const realtimeStatus = useRealtimeDashboard();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const performanceScore = getPerformanceScore();
  const recommendations = getRecommendations();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshMetrics();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50";
    if (score >= 70) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const formatMetric = (
    value: number | undefined,
    unit: string,
    decimals = 0
  ) => {
    if (value === undefined) return "N/A";
    return `${value.toFixed(decimals)}${unit}`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="golden-theme min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Performance Dashboard
            </h1>
            <p className="text-gray-600">
              Real-time application performance monitoring and analytics
            </p>
          </div>

          <div className="flex items-center gap-4">
            <RealtimeIndicator size="md" showLastUpdate={true} />

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Performance Score */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Overall Performance Score
                </h2>
                <div
                  className={`px-4 py-2 rounded-full font-bold text-2xl ${getScoreColor(
                    performanceScore
                  )}`}
                >
                  {performanceScore}/100
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    performanceScore >= 90
                      ? "bg-green-500"
                      : performanceScore >= 70
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${performanceScore}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-500">Excellent</div>
                  <div className="text-green-600 font-bold">90-100</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-500">Good</div>
                  <div className="text-yellow-600 font-bold">70-89</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-500">Poor</div>
                  <div className="text-red-600 font-bold">0-69</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-500">Last Update</div>
                  <div className="text-gray-700 font-bold">
                    {currentMetrics
                      ? new Date(currentMetrics.timestamp).toLocaleTimeString()
                      : "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <RealtimeStatusCard
              title="Real-time Status"
              subscriptions={realtimeStatus.subscriptions}
              lastUpdate={realtimeStatus.lastUpdate}
              className="h-full"
            />
          </div>
        </div>

        {/* Core Web Vitals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Largest Contentful Paint
                </h3>
                <p className="text-sm text-gray-600">Loading performance</p>
              </div>
            </div>

            <div className="text-3xl font-bold text-gray-900 mb-2">
              {formatMetric(currentMetrics?.LCP, "ms", 0)}
            </div>

            <div
              className={`text-sm font-medium ${
                currentMetrics?.LCP && currentMetrics.LCP <= 2500
                  ? "text-green-600"
                  : currentMetrics?.LCP && currentMetrics.LCP <= 4000
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {currentMetrics?.LCP && currentMetrics.LCP <= 2500
                ? "Good"
                : currentMetrics?.LCP && currentMetrics.LCP <= 4000
                ? "Needs Improvement"
                : "Poor"}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  First Input Delay
                </h3>
                <p className="text-sm text-gray-600">Interactivity</p>
              </div>
            </div>

            <div className="text-3xl font-bold text-gray-900 mb-2">
              {formatMetric(currentMetrics?.FID, "ms", 0)}
            </div>

            <div
              className={`text-sm font-medium ${
                currentMetrics?.FID && currentMetrics.FID <= 100
                  ? "text-green-600"
                  : currentMetrics?.FID && currentMetrics.FID <= 300
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {currentMetrics?.FID && currentMetrics.FID <= 100
                ? "Good"
                : currentMetrics?.FID && currentMetrics.FID <= 300
                ? "Needs Improvement"
                : "Poor"}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Cumulative Layout Shift
                </h3>
                <p className="text-sm text-gray-600">Visual stability</p>
              </div>
            </div>

            <div className="text-3xl font-bold text-gray-900 mb-2">
              {formatMetric(currentMetrics?.CLS, "", 3)}
            </div>

            <div
              className={`text-sm font-medium ${
                currentMetrics?.CLS && currentMetrics.CLS <= 0.1
                  ? "text-green-600"
                  : currentMetrics?.CLS && currentMetrics.CLS <= 0.25
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {currentMetrics?.CLS && currentMetrics.CLS <= 0.1
                ? "Good"
                : currentMetrics?.CLS && currentMetrics.CLS <= 0.25
                ? "Needs Improvement"
                : "Poor"}
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Memory Usage */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <HardDrive className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Memory Usage</h3>
            </div>

            {currentMetrics?.memoryUsage ? (
              <>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {currentMetrics.memoryUsage.percentage}%
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      currentMetrics.memoryUsage.percentage < 60
                        ? "bg-green-500"
                        : currentMetrics.memoryUsage.percentage < 80
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{
                      width: `${currentMetrics.memoryUsage.percentage}%`,
                    }}
                  ></div>
                </div>

                <div className="text-sm text-gray-600">
                  {formatBytes(currentMetrics.memoryUsage.used)} /{" "}
                  {formatBytes(currentMetrics.memoryUsage.total)}
                </div>
              </>
            ) : (
              <div className="text-gray-500">Memory API not available</div>
            )}
          </div>

          {/* Service Worker Stats */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Globe className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900">
                Service Worker Stats
              </h3>
            </div>

            {swMetrics ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cache Hits:</span>
                  <span className="font-semibold">{swMetrics.cacheHits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cache Misses:</span>
                  <span className="font-semibold">{swMetrics.cacheMisses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hit Rate:</span>
                  <span className="font-semibold">
                    {swMetrics.cacheHits + swMetrics.cacheMisses > 0
                      ? Math.round(
                          (swMetrics.cacheHits /
                            (swMetrics.cacheHits + swMetrics.cacheMisses)) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Background Syncs:</span>
                  <span className="font-semibold">
                    {swMetrics.backgroundSyncs}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sync Queue:</span>
                  <span className="font-semibold">
                    {swMetrics.syncQueueLength}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">Service Worker not available</div>
            )}
          </div>
        </div>

        {/* Bundle Analysis */}
        {bundleInfo && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-cyan-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Bundle Analysis</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {bundleInfo.totalSize} KB
                </div>
                <div className="text-sm text-gray-600">Total Bundle Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {bundleInfo.chunks.length}
                </div>
                <div className="text-sm text-gray-600">Number of Chunks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(bundleInfo.compressionRatio * 100)}%
                </div>
                <div className="text-sm text-gray-600">Compression Ratio</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Largest Chunks:</h4>
              {bundleInfo.chunks.slice(0, 5).map((chunk, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono">{chunk.name}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        chunk.type === "JavaScript"
                          ? "bg-yellow-100 text-yellow-800"
                          : chunk.type === "CSS"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {chunk.type}
                    </span>
                  </div>
                  <span className="font-semibold">{chunk.size} KB</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900">
                Performance Recommendations
              </h3>
            </div>

            <div className="space-y-3">
              {recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
