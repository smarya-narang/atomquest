import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import Navigation from '@/components/Navigation';

export const metadata = {
  title: 'AtomQuest Goals',
  description: 'In-House Goal Setting & Tracking Portal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="app-container">
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Navigation />
              <main className="main-content">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
