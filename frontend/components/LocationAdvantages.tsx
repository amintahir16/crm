'use client'

import { motion } from 'framer-motion'
import { MapPin, Mountain, Car, TreePine, Cloud, Star } from 'lucide-react'

const advantages = [
  {
    icon: Mountain,
    title: "Breathtaking Views",
    description: "Panoramic views of the Himalayan foothills and lush green valleys",
          color: "text-green-600"
  },
  {
    icon: TreePine,
    title: "Fresh Mountain Air",
    description: "Clean, crisp air with high oxygen levels perfect for health and wellness",
    color: "text-green-600"
  },
  {
    icon: Car,
    title: "Easy Accessibility",
    description: "Just 2 hours from Islamabad and well-connected road network",
    color: "text-purple-600"
  },
  {
    icon: Cloud,
    title: "Pleasant Climate",
    description: "Cool summers and snowy winters - perfect year-round destination",
    color: "text-cyan-600"
  },
  {
    icon: Star,
    title: "Tourist Hotspot",
    description: "High rental potential and growing tourism industry",
    color: "text-yellow-600"
  },
  {
    icon: MapPin,
    title: "Strategic Location",
    description: "Close to major attractions, markets, and essential amenities",
    color: "text-red-600"
  }
]

export default function LocationAdvantages() {
  return (
    <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6">
            The Magic of Murree
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover why Murree is Pakistan's most sought-after hill station destination
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {advantages.map((advantage, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center mb-6 ${advantage.color}`}>
                <advantage.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{advantage.title}</h3>
              <p className="text-gray-600 leading-relaxed">{advantage.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Location Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl p-8 shadow-xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-serif font-bold text-gray-900 mb-6">
                Prime Location in Murree
              </h3>
              <div className="space-y-4 text-gray-600">
                <div className="flex items-start gap-3">
                  <MapPin className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Strategic Position</h4>
                    <p>Located in the most prestigious area of Murree with easy access to all amenities</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Car className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Accessibility</h4>
                    <p>15 minutes from Murree city center, 2 hours from Islamabad International Airport</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mountain className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Elevation & Views</h4>
                    <p>Situated at 7,500 feet above sea level with panoramic mountain views</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div 
                className="w-full h-64 rounded-2xl bg-cover bg-center"
                style={{
                  backgroundImage: "url('/marketing_assets/WhatsApp Image 2025-07-26 at 1.04.12 AM.jpeg')"
                }}
              >
                <div className="absolute inset-0 bg-black/30 rounded-2xl"></div>
                                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 text-center">
                    <MapPin className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                          <p className="font-semibold text-gray-900">Queen Hills Murree</p>
                      <p className="text-sm text-gray-600">Premium Location</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 