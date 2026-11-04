import type { Metadata } from 'next';
import './styles.css';

export const metadata: Metadata = {
  title: 'Apex Field OS | Owner Hub',
  description: 'Private operational workspace for the founding owner.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
