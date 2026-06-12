import { RefreshCw, ChevronRight } from "lucide-react";
const MOODS = [
  { emoji: "😊", label: "Happy" },
  { emoji: "🥰", label: "In Love" },
  { emoji: "😢", label: "Sad" },
  { emoji: "😠", label: "Angry" },
  { emoji: "🍜", label: "Hungry" },
  { emoji: "😰", label: "Anxious" },
  { emoji: "💭", label: "Miss You" },
  { emoji: "😑", label: "Bad Mood" },
];

const INTENSITIES = ["Slightly", "Moderately", "A Lot", "Intensely"];

export default function MoodPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] font-nunito p-6 lg:p-10">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        {/* Header */}
        <div>
          <h1 className="font-fredoka text-2xl font-extrabold text-[#d1101b]">
            How are you feeling?
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Let your partner know your current mood
          </p>
        </div>

        {/* Current mood card */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl shrink-0">
            --
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-fredoka font-bold text-lg text-gray-300">--</p>
            <p className="text-xs text-gray-400 mt-0.5">
              No mood set · visible to your partner
            </p>
          </div>
          <button className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:border-red-200 hover:text-red-500 transition-colors shrink-0">
            <RefreshCw size={15} />
          </button>
        </div>

        {/* Mood grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MOODS.map(({ emoji, label }) => (
            <button
              key={label}
              className="bg-white rounded-2xl py-5 flex flex-col items-center gap-2 border border-gray-100 shadow-sm hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <span className="text-3xl">{emoji}</span>
              <span className="text-xs font-semibold text-gray-600">
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* Intensity */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-[#d1101b]">Intensity</p>
            <span className="px-3 py-1 rounded-xl bg-gray-100 border border-gray-200 text-xs font-bold text-gray-400">
              --
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {INTENSITIES.map((level) => (
              <button
                key={level}
                className="h-2 rounded-full bg-gray-100 hover:bg-red-300 transition-colors"
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {INTENSITIES.map((level) => (
              <span key={level} className="text-[10px] text-gray-400">
                {level}
              </span>
            ))}
          </div>
        </div>

        {/* Partner mood */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center text-xl shrink-0 text-gray-300 font-fredoka font-bold">
            --
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#d1101b]">
              Partner is feeling <span className="text-gray-300">--</span>
            </p>
            <p className="text-xs text-gray-300 mt-0.5">Updated --</p>
          </div>
          <ChevronRight size={16} className="text-gray-300 shrink-0" />
        </div>
      </div>
    </div>
  );
}
