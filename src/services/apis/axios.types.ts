/**
 * API Error interface for consistent error handling
 */
export interface ApiError {
  /** HTTP status code */
  status: number;
  /** Error message */
  message: string;
  /** Error code from backend */
  code: string;
  /** Whether the request was cancelled */
  isCancelled: boolean;
  /** API endpoint that caused the error */
  apiEndpoint: string;
  /** Additional error data from backend */
  error?: {
    code: string;
    message: string;
  };
}
