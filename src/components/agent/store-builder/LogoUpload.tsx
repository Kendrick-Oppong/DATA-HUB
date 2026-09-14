import React, { useRef } from "react";
import { Image, X } from "lucide-react";
import { AgentStoreConfig } from "../../../types";

interface LogoUploadProps {
  store: AgentStoreConfig;
  updateStore: (updates: Partial<AgentStoreConfig>) => void;
  toast?: (message: string) => void;
}

export const LogoUpload: React.FC<LogoUploadProps> = ({
  store,
  updateStore,
  toast,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 1.5MB)
    if (file.size > 1.5 * 1024 * 1024) {
      toast?.("Logo too large — keep it under 1.5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateStore({ storeLogo: reader.result as string });
      toast?.("Logo updated");
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    updateStore({ storeLogo: null });
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-foreground">Store logo</label>
      <div className="flex items-start gap-3">
        {/* Logo thumbnail */}
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: store.storeLogo
              ? "hsl(var(--background))"
              : store.themeColor,
          }}
        >
          {store.storeLogo ? (
            <img
              src={store.storeLogo}
              alt="logo"
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <Image className="w-6 h-6 text-white" />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              className="px-3 py-2 rounded-lg border border-border bg-card text-xs font-bold hover:bg-muted transition-colors cursor-pointer"
            >
              <Image className="w-4 h-4 inline mr-1" />
              {store.storeLogo ? "Replace" : "Upload logo"}
            </button>
            {store.storeLogo && (
              <button
                onClick={handleRemove}
                className="px-3 py-2 rounded-lg border border-border bg-card text-xs font-bold hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 inline mr-1" />
                Remove
              </button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Square PNG or JPG, under 1.5MB. Falls back to your initials.
          </p>
        </div>

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFilePick}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
};
