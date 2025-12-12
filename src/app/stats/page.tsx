'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  Flag,
  Calendar,
  ChevronRight,
  BarChart3,
  PieChart,
  Filter,
} from 'lucide-react'

// Mock stats data
const mockStats = {
  overview: {
    totalRounds: 47,
    averageScore: 86.2,
    bestRound: 78,
    worstRound: 102,
    handicapTrend: -1.4,
    currentHandicap: 12.4,
  },
  scoring: {
    eagles: 2,
    birdies: 34,
    pars: 187,
    bogeys: 156,
    doubleBogeys: 67,
    triplePlus: 23,
  },
  parPerformance: {
    par3: { average: 3.21, trend: -0.05 },
    par4: { average: 4.68, trend: -0.12 },
    par5: { average: 5.42, trend: +0.08 },
  },
  recentRounds: [
    { date: '2025-01-10', course: 'Pebble Beach', score: 84, par: 72 },
    { date: '2025-01-07', course: 'TPC Sawgrass', score: 88, par: 72 },
    { date: '2025-01-03', course: 'Augusta National', score: 82, par: 72 },
    { date: '2024-12-28', course: 'Torrey Pines', score: 86, par: 72 },
    { date: '2024-12-21', course: 'Pebble Beach', score: 85, par: 72 },
    { date: '2024-12-15', course: 'Bethpage Black', score: 91, par: 71 },
    { date: '2024-12-10', course: 'TPC Sawgrass', score: 84, par: 72 },
    { date: '2024-12-05', course: 'Torrey Pines', score: 89, par: 72 },
  ],
  topCourses: [
    { name: 'Pebble Beach', rounds: 12, avgScore: 85.3, bestScore: 78 },
    { name: 'TPC Sawgrass', rounds: 8, avgScore: 88.1, bestScore: 84 },
    { name: 'Torrey Pines', rounds: 6, avgScore: 87.5, bestScore: 82 },
  ],
  averages: {
    fairwayPercentage: 48,
    girPercentage: 42,
    averagePutts: 32.4,
    sandSavePercentage: 35,
    scramblePercentage: 38,
  },
}

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all'

