'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, MapPin, Phone, Calendar, Star } from 'lucide-react'
import Image from 'next/image'

export default function Hero() {
  const [currentTagline, setCurrentTagline] = useState(0)
  const taglines = [
    "Premium Plots in Murree's Most Exclusive Location",
    "Your Gateway to Luxury Living in the Hills",
    "Invest in Paradise - Limited Plots Available",
    "Where Dreams Meet Reality in Murree"
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % taglines.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [taglines.length])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-green-900 to-slate-800">

      {/* Content */}
      <div className="relative z-10 text-center text-white container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-4xl mx-auto"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex justify-center mb-6"
          >
            <Image
              src="/marketing_assets/logos/4.png"
              alt="Queen Hills Murree Logo"
              width={120}
              height={120}
              className="rounded-lg"
            />
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 mb-8"
          >
            <Star className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-medium">Premium Real Estate Investment</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold mb-6 leading-tight"
          >
            Queen Hills
            <span className="block text-4xl md:text-5xl lg:text-6xl text-green-300 font-light mt-2">Murree</span>
          </motion.h1>
          
          {/* Animated Tagline */}
          <motion.p
            key={currentTagline}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6 }}
            className="text-xl md:text-2xl lg:text-3xl mb-8 font-light text-green-100"
          >
            {taglines[currentTagline]}
          </motion.p>

          {/* Location & Price Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-wrap justify-center gap-6 mb-12 text-center"
          >
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <MapPin className="w-5 h-5 text-green-300" />
              <span className="text-sm">Prime Location, Murree</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <Calendar className="w-5 h-5 text-green-300" />
              <span className="text-sm">Ready for Investment</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-sm">Premium Plots Available</span>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-lg px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg">
              Book Your Plot Now
            </button>
            <button className="bg-white/10 backdrop-blur-sm border border-white/30 text-white text-lg px-8 py-4 rounded-lg font-semibold transition-all duration-300 hover:bg-white/20">
              <Phone className="inline mr-2" size={20} />
              Call for Details
            </button>
          </motion.div>

          {/* Price Range */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="text-center"
          >
            <p className="text-lg text-green-200 mb-2">Starting from</p>
            <p className="text-3xl font-bold text-white">PKR 2.5M - 5M</p>
            <p className="text-sm text-green-300 mt-1">Flexible Payment Plans Available</p>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <ChevronDown className="animate-bounce text-white" size={24} />
        </motion.div>
      </div>
    </section>
  )
} 