/**
 * 전화번호 형식 검증
 * 허용 방식: 010-1234-5678 등
 */
export const validatePhoneNumber = (phone: string): boolean => {
    if (!phone) return true;

    const phoneRegex = /^0\d{1,2}-\d{3,4}-\d{4}$/;
    return phoneRegex.test(phone);
};

/**
 * 전화번호 포맷팅(자동하이픈 추가)
 * 예: 01012345678 -> 010-1234-5678
 */
export const formatPhoneNumber = (phone: string): string => {
    // 숫자만 추출
    const numbers = phone.replace(/[^0-9]/g, '');

    if (numbers.length === 0) return '';
    

    // 010, 011 등 휴대폰
    if (numbers.startsWith('01')) {
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }

    // 02 서울 지역번호
    if (numbers.startsWith('02')) {
        if (numbers.length <= 2) return numbers;
        if (numbers.length <= 5) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
        if (numbers.length <= 9) return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`;
        return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
    }

    // 031, 032 등 지역번호
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    if (numbers.length <= 10) return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
};