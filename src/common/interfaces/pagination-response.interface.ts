export interface PaginationResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        lastPage: number;
    };
}

export interface DataResponse<T> {
    data: T;
}