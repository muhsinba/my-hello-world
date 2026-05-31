"use client";

import { useState } from "react";
import { FiX } from "react-icons/fi";
import { MdGolfCourse } from "react-icons/md";
import GolfAssistant, { type GolfAssistantDict } from "./golf-assistant";

export default function GolfChatWidget({
  lang,
  dict,
}: {
  lang: string;
  dict: GolfAssistantDict;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="golf-widget">
      {open && (
        <div className="golf-widget-panel" role="dialog" aria-label={dict.title}>
          <GolfAssistant lang={lang} dict={dict} />
        </div>
      )}

      <button
        type="button"
        className="golf-widget-fab"
        aria-label={open ? "Close chat" : "Open chat"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <FiX size={26} /> : <MdGolfCourse size={30} />}
      </button>
    </div>
  );
}
