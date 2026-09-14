import React from "react";
import { Megaphone } from "lucide-react";
import { AgentStoreConfig } from "../../../types";

interface StorePreviewChipProps {
  store: AgentStoreConfig;
}

export const StorePreviewChip: React.FC<StorePreviewChipProps> = ({ store }) => {
  const initials = store.storeName
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");

  return (
    <div
      className="store-preview rounded-2xl overflow-hidden"
      style={{
        background: store.themeColor,
        padding: "12px",
        marginBottom: "16px",
      }}
    >
      {/* Top bar decoration */}
      <div className="flex gap-1 mb-2">
        <span className="w-2 h-2 rounded-full bg-white/40" />
        <span className="w-2 h-2 rounded-full bg-white/40" />
        <span className="w-2 h-2 rounded-full bg-white/40" />
      </div>

      {/* Announcement banner */}
      {store.announcement && (
        <div
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/20 text-white text-[10px] font-medium mb-2"
        >
          <Megaphone className="w-3 h-3" />
          <span className="line-clamp-1">{store.announcement}</span>
        </div>
      )}

      {/* Store body */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg overflow-hidden"
          style={{
            color: store.themeColor,
            background: store.storeLogo ? "hsl(var(--background))" : undefined,
          }}
        >
          {store.storeLogo ? (
            <img
              src={store.storeLogo}
              alt="logo"
              className="w-full h-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        {/* Name and tagline */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm truncate">{store.storeName}</div>
          <div className="text-white/80 text-[10px] truncate">{store.tagline}</div>
        </div>
      </div>
    </div>
  );
};
