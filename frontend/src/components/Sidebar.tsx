// ===== SIDEBAR COMPONENT =====
// Previously broken because:
//   1. Component was named "Sibebar" (typo — missing 'd')
//   2. Imported from logo.js (which only stored a string path, not a real image)
//   3. Rendered "ITSU_LOGO" as literal text instead of using the imported value
//   4. Only rendered a horizontal bar (h-14), not an actual sidebar
//
// Fix: import logo.png directly (Vite resolves image imports to URLs),
//      fixed component name, and built a proper sidebar layout.

import ITSU_LOGO from "../assets/logo.png";

export default function Sidebar() {
  return (
    <div className="h-screen w-64 background-primary text-white flex flex-col shadow-lg">
      {/* Logo section: displays the imported PNG as an image */}
      <div className="flex items-center justify-center h-20 border-b border-white/20">
        <img
          src={ITSU_LOGO}
          alt="Itsu logo"
          className="h-12 w-auto object-contain"
        />
      </div>

      {/* Navigation items (placeholder for future routes) */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <a
          href="#"
          className="block px-4 py-2 rounded hover:bg-white/10 transition-colors"
        >
          Dashboard
        </a>
        <a
          href="#"
          className="block px-4 py-2 rounded hover:bg-white/10 transition-colors"
        >
          Projects
        </a>
        <a
          href="#"
          className="block px-4 py-2 rounded hover:bg-white/10 transition-colors"
        >
          Settings
        </a>
      </nav>

      {/* Footer section */}
      <div className="px-6 py-4 border-t border-white/20 text-sm text-white/60">
        Itsu v1.0
      </div>
    </div>
  );
}
