/**
 * Extracts a user-friendly error message from an API error response.
 * Handles Axios error shapes and falls back to a provided default message.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (
    typeof err === 'object' &&
    err !== null &&
    'response' in err
  ) {
    const response = (err as { response?: { data?: { message?: string; error?: { message?: string } } } }).response;
    return (
      response?.data?.message ||
      response?.data?.error?.message ||
      fallback
    );
  }

  if (err instanceof Error) {
    return err.message;
  }

  return fallback;
}
