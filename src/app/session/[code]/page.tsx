"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Flag,
  Crown,
  Trophy,
  Play,
  MessageCircle,
  Send,
  X,
  Copy,
  Check,
  ChevronRight,
  Minus,
  Plus,
  Zap,
} from "lucide-react";
import { useAuthStore } from "@/stores";
import {
  formatScoreToPar,
  getScoreColor,
  getScoreRelativeToPar,
} from "@/lib/golf-utils";
import type { Course, Hole } from "@/types";

// ---- Types matching your API responses ----

type SessionStatus = "WAITING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

interface ApiUser {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
}

interface ApiMember {
  id: string;
  sessionId: string;
  userId: string;
  isReady: boolean;
  joinedAt: string | Date;
  user: ApiUser;
}

interface ApiSession {
  id: string;
  hostId: string;
  inviteCode: string;
  status: SessionStatus;
  maxPlayers: number;
  course: Course & { holes?: Hole[] };
  host: ApiUser;
  members: ApiMember[];
}

interface LeaderboardEntry {
  userId: string;
  userName: string;
  currentHole: number;
  totalScore: number;
  scoreToPar: number;
  lastUpdate: Date;
  scores: number[]; // 18 scores
}

interface ChatMessage {
  userId: string;
  userName: string;
  text: string;
}

