// Common API response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Date range types
export interface DateRange {
  startDate: string;
  endDate: string;
}

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Database entity base interface
export interface BaseEntity {
  id: number;
  created_at: Date;
  updated_at: Date;
}
