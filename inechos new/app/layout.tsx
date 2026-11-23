import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'INECHOS — Artisanal Small-Batch Bakery',
  description: 'Minimalist architectural editorial lookbook for INECHOS artisanal small-batch bakery.',
  openGraph: {
    title: 'INECHOS — Artisanal Small-Batch Bakery',
    description: 'Minimalist architectural editorial lookbook for INECHOS artisanal small-batch bakery.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'INECHOS — Artisanal Small-Batch Bakery',
    description: 'Minimalist architectural editorial lookbook for INECHOS artisanal small-batch bakery.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
