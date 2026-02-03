'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2,
  Filter,
  Search,
  MapPin,
  Info,
  Home,
  Layers,
  Download
} from 'lucide-react'
import Image from 'next/image'

// Plot sizes in Pakistan (1 Kanal = 20 Marla)
const plotSizeCategories = [
  { value: 5, label: '5 Marla', sqft: 1125, color: '#10b981' },
  { value: 7, label: '7 Marla', sqft: 1575, color: '#3b82f6' },
  { value: 10, label: '10 Marla', sqft: 2250, color: '#8b5cf6' },
  { value: 15, label: '15 Marla', sqft: 3375, color: '#f59e0b' },
  { value: 20, label: '1 Kanal', sqft: 4500, color: '#ef4444' },
  { value: 40, label: '2 Kanal', sqft: 9000, color: '#ec4899' },
]

// Comprehensive plot data based on Queen Hills Murree map
const plotData: Plot[] = [
  // Block A - Premium Plots (Near Main Road)
  { id: 'A-01', x: 10, y: 15, width: 8, height: 6, size: 20, block: 'A', status: 'available', phase: 1, category: 'Premium' },
  { id: 'A-02', x: 19, y: 15, width: 8, height: 6, size: 20, block: 'A', status: 'available', phase: 1, category: 'Premium' },
  { id: 'A-03', x: 28, y: 15, width: 8, height: 6, size: 20, block: 'A', status: 'sold', phase: 1, category: 'Premium' },
  { id: 'A-04', x: 37, y: 15, width: 8, height: 6, size: 20, block: 'A', status: 'available', phase: 1, category: 'Premium' },
  { id: 'A-05', x: 46, y: 15, width: 8, height: 6, size: 20, block: 'A', status: 'reserved', phase: 1, category: 'Premium' },
  { id: 'A-06', x: 55, y: 15, width: 8, height: 6, size: 20, block: 'A', status: 'available', phase: 1, category: 'Premium' },
  { id: 'A-07', x: 64, y: 15, width: 8, height: 6, size: 20, block: 'A', status: 'available', phase: 1, category: 'Premium' },
  { id: 'A-08', x: 73, y: 15, width: 8, height: 6, size: 20, block: 'A', status: 'sold', phase: 1, category: 'Premium' },
  
  // Block A - Second Row (10 Marla)
  { id: 'A-09', x: 10, y: 22, width: 6, height: 5, size: 10, block: 'A', status: 'available', phase: 1, category: 'Standard' },
  { id: 'A-10', x: 17, y: 22, width: 6, height: 5, size: 10, block: 'A', status: 'available', phase: 1, category: 'Standard' },
  { id: 'A-11', x: 24, y: 22, width: 6, height: 5, size: 10, block: 'A', status: 'reserved', phase: 1, category: 'Standard' },
  { id: 'A-12', x: 31, y: 22, width: 6, height: 5, size: 10, block: 'A', status: 'available', phase: 1, category: 'Standard' },
  { id: 'A-13', x: 38, y: 22, width: 6, height: 5, size: 10, block: 'A', status: 'available', phase: 1, category: 'Standard' },
  { id: 'A-14', x: 45, y: 22, width: 6, height: 5, size: 10, block: 'A', status: 'sold', phase: 1, category: 'Standard' },
  { id: 'A-15', x: 52, y: 22, width: 6, height: 5, size: 10, block: 'A', status: 'available', phase: 1, category: 'Standard' },
  { id: 'A-16', x: 59, y: 22, width: 6, height: 5, size: 10, block: 'A', status: 'available', phase: 1, category: 'Standard' },
  { id: 'A-17', x: 66, y: 22, width: 6, height: 5, size: 10, block: 'A', status: 'available', phase: 1, category: 'Standard' },
  { id: 'A-18', x: 73, y: 22, width: 6, height: 5, size: 10, block: 'A', status: 'reserved', phase: 1, category: 'Standard' },

  // Block B - Mixed Sizes
  { id: 'B-01', x: 10, y: 32, width: 7, height: 5.5, size: 15, block: 'B', status: 'available', phase: 1, category: 'Standard' },
  { id: 'B-02', x: 18, y: 32, width: 7, height: 5.5, size: 15, block: 'B', status: 'available', phase: 1, category: 'Standard' },
  { id: 'B-03', x: 26, y: 32, width: 7, height: 5.5, size: 15, block: 'B', status: 'sold', phase: 1, category: 'Standard' },
  { id: 'B-04', x: 34, y: 32, width: 7, height: 5.5, size: 15, block: 'B', status: 'available', phase: 1, category: 'Standard' },
  { id: 'B-05', x: 42, y: 32, width: 7, height: 5.5, size: 15, block: 'B', status: 'available', phase: 1, category: 'Standard' },
  { id: 'B-06', x: 50, y: 32, width: 7, height: 5.5, size: 15, block: 'B', status: 'reserved', phase: 1, category: 'Standard' },
  { id: 'B-07', x: 58, y: 32, width: 7, height: 5.5, size: 15, block: 'B', status: 'available', phase: 1, category: 'Standard' },
  { id: 'B-08', x: 66, y: 32, width: 7, height: 5.5, size: 15, block: 'B', status: 'available', phase: 1, category: 'Standard' },
  
  // Block B - Second Row (7 Marla)
  { id: 'B-09', x: 10, y: 39, width: 5, height: 4, size: 7, block: 'B', status: 'available', phase: 1, category: 'Compact' },
  { id: 'B-10', x: 16, y: 39, width: 5, height: 4, size: 7, block: 'B', status: 'available', phase: 1, category: 'Compact' },
  { id: 'B-11', x: 22, y: 39, width: 5, height: 4, size: 7, block: 'B', status: 'available', phase: 1, category: 'Compact' },
  { id: 'B-12', x: 28, y: 39, width: 5, height: 4, size: 7, block: 'B', status: 'sold', phase: 1, category: 'Compact' },
  { id: 'B-13', x: 34, y: 39, width: 5, height: 4, size: 7, block: 'B', status: 'available', phase: 1, category: 'Compact' },
  { id: 'B-14', x: 40, y: 39, width: 5, height: 4, size: 7, block: 'B', status: 'available', phase: 1, category: 'Compact' },
  { id: 'B-15', x: 46, y: 39, width: 5, height: 4, size: 7, block: 'B', status: 'reserved', phase: 1, category: 'Compact' },
  { id: 'B-16', x: 52, y: 39, width: 5, height: 4, size: 7, block: 'B', status: 'available', phase: 1, category: 'Compact' },
  { id: 'B-17', x: 58, y: 39, width: 5, height: 4, size: 7, block: 'B', status: 'available', phase: 1, category: 'Compact' },
  { id: 'B-18', x: 64, y: 39, width: 5, height: 4, size: 7, block: 'B', status: 'available', phase: 1, category: 'Compact' },
  { id: 'B-19', x: 70, y: 39, width: 5, height: 4, size: 7, block: 'B', status: 'sold', phase: 1, category: 'Compact' },

  // Block C - Economy Plots (5 Marla)
  { id: 'C-01', x: 8, y: 48, width: 4, height: 3.5, size: 5, block: 'C', status: 'available', phase: 2, category: 'Economy' },
  { id: 'C-02', x: 13, y: 48, width: 4, height: 3.5, size: 5, block: 'C', status: 'available', phase: 2, category: 'Economy' },
  { id: 'C-03', x: 18, y: 48, width: 4, height: 3.5, size: 5, block: 'C', status: 'sold', phase: 2, category: 'Economy' },
  { id: 'C-04', x: 23, y: 48, width: 4, height: 3.5, size: 5, block: 'C', status: 'available', phase: 2, category: 'Economy' },
  { id: 'C-05', x: 28, y: 48, width: 4, height: 3.5, size: 5, block: 'C', status: 'available', phase: 2, category: 'Economy' },
  { id: 'C-06', x: 33, y: 48, width: 4, height: 3.5, size: 5, block: 'C', status: 'reserved', phase: 2, category: 'Economy' },
  { id: 'C-07', x: 38, y: 48, width: 4, height: 3.5, size: 5, block: 'C', status: 'available', phase: 2, category: 'Economy' },
  { id: 'C-08', x: 43, y: 48, width: 4, height: 3.5, size: 5, block: 'C', status: 'available', phase: 2, category: 'Economy' },
  { id: 'C-09', x: 48, y: 48, width: 4, height: 3.5, size: 5, block: 'C', status: 'sold', phase: 2, category: 'Economy' },
  { id: 'C-10', x: 53, y: 48, width: 4, height: 3.5, size: 5, block: 'C', status: 'available', phase: 2, category: 'Economy' },
  { id: 'C-11', x: 58, y: 48, width: 4, height: 3.5, size: 5, block: 'C', status: 'available', phase: 2, category: 'Economy' },
  { id: 'C-12', x: 63, y: 48, width: 4, height: 3.5, size: 5, block: 'C', status: 'available', phase: 2, category: 'Economy' },
  { id: 'C-13', x: 68, y: 48, width: 4, height: 3.5, size: 5, block: 'C', status: 'reserved', phase: 2, category: 'Economy' },
  { id: 'C-14', x: 73, y: 48, width: 4, height: 3.5, size: 5, block: 'C', status: 'available', phase: 2, category: 'Economy' },
  { id: 'C-15', x: 78, y: 48, width: 4, height: 3.5, size: 5, block: 'C', status: 'available', phase: 2, category: 'Economy' },

  // Block C - Second Row (5 Marla)
  { id: 'C-16', x: 8, y: 53, width: 4, height: 3.5, size: 5, block: 'C', status: 'available', phase: 2, category: 'Economy' },
  { id: 'C-17', x: 13, y: 53, width: 4, height: 3.5, size: 5, block: 'C', status: 'sold', phase: 2, category: 'Economy' },
  { id: 'C-18', x: 18, y: 53, width: 4, height: 3.5, size: 5, block: 'C', status: 'available', phase: 2, category: 'Economy' },
  { id: 'C-19', x: 23, y: 53, width: 4, height: 3.5, size: 5, block: 'C', status: 'available', phase: 2, category: 'Economy' },
  { id: 'C-20', x: 28, y: 53, width: 4, height: 3.5, size: 5, block: 'C', status: 'reserved', phase: 2, category: 'Economy' },
  { id: 'C-21', x: 33, y: 53, width: 4, height: 3.5, size: 5, block: 'C', status: 'available', phase: 2, category: 'Economy' },
  { id: 'C-22', x: 38, y: 53, width: 4, height: 3.5, size: 5, block: 'C', status: 'available', phase: 2, category: 'Economy' },
  { id: 'C-23', x: 43, y: 53, width: 4, height: 3.5, size: 5, block: 'C', status: 'sold', phase: 2, category: 'Economy' },
  { id: 'C-24', x: 48, y: 53, width: 4, height: 3.5, size: 5, block: 'C', status: 'available', phase: 2, category: 'Economy' },
  { id: 'C-25', x: 53, y: 53, width: 4, height: 3.5, size: 5, block: 'C', status: 'available', phase: 2, category: 'Economy' },
  { id: 'C-26', x: 58, y: 53, width: 4, height: 3.5, size: 5, block: 'C', status: 'available', phase: 2, category: 'Economy' },
  { id: 'C-27', x: 63, y: 53, width: 4, height: 3.5, size: 5, block: 'C', status: 'reserved', phase: 2, category: 'Economy' },
  { id: 'C-28', x: 68, y: 53, width: 4, height: 3.5, size: 5, block: 'C', status: 'available', phase: 2, category: 'Economy' },
  { id: 'C-29', x: 73, y: 53, width: 4, height: 3.5, size: 5, block: 'C', status: 'available', phase: 2, category: 'Economy' },
  { id: 'C-30', x: 78, y: 53, width: 4, height: 3.5, size: 5, block: 'C', status: 'sold', phase: 2, category: 'Economy' },

  // Block D - Commercial Plots
  { id: 'D-01', x: 10, y: 62, width: 10, height: 8, size: 40, block: 'D', status: 'available', phase: 2, category: 'Commercial' },
  { id: 'D-02', x: 22, y: 62, width: 10, height: 8, size: 40, block: 'D', status: 'reserved', phase: 2, category: 'Commercial' },
  { id: 'D-03', x: 34, y: 62, width: 10, height: 8, size: 40, block: 'D', status: 'available', phase: 2, category: 'Commercial' },
  { id: 'D-04', x: 46, y: 62, width: 10, height: 8, size: 40, block: 'D', status: 'sold', phase: 2, category: 'Commercial' },
  { id: 'D-05', x: 58, y: 62, width: 10, height: 8, size: 40, block: 'D', status: 'available', phase: 2, category: 'Commercial' },
  { id: 'D-06', x: 70, y: 62, width: 10, height: 8, size: 40, block: 'D', status: 'available', phase: 2, category: 'Commercial' },

  // Block E - Hill View Plots (Premium Location)
  { id: 'E-01', x: 12, y: 75, width: 8, height: 6, size: 20, block: 'E', status: 'available', phase: 3, category: 'Hill View' },
  { id: 'E-02', x: 21, y: 75, width: 8, height: 6, size: 20, block: 'E', status: 'sold', phase: 3, category: 'Hill View' },
  { id: 'E-03', x: 30, y: 75, width: 8, height: 6, size: 20, block: 'E', status: 'available', phase: 3, category: 'Hill View' },
  { id: 'E-04', x: 39, y: 75, width: 8, height: 6, size: 20, block: 'E', status: 'reserved', phase: 3, category: 'Hill View' },
  { id: 'E-05', x: 48, y: 75, width: 8, height: 6, size: 20, block: 'E', status: 'available', phase: 3, category: 'Hill View' },
  { id: 'E-06', x: 57, y: 75, width: 8, height: 6, size: 20, block: 'E', status: 'available', phase: 3, category: 'Hill View' },
  { id: 'E-07', x: 66, y: 75, width: 8, height: 6, size: 20, block: 'E', status: 'sold', phase: 3, category: 'Hill View' },
  { id: 'E-08', x: 75, y: 75, width: 8, height: 6, size: 20, block: 'E', status: 'available', phase: 3, category: 'Hill View' },

  // Block F - Corner Plots (Mixed Sizes)
  { id: 'F-01', x: 12, y: 85, width: 6, height: 5, size: 10, block: 'F', status: 'available', phase: 3, category: 'Corner' },
  { id: 'F-02', x: 19, y: 85, width: 6, height: 5, size: 10, block: 'F', status: 'available', phase: 3, category: 'Corner' },
  { id: 'F-03', x: 26, y: 85, width: 6, height: 5, size: 10, block: 'F', status: 'reserved', phase: 3, category: 'Corner' },
  { id: 'F-04', x: 33, y: 85, width: 6, height: 5, size: 10, block: 'F', status: 'available', phase: 3, category: 'Corner' },
  { id: 'F-05', x: 40, y: 85, width: 6, height: 5, size: 10, block: 'F', status: 'sold', phase: 3, category: 'Corner' },
  { id: 'F-06', x: 47, y: 85, width: 6, height: 5, size: 10, block: 'F', status: 'available', phase: 3, category: 'Corner' },
  { id: 'F-07', x: 54, y: 85, width: 6, height: 5, size: 10, block: 'F', status: 'available', phase: 3, category: 'Corner' },
  { id: 'F-08', x: 61, y: 85, width: 6, height: 5, size: 10, block: 'F', status: 'available', phase: 3, category: 'Corner' },
  { id: 'F-09', x: 68, y: 85, width: 6, height: 5, size: 10, block: 'F', status: 'reserved', phase: 3, category: 'Corner' },
  { id: 'F-10', x: 75, y: 85, width: 6, height: 5, size: 10, block: 'F', status: 'available', phase: 3, category: 'Corner' },
]

