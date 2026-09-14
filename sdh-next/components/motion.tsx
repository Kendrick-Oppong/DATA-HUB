"use client";
/* eslint-disable */
// @ts-nocheck
// Ported from platform/motion.js — global motion layer (page-enter cascade +
// scroll-reveal). Runs once after mount; renders nothing. Cleans up on unmount.
import { useEffect } from "react";

function MotionLayer() {
  useEffect(() => {
    "use strict";
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    var timers = [];
    var listeners = [];
    var mo = null;

    /* ---------- scroll-reveal ---------- */
    function checkReveal() {
      var vh = window.innerHeight, trigger = vh * 0.92;
      var nodes = document.querySelectorAll(".sdh-rv:not(.sdh-in)");
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].getBoundingClientRect().top < trigger) nodes[i].classList.add("sdh-in");
      }
    }
    var rvScheduled = false;
    function onScroll() {
      if (rvScheduled) return;
      rvScheduled = true;
      requestAnimationFrame(function () { rvScheduled = false; checkReveal(); });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    listeners.push(["scroll", onScroll], ["resize", onScroll]);
    timers.push(setInterval(checkReveal, 140));

    var REVEAL = [
      ".sec-head", ".feat", ".how", ".tcard", ".tier", ".stat",
      ".strip .item", ".reband", ".sf-card", ".sf-afa-card", ".co-item",
      ".util-card", ".footer .foot-col", ".footer .foot-brand",
      ".an-hero", ".price-net-row", ".store-preview"
    ].join(",");

    function revealify(scope) {
      var nodes = (scope || document).querySelectorAll(REVEAL);
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (n.dataset.sdhRv) continue;
        n.dataset.sdhRv = "1";
        n.classList.add("sdh-rv");
        var sibs = n.parentElement ? n.parentElement.children : [n];
        var idx = 0, seen = 0;
        for (var s = 0; s < sibs.length; s++) {
          if (sibs[s] === n) { idx = seen; break; }
          if (sibs[s].classList && sibs[s].classList.contains("sdh-rv")) seen++;
          else if (sibs[s].matches && sibs[s].matches(REVEAL)) seen++;
        }
        n.style.setProperty("--rv-d", Math.min(idx, 6) * 65 + "ms");
      }
      checkReveal();
    }

    /* ---------- app route-change cascade ---------- */
    var lastRouteKey = "";
    function cascade(content) {
      var kids = content.children, i;
      for (i = 0; i < kids.length; i++) {
        kids[i].style.setProperty("--pg-i", i);
      }
      content.classList.remove("pg-cascade");
      void content.offsetWidth;
      content.classList.add("pg-cascade");

      var topbar = document.querySelector(".topbar");
      if (topbar) {
        topbar.classList.remove("pg-cascade");
        void topbar.offsetWidth;
        topbar.classList.add("pg-cascade");
      }
    }

    function indexStorefront(scope) {
      var grids = (scope || document).querySelectorAll(".sf-grid");
      grids.forEach(function (g) {
        var c = g.children;
        for (var i = 0; i < c.length; i++) c[i].style.setProperty("--pg-i", i % 8);
      });
    }

    /* ---------- driver ---------- */
    function tick() {
      var content = document.querySelector(".content");
      if (content) {
        var titleEl = document.querySelector(".topbar .mtitle");
        var key = (titleEl ? titleEl.textContent : "") + "|" + content.children.length;
        if (key !== lastRouteKey) {
          lastRouteKey = key;
          cascade(content);
        }
      } else {
        lastRouteKey = "";
      }
      revealify(document);
      indexStorefront(document);
      checkReveal();
    }

    timers.push(setInterval(tick, 120));

    var root = document.getElementById("root") || document.body;
    var scheduled = false;
    mo = new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      setTimeout(function () { scheduled = false; tick(); }, 0);
    });
    if (root) mo.observe(root, { childList: true, subtree: true });

    if (document.readyState !== "loading") tick();
    else document.addEventListener("DOMContentLoaded", tick);
    [60, 180, 400, 900].forEach(function (t) { timers.push(setTimeout(tick, t)); });

    return function cleanup() {
      timers.forEach(function (t) { clearInterval(t); clearTimeout(t); });
      listeners.forEach(function (l) { window.removeEventListener(l[0], l[1]); });
      if (mo) mo.disconnect();
    };
  }, []);

  return null;
}

export { MotionLayer };
