import { useState, useCallback } from "react";
import { Bell, BellRing, Clock, Send, Inbox } from "lucide-react";

type SpamEntry = {
  id: number;
  at: Date;
};

export default function SpamPage() {
  const [entries, setEntries] = useState<SpamEntry[]>([]);
  const [spamming, setSpamming] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [partnerSpams] = useState<number>(0);

  const handleSpam = useCallback(() => {
    if (cooldown || spamming) return;
    setSpamming(true);
    setTimeout(() => {
      setEntries((prev) => [{ id: Date.now(), at: new Date() }, ...prev]);
      setSpamming(false);
      setCooldown(true);
      setTimeout(() => setCooldown(false), 3000);
    }, 600);
  }, [cooldown, spamming]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] font-nunito p-6 lg:p-10">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        {/* Header */}
        <div>
          <h1 className="font-fredoka text-2xl font-extrabold text-[#d1101b]">
            Spam
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Send a playful ring to your partner&apos;s phone
          </p>
        </div>

        {/* Main spam button */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-center gap-5">
          <button
            onClick={handleSpam}
            disabled={spamming || cooldown}
            className={`
              w-28 h-28 rounded-[2rem] flex items-center justify-center
              transition-all duration-300 cursor-pointer active:scale-90
              ${spamming
                ? "bg-[#d1101b] scale-90 animate-pulse"
                : cooldown
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-br from-[#d1101b] to-[#9a2a52] hover:scale-105 hover:shadow-xl shadow-lg"
              }
            `}
          >
            {spamming ? (
              <BellRing size={40} className="text-white" />
            ) : (
              <Bell size={40} className="text-white" />
            )}
          </button>

          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">
              {spamming
                ? "Ringing..."
                : cooldown
                  ? "On cooldown"
                  : "Tap to spam"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {cooldown
                ? "Wait a moment before spamming again"
                : "Your partner&apos;s phone will ring 5 times"}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Send size={14} className="text-red-400" />
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Sent
              </p>
            </div>
            <p className="font-fredoka text-2xl font-bold text-gray-800">
              {entries.length}
            </p>
          </div>
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Inbox size={14} className="text-red-400" />
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Received
              </p>
            </div>
            <p className="font-fredoka text-2xl font-bold text-gray-800">
              {partnerSpams}
            </p>
          </div>
        </div>

        {/* Recent spams */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} className="text-red-400" />
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Recent
            </p>
          </div>
          {entries.length === 0 ? (
            <p className="text-sm text-gray-300 text-center py-6">
              No spams yet. Give your partner a nudge!
            </p>
          ) : (
            <div className="space-y-2">
              {entries.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <Bell size={14} className="text-red-400 shrink-0" />
                  <p className="text-sm font-medium text-gray-700 flex-1">
                    You spammed your partner
                  </p>
                  <span className="text-[10px] text-gray-400">just now</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
