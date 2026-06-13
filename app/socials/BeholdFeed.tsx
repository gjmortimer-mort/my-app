"use client";

import { createElement, useEffect } from "react";

/**
 * Renders Behold's <behold-widget> web component and loads its module script
 * once. createElement avoids JSX typing issues for the custom element, and the
 * widget pulls @morts.bar's latest posts itself (auto-updating).
 */
export default function BeholdFeed({ feedId }: { feedId: string }) {
  useEffect(() => {
    const id = "behold-widget-js";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id;
      s.type = "module";
      s.src = "https://w.behold.so/widget.js";
      document.head.appendChild(s);
    }
  }, []);

  return createElement("behold-widget", { "feed-id": feedId });
}
