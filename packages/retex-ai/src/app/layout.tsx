import type { Metadata } from 'next';
import './global.css';

export const metadata: Metadata = {
  title: 'Retex AI',
  description: 'Identificação de peças de roupa via câmera e Google Vision',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
