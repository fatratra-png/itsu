import {
  Flame,
  Link2,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Edit3,
  Zap,
  Heart,
} from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] font-nunito p-6 lg:p-10">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Profile card ── */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start gap-5">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center font-fredoka font-bold text-2xl text-white shrink-0"
              style={{
                background: "linear-gradient(135deg, #f5c6b0 0%, #c9855a 100%)",
              }}
            >
              --
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="font-fredoka text-xl font-bold text-gray-900">
                    --
                  </h1>
                  <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1">
                    <MapPin size={12} /> --
                  </p>
                </div>
                <button className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:border-red-200 hover:text-red-500 transition-colors">
                  <Edit3 size={15} />
                </button>
              </div>

              <div className="flex gap-2 mt-3">
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 border border-red-100 text-xs font-bold text-red-600">
                  <Flame size={12} /> -- day streak
                </span>
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-semibold text-gray-500">
                  <Calendar size={12} /> since --
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
            {[
              { icon: Mail, label: "Email", value: "--" },
              { icon: Phone, label: "Phone", value: "--" },
              { icon: Calendar, label: "Birthday", value: "--" },
              { icon: MapPin, label: "City", value: "--" },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100"
              >
                <Icon size={14} className="text-red-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                    {label}
                  </p>
                  <p className="text-sm font-semibold text-gray-400 truncate">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-5">
          {/* Echo Code */}
          <div
            className="relative overflow-hidden rounded-3xl p-5"
            style={{
              background: "linear-gradient(135deg, #d1101b 0%, #9a2a52 100%)",
            }}
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full border border-white/10" />
            <div className="absolute -right-2 -top-2 w-14 h-14 rounded-full border border-white/10" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <Link2 size={13} className="text-white/70" />
                <p className="text-white/70 text-[11px] font-semibold uppercase tracking-wider">
                  Echo Code
                </p>
              </div>
              <p className="text-white/70 text-xs mb-4">
                Share your code with your partner
              </p>
              <div className="bg-white/10 rounded-2xl px-4 py-3 border border-white/20">
                <p className="text-white/40 font-fredoka text-xl tracking-widest font-semibold">
                  -- -- --
                </p>
              </div>
            </div>
          </div>

          {/* Partner card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Partner
                </p>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-50">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  <span className="text-[11px] text-gray-400 font-bold">
                    offline
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                  <span className="text-gray-300 font-fredoka font-bold text-base">
                    --
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-400">--</p>
                  <p className="text-xs text-gray-300 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> --
                  </p>
                </div>
                <span className="text-xl opacity-30">?</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px bg-gray-100">
              <div className="bg-white py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Flame size={13} className="text-gray-300" />
                  <p className="font-fredoka font-bold text-lg text-gray-300">
                    --
                  </p>
                </div>
                <p className="text-[10px] text-gray-300">days together</p>
              </div>
              <div className="bg-white py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Heart size={13} className="text-gray-300" />
                  <p className="font-fredoka font-bold text-lg text-gray-300">
                    --
                  </p>
                </div>
                <p className="text-[10px] text-gray-300">streak</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Activity
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Flame, label: "Streak", value: "--", accent: true },
                { icon: Zap, label: "Total", value: "--", accent: false },
                { icon: Heart, label: "Mutual", value: "--", accent: false },
                {
                  icon: Calendar,
                  label: "This month",
                  value: "--",
                  accent: false,
                },
              ].map(({ icon: Icon, label, value, accent }) => (
                <div
                  key={label}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${accent ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}
                >
                  <Icon
                    size={13}
                    className={accent ? "text-red-300" : "text-gray-300"}
                  />
                  <div>
                    <p className="text-[10px] text-gray-400 leading-none">
                      {label}
                    </p>
                    <p className="text-sm font-bold leading-tight text-gray-300">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