export default function ActiveSessionPage() {
  const router = useRouter();
  const params = useParams();
  const inviteCode = params.code as string;

  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<ApiSession | null>(null);

  const [status, setStatus] = useState<"lobby" | "playing">("lobby");
  const [isConnected, setIsConnected] = useState(false);

  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [myScores, setMyScores] = useState<number[]>(Array(18).fill(0));

  const [currentHole, setCurrentHole] = useState(1);
  const [strokes, setStrokes] = useState(4);
  const [isSaving, setIsSaving] = useState(false);

  const [copied, setCopied] = useState(false);

  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const [readyLoading, setReadyLoading] = useState(false);
  const [startLoading, setStartLoading] = useState(false);

  const course: (Course & { holes?: Hole[] }) | null =
    sessionData?.course ?? null;
  const holes: Hole[] =
    course?.holes && course.holes.length > 0
      ? course.holes
      : Array.from({ length: 18 }, (_, i) => ({
          id: `hole-${i + 1}`,
          courseId: course?.id ?? "unknown",
          holeNumber: i + 1,
          par: 4,
          yardage: 350,
          handicapRank: i + 1,
        }));

  const hole = holes[currentHole - 1];

  const currentUserId = user?.id;
  const isHost = !!(
    sessionData &&
    currentUserId &&
    sessionData.hostId === currentUserId
  );

  console.log("USER:", user);

  const myMember = sessionData?.members.find((m) => m.userId === currentUserId);
  const isMeReady = !!myMember?.isReady;

  // --- Helpers ---

  function buildPlayersFromSession(session: ApiSession): LeaderboardEntry[] {
    const scoresEmpty = Array(18).fill(0);
    const now = new Date();

    const allUsers: ApiUser[] = [
      session.host,
      ...session.members
        .map((m) => m.user)
        .filter((u) => u.id !== session.host.id),
    ];

    return allUsers.map((u) => ({
      userId: u.id,
      userName: u.name || u.username,
      currentHole: 1,
      totalScore: 0,
      scoreToPar: 0,
      lastUpdate: now,
      scores: [...scoresEmpty],
    }));
  }

  function userIsInSession(
    session: ApiSession,
    uId: string | undefined | null
  ): boolean {
    if (!uId) return false;
    if (session.hostId === uId) return true;
    return session.members.some((m) => m.userId === uId);
  }

  async function fetchSession() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/sessions?inviteCode=${inviteCode}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to load session");
        setSessionData(null);
        setPlayers([]);
        return;
      }

      const session: ApiSession = data.data;
      setSessionData(session);
      setPlayers((prev) => {
        // If we already have players with scores, keep them; otherwise initialize
        if (!prev || prev.length === 0) {
          return buildPlayersFromSession(session);
        }
        return prev;
      });

      setStatus(session.status === "WAITING" ? "lobby" : "playing");
      setIsConnected(true);
    } catch (err) {
      console.error("Error fetching session:", err);
      setError("Failed to load session");
    } finally {
      setLoading(false);
    }
  }

  async function ensureJoined(session: ApiSession) {
    if (!currentUserId) return;

    if (userIsInSession(session, currentUserId)) return;

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });
      const data = await res.json();

      if (
        !res.ok &&
        data.error &&
        !/Already in this session/i.test(data.error)
      ) {
        setError(data.error);
        return;
      }

      // Refresh session data after joining
      await fetchSession();
    } catch (err) {
      console.error("Error joining session:", err);
      setError("Failed to join session.");
    }
  }

  // --- Effects ---

  useEffect(() => {
    fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteCode]);

  useEffect(() => {
    if (sessionData && currentUserId) {
      ensureJoined(sessionData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData?.id, currentUserId]);

  // Keep strokes in sync with existing score or par
  useEffect(() => {
    if (!hole) return;
    setStrokes(myScores[currentHole - 1] || hole.par || 4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentHole, hole?.par]);

  // --- Actions ---

  const handleCopyCode = () => {
    if (!sessionData?.inviteCode) return;
    navigator.clipboard.writeText(sessionData.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = async () => {
    if (!sessionData) return;
    if (!currentUserId) {
      setError("You must be logged in to ready up.");
      return;
    }

    setReadyLoading(true);
    setError(null);

    try {
      const action = isMeReady ? "unready" : "ready";

      const res = await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionData.id,
          action,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to update ready status");
      } else {
        // Re-fetch session to get updated member ready flags
        await fetchSession();
      }
    } catch (err) {
      console.error("Error updating ready status:", err);
      setError("Failed to update ready status.");
    } finally {
      setReadyLoading(false);
    }
  };

  const handleStartSession = async () => {
    if (!sessionData || !isHost) return;

    setStartLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionData.id,
          action: "start",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to start session");
        return;
      }

      const updated: ApiSession = data.data;
      setSessionData(updated);
      setStatus("playing");
    } catch (err) {
      console.error("Error starting session:", err);
      setError("Failed to start session.");
    } finally {
      setStartLoading(false);
    }
  };

  const handleSaveScore = async () => {
    if (!hole) return;
    setIsSaving(true);

    // Update local scores
    const newScores = [...myScores];
    newScores[currentHole - 1] = strokes;
    setMyScores(newScores);

    // Update leaderboard local state
    const updatedPlayers = [...players].map((p) => {
      if (p.userId === currentUserId) {
        const newTotal = newScores.reduce((a, b) => a + (b || 0), 0);
        const playedHoles = newScores.filter((s) => s > 0).length;
        const parThrough = holes
          .slice(0, playedHoles)
          .reduce((a, h) => a + h.par, 0);

        return {
          ...p,
          scores: newScores,
          totalScore: newTotal,
          scoreToPar: parThrough ? newTotal - parThrough : 0,
          currentHole,
          lastUpdate: new Date(),
        };
      }
      return p;
    });

    // Sort by scoreToPar
    updatedPlayers.sort((a, b) => {
      if (a.totalScore === 0 && b.totalScore === 0) return 0;
      if (a.totalScore === 0) return 1;
      if (b.totalScore === 0) return -1;
      return a.scoreToPar - b.scoreToPar;
    });

    setPlayers(updatedPlayers);

    // (Optional) Here you could POST score updates to your backend or socket

    await new Promise((r) => setTimeout(r, 250));
    setIsSaving(false);

    // Auto-advance hole
    if (currentHole < 18) {
      setCurrentHole((h) => h + 1);
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      userId: currentUserId || "anon",
      userName: user?.name || user?.username || "You",
      text: chatInput.trim(),
    };
    setChatMessages((prev) => [...prev, msg]);
    setChatInput("");
    // You can also send this via socket here
  };

  // --- Derived totals for you (optional display) ---
  const myTotalScore = myScores.reduce((a, b) => a + (b || 0), 0);
  const playedHoles = myScores.filter((s) => s > 0).length;
  const courseParThrough = holes
    .slice(0, playedHoles)
    .reduce((a, h) => a + h.par, 0);
  const myScoreToPar = courseParThrough ? myTotalScore - courseParThrough : 0;

  // --- Render ---

  if (loading && !sessionData) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-gold-200 border-t-gold-500 rounded-full"
        />
      </div>
    );
  }

  if (error && !sessionData) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center">
        <div className="card p-8 text-center max-w-md">
          <p className="text-sand-800 font-semibold mb-2">Session Error</p>
          <p className="text-sand-600 mb-4">{error}</p>
          <button onClick={() => router.push("/")} className="btn btn-primary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50 flex flex-col">
      {/* Header */}
      <header className="bg-gold-gradient text-fairway-900 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <button
              onClick={() => router.push("/")}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <p className="font-medium text-sm">
                {course?.name || "Golf Session"}
              </p>
              <div className="flex items-center justify-center gap-2 text-fairway-700/70 text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-birdie" : "bg-sand-400"
                  }`}
                />
                <span>{players.length} players</span>
              </div>
            </div>

            <button
              onClick={() => setShowChat((s) => !s)}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors relative"
            >
              <MessageCircle className="w-5 h-5" />
              {chatMessages.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {chatMessages.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Top-level inline errors */}
        {error && (
          <div className="card p-3 text-sm text-red-700 bg-red-50 border border-red-200">
            {error}
          </div>
        )}

        {/* Lobby View */}
        {status === "lobby" && sessionData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Invite Code */}
            <div className="card p-6 text-center">
              <p className="text-sm text-sand-500 mb-2">Invite Code</p>
              <p className="font-mono text-3xl font-bold text-fairway-600 tracking-wider mb-4">
                {sessionData.inviteCode}
              </p>
              <button onClick={handleCopyCode} className="btn btn-outline">
                {copied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
                {copied ? "Copied!" : "Copy Code"}
              </button>
            </div>

            {/* Players List */}
            <div className="card overflow-hidden">
              <div className="bg-sand-50 px-4 py-3 flex items-center justify-between border-b border-sand-100">
                <h3 className="font-medium text-sand-900">Players</h3>
                <span className="text-sm text-sand-500">
                  {sessionData.members.length + 1} / {sessionData.maxPlayers}
                </span>
              </div>
              <div className="divide-y divide-sand-100">
                {/* Host */}
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-gold-100 text-gold-600 flex items-center justify-center">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sand-900">
                      {sessionData.host.name || sessionData.host.username}
                    </p>
                    <p className="text-sm text-sand-500">Host</p>
                  </div>
                  {sessionData.hostId === currentUserId && (
                    <span className="px-2 py-1 bg-fairway-100 text-fairway-700 text-xs font-medium rounded-full">
                      You
                    </span>
                  )}
                </div>

                {sessionData.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-full bg-fairway-100 text-fairway-600 flex items-center justify-center">
                      {m.user.name?.[0] || m.user.username[0] || "?"}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sand-900">
                        {m.user.name || m.user.username}
                      </p>
                      <p className="text-sm text-sand-500">
                        {m.isReady ? "Ready" : "Not Ready"}
                      </p>
                    </div>
                    {m.userId === currentUserId && (
                      <span className="px-2 py-1 bg-fairway-100 text-fairway-700 text-xs font-medium rounded-full">
                        You
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Ready Button */}
            <button
              onClick={handleToggleReady}
              className="btn btn-outline w-full"
              disabled={readyLoading}
            >
              {readyLoading ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-5 h-5 border-2 border-sand-300 border-t-sand-700 rounded-full"
                  />
                  Updating...
                </span>
              ) : isMeReady ? (
                <>
                  <Flag className="w-5 h-5" />
                  I’m Not Ready
                </>
              ) : (
                <>
                  <Flag className="w-5 h-5" />
                  I’m Ready
                </>
              )}
            </button>

            {/* Start Button (Host Only) */}
            {isHost && (
              <button
                onClick={handleStartSession}
                className="btn btn-gold w-full py-4 text-lg"
                disabled={startLoading}
              >
                {startLoading ? (
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
                    Starting...
                  </span>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start Round
                  </>
                )}
              </button>
            )}
          </motion.div>
        )}

        {/* Playing View */}
        {status === "playing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Live Leaderboard */}
            <div className="card overflow-hidden">
              <div className="bg-gold-gradient px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-fairway-700" />
                  <h3 className="font-display font-semibold text-fairway-900">
                    Leaderboard
                  </h3>
                </div>
                <span className="text-sm text-fairway-700/70">Live</span>
              </div>
              <div className="divide-y divide-sand-100">
                {players.map((player, index) => (
                  <motion.div
                    key={player.userId}
                    layout
                    className={`flex items-center gap-4 p-4 ${
                      player.userId === currentUserId ? "bg-fairway-50" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0
                          ? "bg-gold-500 text-white"
                          : index === 1
                          ? "bg-sand-300 text-sand-700"
                          : index === 2
                          ? "bg-amber-600 text-white"
                          : "bg-sand-100 text-sand-500"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sand-900 truncate">
                        {player.userName}
                        {player.userId === currentUserId && (
                          <span className="ml-2 text-xs text-fairway-600">
                            (You)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-sand-500">
                        Thru {player.scores.filter((s) => s > 0).length}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-xl font-display font-bold ${
                          player.totalScore === 0
                            ? "text-sand-300"
                            : player.scoreToPar <= 0
                            ? "text-birdie"
                            : "text-bogey"
                        }`}
                      >
                        {player.totalScore > 0
                          ? formatScoreToPar(player.scoreToPar)
                          : "—"}
                      </p>
                      <p className="text-sm text-sand-500">
                        {player.totalScore || "—"}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Score Entry Card */}
            <div className="card overflow-hidden">
              <div className="bg-fairway-gradient text-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setCurrentHole((h) => (h > 1 ? h - 1 : h))}
                    disabled={currentHole === 1}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                  <div className="text-center">
                    <p className="text-white/60 text-sm">Hole</p>
                    <p className="text-4xl font-display font-bold">
                      {currentHole}
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentHole((h) => (h < 18 ? h + 1 : h))}
                    disabled={currentHole === 18}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-white/60 text-xs">Par</p>
                    <p className="text-2xl font-bold">{hole?.par}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Yards</p>
                    <p className="text-2xl font-bold">{hole?.yardage}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Score Input */}
                <div className="flex items-center justify-center gap-6 mb-6">
                  <button
                    onClick={() => setStrokes((s) => Math.max(1, s - 1))}
                    className="w-12 h-12 rounded-full bg-sand-100 hover:bg-sand-200 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-5 h-5 text-sand-600" />
                  </button>

                  <motion.div
                    key={strokes}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-display font-bold ${getScoreColor(
                      getScoreRelativeToPar(strokes, hole?.par || 4)
                    )}`}
                  >
                    {strokes}
                  </motion.div>

                  <button
                    onClick={() => setStrokes((s) => Math.min(15, s + 1))}
                    className="w-12 h-12 rounded-full bg-sand-100 hover:bg-sand-200 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-5 h-5 text-sand-600" />
                  </button>
                </div>

                {/* Quick buttons */}
                <div className="grid grid-cols-5 gap-2 mb-6">
                  {[
                    hole?.par - 2,
                    hole?.par - 1,
                    hole?.par,
                    hole?.par + 1,
                    hole?.par + 2,
                  ]
                    .filter((s) => !!s && s > 0)
                    .map((score) => (
                      <button
                        key={score}
                        onClick={() => setStrokes(score!)}
                        className={`py-3 rounded-xl font-medium transition-all ${
                          strokes === score
                            ? "bg-fairway-500 text-white"
                            : "bg-sand-100 text-sand-600 hover:bg-sand-200"
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                </div>

                <button
                  onClick={handleSaveScore}
                  disabled={isSaving}
                  className="btn btn-primary w-full"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Saving...
                    </span>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Save & Continue
                    </>
                  )}
                </button>

                {/* Optional: show your total */}
                <div className="mt-4 text-center text-sm text-sand-600">
                  Through {playedHoles || 0} holes:{" "}
                  <span className="font-mono font-semibold">
                    {myTotalScore || "-"} (
                    {playedHoles ? formatScoreToPar(myScoreToPar) : "E"})
                  </span>
                </div>
              </div>
            </div>

            {/* Hole Progress */}
            <div className="flex gap-1 overflow-x-auto pb-2">
              {holes.map((h, i) => {
                const score = myScores[i];
                const relative = score
                  ? getScoreRelativeToPar(score, h.par)
                  : null;

                return (
                  <button
                    key={h.id}
                    onClick={() => setCurrentHole(i + 1)}
                    className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      currentHole === i + 1
                        ? "ring-2 ring-fairway-500 ring-offset-2"
                        : ""
                    } ${
                      score
                        ? getScoreColor(relative!)
                        : "bg-sand-100 text-sand-400"
                    }`}
                  >
                    {score || i + 1}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </main>

      {/* Chat Drawer */}
      <AnimatePresence>
        {showChat && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChat(false)}
              className="fixed inset-0 bg-black/50 z-30"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-40 max-h-[70vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-sand-100">
                <h3 className="font-display font-semibold text-sand-900">
                  Group Chat
                </h3>
                <button onClick={() => setShowChat(false)}>
                  <X className="w-5 h-5 text-sand-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <p className="text-center text-sand-400 py-8">
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        msg.userId === currentUserId
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                          msg.userId === currentUserId
                            ? "bg-fairway-500 text-white"
                            : "bg-sand-100 text-sand-900"
                        }`}
                      >
                        <p className="text-xs opacity-70 mb-1">
                          {msg.userName}
                        </p>
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-sand-100 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  placeholder="Type a message..."
                  className="input flex-1"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim()}
                  className="btn btn-primary px-4 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
