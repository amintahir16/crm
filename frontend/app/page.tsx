import Hero from '@/components/Hero'
import Features from '@/components/Features'
import PlotShowcase from '@/components/PlotShowcase'
import LocationAdvantages from '@/components/LocationAdvantages'
import PaymentPlans from '@/components/PaymentPlans'
import Testimonials from '@/components/Testimonials'
import ContactCTA from '@/components/ContactCTA'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <PlotShowcase />
      <LocationAdvantages />
      <PaymentPlans />
      <Testimonials />
      <ContactCTA />
      <Footer />
    </main>
  )
} 