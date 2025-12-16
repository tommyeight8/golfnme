"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Search,
  ChevronRight,
  Flag,
  Plus,
  ArrowLeft,
  Cloud,
  Sun,
  CloudRain,
  Wind,
  Loader2,
} from "lucide-react";
import type { Course } from "@/types";

const weatherOptions = [
  { id: "sunny", label: "Sunny", icon: Sun },
  { id: "cloudy", label: "Cloudy", icon: Cloud },
  { id: "rainy", label: "Rainy", icon: CloudRain },
  { id: "windy", label: "Windy", icon: Wind },
];

// API functions
const fetchCourses = async (search: string): Promise<Course[]> => {
  const response = await fetch(
    `/api/courses?search=${encodeURIComponent(search)}`
  );
  const data = await response.json();
  if (!data.success) throw new Error(data.error || "Failed to fetch courses");
  return data.data;
};

const createCourse = async (courseData: {
  name: string;
  city: string;
  state: string;
  par: number;
  numHoles: number;
  slope?: number;
  rating?: number;
}): Promise<Course> => {
  const response = await fetch("/api/courses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(courseData),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || "Failed to create course");
  return data.data;
};

const createRound = async (roundData: {
  courseId: string;
  weather: string;
  notes: string;
}) => {
  const response = await fetch("/api/rounds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(roundData),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || "Failed to create round");
  return data.data;
};

export default function NewRoundPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Form state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [weather, setWeather] = useState("sunny");
  const [notes, setNotes] = useState("");

  // Modal state
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: "",
    city: "",
    state: "",
    par: 72,
    numHoles: 18,
    slope: "",
    rating: "",
  });

  // Debounce search
  useState(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timeoutId);
  });

  // Fetch courses query
  const {
    data: courses = [],
    isLoading: isLoadingCourses,
    error: coursesError,
  } = useQuery({
    queryKey: ["courses", debouncedSearch],
    queryFn: () => fetchCourses(debouncedSearch),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create course mutation
  const addCourseMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: (course) => {
      // Invalidate courses cache so list refreshes
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      // Select the newly created course
      setSelectedCourse(course);
      // Close modal and reset form
      setShowAddCourse(false);
      setNewCourse({
        name: "",
        city: "",
        state: "",
        par: 72,
        numHoles: 18,
        slope: "",
        rating: "",
      });
    },
  });

  // Create round mutation
  const createRoundMutation = useMutation({
    mutationFn: createRound,
    onSuccess: (round) => {
      router.push(`/round/${round.id}`);
    },
  });

  const handleAddCourse = () => {
    if (!newCourse.name || !newCourse.city || !newCourse.state) return;

    addCourseMutation.mutate({
      name: newCourse.name,
      city: newCourse.city,
      state: newCourse.state,
      par: newCourse.par,
      numHoles: newCourse.numHoles,
      slope: newCourse.slope ? parseInt(newCourse.slope) : undefined,
      rating: newCourse.rating ? parseFloat(newCourse.rating) : undefined,
    });
  };

  const handleStartRound = () => {
    if (!selectedCourse) return;
    createRoundMutation.mutate({
      courseId: selectedCourse.id,
      weather,
      notes,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                // Inline debounce
                setTimeout(() => setDebouncedSearch(e.target.value), 300);
              }}
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
            ) : coursesError ? (
              <div className="text-center py-8">
                <p className="text-red-500">Failed to load courses</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-8">
                <Flag className="w-12 h-12 text-sand-300 mx-auto mb-2" />
                <p className="text-sand-500">No courses found</p>
                <p className="text-sand-400 text-sm">
                  Try a different search or add a new course
                </p>
              </div>
            ) : (
              courses.map((course) => (
                <motion.button
                  key={course.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCourse(course)}
                  className={`w-full card p-4 text-left transition-all ${
                    selectedCourse?.id === course.id
                      ? "ring-2 ring-fairway-500 bg-fairway-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        selectedCourse?.id === course.id
                          ? "bg-fairway-500 text-white"
                          : "bg-fairway-100 text-fairway-600"
                      }`}
                    >
                      <Flag className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sand-900">{course.name}</p>
                      <div className="flex items-center gap-2 text-sm text-sand-500">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {course.city}, {course.state}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-medium text-sand-700">
                        Par {course.par}
                      </p>
                      {course.slope && (
                        <p className="text-xs text-sand-500">
                          Slope: {course.slope}
                        </p>
                      )}
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 transition-colors ${
                        selectedCourse?.id === course.id
                          ? "text-fairway-500"
                          : "text-sand-300"
                      }`}
                    />
                  </div>
                </motion.button>
              ))
            )}
          </div>

          {/* Add Custom Course */}
          <button
            onClick={() => setShowAddCourse(true)}
            className="w-full mt-3 card p-4 text-left hover:bg-slate-50 transition-colors border-2 border-dashed border-sand-200"
          >
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
                    ? "ring-2 ring-fairway-500 bg-fairway-50"
                    : "hover:bg-slate-50"
                }`}
              >
                <option.icon
                  className={`w-8 h-8 mx-auto mb-2 ${
                    weather === option.id ? "text-fairway-500" : "text-sand-400"
                  }`}
                />
                <p
                  className={`text-sm font-medium ${
                    weather === option.id ? "text-fairway-700" : "text-sand-600"
                  }`}
                >
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
            <h3 className="font-display text-lg font-semibold mb-4">
              Round Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/60 text-sm">Course</p>
                <p className="font-medium">{selectedCourse.name}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Location</p>
                <p className="font-medium">
                  {selectedCourse.city}, {selectedCourse.state}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Par</p>
                <p className="font-display text-2xl font-bold">
                  {selectedCourse.par}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Holes</p>
                <p className="font-display text-2xl font-bold">
                  {selectedCourse.numHoles}
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {/* Error display */}
        {createRoundMutation.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {createRoundMutation.error.message}
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={handleStartRound}
          disabled={!selectedCourse || createRoundMutation.isPending}
          className="btn btn-gold w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createRoundMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
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

      {/* Add Course Modal */}
      {showAddCourse && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowAddCourse(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl z-50 max-w-md mx-auto p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-xl font-bold text-sand-900">
              Add New Course
            </h3>

            {addCourseMutation.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {addCourseMutation.error.message}
              </div>
            )}

            <input
              type="text"
              placeholder="Course Name *"
              value={newCourse.name}
              onChange={(e) =>
                setNewCourse({ ...newCourse, name: e.target.value })
              }
              className="input"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="City *"
                value={newCourse.city}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, city: e.target.value })
                }
                className="input"
              />
              <input
                type="text"
                placeholder="State *"
                value={newCourse.state}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, state: e.target.value })
                }
                className="input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-sand-600 mb-1 block">Par</label>
                <input
                  type="number"
                  value={newCourse.par}
                  onChange={(e) =>
                    setNewCourse({
                      ...newCourse,
                      par: parseInt(e.target.value) || 72,
                    })
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="text-sm text-sand-600 mb-1 block">
                  Holes
                </label>
                <select
                  value={newCourse.numHoles}
                  onChange={(e) =>
                    setNewCourse({
                      ...newCourse,
                      numHoles: parseInt(e.target.value),
                    })
                  }
                  className="input"
                >
                  <option value={9}>9 Holes</option>
                  <option value={18}>18 Holes</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Slope (optional)"
                value={newCourse.slope}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, slope: e.target.value })
                }
                className="input"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Rating (optional)"
                value={newCourse.rating}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, rating: e.target.value })
                }
                className="input"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowAddCourse(false);
                  addCourseMutation.reset();
                }}
                className="btn btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCourse}
                disabled={
                  !newCourse.name ||
                  !newCourse.city ||
                  !newCourse.state ||
                  addCourseMutation.isPending
                }
                className="btn btn-primary flex-1 disabled:opacity-50"
              >
                {addCourseMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </span>
                ) : (
                  "Add Course"
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
