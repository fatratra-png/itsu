import { useEffect } from "react";

export default function Alert({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="bg-white rounded-xl px-5 py-4 shadow-xl border border-gray-100 flex items-center gap-3">
      <p className="text-gray-800 font-nunito text-sm flex-1">{message}</p>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
    </div>
  );
}
