'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Gallery() {
  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-serif font-bold mb-4">
            Virtual Tour & Gallery
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore the beauty of Queen Hills Murree through our photo and video gallery
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Gallery items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="group cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-2xl">
              <img
                src="/marketing_assets/WhatsApp Image 2025-07-26 at 1.04.12 AM.jpeg"
                alt="Site View"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="font-semibold">Site View</h3>
                <p className="text-sm opacity-90">Aerial perspective</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="group cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-2xl">
              <img
                src="/marketing_assets/WhatsApp Image 2025-07-26 at 1.04.11 AM.jpeg"
                alt="Landscape View"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="font-semibold">Landscape View</h3>
                <p className="text-sm opacity-90">Natural beauty</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="group cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-2xl">
              <video
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                muted
                loop
              >
                <source src="/marketing_assets/Marketing_video_with music.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="font-semibold">Marketing Video</h3>
                <p className="text-sm opacity-90">Experience Queen Hills</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
} 