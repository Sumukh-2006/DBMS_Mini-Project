// app/layout.js
import './globals.css';

export const metadata = {
  title: 'InternTrack — Internship Lifecycle Management & Semantic Matching Platform',
  description: 'PES University DBMS Experiential Learning Level 3 Project by Sumukh Shandilya and team. Polyglot persistence with PostgreSQL, pgvector, and MongoDB.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220%22%20%22100%22%20%22100%22><text y=%22.9em%22 font-size=%2290%22>🎓</text></svg>" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