// Amenities and landmarks
const landmarks = [
  { id: 'main-gate', x: 5, y: 10, icon: '🏛️', label: 'Main Entrance' },
  { id: 'mosque', x: 45, y: 55, icon: '🕌', label: 'Mosque' },
  { id: 'park-1', x: 30, y: 45, icon: '🌳', label: 'Central Park' },
  { id: 'park-2', x: 60, y: 70, icon: '🌲', label: 'Hill View Park' },
  { id: 'commercial', x: 45, y: 65, icon: '🏪', label: 'Commercial Area' },
  { id: 'club', x: 85, y: 50, icon: '🏌️', label: 'Club House' },
]

interface Plot {
  id: string
  x: number
  y: number
  width: number
  height: number
  size: number
  block: string
  status: 'available' | 'reserved' | 'sold' | 'transferred'
  phase: number
  category: string
}

export default function InteractivePlotMap() {
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null)
  const [hoveredPlot, setHoveredPlot] = useState<Plot | null>(null)
  const [selectedSize, setSelectedSize] = useState<number | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(false)
  const [showLandmarks, setShowLandmarks] = useState(true)
  const mapRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Filter plots based on criteria
  const filteredPlots = plotData.filter(plot => {
    const matchesSize = selectedSize === null || plot.size === selectedSize
    const matchesBlock = selectedBlock === null || plot.block === selectedBlock
    const matchesPhase = selectedPhase === null || plot.phase === selectedPhase
    const matchesSearch = searchQuery === '' || 
      plot.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plot.category.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesSize && matchesBlock && matchesPhase && matchesSearch
  })

  // Get plot color based on size
  const getPlotColor = (size: number) => {
    const category = plotSizeCategories.find(cat => cat.value === size)
    return category?.color || '#6b7280'
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#10b981'
      case 'reserved': return '#f59e0b'
      case 'sold': return '#ef4444'
      default: return '#6b7280'
    }
  }

  // Calculate price based on size and category
  const calculatePrice = (plot: Plot) => {
    const basePrice = 500000 // Base price per marla
    const categoryMultiplier = {
      'Premium': 1.5,
      'Hill View': 1.4,
      'Commercial': 2,
      'Corner': 1.3,
      'Standard': 1.2,
      'Compact': 1.1,
      'Economy': 1
    }[plot.category] || 1

    return plot.size * basePrice * categoryMultiplier
  }

  // Handle zoom
  const handleZoom = useCallback((direction: 'in' | 'out') => {
    setZoom(prevZoom => {
      const newZoom = direction === 'in' ? prevZoom * 1.2 : prevZoom / 1.2
      return Math.max(0.5, Math.min(3, newZoom))
    })
  }, [])

  // Handle reset
  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setSelectedPlot(null)
    setHoveredPlot(null)
  }

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Mouse handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') handleZoom('in')
      if (e.key === '-') handleZoom('out')
      if (e.key === 'r') handleReset()
      if (e.key === 'g') setShowGrid(prev => !prev)
      if (e.key === 'l') setShowLandmarks(prev => !prev)
      if (e.key === 'Escape') setSelectedPlot(null)
    }
    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [handleZoom])

  // Stats calculation
  const stats = {
    total: plotData.length,
    available: plotData.filter(p => p.status === 'available').length,
    reserved: plotData.filter(p => p.status === 'reserved').length,
    sold: plotData.filter(p => p.status === 'sold').length,
    blocks: Array.from(new Set(plotData.map(p => p.block))).length,
    phases: Array.from(new Set(plotData.map(p => p.phase))).length,
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-2xl overflow-hidden">
      {/* Header Controls */}
      <div className="bg-white border-b p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by plot ID or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {/* Size Filter */}
            <select
              value={selectedSize || ''}
              onChange={(e) => setSelectedSize(e.target.value ? Number(e.target.value) : null)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Sizes</option>
              {plotSizeCategories.map(size => (
                <option key={size.value} value={size.value}>{size.label}</option>
              ))}
            </select>

            {/* Block Filter */}
            <select
              value={selectedBlock || ''}
              onChange={(e) => setSelectedBlock(e.target.value || null)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Blocks</option>
              {Array.from(new Set(plotData.map(p => p.block))).sort().map(block => (
                <option key={block} value={block}>Block {block}</option>
              ))}
            </select>

            {/* Phase Filter */}
            <select
              value={selectedPhase || ''}
              onChange={(e) => setSelectedPhase(e.target.value ? Number(e.target.value) : null)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Phases</option>
              {Array.from(new Set(plotData.map(p => p.phase))).sort().map(phase => (
                <option key={phase} value={phase}>Phase {phase}</option>
              ))}
            </select>

            {/* Toggle Buttons */}
            <button
              onClick={() => setShowGrid(prev => !prev)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                showGrid ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Toggle Grid (G)"
            >
              <Layers className="h-5 w-5" />
            </button>

            <button
              onClick={() => setShowLandmarks(prev => !prev)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                showLandmarks ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Toggle Landmarks (L)"
            >
              <MapPin className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Total:</span>
            <span className="text-gray-600">{stats.total} plots</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Available: {stats.available}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-600">Reserved: {stats.reserved}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600">Sold: {stats.sold}</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-gradient-to-br from-emerald-50 to-blue-50" style={{ height: '70vh' }}>
        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <button
            onClick={() => handleZoom('in')}
            className="p-3 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-all hover:shadow-xl"
            title="Zoom In (+)"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleZoom('out')}
            className="p-3 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-all hover:shadow-xl"
            title="Zoom Out (-)"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <button
            onClick={handleReset}
            className="p-3 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-all hover:shadow-xl"
            title="Reset View (R)"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-3 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-all hover:shadow-xl"
            title="Fullscreen"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </div>

        {/* Map View */}
        <div
          ref={mapRef}
          className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="relative w-full h-full transition-transform duration-300"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            {/* Grid Overlay */}
            {showGrid && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ opacity: 0.1 }}
              >
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="black" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            )}

            {/* Map Background Image */}
            <div className="absolute inset-0 w-full h-full">
              <Image
                src="/Queen Hills MURREE map.pdf"
                alt="Queen Hills Murree Master Plan"
                fill
                className="object-contain opacity-30"
                priority
              />
            </div>

            {/* Plot Overlays */}
            <svg className="absolute inset-0 w-full h-full">
              {filteredPlots.map((plot) => {
                const isSelected = selectedPlot?.id === plot.id
                const isHovered = hoveredPlot?.id === plot.id
                const opacity = plot.status === 'sold' ? 0.3 : isSelected ? 1 : isHovered ? 0.9 : 0.7

                return (
                  <g key={plot.id}>
                    {/* Plot Rectangle */}
                    <rect
                      x={`${plot.x}%`}
                      y={`${plot.y}%`}
                      width={`${plot.width}%`}
                      height={`${plot.height}%`}
                      fill={getStatusColor(plot.status)}
                      fillOpacity={opacity}
                      stroke={isSelected ? '#fbbf24' : isHovered ? '#60a5fa' : '#374151'}
                      strokeWidth={isSelected ? 3 : isHovered ? 2 : 1}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredPlot(plot)}
                      onMouseLeave={() => setHoveredPlot(null)}
                      onClick={() => setSelectedPlot(plot)}
                    />
                    
                    {/* Plot Label */}
                    {(isSelected || isHovered || zoom > 1.5) && (
                      <text
                        x={`${plot.x + plot.width / 2}%`}
                        y={`${plot.y + plot.height / 2}%`}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="pointer-events-none select-none"
                        fill={plot.status === 'sold' ? '#6b7280' : '#ffffff'}
                        fontSize={isSelected ? 14 : 12}
                        fontWeight={isSelected ? 'bold' : 'normal'}
                      >
                        {plot.id}
                      </text>
                    )}
                  </g>
                )
              })}

              {/* Landmarks */}
              {showLandmarks && landmarks.map((landmark) => (
                <g key={landmark.id}>
                  <circle
                    cx={`${landmark.x}%`}
                    cy={`${landmark.y}%`}
                    r="8"
                    fill="#ffffff"
                    stroke="#374151"
                    strokeWidth="2"
                  />
                  <text
                    x={`${landmark.x}%`}
                    y={`${landmark.y}%`}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="16"
                    className="pointer-events-none select-none"
                  >
                    {landmark.icon}
                  </text>
                  {zoom > 1.2 && (
                    <text
                      x={`${landmark.x}%`}
                      y={`${landmark.y + 2}%`}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#374151"
                      className="pointer-events-none select-none"
                    >
                      {landmark.label}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Plot Information Panel */}
        <AnimatePresence>
          {selectedPlot && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute left-4 top-4 bg-white rounded-xl shadow-2xl p-6 max-w-sm z-30"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">Plot {selectedPlot.id}</h3>
                <button
                  onClick={() => setSelectedPlot(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Block:</span>
                  <span className="font-semibold">{selectedPlot.block}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-semibold">
                    {selectedPlot.size === 20 ? '1 Kanal' : 
                     selectedPlot.size === 40 ? '2 Kanal' : 
                     `${selectedPlot.size} Marla`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-semibold">{selectedPlot.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phase:</span>
                  <span className="font-semibold">Phase {selectedPlot.phase}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-semibold capitalize px-2 py-1 rounded text-white ${
                    selectedPlot.status === 'available' ? 'bg-green-500' :
                    selectedPlot.status === 'reserved' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}>
                    {selectedPlot.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-bold text-lg text-primary-600">
                    PKR {calculatePrice(selectedPlot).toLocaleString()}
                  </span>
                </div>
              </div>

              {selectedPlot.status === 'available' && (
                <div className="mt-4 space-y-2">
                  <button className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    Book Now
                  </button>
                  <button className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    Schedule Visit
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hover Tooltip */}
        <AnimatePresence>
          {hoveredPlot && !selectedPlot && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute bg-black text-white px-3 py-2 rounded-lg text-sm pointer-events-none z-40"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="font-semibold">{hoveredPlot.id}</div>
              <div>{hoveredPlot.size === 20 ? '1 Kanal' : `${hoveredPlot.size} Marla`} • {hoveredPlot.category}</div>
              <div className="capitalize">{hoveredPlot.status}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="bg-white border-t p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm">Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">Sold</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>Keyboard: + / - (Zoom) • R (Reset) • G (Grid) • L (Landmarks)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
