/**
 * 사용자(User) 관련 타입 정의
 */

/**
 * 사용자 권한 enum
 */
export enum UserRole {
    SYSTEM_ADMIN = "SYSTEM_ADMIN",
    MANAGER = "MANAGER",
    AGENT = "AGENT"
}

/**
 * 사용자 기본정보
 */
export interface User {
    id: number;
    username: string;
    name: string;
    extension?: string;
    role: string;
    company_id: number;
    is_active: boolean;
    created_at: string;
}

/**
 * 사용자 생성 요청 데이터
 */
export interface UserCreateRequest {
    username: string;
    password: string;
    name: string;
    extension?: string;
    role: string;
    company_id: number;
}

/**
 * 사용자 수정 요청 데이터
 */
export interface UserUpdateRequest {
    password?: string;
    name?: string;
    extension?: string;
    role?: string;
    company_id?: number;
}

/**
 * 사용자 폼 상태(UI용)
 */
export interface UserFormState {
    id: number | null;
    username: string;
    password: string;
    name: string;
    extension: string;
    role: string;
    company_id: string | number;
}