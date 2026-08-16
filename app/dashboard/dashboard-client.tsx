"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";

type DashboardClientProps = {
  profileLink: string;
  resumeLink: string;
  linkedinLink: string;
  portfolioLink: string;
};

export function DashboardClient({ profileLink, resumeLink, linkedinLink, portfolioLink }: DashboardClientProps) {
  const [copyFeedback, setCopyFeedback] = useState("");
  const [copyButtonLabel, setCopyButtonLabel] = useState("Copy Link");

  const copyText = useCallback(async (value: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return false;
    }
  }, []);

  const copyProfileLink = useCallback(async () => {
    const copied = await copyText(profileLink);
    setCopyFeedback(copied ? "Link copied." : "Could not copy link. Please copy it manually.");
    setCopyButtonLabel(copied ? "Copied" : "Copy Link");

    window.setTimeout(() => {
      setCopyFeedback("");
      setCopyButtonLabel("Copy Link");
    }, 1600);
  }, [copyText, profileLink]);

  const copyExample = useCallback(
    async (value: string, event: MouseEvent<HTMLButtonElement>) => {
      const copied = await copyText(value);
      if (!copied) return;

      const button = event.currentTarget;
      const labelEl = button.querySelector(".copy-label");
      button.classList.add("copied");
      if (labelEl) {
        labelEl.textContent = "Copied";
      }

      window.setTimeout(() => {
        button.classList.remove("copied");
        if (labelEl) {
          labelEl.textContent = "Copy";
        }
      }, 1200);
    },
    [copyText]
  );

  useEffect(() => {
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!browserTimezone) return;

    const body = new URLSearchParams({ timezone: browserTimezone }).toString();
    fetch("/api/dashboard/timezone", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      credentials: "same-origin",
    }).catch(() => {
      // Non-blocking sync; email formatter falls back to UTC.
    });
  }, []);

  return (
    <>
      <h2 className="section-title">Your unique profile link</h2>
      <div className="link-box">
        <input readOnly value={profileLink} aria-label="Profile tracking link" />
        <button onClick={copyProfileLink} type="button" className="btn ghost copy-btn">
          {copyButtonLabel}
        </button>
      </div>
      <p className="subtext copy-feedback" aria-live="polite">
        {copyFeedback}
      </p>

      <p className="subtext content">Share this link publicly. You will receive email alerts when activity happens.</p>

      <section className="track-help">
        <h3>Track where views come from</h3>
        <p className="subtext content">
          To know the source of each GitHub view, add a <strong>ref</strong> value to your link.
        </p>
        <ul className="example-list">
          <li>
            <span>Resume:</span>
            <code>{resumeLink}</code>
            <button
              type="button"
              className="icon-copy-btn"
              aria-label="Copy resume link"
              title="Copy"
              onClick={(event) => copyExample(resumeLink, event)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M9 9h10v12H9z"></path>
                <path d="M5 3h10v2H7v10H5z"></path>
              </svg>
              <span className="copy-label">Copy</span>
            </button>
          </li>
          <li>
            <span>LinkedIn:</span>
            <code>{linkedinLink}</code>
            <button
              type="button"
              className="icon-copy-btn"
              aria-label="Copy LinkedIn link"
              title="Copy"
              onClick={(event) => copyExample(linkedinLink, event)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M9 9h10v12H9z"></path>
                <path d="M5 3h10v2H7v10H5z"></path>
              </svg>
              <span className="copy-label">Copy</span>
            </button>
          </li>
          <li>
            <span>Portfolio:</span>
            <code>{portfolioLink}</code>
            <button
              type="button"
              className="icon-copy-btn"
              aria-label="Copy portfolio link"
              title="Copy"
              onClick={(event) => copyExample(portfolioLink, event)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M9 9h10v12H9z"></path>
                <path d="M5 3h10v2H7v10H5z"></path>
              </svg>
              <span className="copy-label">Copy</span>
            </button>
          </li>
        </ul>
      </section>
    </>
  );
}
