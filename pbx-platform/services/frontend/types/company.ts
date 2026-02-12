/**
 * 업체(Company) 관련 타입 정의
 */

/**
 * 업체 기본 정보
 */
export interface Company {
    id: number;
    name: string;
    representative?: string;
    contact?: string;
    callback: boolean;
    active: boolean;
    registered_at: string;
}

/**
 * 업체 생성 요청 데이터
 */
export interface CompanyCreateRequest {
    name: string;
    representative?: string;
    contact?: string;
    callback?: boolean;
    active?: boolean;
}

/**
 * 업체 수정 요청 데이터
 */
export interface CompanyUpdateRequest {
    name?: string;
    representative?: string;
    contact?: string;
    callback?: boolean;
    active?: boolean;
}

/**
 * 업체 폼 상태 (UI용)
 */
export interface CompanyFormState {
    id: number | null;
    name: string;
    representative: string;
    contact: string;
    callback: boolean;
    active: boolean;
}