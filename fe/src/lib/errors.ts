// ─── API error helpers ────────────────────────────────────────────────────────
// Backend errors are `{ success: false, error }` (be/src/middleware/errorHandler.js);
// a few responses (404 route-not-found) use `message` instead.

type ApiErrorShape = {
  response?: { status?: number; data?: { message?: string; error?: string } };
  message?: string;
};

/**
 * Business-rule message sent by the API (4xx), if any. Use with a translated fallback:
 * `getApiMessage(e) || t('toast.error')`. 5xx messages are internal errors, so they fall back.
 */
export const getApiMessage = (error: unknown): string | undefined => {
  const response = (error as ApiErrorShape | null)?.response;
  if (!response || (response.status ?? 500) >= 500) return undefined;
  return response.data?.error || response.data?.message || undefined;
};

/** API message → API error code → JS error message → fallback. Used by stores. */
export const extractErrorMessage = (error: unknown, fallback = 'Đã xảy ra lỗi không xác định'): string => {
  const e = error as ApiErrorShape | null;
  return e?.response?.data?.message || e?.response?.data?.error || e?.message || fallback;
};
