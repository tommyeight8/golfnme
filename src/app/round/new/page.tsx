'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  MapPin,
  Search,
  ChevronRight,
  Flag,
  Star,
  Plus,
  ArrowLeft,
  Cloud,
  Sun,
  CloudRain,
  Wind,
  Loader2,
} from 'lucide-react'
import type { Course } from '@/types'

const weatherOptions = [
  { id: 'sunny', label: 'Sunny', icon: Sun },
  { id: 'cloudy', label: 'Cloudy', icon: Cloud },
  { id: 'rainy', label: 'Rainy', icon: CloudRain },
  { id: 'windy', label: 'Windy', icon: Wind },
]

export default function NewRoundPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [weather, setWeather] = useState('sunny')
  const [notes, setNotes] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  
  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(`/api/courses?search=${encodeURIComponent(searchQuery)}`)
        const data = await response.json()
        
        if (data.success) {
          setCourses(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error)
      } finally {
        setIsLoadingCourses(false)
      }
    }
    
    // Debounce search
    const timeoutId = setTimeout(fetchCourses, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])
  
  const handleStartRound = async () => {
    if (!selectedCourse) return
    
    setIsCreating(true)
    try {
      const response = await fetch('/api/rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          weather,
          notes,
        }),
      })
      
      const data = await response.json()
      if (data.success) {
        router.push(`/round/${data.data.id}`)
      } else {
        console.error('Failed to create round:', data.error)
      }
    } catch (error) {
      console.error('Failed to create round:', error)
    } finally {
      setIsCreating(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-sand-50">
      {/* Header */}
      <header className="bg-fairway-gradient text-white">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold">New Round</h1>
              <p className="text-white/70 text-sm">Me Time - Solo Play</p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Course Selection */}
        <section>
          <h2 className="font-display text-lg font-semibold text-sand-900 mb-4">
            Select Course
          </h2>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sand-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-12"
            />
          </div>
          
          {/* Course List */}
          <div className="space-y-3">
            {isLoadingCourses ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-fairway-500 mx-auto mb-2" />
                <p className="text-sand-500">Loading courses...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-8">
                <Flag className="w-12 h-12 text-sand-300 mx-auto mb-2" />
                <p className="text-sand-500">No courses found</p>
                <p className="text-sand-400 text-sm">Try a different search or add a new course</p>
              </div>
            ) : (
              courses.map((course) => (
                <motion.button
                  key={course.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCourse(course)}
                  className={`w-full card p-4 text-left transition-all ${
                    selectedCourse?.id === course.id
                      ? 'ring-2 ring-fairway-500 bg-fairway-50'
                      : 'hover:bg-sand-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedCourse?.id === course.id
                        ? 'bg-fairway-500 text-white'
                        : 'bg-fairway-100 text-fairway-600'
                    }`}>
                      <Flag className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sand-900">{course.name}</p>
                      <div className="flex items-center gap-2 text-sm text-sand-500">
                        <MapPin className="w-4 h-4" />
                        <span>{course.city}, {course.state}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-medium text-sand-700">Par {course.par}</p>
                      {course.slope && (
                        <p className="text-xs text-sand-500">Slope: {course.slope}</p>
                      )}
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-colors ${
                      selectedCourse?.id === course.id
                        ? 'text-fairway-500'
                        : 'text-sand-300'
                    }`} />
                  </div>
                </motion.button>
              ))
            )}
          </div>
          
          {/* Add Custom Course */}
          <button className="w-full mt-3 card p-4 text-left hover:bg-sand-50 transition-colors border-2 border-dashed border-sand-200">
            <div className="flex items-center gap-4 text-sand-500">
              <div className="w-12 h-12 rounded-xl bg-sand-100 flex items-center justify-center">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-medium">Add New Course</span>
            </div>
          </button>
        </section>
        
        {/* Weather Selection */}
        <section>
          <h2 className="font-display text-lg font-semibold text-sand-900 mb-4">
            Weather Conditions
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {weatherOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setWeather(option.id)}
                className={`card p-4 text-center transition-all ${
                  weather === option.id
                    ? 'ring-2 ring-fairway-500 bg-fairway-50'
                    : 'hover:bg-sand-50'
                }`}
              >
                <option.icon className={`w-8 h-8 mx-auto mb-2 ${
                  weather === option.id ? 'text-fairway-500' : 'text-sand-400'
                }`} />
                <p className={`text-sm font-medium ${
                  weather === option.id ? 'text-fairway-700' : 'text-sand-600'
                }`}>
                  {option.label}
                </p>
              </button>
            ))}
          </div>
        </section>
        
        {/* Notes */}
        <section>
          <h2 className="font-display text-lg font-semibold text-sand-900 mb-4">
            Round Notes (Optional)
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this round..."
            rows={3}
            className="input resize-none"
          />
        </section>
        
        {/* Course Summary */}
        {selectedCourse && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 bg-fairway-gradient text-white"
          >
            <h3 className="font-display text-lg font-semibold mb-4">Round Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/60 text-sm">Course</p>
                <p className="font-medium">{selectedCourse.name}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Location</p>
                <p className="font-medium">{selectedCourse.city}, {selectedCourse.state}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Par</p>
                <p className="font-display text-2xl font-bold">{selectedCourse.par}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Holes</p>
                <p className="font-display text-2xl font-bold">{selectedCourse.numHoles}</p>
              </div>
            </div>
          </motion.section>
        )}
        
        {/* Start Button */}
        <button
          onClick={handleStartRound}
          disabled={!selectedCourse || isCreating}
          className="btn btn-gold w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <span className="flex items-center justify-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-fairway-900/30 border-t-fairway-900 rounded-full"
              />
              Starting Round...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Flag className="w-5 h-5" />
              Start Round
            </span>
          )}
        </button>
      </main>
    </div>
  )
}
