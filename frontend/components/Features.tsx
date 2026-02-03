'use client'

import { motion } from 'framer-motion'
import { Shield, Mountain, Car, Wifi, TreePine, MapPin, Star, Zap } from 'lucide-react'

const features = [
  {
    icon: Mountain,
    title: "Prime Location",
    description: "Situated in the most prestigious area of Murree with breathtaking mountain views",
          color: "text-green-600"
  },
  {
    icon: Shield,
    title: "Gated Community",
    description: "24/7 security with controlled access ensuring your family's safety",
    color: "text-green-600"
  },
  {
    icon: Car,
    title: "Easy Access",
    description: "Well-connected roads with just 15 minutes from Murree city center",
    color: "text-purple-600"
  },
  {
    icon: Wifi,
    title: "Modern Amenities",
    description: "High-speed internet, electricity, and water connections available",
    color: "text-orange-600"
  },
  {
    icon: TreePine,
    title: "Natural Beauty",
    description: "Surrounded by pine forests and scenic landscapes",
    color: "text-emerald-600"
  },
  {
    icon: Star,
    title: "Investment Value",
    description: "High appreciation potential with growing demand in Murree",
    color: "text-yellow-600"
  }
]

export default function Features() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6">
            Why Choose Queen Hills Murree?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience luxury living in the heart of Pakistan's most beautiful hill station
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center mb-6 ${feature.color}`}>
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
                      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-white">
            <Zap className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
            <h3 className="text-2xl font-bold mb-4">Limited Time Offer</h3>
            <p className="text-lg mb-6 opacity-90">
              Book your plot today and get exclusive early bird discounts
            </p>
                          <button className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300">
              Reserve Your Plot Now
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 