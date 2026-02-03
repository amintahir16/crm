import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import LayoutWrapper from '@/components/LayoutWrapper';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfairDisplay = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair-display' })

export const metadata: Metadata = {
  title: 'Queen Hills Murree - Your Dream Home in the Hills',
  description: 'Discover luxury living in the picturesque hills of Murree. Book your dream plot today and be part of an exclusive community.',
  keywords: 'Murree, real estate, housing society, plots, luxury homes, Pakistan',
  authors: [{ name: 'Queen Hills Development Team' }],
  icons: {
    icon: '/marketing_assets/logos/4.png',
    shortcut: '/marketing_assets/logos/4.png',
    apple: '/marketing_assets/logos/4.png',
  },
  openGraph: {
    title: 'Queen Hills Murree - Your Dream Home in the Hills',
    description: 'Discover luxury living in the picturesque hills of Murree.',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/marketing_assets/logos/4.png',
        width: 1200,
        height: 630,
        alt: 'Queen Hills Murree Logo',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfairDisplay.variable}`}>
      <body>
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  )
} 