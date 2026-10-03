import axios from 'axios';
import {errorLabel, validationLabel} from './errorLabels';

export interface ApiError {
    timestamp: string;
    status: number;
    code: string;
    message: string;
    path: string;
    requestId: string;
    fieldErrors: { field: string; message: string }[];
}

export function apiError(error: unknown): ApiError | undefined {
    if (axios.isAxiosError<ApiError>(error)) {
        const data = error.response?.data;
        if (data && typeof data.code === 'string') return {...data, message: errorLabel(data.code, data.status), fieldErrors: (data.fieldErrors || []).map(field => ({...field, message: validationLabel(field.message)}))};
    }
    return undefined;
}

export function errorMessage(error: unknown): string {
    if (axios.isAxiosError(error) && error.code === 'ERR_INVALID_API_RESPONSE') {
        return 'Dịch vụ dữ liệu chưa sẵn sàng. Vui lòng thử lại sau.';
    }
    return apiError(error)?.message || 'Không thể kết nối. Vui lòng thử lại.';
}

export interface PageResponse<T> {
    items: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}
