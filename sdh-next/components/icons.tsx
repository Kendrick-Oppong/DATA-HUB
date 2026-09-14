"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";

/* Smart Data Hub — platform icons (stroke-based, geometric) */
const Icon = ({ d, size = 22, sw = 1.9, fill = "none", stroke = "currentColor", children, vb = 24, style }) =>
<svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill={fill} stroke={stroke}
strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {d ? <path d={d} style={{ stroke: "rgb(255, 255, 255)" }} /> : children}
  </svg>;


const I = {
  home: (p) => <Icon {...p} d="M3 10.4 12 3l9 7.4M5.5 9.2V20a1 1 0 0 0 1 1H10v-5.5h4V21h3.5a1 1 0 0 0 1-1V9.2" />,
  grid: (p) => <Icon {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="1.8" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.8" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.8" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.8" /></Icon>,
  bolt: (p) => <Icon {...p} d="M13 2 4.5 13.2h6L11 22l8.5-11.2h-6L13 2Z" />,
  wallet: (p) => <Icon {...p}><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a1 1 0 0 1 1 1v1.5" /><path d="M3 7.5V18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2.5M21 9.5v3.5h-4a1.75 1.75 0 0 1 0-3.5h4Z" /></Icon>,
  user: (p) => <Icon {...p}><circle cx="12" cy="8" r="3.6" /><path d="M5 20c.7-3.6 3.5-5.5 7-5.5S18.3 16.4 19 20" /></Icon>,
  signal: (p) => <Icon {...p}><path d="M4.5 13a10.6 10.6 0 0 1 15 0M7.7 16a6.1 6.1 0 0 1 8.6 0" /><circle cx="12" cy="19.2" r="1.4" fill="currentColor" stroke="none" /></Icon>,
  phone: (p) => <Icon {...p}><rect x="7" y="2.5" width="10" height="19" rx="2.4" /><path d="M10.5 18.5h3" /></Icon>,
  clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 2" /></Icon>,
  tag: (p) => <Icon {...p}><path d="M3.5 12.6 11 5.1a2 2 0 0 1 1.4-.6H19a1.5 1.5 0 0 1 1.5 1.5v6.6a2 2 0 0 1-.6 1.4l-7.5 7.5a1.6 1.6 0 0 1-2.3 0l-6.6-6.6a1.6 1.6 0 0 1 0-2.3Z" /><circle cx="16" cy="8" r="1.3" fill="currentColor" stroke="none" /></Icon>,
  shield: (p) => <Icon {...p}><path d="M12 3 5 5.7v5.1c0 4.4 2.9 8 7 9.2 4.1-1.2 7-4.8 7-9.2V5.7L12 3Z" /><path d="M9 11.6l2.1 2.1L15 9.8" /></Icon>,
  check: (p) => <Icon {...p} d="M5 12.5 10 17.5 19.5 7" />,
  checkc: (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M8 12.2l2.6 2.6L16 9.4" /></Icon>,
  arrow: (p) => <Icon {...p} d="M5 12h14M13 6l6 6-6 6" />,
  chev: (p) => <Icon {...p} d="M9 5l7 7-7 7" />,
  chevd: (p) => <Icon {...p} d="M5 9l7 7 7-7" />,
  back: (p) => <Icon {...p} d="M15 5l-7 7 7 7" />,
  plus: (p) => <Icon {...p} d="M12 5v14M5 12h14" />,
  minus: (p) => <Icon {...p} d="M5 12h14" />,
  x: (p) => <Icon {...p} d="M6 6l12 12M18 6L6 18" />,
  gift: (p) => <Icon {...p}><path d="M4 11h16v8.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5V11Z" /><path d="M3 7.5h18V11H3zM12 7.5V21" /><path d="M12 7.5C12 5 10.5 3.5 8.8 3.5S6 4.6 6 6s1.5 1.5 6 1.5Zm0 0c0-2.5 1.5-4 3.2-4S18 4.6 18 6s-1.5 1.5-6 1.5Z" /></Icon>,
  whatsapp: (p) => <Icon {...p}><path d="M3.5 20.5l1.3-4.2A8 8 0 1 1 8 19.2L3.5 20.5Z" /><path d="M9 9c-.3 2 1 4 3.2 5.2.8.4 1.5.3 1.8-.4.2-.5 0-.8-.4-1.1l-1-.6c-.3-.2-.6-.1-.8.1l-.3.4c-.9-.5-1.6-1.2-2-2l.4-.4c.2-.2.2-.5.1-.8L10 8c-.3-.6-.8-.7-1-.2Z" fill="currentColor" stroke="none" /></Icon>,
  mail: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M4 7l8 5.5L20 7" /></Icon>,
  pin: (p) => <Icon {...p}><path d="M12 21c4-4.2 6-7.4 6-10a6 6 0 1 0-12 0c0 2.6 2 5.8 6 10Z" /><circle cx="12" cy="11" r="2.2" /></Icon>,
  menu: (p) => <Icon {...p} d="M4 7h16M4 12h16M4 17h16" />,
  bell: (p) => <Icon {...p}><path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z" /><path d="M10 19.5a2 2 0 0 0 4 0" /></Icon>,
  refresh: (p) => <Icon {...p}><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v3.5h-3.5" /></Icon>,
  star: (p) => <Icon {...p} fill="currentColor" stroke="none" d="M12 3.5l2.5 5.1 5.6.8-4 4 1 5.6L12 16.4 6.9 19l1-5.6-4-4 5.6-.8L12 3.5Z" />,
  share: (p) => <Icon {...p}><circle cx="6" cy="12" r="2.4" /><circle cx="17" cy="6" r="2.4" /><circle cx="17" cy="18" r="2.4" /><path d="M8.2 11 15 7.2M8.2 13 15 16.8" /></Icon>,
  copy: (p) => <Icon {...p}><rect x="8" y="8" width="12" height="12" rx="2.5" /><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" /></Icon>,
  lock: (p) => <Icon {...p}><rect x="5" y="11" width="14" height="9" rx="2.2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Icon>,
  send: (p) => <Icon {...p} d="M21 3 10.5 13.5M21 3l-6.5 18-4-8-8-4L21 3Z" />,
  users: (p) => <Icon {...p}><circle cx="9" cy="8" r="3" /><path d="M3 19c.6-3 2.8-4.6 6-4.6S14.4 16 15 19" /><path d="M16 5.2A3 3 0 0 1 16 11M21 19c-.4-2.2-1.6-3.6-3.6-4.2" /></Icon>,
  chart: (p) => <Icon {...p}><path d="M4 20V4M4 20h16M8 16v-3M12 16V8M16 16v-6" /></Icon>,
  trend: (p) => <Icon {...p}><path d="M3 16l5-5 4 4 8-8" /><path d="M16 7h4v4" /></Icon>,
  coins: (p) => <Icon {...p}><ellipse cx="9" cy="7" rx="6" ry="3" /><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7" /><path d="M9 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" /></Icon>,
  download: (p) => <Icon {...p}><path d="M12 3v12M7.5 10.5 12 15l4.5-4.5" /><path d="M4 20h16" /></Icon>,
  cart: (p) => <Icon {...p}><path d="M3 4h2.4l2.1 11.2a1.4 1.4 0 0 0 1.4 1.1h7.8a1.4 1.4 0 0 0 1.4-1.1L20 7H6.2" /><circle cx="9.5" cy="20" r="1.5" fill="currentColor" stroke="none" /><circle cx="17" cy="20" r="1.5" fill="currentColor" stroke="none" /></Icon>,
  eye: (p) => <Icon {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3.2" /></Icon>,
  eyeoff: (p) => <Icon {...p}><path d="M4 4l16 16M9.5 9.6A3.2 3.2 0 0 0 12 15.2c.9 0 1.7-.36 2.3-.95M6.3 6.5C3.9 8 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.6 0 3-.45 4.2-1.1M9.8 5.8A8.6 8.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5s-.8 1.5-2.3 3" /></Icon>,
  sliders: (p) => <Icon {...p}><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="15.5" cy="7" r="2.3" /><circle cx="8.5" cy="17" r="2.3" /></Icon>,
  cog: (p) => <Icon {...p}><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" /></Icon>,
  brief: (p) => <Icon {...p}><rect x="3" y="7" width="18" height="13" rx="2.4" /><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7M3 12h18" /></Icon>,
  list: (p) => <Icon {...p}><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r="1.1" fill="currentColor" stroke="none" /><circle cx="4" cy="12" r="1.1" fill="currentColor" stroke="none" /><circle cx="4" cy="18" r="1.1" fill="currentColor" stroke="none" /></Icon>,
  logout: (p) => <Icon {...p}><path d="M14 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" /><path d="M10 12h11M18 9l3 3-3 3" /></Icon>,
  search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Icon>,
  receipt: (p) => <Icon {...p}><path d="M5 3.5h14v17l-2.3-1.5-2.4 1.5-2.3-1.5-2.4 1.5L7 19.5 4.7 21 5 3.5Z" /><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" /></Icon>,
  info: (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.6h.01" /></Icon>,
  fund: (p) => <Icon {...p}><rect x="3" y="6" width="18" height="12" rx="2.4" /><circle cx="12" cy="12" r="2.6" /><path d="M7 12h.01M17 12h.01" /></Icon>,
  key: (p) => <Icon {...p}><circle cx="8" cy="8" r="4" /><path d="M11 11l8 8M16 16l2-2M14.5 18.5l2-2" /></Icon>,
  ticket: (p) => <Icon {...p}><path d="M4 7.5C4 6.7 4.7 6 5.5 6h13c.8 0 1.5.7 1.5 1.5V10a2 2 0 0 0 0 4v2.5c0 .8-.7 1.5-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4V7.5Z" /><path d="M14 6v12" strokeDasharray="2 2" /></Icon>,
  doc: (p) => <Icon {...p}><path d="M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v4h4M8 12h8M8 16h5" /></Icon>,
  flag: (p) => <Icon {...p}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></Icon>,
  sparkle: (p) => <Icon {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /></Icon>,
  idcard: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2.4" /><circle cx="8.5" cy="11" r="2.1" /><path d="M5.5 16c.5-1.6 1.7-2.4 3-2.4s2.5.8 3 2.4M14 9.5h4M14 13h3" /></Icon>,
  play: (p) => <Icon {...p}><path d="M8 5.5v13l11-6.5-11-6.5Z" /></Icon>,
  plug: (p) => <Icon {...p}><path d="M9 2.5v5M15 2.5v5M6.5 7.5h11v2.5a5.5 5.5 0 0 1-11 0V7.5ZM12 15.5V21" /></Icon>,
  sun: (p) => <Icon {...p}><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7" /></Icon>,
  moon: (p) => <Icon {...p} d="M20 13.5A8 8 0 1 1 10.5 4a6.5 6.5 0 0 0 9.5 9.5Z" />,
  link: (p) => <Icon {...p}><path d="M9.5 14.5l5-5M8 11l-2 2a3.5 3.5 0 0 0 5 5l2-2M16 13l2-2a3.5 3.5 0 0 0-5-5l-2 2" /></Icon>,
  image: (p) => <Icon {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="2.4" /><circle cx="8.5" cy="9.5" r="1.7" /><path d="M5 17l4.5-4.5 3 3L16 12l3.5 3.5" /></Icon>,
  megaphone: (p) => <Icon {...p}><path d="M3 11v2a1.5 1.5 0 0 0 1.5 1.5H6l9 4.5V6L6 10.5H4.5A1.5 1.5 0 0 0 3 12" /><path d="M18 9a3.5 3.5 0 0 1 0 6M7 15v3.5a1.5 1.5 0 0 0 3 0V15" /></Icon>,
  facebook: (p) => <Icon {...p}><path d="M14 8.5h2.5V5H14a3.5 3.5 0 0 0-3.5 3.5V11H8v3.5h2.5V21H14v-6.5h2.5L17 11h-3V8.8c0-.2.1-.3.4-.3Z" fill="currentColor" stroke="none" /></Icon>,
  instagram: (p) => <Icon {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" /><circle cx="12" cy="12" r="4" /><circle cx="16.8" cy="7.2" r="1.1" fill="currentColor" stroke="none" /></Icon>,
  tiktok: (p) => <Icon {...p}><path d="M14 4c.4 2.4 2 4 4.5 4.3V11c-1.7 0-3.2-.5-4.5-1.4v5.4a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1v2.8a2.7 2.7 0 1 0 1.9 2.6V4H14Z" fill="currentColor" stroke="none" /></Icon>
};
const Ic = ({ name, ...p }) => {const C = I[name];return C ? <C {...p} /> : null;};

export { I, Ic, Icon };
