import type { ReactNode } from 'react';
import './global.css';
import './styles/viewport.css';
import './styles/glass.css';
import './styles/buttons.css';
import PublicEnvScript from '../components/common/PublicEnvScript';

export const metadata = {
  title: 'Assessment Form',
  description: 'Submit your preferred branch for consultation with our team.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <PublicEnvScript />
      </head>
      <body>{children}</body>
    </html>
  );
}

