// Input sanitization utilities

// Sanitize HTML to prevent XSS
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Sanitize user input for database queries
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control characters
    .slice(0, 10000); // Limit length
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Generate CSRF token
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Verify CSRF token
export function verifyCsrfToken(token: string, sessionToken: string): boolean {
  return token === sessionToken && token.length === 64;
}

// Rate limit key generation
export function getRateLimitKey(userId: string, action: string): string {
  return `${userId}:${action}`;
}

// Check if URL is safe (prevent SSRF)
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;

    // Block private/internal IPs
    const blockedPatterns = [
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^0\./,
      /^localhost$/i,
      /^::1$/,
      /^\[::1\]$/,
    ];

    if (blockedPatterns.some((pattern) => pattern.test(hostname))) {
      return false;
    }

    // Only allow http/https
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Mask sensitive data for logging
export function maskSensitive(value: string, visibleChars: number = 4): string {
  if (value.length <= visibleChars) return "****";
  return value.slice(0, visibleChars) + "****" + value.slice(-visibleChars);
}

// Validate and sanitize JSON
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as T;
    }
    return fallback;
  } catch {
    return fallback;
  }
}
