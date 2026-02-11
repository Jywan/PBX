import Cookies from "js-cookie";


/**
 *  JWT 토큰의 Payload를 디코딩하는 헬퍼함수
 */
const decodeJWTPayload = (token: string): any => {
    const base64Url = token.split(".")[1];
    if (!base64Url) {
        throw new Error("Invalid token format");
    }

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    const jsonPayload = decodeURIComponent(
        atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
    );
    return JSON.parse(jsonPayload);
};

/**
 * JWT 토큰의 유효성을 검증하는 함수
 * @Param token - JWT 토큰 문자열
 * @returns 유효하면 true, 그렇지 않으면 false
 */
export const isTokenValid = (token: string): boolean => {
    try {
        const payload = decodeJWTPayload(token);

        // exp 클레임 확인 (JWT는 초단위, js는 밀리초 단위)
        if (payload.exp) {
            const expirationTime = payload.exp * 1000;
            const currentTime = Date.now();

            if (currentTime >= expirationTime) {
                console.warn("토큰이 만료되었습니다.");
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error("토큰 검증 중 오류 발생:", error);
        return false;
    }
};


/**
 * 쿠키에 저장된 access_token을 읽어와서 
 * 유효성을 검증한 후 사용자 정보를 반환하는 함수
 * @returns 유효한 토큰이면 사용자 정보, 그렇지 않으면 null
 */
export const getUserInfoFromToken = () => {
    const token = Cookies.get("access_token");
    if (!token) return null;

    try {
        // 토큰 유효성 검증
        if (!isTokenValid(token)) {
            // 만료된토큰은 제거
            Cookies.remove("access_token");
            return null;
        }

        // 유효한 토큰의 Payload 반환
        return decodeJWTPayload(token);
    } catch (error) {
        console.error("토큰 디코딩 중 오류 발생:", error);
        // 손상된 토큰은 제거
        Cookies.remove("access_token");
        return null;
    }
};

/**
 * 토큰의 남은 유효시간을 밀리초 단위로 반환
 * @returns 남은 시간(ms), 만료되었거나 유효하지 않으면 0
 */
export const getTokenRemainingTime = (): number => {
    const token = Cookies.get("access_token");
    if (!token) return 0;

    try {
        const payload = decodeJWTPayload(token);

        if (payload.exp) {
            const expirationTime = payload.exp * 1000;
            const remainingTime = expirationTime - Date.now();
            return Math.max(0, remainingTime);
        }
        return 0;
    } catch (error) {
        return 0;
    }
};