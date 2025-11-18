import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gambiarra - Escaneador de Domínio',
  description: 'Ferramenta para escanear e baixar todos os arquivos de um domínio',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}

