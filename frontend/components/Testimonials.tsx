'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

export default function Testimonials() {
  const testimonials = [
    {
      name: "Ahmed Khan",
      role: "Plot Owner",
      content: "Queen Hills Murree exceeded all my expectations. The location is perfect and the development quality is outstanding.",
      rating: 5
    },
    {
      name: "Fatima Ali",
      role: "Investor",
      content: "I've invested in multiple properties, but Queen Hills stands out for its strategic location and potential returns.",
      rating: 5
    },
    {
      name: "Muhammad Hassan",
      role: "Future Resident",
      content: "The booking process was smooth and the team was very professional. Can't wait to build my dream home here.",
      rating: 5
    }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-serif font-bold mb-4">
            What Our Customers Say
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our satisfied customers have to say
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-lg"
            >
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="text-yellow-400 fill-current" size={20} />
                ))}
              </div>
              
              <Quote className="text-primary-200 mb-4" size={32} />
              
              <p className="text-gray-600 mb-6 italic">
                "{testimonial.content}"
              </p>
              
              <div>
                <h4 className="font-semibold text-lg">{testimonial.name}</h4>
                <p className="text-gray-500">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 