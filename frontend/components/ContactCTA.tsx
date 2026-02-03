'use client'

import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, Clock, Star } from 'lucide-react'

export default function ContactCTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 via-green-900 to-gray-800 text-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-6 h-6 text-yellow-400" />
              <span className="text-green-300 font-semibold">LIMITED TIME OFFER</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              Ready to Own Your Piece of Paradise?
            </h2>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Don't miss this opportunity to invest in Murree's most exclusive location. 
              Our premium plots are selling fast, and prices are expected to increase soon.
            </p>

            {/* Key Benefits */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-300">Flexible payment plans available</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-300">Immediate possession available</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-300">All legal documents provided</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-300">24/7 customer support</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg">
                Book Your Plot Now
              </button>
              <button className="bg-white/10 backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 hover:bg-white/20">
                Download Brochure
              </button>
            </div>
          </motion.div>

          {/* Right Content - Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20"
          >
            <h3 className="text-2xl font-bold mb-6">Get in Touch</h3>
            
                          <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Call Us</h4>
                  <p className="text-gray-300">+92 300 1234567</p>
                  <p className="text-gray-300">+92 300 7654321</p>
                </div>
              </div>

                              <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Email Us</h4>
                  <p className="text-gray-300">info@queenhillsmurree.com</p>
                  <p className="text-gray-300">sales@queenhillsmurree.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Visit Us</h4>
                  <p className="text-gray-300">Queen Hills Murree</p>
                  <p className="text-gray-300">Phase 1, Block A, Murree</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Office Hours</h4>
                  <p className="text-gray-300">Mon - Sat: 9:00 AM - 6:00 PM</p>
                  <p className="text-gray-300">Sunday: 10:00 AM - 4:00 PM</p>
                </div>
              </div>
            </div>

            {/* Urgency Message */}
            <div className="mt-8 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="font-semibold text-yellow-300">Limited Availability</span>
              </div>
              <p className="text-sm text-gray-300">
                Only 15 plots remaining in Phase 1. Book now to secure your investment!
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
} 