export default function StatsPage() {
  const router = useRouter()
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [activeSection, setActiveSection] = useState<'overview' | 'scoring' | 'courses'>('overview')
  
  const scoringTotal = Object.values(mockStats.scoring).reduce((a, b) => a + b, 0)
  const scoringData = [
    { name: 'Eagles', value: mockStats.scoring.eagles, color: 'bg-eagle', pct: (mockStats.scoring.eagles / scoringTotal * 100).toFixed(1) },
    { name: 'Birdies', value: mockStats.scoring.birdies, color: 'bg-birdie', pct: (mockStats.scoring.birdies / scoringTotal * 100).toFixed(1) },
    { name: 'Pars', value: mockStats.scoring.pars, color: 'bg-par', pct: (mockStats.scoring.pars / scoringTotal * 100).toFixed(1) },
    { name: 'Bogeys', value: mockStats.scoring.bogeys, color: 'bg-bogey', pct: (mockStats.scoring.bogeys / scoringTotal * 100).toFixed(1) },
    { name: 'Double+', value: mockStats.scoring.doubleBogeys + mockStats.scoring.triplePlus, color: 'bg-double', pct: ((mockStats.scoring.doubleBogeys + mockStats.scoring.triplePlus) / scoringTotal * 100).toFixed(1) },
  ]
  
  const maxScoringValue = Math.max(...scoringData.map(d => d.value))
  
  return (
    <div className="min-h-screen bg-sand-50">
      {/* Header */}
      <header className="bg-fairway-gradient text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold">Statistics</h1>
              <p className="text-white/70 text-sm">Track your progress</p>
            </div>
          </div>
          
          {/* Time Range Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: '7d' as const, label: '7 Days' },
              { id: '30d' as const, label: '30 Days' },
              { id: '90d' as const, label: '90 Days' },
              { id: '1y' as const, label: '1 Year' },
              { id: 'all' as const, label: 'All Time' },
            ].map((range) => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  timeRange === range.id
                    ? 'bg-white text-fairway-700'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Overview Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 text-sand-500 mb-2">
              <Flag className="w-4 h-4" />
              <span className="text-xs">Rounds</span>
            </div>
            <p className="text-3xl font-display font-bold text-sand-900">
              {mockStats.overview.totalRounds}
            </p>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center gap-2 text-sand-500 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Average</span>
            </div>
            <p className="text-3xl font-display font-bold text-sand-900">
              {mockStats.overview.averageScore}
            </p>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center gap-2 text-sand-500 mb-2">
              <Trophy className="w-4 h-4" />
              <span className="text-xs">Best Round</span>
            </div>
            <p className="text-3xl font-display font-bold text-birdie">
              {mockStats.overview.bestRound}
            </p>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center gap-2 text-sand-500 mb-2">
              <Target className="w-4 h-4" />
              <span className="text-xs">Handicap</span>
            </div>
            <p className="text-3xl font-display font-bold text-sand-900">
              {mockStats.overview.currentHandicap}
            </p>
            <p className={`text-xs font-medium mt-1 ${
              mockStats.overview.handicapTrend < 0 ? 'text-birdie' : 'text-bogey'
            }`}>
              {mockStats.overview.handicapTrend > 0 ? '+' : ''}{mockStats.overview.handicapTrend} this month
            </p>
          </div>
        </section>
        
        {/* Score Trend Chart */}
        <section className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg font-semibold text-sand-900">Score Trend</h2>
            <div className="flex items-center gap-2 text-sm text-sand-500">
              <span>Last 8 rounds</span>
            </div>
          </div>
          
          {/* Simple line visualization */}
          <div className="relative h-48">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-xs text-sand-400">
              <span>100</span>
              <span>90</span>
              <span>80</span>
              <span>70</span>
            </div>
            
            {/* Chart area */}
            <div className="ml-12 h-40 relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="border-b border-sand-100" />
                ))}
              </div>
              
              {/* Data points and line */}
              <svg className="absolute inset-0 w-full h-full overflow-visible">
                {/* Line */}
                <polyline
                  fill="none"
                  stroke="rgb(34 197 94)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={mockStats.recentRounds.map((round, i) => {
                    const x = (i / (mockStats.recentRounds.length - 1)) * 100
                    const y = ((100 - round.score) / 30) * 100 // Scale 70-100 to 0-100%
                    return `${x}%,${100 - y}%`
                  }).join(' ')}
                />
                
                {/* Points */}
                {mockStats.recentRounds.map((round, i) => {
                  const x = (i / (mockStats.recentRounds.length - 1)) * 100
                  const y = ((100 - round.score) / 30) * 100
                  return (
                    <circle
                      key={i}
                      cx={`${x}%`}
                      cy={`${100 - y}%`}
                      r="6"
                      fill="white"
                      stroke="rgb(34 197 94)"
                      strokeWidth="2"
                    />
                  )
                })}
              </svg>
              
              {/* Score labels */}
              <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-sand-500">
                {mockStats.recentRounds.slice().reverse().map((round, i) => (
                  <span key={i} className="text-center" style={{ width: `${100 / mockStats.recentRounds.length}%` }}>
                    {round.score}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {/* Date labels */}
          <div className="mt-8 flex justify-between text-xs text-sand-400 ml-12">
            {mockStats.recentRounds.slice().reverse().map((round, i) => (
              <span key={i}>
                {new Date(round.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            ))}
          </div>
        </section>
        
        {/* Scoring Distribution */}
        <section className="card p-6">
          <h2 className="font-display text-lg font-semibold text-sand-900 mb-6">Scoring Distribution</h2>
          <div className="space-y-4">
            {scoringData.map((item) => (
              <div key={item.name} className="flex items-center gap-4">
                <span className="w-16 text-sm text-sand-600">{item.name}</span>
                <div className="flex-1 h-8 bg-sand-100 rounded-lg overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.value / maxScoringValue) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className={`h-full ${item.color} rounded-lg flex items-center justify-end pr-2`}
                  >
                    <span className="text-xs font-medium text-white">{item.pct}%</span>
                  </motion.div>
                </div>
                <span className="w-12 text-right font-mono text-sm font-medium text-sand-700">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </section>
        
        {/* Par Performance */}
        <section className="card p-6">
          <h2 className="font-display text-lg font-semibold text-sand-900 mb-6">Par Performance</h2>
          <div className="grid grid-cols-3 gap-6">
            {[
              { par: 3, data: mockStats.parPerformance.par3 },
              { par: 4, data: mockStats.parPerformance.par4 },
              { par: 5, data: mockStats.parPerformance.par5 },
            ].map(({ par, data }) => (
              <div key={par} className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-fairway-100 mx-auto mb-3 flex items-center justify-center">
                  <span className="font-display text-3xl font-bold text-fairway-600">{par}</span>
                </div>
                <p className="text-2xl font-bold text-sand-900">{data.average.toFixed(2)}</p>
                <p className="text-sm text-sand-500">Avg Score</p>
                <p className={`text-xs mt-1 font-medium ${data.trend < 0 ? 'text-birdie' : 'text-bogey'}`}>
                  {data.trend > 0 ? '+' : ''}{data.trend.toFixed(2)} vs last month
                </p>
              </div>
            ))}
          </div>
        </section>
        
        {/* Key Metrics */}
        <section className="card p-6">
          <h2 className="font-display text-lg font-semibold text-sand-900 mb-6">Key Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-sand-50 rounded-xl">
              <p className="text-2xl font-bold text-sand-900">{mockStats.averages.fairwayPercentage}%</p>
              <p className="text-xs text-sand-500">Fairways Hit</p>
            </div>
            <div className="text-center p-4 bg-sand-50 rounded-xl">
              <p className="text-2xl font-bold text-sand-900">{mockStats.averages.girPercentage}%</p>
              <p className="text-xs text-sand-500">Greens in Reg</p>
            </div>
            <div className="text-center p-4 bg-sand-50 rounded-xl">
              <p className="text-2xl font-bold text-sand-900">{mockStats.averages.averagePutts}</p>
              <p className="text-xs text-sand-500">Avg Putts</p>
            </div>
            <div className="text-center p-4 bg-sand-50 rounded-xl">
              <p className="text-2xl font-bold text-sand-900">{mockStats.averages.sandSavePercentage}%</p>
              <p className="text-xs text-sand-500">Sand Saves</p>
            </div>
            <div className="text-center p-4 bg-sand-50 rounded-xl">
              <p className="text-2xl font-bold text-sand-900">{mockStats.averages.scramblePercentage}%</p>
              <p className="text-xs text-sand-500">Scramble</p>
            </div>
          </div>
        </section>
        
        {/* Top Courses */}
        <section className="card overflow-hidden">
          <div className="bg-sand-50 px-6 py-4 flex items-center justify-between border-b border-sand-100">
            <h2 className="font-display text-lg font-semibold text-sand-900">Top Courses</h2>
            <span className="text-sm text-sand-500">By rounds played</span>
          </div>
          <div className="divide-y divide-sand-100">
            {mockStats.topCourses.map((course, index) => (
              <div key={course.name} className="flex items-center gap-4 p-4 hover:bg-sand-50 transition-colors">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-gold-100 text-gold-600' :
                  index === 1 ? 'bg-sand-200 text-sand-600' :
                  'bg-amber-100 text-amber-600'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sand-900">{course.name}</p>
                  <p className="text-sm text-sand-500">{course.rounds} rounds</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-medium text-sand-700">Avg {course.avgScore}</p>
                  <p className="text-xs text-birdie">Best: {course.bestScore}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-sand-300" />
              </div>
            ))}
          </div>
        </section>
        
        {/* Recent Rounds */}
        <section className="card overflow-hidden">
          <div className="bg-sand-50 px-6 py-4 flex items-center justify-between border-b border-sand-100">
            <h2 className="font-display text-lg font-semibold text-sand-900">Recent Rounds</h2>
            <button className="text-sm text-fairway-600 font-medium hover:underline">
              View All
            </button>
          </div>
          <div className="divide-y divide-sand-100">
            {mockStats.recentRounds.slice(0, 5).map((round) => (
              <div key={round.date} className="flex items-center gap-4 p-4 hover:bg-sand-50 transition-colors cursor-pointer">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-lg ${
                  round.score - round.par <= 0 ? 'bg-birdie/20 text-birdie' :
                  round.score - round.par <= 10 ? 'bg-bogey/20 text-bogey' :
                  'bg-double/20 text-double'
                }`}>
                  {round.score}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sand-900">{round.course}</p>
                  <p className="text-sm text-sand-500 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(round.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className={`text-lg font-bold ${
                  round.score - round.par <= 0 ? 'text-birdie' : 'text-bogey'
                }`}>
                  {round.score - round.par > 0 ? '+' : ''}{round.score - round.par}
                </div>
                <ChevronRight className="w-5 h-5 text-sand-300" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
