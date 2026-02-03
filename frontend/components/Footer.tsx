'use client'

import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, Clock, Star, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/marketing_assets/logos/4.png"
                alt="Queen Hills Murree Logo"
                width={48}
                height={48}
                className="rounded"
              />
              <h3 className="text-2xl font-serif font-bold">Queen Hills Murree</h3>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Your gateway to luxury living in Pakistan's most beautiful hill station. 
              Premium plots in Murree's most exclusive location.
            </p>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-300">Premium Real Estate Investment</span>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Available Plots</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Payment Plans</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Location Map</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Gallery</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </motion.div>

          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold mb-6">Our Services</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Plot Booking</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Legal Documentation</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Site Visits</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Investment Consultation</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Property Management</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Customer Support</a></li>
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold mb-6">Contact Info</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-300">+92 300 1234567</p>
                  <p className="text-gray-300">+92 300 7654321</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-300">info@queenhillsmurree.com</p>
                  <p className="text-gray-300">sales@queenhillsmurree.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-300">Queen Hills Murree</p>
                  <p className="text-gray-300">Phase 1, Block A, Murree</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-orange-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-300">Mon - Sat: 9:00 AM - 6:00 PM</p>
                  <p className="text-gray-300">Sunday: 10:00 AM - 4:00 PM</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Social Media & Newsletter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="border-t border-gray-800 mt-12 pt-8"
        >
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            {/* Social Media */}
            <div className="flex items-center gap-4">
              <span className="text-gray-300">Follow us:</span>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center hover:bg-green-700 transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center hover:bg-pink-700 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-green-400 rounded-lg flex items-center justify-center hover:bg-green-500 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-green-700 rounded-lg flex items-center justify-center hover:bg-green-800 transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Newsletter */}
            <div className="flex items-center gap-4">
              <span className="text-gray-300">Get updates:</span>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg focus:outline-none focus:border-green-500 text-white placeholder-gray-400"
                />
                                  <button className="px-6 py-2 bg-green-600 hover:bg-green-700 transition-colors rounded-r-lg font-semibold">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2024 Queen Hills Murree. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 