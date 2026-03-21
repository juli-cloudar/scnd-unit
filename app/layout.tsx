export const metadata = {
  title: 'SCND UNIT | Streetwear & Vintage',
  description: 'Curated Streetwear, Vintage, Y2K & Gorpcore aus Bad Kreuznach',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
