'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Home, Filter, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import Image from 'next/image'

const plotSizes = [
  { value: 3.5, label: '3.5 Marla', sqm: 87.5 },
  { value: 5, label: '5 Marla', sqm: 125 },
  { value: 10, label: '10 Marla', sqm: 250 },
  { value: 20, label: '1 Kanal', sqm: 500 },
]

// Plot coordinates based on the map analysis
// These are approximate coordinates for the plots visible in the map
const plotCoordinates = [
  // Phase 1 - Top section
  { id: 'A-001', x: 15, y: 8, size: 5, status: 'available', block: 'A' },
  { id: 'A-002', x: 25, y: 8, size: 5, status: 'available', block: 'A' },
  { id: 'A-003', x: 35, y: 8, size: 5, status: 'available', block: 'A' },
  { id: 'A-004', x: 45, y: 8, size: 5, status: 'available', block: 'A' },
  { id: 'A-005', x: 55, y: 8, size: 5, status: 'available', block: 'A' },
  { id: 'A-006', x: 65, y: 8, size: 5, status: 'available', block: 'A' },
  { id: 'A-007', x: 75, y: 8, size: 5, status: 'available', block: 'A' },
  { id: 'A-008', x: 85, y: 8, size: 5, status: 'available', block: 'A' },
  
  // Phase 1 - Second row
  { id: 'A-009', x: 15, y: 18, size: 5, status: 'available', block: 'A' },
  { id: 'A-010', x: 25, y: 18, size: 5, status: 'available', block: 'A' },
  { id: 'A-011', x: 35, y: 18, size: 5, status: 'available', block: 'A' },
  { id: 'A-012', x: 45, y: 18, size: 5, status: 'available', block: 'A' },
  { id: 'A-013', x: 55, y: 18, size: 5, status: 'available', block: 'A' },
  { id: 'A-014', x: 65, y: 18, size: 5, status: 'available', block: 'A' },
  { id: 'A-015', x: 75, y: 18, size: 5, status: 'available', block: 'A' },
  { id: 'A-016', x: 85, y: 18, size: 5, status: 'available', block: 'A' },
  
  // Phase 2 - Middle section
  { id: 'B-001', x: 15, y: 35, size: 10, status: 'available', block: 'B' },
  { id: 'B-002', x: 30, y: 35, size: 10, status: 'available', block: 'B' },
  { id: 'B-003', x: 45, y: 35, size: 10, status: 'available', block: 'B' },
  { id: 'B-004', x: 60, y: 35, size: 10, status: 'available', block: 'B' },
  { id: 'B-005', x: 75, y: 35, size: 10, status: 'available', block: 'B' },
  
  { id: 'B-006', x: 15, y: 50, size: 10, status: 'available', block: 'B' },
  { id: 'B-007', x: 30, y: 50, size: 10, status: 'available', block: 'B' },
  { id: 'B-008', x: 45, y: 50, size: 10, status: 'available', block: 'B' },
  { id: 'B-009', x: 60, y: 50, size: 10, status: 'available', block: 'B' },
  { id: 'B-010', x: 75, y: 50, size: 10, status: 'available', block: 'B' },
  
  // Phase 3 - Bottom section
  { id: 'C-001', x: 10, y: 70, size: 3.5, status: 'available', block: 'C' },
  { id: 'C-002', x: 20, y: 70, size: 3.5, status: 'available', block: 'C' },
  { id: 'C-003', x: 30, y: 70, size: 3.5, status: 'available', block: 'C' },
  { id: 'C-004', x: 40, y: 70, size: 3.5, status: 'available', block: 'C' },
  { id: 'C-005', x: 50, y: 70, size: 3.5, status: 'available', block: 'C' },
  { id: 'C-006', x: 60, y: 70, size: 3.5, status: 'available', block: 'C' },
  { id: 'C-007', x: 70, y: 70, size: 3.5, status: 'available', block: 'C' },
  { id: 'C-008', x: 80, y: 70, size: 3.5, status: 'available', block: 'C' },
  { id: 'C-009', x: 90, y: 70, size: 3.5, status: 'available', block: 'C' },
  
  { id: 'C-010', x: 10, y: 80, size: 3.5, status: 'available', block: 'C' },
  { id: 'C-011', x: 20, y: 80, size: 3.5, status: 'available', block: 'C' },
  { id: 'C-012', x: 30, y: 80, size: 3.5, status: 'available', block: 'C' },
  { id: 'C-013', x: 40, y: 80, size: 3.5, status: 'available', block: 'C' },
  { id: 'C-014', x: 50, y: 80, size: 3.5, status: 'available', block: 'C' },
  { id: 'C-015', x: 60, y: 80, size: 3.5, status: 'available', block: 'C' },
  { id: 'C-016', x: 70, y: 80, size: 3.5, status: 'available', block: 'C' },
  { id: 'C-017', x: 80, y: 80, size: 3.5, status: 'available', block: 'C' },
  { id: 'C-018', x: 90, y: 80, size: 3.5, status: 'available', block: 'C' },
]

