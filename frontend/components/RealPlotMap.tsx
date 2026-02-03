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
  Download,
  RefreshCw,
  Plus,
  X,
  Save,
  Upload
} from 'lucide-react'
import Image from 'next/image'

interface Plot {
  id: string
  plotNumber: string
  sizeMarla: number
  sizeSqm: number
  phase: string
  block: string
  pricePkr: number
  status: string
  coordinates: string
  mapX: number
  mapY: number
  imageBounds?: string // JSON string: {x, y, width, height}
  imagePath?: string
  imageWidth?: number
  imageHeight?: number
  createdAt: string
  updatedAt: string
}

// Plot size categories for filtering (Queen Hills Murree actual sizes)
const plotSizeCategories = [
  { value: 4, label: '4 Marla', color: '#22c55e' },
  { value: 5, label: '5 Marla', color: '#84cc16' },
  { value: 6, label: '6 Marla', color: '#10b981' },
  { value: 7, label: '7 Marla', color: '#06b6d4' },
  { value: 8, label: '8 Marla', color: '#3b82f6' },
  { value: 10, label: '10 Marla', color: '#6366f1' },
  { value: 12, label: '12 Marla', color: '#8b5cf6' },
  { value: 15, label: '15 Marla', color: '#a855f7' },
  { value: 20, label: '1 Kanal (20 Marla)', color: '#ef4444' },
]


// Landmarks on the map
const landmarks: any[] = []


