/**
 * Extracts a user-friendly error message from an unknown error object.
 * Parses Axios error responses (including validation error metadata arrays) and Error instances.
 *
 * @param err - Unknown error caught in try/catch or React Query onError handler
 * @returns Human-readable error message string
 */
export const extractErrorMessage = (err: unknown): string => {
  if (err && typeof err === "object" && "response" in err) {
    const axiosError = err as {
      response?: {
        data?: {
          message?: string;
          error?: {
            message?: string;
            code?: string;
            meta?: Array<{ field?: string; message: string }>;
          };
        };
      };
    };
    const responseData = axiosError.response?.data;
    if (responseData) {
      if (responseData.error) {
        const errorObj = responseData.error;
        if (errorObj.code === "VALIDATION_ERROR" && Array.isArray(errorObj.meta)) {
          return errorObj.meta
            .map((m) => {
              const fieldName = m.field ? `${m.field}: ` : "";
              return `${fieldName}${m.message}`;
            })
            .join(", ");
        }
        if (errorObj.message) {
          return errorObj.message;
        }
      }
      if (responseData.message) {
        return responseData.message;
      }
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Đã xảy ra lỗi";
};
