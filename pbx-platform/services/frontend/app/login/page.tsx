'use client';

import { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import '@/styles/login.css';

export default function LoginPage() {
    const [account, setAccount] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const setPermissions = useAuthStore((state) => state.setPermissions);

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post(`${API_URL}/api/v1/auth/login`, {
                username: account,
                password: password
            });
            const { access_token, permissions } = response.data;
            Cookies.set('access_token', access_token, { expires: 10/24 });
            if (permissions) {
                setPermissions(permissions);
            }
            router.push('/'); 
        } catch (err: any) {
            console.error("로그인 에러:", err);
            setError(err.response?.data?.detail || "로그인 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1 className="login-title">Login</h1>
                
                <form onSubmit={handleLogin} className="login-form">
                    {error && <p className="text-red-500 text-sm mb-2 text-center">{error}</p>}
                    <input
                        type="text"
                        placeholder="Account"
                        value={account}
                        onChange={(e) => setAccount(e.target.value)}
                        className="input-field"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field"
                        required
                    />
                    <button type="submit" className="login-button">
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
}