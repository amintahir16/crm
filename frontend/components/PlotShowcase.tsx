'use client'

import { motion } from 'framer-motion'
import { MapPin, Ruler, DollarSign, Calendar, Star } from 'lucide-react'

const plots = [
  {
    id: 1,
    plotNumber: "A-001",
    size: "5 Marla",
    price: "2.5M",
    location: "Phase 1, Block A",
    status: "Available",
    features: ["Mountain View", "Corner Plot", "Ready for Construction"],
    image: "/marketing_assets/WhatsApp Image 2025-07-26 at 1.04.11 AM.jpeg"
  },
  {
    id: 2,
    plotNumber: "A-002",
    size: "5 Marla",
    price: "2.4M",
    location: "Phase 1, Block A",
    status: "Available",
    features: ["Premium Location", "Easy Access", "Garden View"],
    image: "/marketing_assets/WhatsApp Image 2025-07-26 at 1.04.12 AM.jpeg"
  },
  {
    id: 3,
    plotNumber: "B-001",
    size: "7.5 Marla",
    price: "3.5M",
    location: "Phase 1, Block B",
    status: "Available",
    features: ["Large Plot", "Villa Ready", "Scenic Views"],
    image: "/marketing_assets/WhatsApp Image 2025-07-26 at 1.04.12 AM.jpeg"
  }
]

export default function PlotShowcase() {
  return (
    <section className="py-20 bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
            Available Plots
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Choose from our premium selection of plots in Queen Hills Murree
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plots.map((plot, index) => (
            <motion.div
              key={plot.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="bg-gray-800 rounded-2xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300"
            >
              {/* Plot Image */}
              <div className="relative h-48 overflow-hidden">
                <div 
                  className="w-full h-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${plot.image})`
                  }}
                >
                  <div className="absolute inset-0 bg-black/40"></div>
                </div>
                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {plot.status}
                </div>
              </div>

              {/* Plot Details */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-green-300">{plot.plotNumber}</h3>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-4 h-4" />
                    <Star className="w-4 h-4" />
                    <Star className="w-4 h-4" />
                    <Star className="w-4 h-4" />
                    <Star className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">{plot.location}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Ruler className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">{plot.size}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-300 font-semibold">PKR {plot.price}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">FEATURES</h4>
                  <div className="flex flex-wrap gap-2">
                    {plot.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className="bg-green-600/20 text-green-300 px-3 py-1 rounded-full text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-lg font-semibold transition-all duration-300">
                  Book This Plot
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Plots CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <button className="bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300">
            View All Available Plots
          </button>
        </motion.div>
      </div>
    </section>
  )
} 