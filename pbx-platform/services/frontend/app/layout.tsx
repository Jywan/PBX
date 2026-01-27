import React from "react";

export const metadata = {
    title: 'PBX Project',
    descripion: 'PBX Platform Management',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ko">
            <body>
                {children}
            </body>
        </html>
    )
}