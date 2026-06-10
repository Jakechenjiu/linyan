// 性能优化工具

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * 检测设备类型
 */
export function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

/**
 * 检测浏览器
 */
export function getBrowser(): "chrome" | "firefox" | "safari" | "edge" | "other" {
  if (typeof window === "undefined") return "other";
  const ua = navigator.userAgent;
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "chrome";
  if (ua.includes("Firefox")) return "firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "safari";
  if (ua.includes("Edg")) return "edge";
  return "other";
}

/**
 * 检测是否支持某个 CSS 特性
 */
export function supportsCSS(property: string): boolean {
  if (typeof window === "undefined") return false;
  return property in document.documentElement.style;
}

/**
 * 检测是否支持某个 JS API
 */
export function supportsAPI(api: string): boolean {
  if (typeof window === "undefined") return false;
  return api in window;
}

/**
 * 获取设备性能等级
 */
export function getPerformanceLevel(): "low" | "medium" | "high" {
  if (typeof navigator === "undefined") return "medium";

  // 检查设备内存
  const nav = navigator as any;
  if (nav.deviceMemory) {
    if (nav.deviceMemory <= 2) return "low";
    if (nav.deviceMemory <= 4) return "medium";
    return "high";
  }

  // 检查 CPU 核心数
  if (navigator.hardwareConcurrency) {
    if (navigator.hardwareConcurrency <= 2) return "low";
    if (navigator.hardwareConcurrency <= 4) return "medium";
    return "high";
  }

  return "medium";
}

/**
 * 根据设备性能调整动画配置
 */
export function getAnimationConfig(): {
  enableAnimations: boolean;
  duration: number;
  enableParallax: boolean;
  enableBlur: boolean;
} {
  const level = getPerformanceLevel();
  const browser = getBrowser();

  // Safari 对动画支持较差
  const isSafari = browser === "safari";

  switch (level) {
    case "low":
      return {
        enableAnimations: false,
        duration: 0,
        enableParallax: false,
        enableBlur: false,
      };
    case "medium":
      return {
        enableAnimations: true,
        duration: isSafari ? 200 : 300,
        enableParallax: false,
        enableBlur: !isSafari,
      };
    case "high":
      return {
        enableAnimations: true,
        duration: 300,
        enableParallax: true,
        enableBlur: true,
      };
  }
}

/**
 * 根据设备类型获取布局配置
 */
export function getLayoutConfig(): {
  sidebarWidth: string;
  rightPanelWidth: string;
  showSidebar: boolean;
  showRightPanel: boolean;
  compactMode: boolean;
} {
  const device = getDeviceType();

  switch (device) {
    case "mobile":
      return {
        sidebarWidth: "w-0",
        rightPanelWidth: "w-full",
        showSidebar: false,
        showRightPanel: true,
        compactMode: true,
      };
    case "tablet":
      return {
        sidebarWidth: "w-48",
        rightPanelWidth: "w-[24rem]",
        showSidebar: true,
        showRightPanel: true,
        compactMode: false,
      };
    case "desktop":
      return {
        sidebarWidth: "w-56",
        rightPanelWidth: "w-[30rem]",
        showSidebar: true,
        showRightPanel: true,
        compactMode: false,
      };
  }
}
