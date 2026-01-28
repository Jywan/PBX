export default function Footer() {
    return (
        <footer className="layout-footer">
            <div className="footer-left">
                <span className="version-info">PBX System v1.0</span>
            </div>
            {/* 오른쪽 영역은 비워두거나 다른 시스템 정보를 넣을 수 있습니다 */}
            <div className="footer-right"></div>
        </footer>
    );
}