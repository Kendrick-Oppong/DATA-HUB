// Ambient declarations for the globals the ported prototype still uses at runtime.
import type * as React from "react";

declare global {
  interface Window {
    SDH: any;
    __SDH_WEB__?: boolean;
    __resources?: { logoMark?: string; [k: string]: any };
    AppRouter?: (page: string, role: string) => React.ComponentType<any>;
  }
  // React is imported per-module, but a few files reference bare `performance`/`matchMedia`
  // which already exist on the DOM lib.
}

export {};
