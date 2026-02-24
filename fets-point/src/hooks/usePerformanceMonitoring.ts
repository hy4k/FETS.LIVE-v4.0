import { useState, useEffect, useCallback, useRef } from "react";

// Core Web Vitals and Performance Metrics
export interface PerformanceMetrics {
  // Core Web Vitals
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift

  // Additional metrics
  TTFB?: number; // Time to First Byte
  FCP?: number; // First Contentful Paint
  TTI?: number; // Time to Interactive

  // Custom metrics
  routeLoadTime?: number;
  componentRenderTime?: number;
  apiResponseTime?: number;

  // Memory and network
  memoryUsage?: {
    used: number;
    total: number;
    percentage: number;
  };

  // Bundle and cache
  bundleSize?: number;
  cacheHitRate?: number;

  timestamp: number;
}

export interface ServiceWorkerMetrics {
  cacheHits: number;
  cacheMisses: number;
  networkRequests: number;
  backgroundSyncs: number;
  errors: number;
  syncQueueLength: number;
  timestamp: string;
}

// Performance monitoring hook
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] =
    useState<PerformanceMetrics | null>(null);
  const [swMetrics, setSwMetrics] = useState<ServiceWorkerMetrics | null>(null);
  const observerRef = useRef<PerformanceObserver | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Update current metrics
  const updateCurrentMetrics = useCallback(
    (newData: Partial<PerformanceMetrics>) => {
      setCurrentMetrics((prev) => ({
        ...prev,
        ...newData,
        timestamp: Date.now(),
      }));
    },
    []
  );

  // Collect Core Web Vitals
  const collectWebVitals = useCallback(() => {
    if (!("PerformanceObserver" in window)) {
      console.warn("PerformanceObserver not supported");
      return;
    }

    const vitalsData: Partial<PerformanceMetrics> = {};

    // LCP Observer
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      vitalsData.LCP = lastEntry.startTime;
      updateCurrentMetrics(vitalsData);
    });

    // FID Observer
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        vitalsData.FID = entry.processingStart - entry.startTime;
        updateCurrentMetrics(vitalsData);
      });
    });

    // CLS Observer
    const clsObserver = new PerformanceObserver((entryList) => {
      let clsValue = 0;
      entryList.getEntries().forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      vitalsData.CLS = clsValue;
      updateCurrentMetrics(vitalsData);
    });

    try {
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      fidObserver.observe({ type: "first-input", buffered: true });
      clsObserver.observe({ type: "layout-shift", buffered: true });

      observerRef.current = lcpObserver; // Store reference for cleanup
    } catch (error) {
      console.error("Error setting up performance observers:", error);
    }
  }, [updateCurrentMetrics]);

  // Collect Navigation Timing metrics
  const collectNavigationMetrics = useCallback(() => {
    if (!("performance" in window) || !window.performance.getEntriesByType) {
      return {};
    }

    const navigation = window.performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming;
    if (!navigation) return {};

    return {
      TTFB: navigation.responseStart - navigation.requestStart,
      FCP:
        window.performance.getEntriesByName("first-contentful-paint")[0]
          ?.startTime || 0,
      TTI:
        window.performance.getEntriesByName("time-to-interactive")[0]
          ?.startTime || 0,
    };
  }, []);

  // Collect memory usage
  const collectMemoryMetrics = useCallback(() => {
    if (
      typeof window === "undefined" ||
      !window.performance ||
      !("memory" in window.performance)
    ) {
      return undefined;
    }

    const memory = (window.performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: Math.round(
        (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      ),
    };
  }, []);

  // Get Service Worker metrics
  const getServiceWorkerMetrics =
    useCallback(async (): Promise<ServiceWorkerMetrics | null> => {
      if (
        !("serviceWorker" in navigator) ||
        !navigator.serviceWorker.controller
      ) {
        return null;
      }

      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();

        messageChannel.port1.onmessage = (event) => {
          if (event.data.type === "PERFORMANCE_METRICS") {
            resolve(event.data.data);
          }
        };

        navigator.serviceWorker.controller.postMessage(
          { type: "GET_PERFORMANCE_METRICS" },
          [messageChannel.port2]
        );

        // Timeout after 5 seconds
        setTimeout(() => resolve(null), 5000);
      });
    }, []);

  // Measure route load time
  const measureRouteLoad = useCallback(
    (routeName: string) => {
      if (typeof window === "undefined" || !window.performance) {
        return () => {};
      }

      const startTime = window.performance.now();

      return () => {
        const loadTime = window.performance.now() - startTime;
        updateCurrentMetrics({ routeLoadTime: loadTime });

        // Store historical data
        const newMetric: PerformanceMetrics = {
          ...currentMetrics,
          routeLoadTime: loadTime,
          timestamp: Date.now(),
        };

        setMetrics((prev) => [...prev.slice(-99), newMetric]); // Keep last 100 measurements

        console.log(
          `📊 Route '${routeName}' loaded in ${loadTime.toFixed(2)}ms`
        );
      };
    },
    [currentMetrics, updateCurrentMetrics]
  );

  // Measure component render time
  const measureComponentRender = useCallback(
    (componentName: string) => {
      if (typeof window === "undefined" || !window.performance) {
        return () => {};
      }

      const startTime = window.performance.now();

      return () => {
        const renderTime = window.performance.now() - startTime;
        updateCurrentMetrics({ componentRenderTime: renderTime });
        console.log(
          `⚛️ Component '${componentName}' rendered in ${renderTime.toFixed(
            2
          )}ms`
        );
      };
    },
    [updateCurrentMetrics]
  );

  // Measure API response time
  const measureAPICall = useCallback(
    (apiEndpoint: string) => {
      if (typeof window === "undefined" || !window.performance) {
        return () => {};
      }

      const startTime = window.performance.now();

      return () => {
        const responseTime = window.performance.now() - startTime;
        updateCurrentMetrics({ apiResponseTime: responseTime });
        console.log(
          `🌐 API '${apiEndpoint}' responded in ${responseTime.toFixed(2)}ms`
        );
      };
    },
    [updateCurrentMetrics]
  );

  // Calculate bundle size estimate
  const calculateBundleSize = useCallback(() => {
    const scripts = document.querySelectorAll("script[src]");
    let totalSize = 0;

    scripts.forEach((script) => {
      const src = script.getAttribute("src");
      if (src && src.includes("/assets/")) {
        // Estimate based on script tag (actual size would need network monitoring)
        totalSize += 500; // KB estimate per chunk
      }
    });

    return totalSize;
  }, []);

  // Initialize monitoring
  useEffect(() => {
    startTimeRef.current = Date.now();

    // Collect initial metrics
    const navigationMetrics = collectNavigationMetrics();
    const memoryMetrics = collectMemoryMetrics();
    const bundleSize = calculateBundleSize();

    updateCurrentMetrics({
      ...navigationMetrics,
      memoryUsage: memoryMetrics,
      bundleSize,
      timestamp: Date.now(),
    });

    // Set up Web Vitals collection
    collectWebVitals();

    // Get Service Worker metrics
    getServiceWorkerMetrics().then(setSwMetrics);

    // Set up periodic metric collection
    const interval = setInterval(() => {
      const memoryMetrics = collectMemoryMetrics();
      updateCurrentMetrics({
        memoryUsage: memoryMetrics,
        timestamp: Date.now(),
      });

      // Update Service Worker metrics
      getServiceWorkerMetrics().then(setSwMetrics);
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(interval);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [
    collectWebVitals,
    collectNavigationMetrics,
    collectMemoryMetrics,
    calculateBundleSize,
    getServiceWorkerMetrics,
    updateCurrentMetrics,
  ]);

  // Performance analysis functions
  const getPerformanceScore = useCallback(() => {
    if (!currentMetrics) return 0;

    let score = 100;

    // LCP scoring (good: <2.5s, poor: >4s)
    if (currentMetrics.LCP) {
      if (currentMetrics.LCP > 4000) score -= 30;
      else if (currentMetrics.LCP > 2500) score -= 15;
    }

    // FID scoring (good: <100ms, poor: >300ms)
    if (currentMetrics.FID) {
      if (currentMetrics.FID > 300) score -= 25;
      else if (currentMetrics.FID > 100) score -= 10;
    }

    // CLS scoring (good: <0.1, poor: >0.25)
    if (currentMetrics.CLS) {
      if (currentMetrics.CLS > 0.25) score -= 25;
      else if (currentMetrics.CLS > 0.1) score -= 10;
    }

    // Memory usage scoring
    if (
      currentMetrics.memoryUsage &&
      currentMetrics.memoryUsage.percentage > 80
    ) {
      score -= 20;
    }

    return Math.max(0, Math.round(score));
  }, [currentMetrics]);

  const getRecommendations = useCallback(() => {
    const recommendations: string[] = [];

    if (!currentMetrics) return recommendations;

    if (currentMetrics.LCP && currentMetrics.LCP > 2500) {
      recommendations.push(
        "Optimize Largest Contentful Paint by reducing image sizes and implementing lazy loading"
      );
    }

    if (currentMetrics.FID && currentMetrics.FID > 100) {
      recommendations.push(
        "Reduce First Input Delay by breaking up long-running JavaScript tasks"
      );
    }

    if (currentMetrics.CLS && currentMetrics.CLS > 0.1) {
      recommendations.push(
        "Minimize Cumulative Layout Shift by reserving space for dynamic content"
      );
    }

    if (
      currentMetrics.memoryUsage &&
      currentMetrics.memoryUsage.percentage > 80
    ) {
      recommendations.push(
        "High memory usage detected - consider reducing component complexity"
      );
    }

    if (currentMetrics.routeLoadTime && currentMetrics.routeLoadTime > 1000) {
      recommendations.push(
        "Route loading is slow - implement code splitting and lazy loading"
      );
    }

    return recommendations;
  }, [currentMetrics]);

  return {
    metrics,
    currentMetrics,
    swMetrics,
    measureRouteLoad,
    measureComponentRender,
    measureAPICall,
    getPerformanceScore,
    getRecommendations,
    refreshMetrics: () => getServiceWorkerMetrics().then(setSwMetrics),
  };
}

// Bundle size analysis
export function useBundleAnalysis() {
  const [bundleInfo, setBundleInfo] = useState<{
    totalSize: number;
    chunks: Array<{ name: string; size: number; type: string }>;
    compressionRatio: number;
  } | null>(null);

  useEffect(() => {
    // Analyze loaded resources
    const analyzeBundle = () => {
      const resources = window.performance.getEntriesByType(
        "resource"
      ) as PerformanceResourceTiming[];
      const chunks: Array<{ name: string; size: number; type: string }> = [];
      let totalSize = 0;
      let totalTransferred = 0;

      resources.forEach((resource) => {
        if (resource.name.includes("/assets/")) {
          const size = resource.transferSize || 0;
          const decodedSize = resource.decodedBodySize || 0;

          chunks.push({
            name: resource.name.split("/").pop() || "unknown",
            size: Math.round(size / 1024), // KB
            type: resource.name.includes(".js")
              ? "JavaScript"
              : resource.name.includes(".css")
              ? "CSS"
              : "Other",
          });

          totalSize += decodedSize;
          totalTransferred += size;
        }
      });

      setBundleInfo({
        totalSize: Math.round(totalTransferred / 1024), // KB
        chunks: chunks.sort((a, b) => b.size - a.size),
        compressionRatio: totalSize > 0 ? totalTransferred / totalSize : 1,
      });
    };

    // Wait for resources to load
    setTimeout(analyzeBundle, 2000);
  }, []);

  return bundleInfo;
}