export default function PlotMap() {
  const [selectedSize, setSelectedSize] = useState<number | null>(null)
  const [hoveredPlot, setHoveredPlot] = useState<any>(null)
  const [selectedPlot, setSelectedPlot] = useState<any>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const mapRef = useRef<HTMLDivElement>(null)

  // Filter plots based on selected size
  const filteredPlots = plotCoordinates.filter(plot => 
    selectedSize === null || plot.size === selectedSize
  )

  // Handle plot click
  const handlePlotClick = (plot: any) => {
    setSelectedPlot(plot)
    // Center the map on the selected plot
    setPan({
      x: -plot.x * zoom + 50,
      y: -plot.y * zoom + 50
    })
  }

  // Handle zoom
  const handleZoom = (direction: 'in' | 'out') => {
    const newZoom = direction === 'in' ? zoom * 1.2 : zoom / 1.2
    setZoom(Math.max(0.5, Math.min(3, newZoom)))
  }

  // Handle reset
  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setSelectedPlot(null)
  }

  // Handle mouse events for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

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
            Interactive Master Plan
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore our exclusive plots with different sizes and locations. 
            Hover over plots to see details and pricing.
          </p>
        </motion.div>

        {/* Filter Controls */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setSelectedSize(null)}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                selectedSize === null
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Sizes
            </button>
            {plotSizes.map((size) => (
              <button
                key={size.value}
                onClick={() => setSelectedSize(size.value)}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  selectedSize === size.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>

        {/* Map Container */}
        <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="relative aspect-video bg-gray-100 overflow-hidden">
            {/* Map Controls */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
              <button
                onClick={() => handleZoom('in')}
                className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleZoom('out')}
                className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={handleReset}
                className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
                title="Reset View"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            {/* Map Image Container */}
            <div
              ref={mapRef}
              className="relative w-full h-full cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.3s ease'
              }}
            >
              {/* Map Image */}
              <div className="relative w-full h-full">
                <Image
                  src="/marketing_assets/WhatsApp Image 2025-07-26 at 1.04.12 AM.jpeg"
                  alt="Queen Hills Murree Master Plan"
                  fill
                  className="object-contain"
                  priority
                />
                
                {/* Plot Markers */}
                {filteredPlots.map((plot) => {
                  const isSelected = selectedPlot?.id === plot.id
                  const isHovered = hoveredPlot?.id === plot.id
                  
                  return (
                    <div
                      key={plot.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200"
                      style={{
                        left: `${plot.x}%`,
                        top: `${plot.y}%`,
                      }}
                      onClick={() => handlePlotClick(plot)}
                      onMouseEnter={() => setHoveredPlot({
                        id: plot.id,
                        size: `${plot.size} Marla`,
                        price: `PKR ${(plot.size * 500000).toLocaleString()}`,
                        status: plot.status === 'available' ? 'Available' : 'Sold',
                        block: plot.block
                      })}
                      onMouseLeave={() => setHoveredPlot(null)}
                    >
                      {/* Plot Marker */}
                      <div
                        className={`w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all duration-200 ${
                          isSelected
                            ? 'w-6 h-6 bg-yellow-500 scale-125'
                            : isHovered
                            ? 'w-5 h-5 scale-110'
                            : 'w-4 h-4'
                        } ${
                          plot.status === 'available'
                            ? 'bg-green-500'
                            : plot.status === 'reserved'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                      />
                      
                      {/* Plot ID Label */}
                      {(isSelected || isHovered) && (
                        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          {plot.id}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Plot Info Tooltip */}
          {hoveredPlot && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute bg-white p-4 rounded-lg shadow-lg border z-30"
              style={{
                top: '20%',
                left: '30%',
              }}
            >
              <h4 className="font-semibold text-lg mb-2">{hoveredPlot.id}</h4>
              <p className="text-gray-600 mb-1">Size: {hoveredPlot.size}</p>
              <p className="text-gray-600 mb-1">Price: {hoveredPlot.price}</p>
              <p className="text-gray-600 mb-1">Block: {hoveredPlot.block}</p>
              <p className={`font-semibold ${
                hoveredPlot.status === 'Available' ? 'text-green-600' : 
                hoveredPlot.status === 'Reserved' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {hoveredPlot.status}
              </p>
            </motion.div>
          )}

          {/* Selected Plot Details */}
          {selectedPlot && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border z-30 max-w-sm"
            >
              <h4 className="font-semibold text-lg mb-2">{selectedPlot.id}</h4>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">Size: {selectedPlot.size} Marla</p>
                <p className="text-gray-600">Block: {selectedPlot.block}</p>
                <p className="text-gray-600">Price: PKR {(selectedPlot.size * 500000).toLocaleString()}</p>
                <p className={`font-semibold ${
                  selectedPlot.status === 'available' ? 'text-green-600' : 
                  selectedPlot.status === 'reserved' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  Status: {selectedPlot.status === 'available' ? 'Available' : 
                          selectedPlot.status === 'reserved' ? 'Reserved' : 'Sold'}
                </p>
              </div>
              <button
                onClick={() => setSelectedPlot(null)}
                className="mt-3 text-xs text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </motion.div>
          )}
        </div>

        {/* Map Legend */}
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Sold</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full border-2 border-white"></div>
              <span>Selected</span>
            </div>
          </div>
        </div>

        {/* Plot Statistics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
            <h4 className="font-semibold text-lg text-gray-900">Total Plots</h4>
            <p className="text-2xl font-bold text-primary-600">{plotCoordinates.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
            <h4 className="font-semibold text-lg text-gray-900">Available</h4>
            <p className="text-2xl font-bold text-green-600">
              {plotCoordinates.filter(p => p.status === 'available').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
            <h4 className="font-semibold text-lg text-gray-900">Blocks</h4>
            <p className="text-2xl font-bold text-blue-600">
              {new Set(plotCoordinates.map(p => p.block)).size}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
} 