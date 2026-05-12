import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CDSS Tăng huyết áp — VSH/VNHA 2022',
  description: 'Hệ thống Hỗ trợ Quyết định Lâm sàng Tăng huyết áp theo VSH/VNHA 2022',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
