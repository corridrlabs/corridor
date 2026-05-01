export const toUserSafeError = (
  raw: unknown,
  fallback = 'Something went wrong. Please try again.'
): string => {
  const msg = typeof raw === 'string' ? raw.trim() : '';
  if (!msg) return fallback;

  // Keep clear, actionable domain errors.
  if (/title is required/i.test(msg)) return 'Please add a goal title.';
  if (/target amount must be greater than zero/i.test(msg)) return 'Enter a target amount greater than 0.';
  if (/sender wallet not found for currency/i.test(msg)) return 'No wallet was found for that currency. Add funds in that currency or switch to one you already hold.';
  if (/insufficient funds/i.test(msg)) return 'Insufficient funds. Add funds to your wallet and try again.';
  if (/unauthorized|forbidden/i.test(msg)) return 'Your session has expired. Please sign in again and retry.';
  if (/recipient email or handle required/i.test(msg)) return 'Enter a valid recipient email or @handle.';

  // Hide backend internals from users.
  if (/(^pq:|sql|database|relation .* does not exist|stack|trace|internal server error|syntax error)/i.test(msg)) {
    return 'We could not complete that request right now. Please try again in a moment.';
  }

  return msg;
};

export const extractApiErrorMessage = (err: any): string => {
  return (
    err?.response?.data?.error ||
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    (typeof err?.response?.data === 'string' ? err.response.data : '') ||
    err?.message ||
    ''
  );
};
