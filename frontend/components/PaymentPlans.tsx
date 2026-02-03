'use client'

import { motion } from 'framer-motion'
import { Download, Check } from 'lucide-react'

export default function PaymentPlans() {
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
            Payment Plans
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Flexible payment options to make your dream home a reality
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Plan 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="bg-white border-2 border-primary-200 rounded-2xl p-8 hover:border-primary-400 transition-colors"
          >
            <h3 className="text-2xl font-bold mb-4">Down Payment</h3>
            <div className="text-4xl font-bold text-primary-600 mb-6">25%</div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <Check className="text-green-500 mr-3" size={20} />
                <span>Immediate booking</span>
              </li>
              <li className="flex items-center">
                <Check className="text-green-500 mr-3" size={20} />
                <span>Plot reservation</span>
              </li>
              <li className="flex items-center">
                <Check className="text-green-500 mr-3" size={20} />
                <span>Documentation included</span>
              </li>
            </ul>
            <button className="w-full btn-primary">
              Download Plan
            </button>
          </motion.div>

          {/* Plan 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-primary-600 text-white rounded-2xl p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-primary-700 text-white px-4 py-2 text-sm font-semibold">
              Popular
            </div>
            <h3 className="text-2xl font-bold mb-4">Quarterly Installments</h3>
            <div className="text-4xl font-bold mb-6">75%</div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <Check className="text-green-300 mr-3" size={20} />
                <span>12 quarterly payments</span>
              </li>
              <li className="flex items-center">
                <Check className="text-green-300 mr-3" size={20} />
                <span>No hidden charges</span>
              </li>
              <li className="flex items-center">
                <Check className="text-green-300 mr-3" size={20} />
                <span>Flexible payment dates</span>
              </li>
            </ul>
            <button className="w-full bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg transition-colors">
              Download Plan
            </button>
          </motion.div>

          {/* Plan 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="bg-white border-2 border-primary-200 rounded-2xl p-8 hover:border-primary-400 transition-colors"
          >
            <h3 className="text-2xl font-bold mb-4">Monthly Installments</h3>
            <div className="text-4xl font-bold text-primary-600 mb-6">75%</div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <Check className="text-green-500 mr-3" size={20} />
                <span>36 monthly payments</span>
              </li>
              <li className="flex items-center">
                <Check className="text-green-500 mr-3" size={20} />
                <span>Lower monthly amount</span>
              </li>
              <li className="flex items-center">
                <Check className="text-green-500 mr-3" size={20} />
                <span>Easy budgeting</span>
              </li>
            </ul>
            <button className="w-full btn-primary">
              Download Plan
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  )
} 