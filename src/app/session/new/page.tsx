"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  MapPin,
  Search,
  Flag,
  ChevronRight,
  Copy,
  Share2,
  Check,
  Crown,
  AlertCircle,
} from "lucide-react";
import type { Course } from "@/types";

type SessionStatus = "WAITING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

type CreatedSession = {
  id: string;
  inviteCode: string;
  status: SessionStatus;
  maxPlayers: number;
  name?: string | null;
  course: Course;
};

export default function NewSessionPage() {
  const router = useRouter();
  const [step, setStep] = useState<"course" | "settings" | "share">("course");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [sessionName, setSessionName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);

  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  // Real: store session object
  const [createdSession, setCreatedSession] = useState<CreatedSession | null>(
    null
  );

  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchCourses = async () => {
      setIsLoadingCourses(true);
      setCoursesError(null);

      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set("search", searchQuery.trim());
        params.set("limit", "50");

        const res = await fetch(`/api/courses?${params.toString()}`, {
          signal: controller.signal,
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load courses");
        }

        setCourses(data.data);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setCoursesError(err.message);
        }
      } finally {
        setIsLoadingCourses(false);
      }
    };

    const timeout = setTimeout(fetchCourses, 300); // debounce

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [searchQuery]);

  const displayedCourses = courses;

  // const filteredCourses = useMemo(() => {
  //   const q = searchQuery.toLowerCase().trim();
  //   if (!q) return mockCourses;
  //   return mockCourses.filter((course) =>
  //     course.name.toLowerCase().includes(q)
  //   );
  // }, [searchQuery]);

  const inviteCode = createdSession?.inviteCode ?? "";

  const handleCreateSession = async () => {
    if (!selectedCourse) return;

    setIsCreating(true);
    setError("");

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          name: sessionName || `Round at ${selectedCourse.name}`,
          maxPlayers,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // your API uses { error: string | zodErrors }
        const message =
          typeof data.error === "string"
            ? data.error
            : "Failed to create session";
        setError(message);
        return;
      }

      setCreatedSession(data.data);
      setStep("share");
    } catch (e) {
      console.error("Failed to create session:", e);
      setError("Failed to create session. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!inviteCode) return;
    const shareUrl = `${window.location.origin}/session/join?code=${inviteCode}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Join my golf round!",
          text: sessionName || "Join me for a round of golf",
          url: shareUrl,
        });
      } else {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // ignore share cancel
    }
  };

  const handleStartSession = () => {
    if (!inviteCode) return;
    router.push(`/session/${inviteCode}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gold-gradient text-fairway-900">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setError("");
                if (step === "course") router.back();
                else if (step === "settings") setStep("course");
                else if (step === "share") setStep("settings");
              }}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold">Group Compete</h1>
              <p className="text-fairway-700/70 text-sm">
                Create a new session
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-6">
            {["course", "settings", "share"].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    step === s
                      ? "bg-fairway-700 text-white"
                      : ["settings", "share"].indexOf(step) >= i
                      ? "bg-fairway-700/50 text-white"
                      : "bg-white/30 text-fairway-700"
                  }`}
                >
                  {["settings", "share"].indexOf(step) > i ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 2 && (
                  <div
                    className={`w-8 h-0.5 mx-1 ${
                      ["settings", "share"].indexOf(step) > i
                        ? "bg-fairway-700"
                        : "bg-white/30"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="card p-3 mb-6 bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {step === "course" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h2 className="font-display text-lg font-semibold text-sand-900">
              Select Course
            </h2>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sand-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-12"
              />
            </div>
            <div className="space-y-3">
              {isLoadingCourses && (
                <div className="card p-6 text-center text-sand-500">
                  Loading courses…
                </div>
              )}

              {!isLoadingCourses && coursesError && (
                <div className="card p-6 text-center text-red-600">
                  {coursesError}
                </div>
              )}

              {!isLoadingCourses && !coursesError && courses.length === 0 && (
                <div className="card p-6 text-center text-sand-500">
                  No courses found
                </div>
              )}

              {!isLoadingCourses &&
                courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className={`w-full card p-4 text-left transition-all ${
                      selectedCourse?.id === course.id
                        ? "ring-2 ring-gold-500 bg-gold-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          selectedCourse?.id === course.id
                            ? "bg-gold-500 text-white"
                            : "bg-gold-100 text-gold-600"
                        }`}
                      >
                        <Flag className="w-6 h-6" />
                      </div>

                      <div className="flex-1">
                        <p className="font-medium text-sand-900">
                          {course.name}
                        </p>
                        <p className="text-sm text-sand-500 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {course.city ?? "—"}
                          {course.state ? `, ${course.state}` : ""}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-mono text-sm font-medium text-sand-700">
                          Par {course.par}
                        </p>
                      </div>

                      <ChevronRight
                        className={`w-5 h-5 ${
                          selectedCourse?.id === course.id
                            ? "text-gold-500"
                            : "text-sand-300"
                        }`}
                      />
                    </div>
                  </button>
                ))}
            </div>

            <button
              onClick={() => {
                setError("");
                setStep("settings");
              }}
              disabled={!selectedCourse}
              className="btn btn-gold w-full disabled:opacity-50"
            >
              Continue
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {step === "settings" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h2 className="font-display text-lg font-semibold text-sand-900">
              Session Settings
            </h2>

            {selectedCourse && (
              <div className="card p-4 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gold-100 text-gold-600 flex items-center justify-center">
                    <Flag className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sand-900">
                      {selectedCourse.name}
                    </p>
                    <p className="text-sm text-sand-500">
                      Par {selectedCourse.par}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-sand-700 mb-2">
                Session Name (Optional)
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Sunday Round with the Boys"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sand-700 mb-2">
                Maximum Players
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[2, 3, 4, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => setMaxPlayers(num)}
                    className={`card p-4 text-center transition-all ${
                      maxPlayers === num
                        ? "ring-2 ring-gold-500 bg-gold-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <Users
                      className={`w-6 h-6 mx-auto mb-1 ${
                        maxPlayers === num ? "text-gold-600" : "text-sand-400"
                      }`}
                    />
                    <p
                      className={`font-medium ${
                        maxPlayers === num ? "text-gold-700" : "text-sand-600"
                      }`}
                    >
                      {num}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateSession}
              disabled={isCreating}
              className="btn btn-gold w-full"
            >
              {isCreating ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-5 h-5 border-2 border-fairway-900/30 border-t-fairway-900 rounded-full"
                  />
                  Creating Session...
                </span>
              ) : (
                <>
                  Create Session
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </motion.div>
        )}

        {step === "share" && createdSession && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-gold-100 mx-auto mb-4 flex items-center justify-center">
                <Crown className="w-10 h-10 text-gold-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-sand-900">
                Session Created!
              </h2>
              <p className="text-sand-600 mt-2">
                Share the invite code with your friends
              </p>
            </div>

            <div className="card p-6 text-center">
              <p className="text-sm text-sand-500 mb-2">Invite Code</p>
              <p className="font-mono text-4xl font-bold text-fairway-600 tracking-wider">
                {createdSession.inviteCode}
              </p>
              <button
                onClick={handleCopyCode}
                className="mt-4 btn btn-outline w-full"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 text-birdie" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy Code
                  </>
                )}
              </button>
            </div>

            <button onClick={handleShare} className="btn btn-outline w-full">
              <Share2 className="w-5 h-5" />
              Share Invite Link
            </button>

            <div className="card p-4 bg-slate-50">
              <h3 className="font-medium text-sand-900 mb-2">
                Session Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-sand-500">Course</span>
                  <span className="text-sand-700">
                    {createdSession.course.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sand-500">Max Players</span>
                  <span className="text-sand-700">
                    {createdSession.maxPlayers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sand-500">Status</span>
                  <span className="text-gold-600 font-medium">
                    Waiting for players
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartSession}
              className="btn btn-gold w-full py-4 text-lg"
            >
              <Users className="w-5 h-5" />
              Go to Lobby
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
