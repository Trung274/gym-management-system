// ─── API error helpers ────────────────────────────────────────────────────────
// Backend errors follow `{ success: false, message, error? }` (see be/src/middleware/errorHandler.js).

type ApiErrorShape = {
  response?: { data?: { message?: string; error?: string } };
  message?: string;
};

/** Message sent by the API, if any. Use with a translated fallback: `getApiMessage(e) || t('toast.error')` */
export const getApiMessage = (error: unknown): string | undefined =>
  (error as ApiErrorShape | null)?.response?.data?.message || undefined;

/** API message → API error code → JS error message → fallback. Used by stores. */
export const extractErrorMessage = (error: unknown, fallback = 'Đã xảy ra lỗi không xác định'): string => {
  const e = error as ApiErrorShape | null;
  return e?.response?.data?.message || e?.response?.data?.error || e?.message || fallback;
};
