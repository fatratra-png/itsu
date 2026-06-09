import "./index.css";
// ===== ROOT APP =====
// Previously imported "Sibebar" (typo). Fixed to "Sidebar".
// Now uses a flex layout: sidebar on the left, main content area on the right.

import Sidebar from "./components/Sidebar";

export default function App() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-800">Welcome to Itsu</h1>
        <p className="mt-4 text-gray-600">Select a page from the sidebar.</p>
      </main>
    </div>
  );
}
