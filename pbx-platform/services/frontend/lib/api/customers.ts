import axios from "axios";
import { API_URL } from "@/lib/config";
import type { Customer } from "@/types/customer";

export interface CustomerCreate {
    name: string;
    phone: string;
    email?: string;
    company_id?: number;
    group?: string;
    memo?: string;
}

export interface CustomerUpdate {
    name?: string;
    phone?: string;
    email?: string;
    company_id?: number;
    group?: string;
    memo?: string;
}

export const fetchCustomers = async (token: string): Promise<Customer[]> => {
    const res = await axios.get<Customer[]>(`${API_URL}/api/v1/customers`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const createCustomer = async (token: string, data: CustomerCreate): Promise<Customer> => {
    const res = await axios.post<Customer>(`${API_URL}/api/v1/customers`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const updateCustomer = async (token: string, id: number, data: CustomerUpdate): Promise<Customer> => {
    const res = await axios.patch<Customer>(`${API_URL}/api/v1/customers/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const deleteCustomer = async (token: string, id: number): Promise<void> => {
    await axios.delete(`${API_URL}/api/v1/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};
