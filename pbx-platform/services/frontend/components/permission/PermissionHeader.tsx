"use client";

interface PermissionHeaderProps {
    onOpenDrawer: () => void;
}

export default function PermissionHeader({ onOpenDrawer }: PermissionHeaderProps) {
    return (
        <header className="perm-header">
            <div className="perm-title-group">
                <h2>권한 템플릿 설정</h2>
                <p>개발용 마스터 : 페이지 식별 코드와 세부 실행 권한을 관리합니다.</p>
            </div>
            <button className="btn-primary" onClick={onOpenDrawer}>+ 신규 메뉴 정의</button>
        </header>
    );
}