export default function RealPlotMap() {
  const [plots, setPlots] = useState<Plot[]>([])
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null)
  const [hoveredPlot, setHoveredPlot] = useState<Plot | null>(null)
  const [selectedSize, setSelectedSize] = useState<number | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(false)
  const [showLandmarks, setShowLandmarks] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const mapRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Add plot mode
  const [isAddMode, setIsAddMode] = useState(false)
  const [clickedPoint, setClickedPoint] = useState<{ x: number; y: number } | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPlotData, setNewPlotData] = useState({
    plotNumber: '',
    block: '',
    phase: '1',
    sizeMarla: 5.0,
    sizeSqm: 126.45,
    pricePkr: 0,
    status: 'available' as 'available' | 'reserved' | 'sold' | 'transferred',
    imageBounds: '',
    imagePath: '/plot-map.png',
    imageWidth: 2068,
    imageHeight: 1312,
  })
  const [isSaving, setIsSaving] = useState(false)

  // Fetch plots from API
  useEffect(() => {
    fetchPlots()
  }, [])

  const fetchPlots = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('access_token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

      const response = await fetch(`${apiUrl}/plots?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Fetched plots:', data.data?.length || 0) // Debug log
        setPlots(data.data || data.plots || [])
      } else {
        console.error('Failed to fetch plots:', response.status)
      }
    } catch (error) {
      console.error('Error fetching plots:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle map upload
  const handleMapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!confirm('Are you sure you want to update the map image? This will replace the map for all plots.')) {
      e.target.value = '' // Reset input
      return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${apiUrl}/plots/map/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        await fetchPlots()
        alert('Map updated successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to upload map: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error uploading map:', error)
      alert('An error occurred while uploading the map')
    } finally {
      setIsLoading(false)
      e.target.value = '' // Reset input
    }
  }

  // Filter plots based on criteria
  const filteredPlots = plots.filter(plot => {
    const matchesSize = selectedSize === null || plot.sizeMarla === selectedSize
    const matchesBlock = selectedBlock === null || plot.block === selectedBlock
    const matchesPhase = selectedPhase === null || plot.phase === selectedPhase
    const matchesStatus = selectedStatus === null || plot.status === selectedStatus
    const matchesSearch = searchQuery === '' ||
      plot.plotNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plot.block.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSize && matchesBlock && matchesPhase && matchesStatus && matchesSearch
  })

  // Get plot color based on size
  const getPlotColor = (size: number) => {
    const category = plotSizeCategories.find(cat => cat.value === size)
    return category?.color || '#6b7280'
  }

  // Get status color with opacity
  const getStatusStyle = (status: string, size: number) => {
    switch (status.toLowerCase()) {
      case 'available':
        return { fill: '#10b981', opacity: 0.8, strokeWidth: 2 }
      case 'reserved':
        return { fill: '#fbbf24', opacity: 0.8, strokeWidth: 2 }
      case 'sold':
        return { fill: '#ef4444', opacity: 0.7, strokeWidth: 1.5 }
      default:
        return { fill: '#6b7280', opacity: 0.6, strokeWidth: 1.5 }
    }
  }

  // Parse coordinates string to get plot dimensions
  const parseCoordinates = (coordString: string) => {
    const coords = coordString.split(',').map(Number)
    return {
      x: coords[0] || 0,
      y: coords[1] || 0,
      width: coords[2] || 5,
      height: coords[3] || 5
    }
  }

  // Get plot rectangle properties from image coordinates
  const getPlotRect = (plot: Plot) => {
    // If imageBounds is available, use it (preferred method)
    if (plot.imageBounds && plot.imageWidth && plot.imageHeight) {
      try {
        const bounds = JSON.parse(plot.imageBounds)
        // Convert pixel coordinates to percentage
        return {
          x: (bounds.x / plot.imageWidth) * 100,
          y: (bounds.y / plot.imageHeight) * 100,
          width: (bounds.width / plot.imageWidth) * 100,
          height: (bounds.height / plot.imageHeight) * 100
        }
      } catch (e) {
        console.warn(`Failed to parse imageBounds for plot ${plot.plotNumber}:`, e)
      }
    }

    // Fallback to old coordinate system
    const coords = parseCoordinates(plot.coordinates)
    return {
      x: plot.mapX || coords.x,
      y: plot.mapY || coords.y,
      width: coords.width || 5,
      height: coords.height || 5
    }
  }

  // Get the map image path from plots (use first plot's imagePath, or default)
  const getMapUrl = (path: string | undefined) => {
    if (!path) return '/plot-map.png'
    if (path.startsWith('http')) return path
    if (path.startsWith('/uploads')) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
      try {
        const url = new URL(apiUrl)
        return `${url.origin}${path}`
      } catch (e) {
        return `http://localhost:3001${path}`
      }
    }
    return path.startsWith('/') ? path : `/${path}`
  }

  const mapImagePath = plots.length > 0
    ? getMapUrl(plots[0].imagePath)
    : '/plot-map.png'

  // Handle zoom
  const handleZoom = useCallback((direction: 'in' | 'out') => {
    setZoom(prevZoom => {
      const newZoom = direction === 'in' ? prevZoom * 1.2 : prevZoom / 1.2
      return Math.max(0.5, Math.min(4, newZoom))
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
    if (isAddMode) {
      // In add mode, clicking captures coordinates
      e.preventDefault()
      e.stopPropagation()
      handleMapClick(e)
      return
    }

    if (e.button === 0 && !e.currentTarget.closest('rect')) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && !isAddMode) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Handle map click in add mode
  const handleMapClick = (e: React.MouseEvent) => {
    if (!isAddMode) return

    const mapContainer = mapRef.current
    if (!mapContainer) return

    const rect = mapContainer.getBoundingClientRect()
    const containerWidth = rect.width
    const containerHeight = rect.height

    // Get click position relative to container
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    // Get the transformed container (accounts for pan/zoom)
    const transformedContainer = mapContainer.querySelector('div[style*="transform"]') as HTMLElement
    if (!transformedContainer) return

    // Calculate the actual image display dimensions (object-contain maintains aspect ratio)
    const imageWidth = newPlotData.imageWidth
    const imageHeight = newPlotData.imageHeight
    const imageAspect = imageWidth / imageHeight
    const containerAspect = containerWidth / containerHeight

    let displayWidth: number
    let displayHeight: number
    let offsetX = 0
    let offsetY = 0

    if (imageAspect > containerAspect) {
      // Image is wider - fits to width
      displayWidth = containerWidth
      displayHeight = containerWidth / imageAspect
      offsetY = (containerHeight - displayHeight) / 2
    } else {
      // Image is taller - fits to height
      displayHeight = containerHeight
      displayWidth = containerHeight * imageAspect
      offsetX = (containerWidth - displayWidth) / 2
    }

    // Account for pan and zoom
    const centerX = containerWidth / 2
    const centerY = containerHeight / 2

    // Transform click coordinates
    const relativeX = (clickX - centerX - pan.x) / zoom + centerX
    const relativeY = (clickY - centerY - pan.y) / zoom + centerY

    // Convert to image pixel coordinates
    const pixelX = Math.max(0, Math.min(imageWidth, ((relativeX - offsetX) / displayWidth) * imageWidth))
    const pixelY = Math.max(0, Math.min(imageHeight, ((relativeY - offsetY) / displayHeight) * imageHeight))

    // Default plot size (can be adjusted in form)
    const defaultWidth = 100
    const defaultHeight = 80

    setClickedPoint({ x: pixelX, y: pixelY })

    // Set image bounds
    const bounds = {
      x: Math.max(0, pixelX - defaultWidth / 2),
      y: Math.max(0, pixelY - defaultHeight / 2),
      width: defaultWidth,
      height: defaultHeight
    }

    setNewPlotData(prev => ({
      ...prev,
      imageBounds: JSON.stringify(bounds),
      coordinates: `${bounds.x},${bounds.y}`,
      mapX: (bounds.x / imageWidth) * 100,
      mapY: (bounds.y / imageHeight) * 100,
    }))

    setShowAddForm(true)
  }

  // Save new plot
  const handleSavePlot = async () => {
    if (!newPlotData.plotNumber || !newPlotData.block) {
      alert('Please fill in plot number and block')
      return
    }

    setIsSaving(true)
    try {
      const token = localStorage.getItem('access_token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

      const plotPayload = {
        ...newPlotData,
        sizeSqm: newPlotData.sizeMarla * 25.29, // Auto-calculate
      }

      const response = await fetch(`${apiUrl}/plots`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(plotPayload),
      })

      if (response.ok) {
        await fetchPlots()
        setIsAddMode(false)
        setShowAddForm(false)
        setClickedPoint(null)
        setNewPlotData({
          plotNumber: '',
          block: '',
          phase: '1',
          sizeMarla: 5.0,
          sizeSqm: 126.45,
          pricePkr: 0,
          status: 'available',
          imageBounds: '',
          imagePath: '/plot-map.png',
          imageWidth: 2068,
          imageHeight: 1312,
        })
        alert('Plot added successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to add plot: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving plot:', error)
      alert('An error occurred while saving the plot')
    } finally {
      setIsSaving(false)
    }
  }

  // Cancel add mode
  const handleCancelAdd = () => {
    setIsAddMode(false)
    setShowAddForm(false)
    setClickedPoint(null)
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

  // Calculate statistics
  const stats = {
    total: plots.length,
    available: plots.filter(p => p.status.toLowerCase() === 'available').length,
    reserved: plots.filter(p => p.status.toLowerCase() === 'reserved').length,
    sold: plots.filter(p => p.status.toLowerCase() === 'sold').length,
    blocks: Array.from(new Set(plots.map(p => p.block))).length,
    phases: Array.from(new Set(plots.map(p => p.phase))).length,
  }

  // Get unique values for filters
  const uniqueBlocks = Array.from(new Set(plots.map(p => p.block))).sort()
  const uniquePhases = Array.from(new Set(plots.map(p => p.phase))).sort()
  const uniqueSizes = Array.from(new Set(plots.map(p => p.sizeMarla))).sort((a, b) => a - b)

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-xl shadow-lg p-8 flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading plot data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-2xl overflow-hidden">
      {/* Header Controls */}
      <div className="bg-white border-b p-4">
        <div className="flex flex-col xl:flex-row gap-2 items-center justify-between">
          {/* Search Bar */}
          <div className="min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Size Filter */}
            <select
              value={selectedSize || ''}
              onChange={(e) => setSelectedSize(e.target.value ? Number(e.target.value) : null)}
              className="px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Sizes</option>
              {uniqueSizes.map(size => (
                <option key={size} value={size}>
                  {size === 20 ? '1 Kanal' : `${size} Marla`}
                </option>
              ))}
            </select>

            {/* Block Filter */}
            <select
              value={selectedBlock || ''}
              onChange={(e) => setSelectedBlock(e.target.value || null)}
              className="px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Blocks</option>
              {uniqueBlocks.map(block => (
                <option key={block} value={block}>Block {block}</option>
              ))}
            </select>

            {/* Phase Filter */}
            <select
              value={selectedPhase || ''}
              onChange={(e) => setSelectedPhase(e.target.value || null)}
              className="px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Phases</option>
              {uniquePhases.map(phase => (
                <option key={phase} value={phase}>Phase {phase}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus || ''}
              onChange={(e) => setSelectedStatus(e.target.value || null)}
              className="px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
            </select>

            {/* Toggle Buttons */}
            <button
              onClick={() => setShowGrid(prev => !prev)}
              className={`p-1.5 rounded-md transition-colors ${showGrid ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              title="Toggle Grid (G)"
            >
              <Layers className="h-4 w-4" />
            </button>

            <button
              onClick={fetchPlots}
              className="p-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            {/* Update Map Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleMapUpload}
              className="hidden"
              accept="image/*"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1.5"
              title="Update Map Image"
            >
              <Upload className="h-4 w-4" />
              <span className="whitespace-nowrap">Update Map</span>
            </button>

            {/* Add Plot Button */}
            <button
              onClick={() => setIsAddMode(!isAddMode)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${isAddMode
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              title={isAddMode ? "Cancel Add Plot" : "Add Plot"}
            >
              {isAddMode ? (
                <>
                  <X className="h-4 w-4" />
                  <span className="whitespace-nowrap">Cancel</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span className="whitespace-nowrap">Add Plot</span>
                </>
              )}
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
            <span className="font-semibold">Filtered:</span>
            <span className="text-gray-600">{filteredPlots.length} plots</span>
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
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Showing: {filteredPlots.length} plots</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-gradient-to-br from-emerald-50 to-blue-50" style={{ height: '75vh' }}>
        {/* Add Mode Indicator */}
        {isAddMode && (
          <div className="absolute top-4 left-4 z-30 bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span className="font-semibold">Click on the map to add a plot</span>
            </div>
          </div>
        )}

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
          className="relative w-full h-full overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isAddMode ? 'crosshair' : (isDragging ? 'grabbing' : 'grab') }}
        >
          <div
            className="relative w-full h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.3s ease',
            }}
          >
            {/* Background Map Images */}
            <div className="absolute inset-0 w-full h-full">
              <Image
                src={mapImagePath}
                alt="Queen Hills Murree Master Plan"
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Grid Overlay */}
            {showGrid && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ opacity: 0.15 }}
              >
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="black" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            )}

            {/* Plot Overlays */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <filter id="plotShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="1" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.3" />
                </filter>
              </defs>

              {/* Draw plot boundaries */}
              {filteredPlots.map((plot) => {
                const rect = getPlotRect(plot)
                const isSelected = selectedPlot?.id === plot.id
                const isHovered = hoveredPlot?.id === plot.id
                const style = getStatusStyle(plot.status, plot.sizeMarla)

                return (
                  <g key={plot.id}>
                    {/* Plot Rectangle */}
                    <rect
                      x={`${rect.x}%`}
                      y={`${rect.y}%`}
                      width={`${rect.width}%`}
                      height={`${rect.height}%`}
                      fill={style.fill}
                      fillOpacity={isSelected ? 0.9 : isHovered ? 0.8 : style.opacity}
                      stroke={isSelected ? '#fbbf24' : isHovered ? '#3b82f6' : '#374151'}
                      strokeWidth={isSelected ? 3 : isHovered ? 2 : style.strokeWidth}
                      filter={isSelected || isHovered ? "url(#plotShadow)" : "none"}
                      className="cursor-pointer transition-all duration-200 pointer-events-auto"
                      onMouseEnter={() => setHoveredPlot(plot)}
                      onMouseLeave={() => setHoveredPlot(null)}
                      onClick={() => setSelectedPlot(plot)}
                    />

                    {/* Plot Label */}
                    {(isSelected || isHovered || zoom > 1.5) && (
                      <text
                        x={`${rect.x + rect.width / 2}%`}
                        y={`${rect.y + rect.height / 2}%`}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="pointer-events-none select-none font-semibold"
                        fill={plot.status.toLowerCase() === 'sold' ? '#ffffff' : '#1f2937'}
                        fontSize={isSelected ? 12 : zoom > 2 ? 11 : 10}
                        fontWeight={isSelected ? 'bold' : 'normal'}
                      >
                        {plot.plotNumber}
                      </text>
                    )}

                    {/* Size Label for larger zoom */}
                    {zoom > 2.2 && (
                      <text
                        x={`${rect.x + rect.width / 2}%`}
                        y={`${rect.y + rect.height / 2 + 1.5}%`}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="pointer-events-none select-none"
                        fill={plot.status.toLowerCase() === 'sold' ? '#ffffff' : '#6b7280'}
                        fontSize={8}
                      >
                        {plot.sizeMarla === 20 ? '1 Kanal' : `${plot.sizeMarla}M`}
                      </text>
                    )}

                    {/* Status indicator dot */}
                    {zoom > 1.8 && (
                      <circle
                        cx={`${rect.x + rect.width - 1}%`}
                        cy={`${rect.y + 1}%`}
                        r="2"
                        fill={
                          plot.status.toLowerCase() === 'available' ? '#10b981' :
                            plot.status.toLowerCase() === 'reserved' ? '#f59e0b' : '#ef4444'
                        }
                        stroke="#ffffff"
                        strokeWidth="1"
                      />
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
                    r="10"
                    fill="#ffffff"
                    stroke="#374151"
                    strokeWidth="2"
                    opacity="0.9"
                  />
                  <text
                    x={`${landmark.x}%`}
                    y={`${landmark.y}%`}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="14"
                    className="pointer-events-none select-none"
                  >
                    {landmark.icon}
                  </text>
                  {zoom > 1.5 && (
                    <text
                      x={`${landmark.x}%`}
                      y={`${landmark.y + 2.5}%`}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#374151"
                      fontWeight="500"
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
                <h3 className="text-xl font-bold text-gray-900">Plot {selectedPlot.plotNumber}</h3>
                <button
                  onClick={() => setSelectedPlot(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
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
                    {selectedPlot.sizeMarla === 20 ? '1 Kanal' : `${selectedPlot.sizeMarla} Marla`}
                    <span className="text-xs text-gray-500 ml-1">({selectedPlot.sizeSqm.toFixed(1)} sqm)</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phase:</span>
                  <span className="font-semibold">Phase {selectedPlot.phase}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-semibold capitalize px-2 py-1 rounded text-white text-sm ${selectedPlot.status.toLowerCase() === 'available' ? 'bg-green-500' :
                    selectedPlot.status.toLowerCase() === 'reserved' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                    {selectedPlot.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-bold text-lg text-primary-600">
                    PKR {selectedPlot.pricePkr.toLocaleString()}
                  </span>
                </div>
              </div>

              {selectedPlot.status.toLowerCase() === 'available' && (
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
              className="absolute bg-black/90 text-white px-4 py-3 rounded-lg text-sm pointer-events-none z-40"
              style={{
                left: '50%',
                bottom: '10%',
                transform: 'translateX(-50%)'
              }}
            >
              <div className="font-semibold text-base">{hoveredPlot.plotNumber}</div>
              <div className="mt-1">
                {hoveredPlot.sizeMarla === 20 ? '1 Kanal' : `${hoveredPlot.sizeMarla} Marla`} • Block {hoveredPlot.block} • Phase {hoveredPlot.phase}
              </div>
              <div className="capitalize mt-1">
                Status: <span className={`font-semibold ${hoveredPlot.status.toLowerCase() === 'available' ? 'text-green-400' :
                  hoveredPlot.status.toLowerCase() === 'reserved' ? 'text-yellow-400' : 'text-red-400'
                  }`}>{hoveredPlot.status}</span>
              </div>
              <div className="mt-1 font-semibold">PKR {hoveredPlot.pricePkr.toLocaleString()}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="bg-white border-t p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-600 rounded"></div>
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
            <div className="h-4 w-px bg-gray-300"></div>
            {plotSizeCategories.slice(0, 6).map(size => (
              <div key={size.value} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: size.color }}></div>
                <span className="text-xs text-gray-600">{size.label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            <span>Keyboard: + / - (Zoom) • R (Reset) • G (Grid) • L (Landmarks) • ESC (Close)</span>
          </div>
        </div>
      </div>

      {/* Add Plot Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Add New Plot</h2>
                  <button
                    onClick={handleCancelAdd}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Plot location: ({clickedPoint?.x.toFixed(0)}, {clickedPoint?.y.toFixed(0)})
                </p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSavePlot(); }} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plot Number *
                    </label>
                    <input
                      type="text"
                      value={newPlotData.plotNumber}
                      onChange={(e) => setNewPlotData(prev => ({ ...prev, plotNumber: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., A-01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Block *
                    </label>
                    <input
                      type="text"
                      value={newPlotData.block}
                      onChange={(e) => setNewPlotData(prev => ({ ...prev, block: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., A"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phase *
                    </label>
                    <input
                      type="text"
                      value={newPlotData.phase}
                      onChange={(e) => setNewPlotData(prev => ({ ...prev, phase: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={newPlotData.status}
                      onChange={(e) => setNewPlotData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="available">Available</option>
                      <option value="reserved">Reserved</option>
                      <option value="sold">Sold</option>
                      <option value="transferred">Transferred</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Size (Marla) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={newPlotData.sizeMarla}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        setNewPlotData(prev => ({
                          ...prev,
                          sizeMarla: val,
                          sizeSqm: val * 25.29
                        }))
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (PKR) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={newPlotData.pricePkr}
                      onChange={(e) => setNewPlotData(prev => ({ ...prev, pricePkr: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancelAdd}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Plot'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
