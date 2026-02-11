import axios from "axios";
import type { Company, CompanyCreateRequest, CompanyUpdateRequest } from "@/types/company";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * 업체 목록 조회
 */
export const fetchCompanies = async (token: string): Promise<Company[]> => {
    const response = await axios.get<Company[]>(`${API_URL}/api/v1/companies`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};


/**
 * 업체 생성
 */
export const createCompany = async (
    token: string,
    data: CompanyCreateRequest
): Promise<Company> => {
    const response = await axios.post<Company>(`${API_URL}/api/v1/companies`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * 업체 수정
 */
export const updateCompany = async (
    token: string,
    id: number,
    data: CompanyUpdateRequest
): Promise<Company> => {
    const response = await axios.patch<Company>(`${API_URL}/api/v1/companies/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * 업체 비활성화
 */
export const deactivateCompany = async (
    token: string,
    id: number
): Promise<Company> => {
    const response = await axios.patch<Company>(`${API_URL}/api/v1/companies/${id}`, 
        { active: false },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
};