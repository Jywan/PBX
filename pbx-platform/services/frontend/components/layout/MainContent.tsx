export default function MainContent({ children }: { children: React.ReactNode }) {
    return (
        <main className="layout-main-canvas">
            <div className="template-card">
                {children}
            </div>
        </main>
    );
}