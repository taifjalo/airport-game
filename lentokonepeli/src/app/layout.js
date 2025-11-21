
export default function RootLayout({ children }) {
  return (
    <html lang="en">
        <head>
            <link rel="icon" href="/favicon.ico" />
            <title>Lentokonepeli</title>
            </head>
      <body>
        {children}
      </body>
    </html>
  );
}
