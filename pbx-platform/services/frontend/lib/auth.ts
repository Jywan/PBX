import Cookies from "js-cookie";

/**
 * 쿠키에 저장된 access_token을 읽어와서 
 * 내부 Payload(사용자 정보)를 디코딩하여 반환하는 함수
 */
export const getUserInfoFromToken = () => {
    const token = Cookies.get("access_token");
    if (!token) return null;

    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        
        const jsonPayload = decodeURIComponent(
        atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error("토큰 디코딩 중 오류 발생:", error);
        return null;
    }
};