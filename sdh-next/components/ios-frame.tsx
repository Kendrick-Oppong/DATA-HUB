"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";

/* Smart Data Hub — iPhone bezel + status bar + dynamic island */
const { useState: useDev, useEffect: useDevE } = React;

function StatusBar(){
  const [time, setTime] = useDev(()=>{
    const d = new Date();
    return d.toLocaleTimeString([], { hour:"numeric", minute:"2-digit" }).replace(/\s?[AP]M/i,"");
  });
  useDevE(()=>{
    const t = setInterval(()=>{
      const d = new Date();
      setTime(d.toLocaleTimeString([], { hour:"numeric", minute:"2-digit" }).replace(/\s?[AP]M/i,""));
    }, 20000);
    return ()=>clearInterval(t);
  },[]);
  return (
    <div className="ios-status">
      <div className="ios-time">{time}</div>
      <div className="ios-status-r">
        {/* signal */}
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
          <rect x="0"  y="8" width="3" height="4"  rx="1" fill="currentColor"/>
          <rect x="5"  y="5.5" width="3" height="6.5" rx="1" fill="currentColor"/>
          <rect x="10" y="3" width="3" height="9"  rx="1" fill="currentColor"/>
          <rect x="15" y="0.5" width="3" height="11.5" rx="1" fill="currentColor"/>
        </svg>
        {/* wifi */}
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
          <path d="M8.5 2.2c2.7 0 5.2 1 7 2.8l-1.5 1.6A7.7 7.7 0 0 0 8.5 4.3 7.7 7.7 0 0 0 3 6.6L1.5 5C3.3 3.2 5.8 2.2 8.5 2.2Z" fill="currentColor"/>
          <path d="M8.5 5.7c1.7 0 3.3.7 4.5 1.8l-1.6 1.7A4 4 0 0 0 8.5 8 4 4 0 0 0 5.6 9.2L4 7.5A6.4 6.4 0 0 1 8.5 5.7Z" fill="currentColor"/>
          <path d="M8.5 9.1c.8 0 1.5.3 2 .9l-2 2-2-2c.5-.6 1.2-.9 2-.9Z" fill="currentColor"/>
        </svg>
        {/* battery */}
        <svg width="26" height="13" viewBox="0 0 26 13" fill="none">
          <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="currentColor" strokeOpacity="0.4"/>
          <rect x="2" y="2" width="17" height="9" rx="2" fill="currentColor"/>
          <path d="M24 4.2v4.6c1-.4 1-4.2 0-4.6Z" fill="currentColor" fillOpacity="0.5"/>
        </svg>
      </div>
    </div>
  );
}

function IOSDevice({ children }){
  return (
    <div className="ios-device">
      <div className="ios-screen">
        <StatusBar />
        <div className="ios-island" />
        {children}
        <div className="ios-home" />
      </div>
    </div>
  );
}

export { IOSDevice, StatusBar };
