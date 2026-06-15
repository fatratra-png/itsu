import { useState } from "react";
import { AlarmClockIcon } from "lucide-react";
export default function SpamPage() {
  const [show, setShow] = useState(false);

  console.log("SpamPage render, show:", show);

  return (
    <div className="min-h-screen bg-[#f5f5f7] font-nunito p-6 lg:p-10">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        <div>
          <h1 className="font-fredoka text-2xl font-extrabold text-[#d1101b]">
            Spam
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Spam you partner whenever he/she tries to ghost you off
          </p>
        </div>
        <button
          onClick={() => {
            console.log("clicked");
            setShow(true);
          }}
          className="bg-[#d1101b] text-white rounded-3xl py-3 px-6 flex items-center gap-2 hover:bg-[#a10c16] transition-colors"
        >
          <AlarmClockIcon className="w-5 h-5" />
          <span>Spam</span>
        </button>
        {show && (
          <div className="bg-white rounded-xl px-5 py-4 shadow-xl border border-gray-100">
            <p className="text-gray-800 font-nunito text-sm">
              Spam sent to your partner!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
