export const metadata = {
  title: 'Autism Copilot',
  description: 'AI-powered support for parents of autistic children',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
