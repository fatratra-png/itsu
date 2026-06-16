import { useState } from "react";
import {
  Mail,
  Phone,
  Calendar,
  MapPin,
  Edit3,
  Bell,
  Heart,
  Link2,
  Trash2,
  Info,
  ChevronRight,
  Palette,
  LogOut,
} from "lucide-react";

function Toggle({
  enabled,
  onChange,
  label,
  description,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="flex items-center justify-between w-full py-3 group"
    >
      <div className="text-left">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
      <div
        className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${
          enabled ? "bg-[#d1101b]" : "bg-gray-200"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
            enabled ? "left-[22px]" : "left-0.5"
          }`}
        />
      </div>
    </button>
  );
}

const INFO_FIELDS = [
  { icon: Mail, label: "Email", value: "—" },
  { icon: Phone, label: "Phone", value: "—" },
  { icon: Calendar, label: "Birthday", value: "—" },
  { icon: MapPin, label: "City", value: "—" },
];

export default function SettingPage() {
  const [notifications, setNotifications] = useState({
    mood: true,
    chat: true,
    spam: false,
    partner: true,
  });
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f5f7] font-nunito p-6 lg:p-10">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        {/* Header */}
        <div>
          <h1 className="font-fredoka text-2xl font-extrabold text-[#d1101b]">
            Setting
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Configure your preferences and account settings
          </p>
        </div>

        {/* Profile */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-fredoka font-bold text-xl text-white shrink-0"
              style={{
                background: "linear-gradient(135deg, #f5c6b0 0%, #c9855a 100%)",
              }}
            >
              —
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-fredoka text-lg font-bold text-gray-900">
                    —
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Your display name
                  </p>
                </div>
                <button className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:border-red-200 hover:text-red-500 transition-colors shrink-0">
                  <Edit3 size={15} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5">
            {INFO_FIELDS.map(({ icon: Icon, label, value }) => (
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

        {/* Partner */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Heart size={14} className="text-red-400" />
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Partner
            </p>
          </div>

          <div
            className="relative overflow-hidden rounded-2xl p-4 mb-4"
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
              <p className="text-white/70 text-xs mb-3">
                Share this code with your partner to connect
              </p>
              <div className="bg-white/10 rounded-2xl px-4 py-3 border border-white/20">
                <p className="text-white/40 font-fredoka text-xl tracking-widest font-semibold">
                  — — —
                </p>
              </div>
            </div>
          </div>

          <button className="w-full py-2.5 rounded-xl border border-dashed border-gray-200 text-sm text-gray-400 font-semibold hover:border-red-200 hover:text-red-500 transition-colors">
            Unlink partner
          </button>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Bell size={14} className="text-red-400" />
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Notifications
            </p>
          </div>
          <p className="text-xs text-gray-400 mb-2">
            Choose what you get notified about
          </p>
          <div className="divide-y divide-gray-50">
            <Toggle
              enabled={notifications.mood}
              onChange={(v) => setNotifications((p) => ({ ...p, mood: v }))}
              label="Mood updates"
              description="When your partner logs a mood"
            />
            <Toggle
              enabled={notifications.chat}
              onChange={(v) => setNotifications((p) => ({ ...p, chat: v }))}
              label="Chat messages"
              description="New messages from your partner"
            />
            <Toggle
              enabled={notifications.spam}
              onChange={(v) => setNotifications((p) => ({ ...p, spam: v }))}
              label="Spam rings"
              description="When your partner spams you"
            />
            <Toggle
              enabled={notifications.partner}
              onChange={(v) => setNotifications((p) => ({ ...p, partner: v }))}
              label="Partner activity"
              description="When your partner comes online"
            />
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Palette size={14} className="text-red-400" />
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Preferences
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            <Toggle
              enabled={darkMode}
              onChange={setDarkMode}
              label="Dark theme"
              description="Use dark mode throughout the app"
            />
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold text-gray-700">Language</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  App display language
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                English
                <ChevronRight size={14} className="text-gray-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-3xl p-5 border border-red-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 size={14} className="text-red-400" />
            <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">
              Danger Zone
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button className="w-full py-2.5 rounded-xl border border-red-200 text-sm text-red-500 font-semibold hover:bg-red-50 transition-colors">
              <span className="flex items-center justify-center gap-2">
                <LogOut size={14} />
                Sign out
              </span>
            </button>
            <button className="w-full py-2.5 rounded-xl border border-red-200 text-sm text-red-500 font-semibold hover:bg-red-50 transition-colors">
              Delete account
            </button>
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Info size={14} className="text-red-400" />
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              About
            </p>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Version</span>
            <span className="text-sm font-semibold text-gray-800">1.0.0</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-50">
            <span className="text-sm text-gray-600">App name</span>
            <span className="text-sm font-semibold text-gray-800">Itsu</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-50">
            <span className="text-sm text-gray-600">Made with love</span>
            <span className="text-sm text-gray-800">❤️</span>
          </div>
        </div>
      </div>
    </div>
  );
}
