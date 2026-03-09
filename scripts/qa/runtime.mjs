import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import {
  LOCALE_STORAGE_KEY,
  QA_ARTIFACT_ROOT,
  findLocaleSentinelViolations,
  isAllowedConsoleError,
} from "./inventory.mjs";

export const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
export const HEADLESS = process.env.HEADLESS ? process.env.HEADLESS !== "false" : true;
const CHROME_PATH =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export function nowSlug() {
  const value = new Date();
  const pad = (part) => String(part).padStart(2, "0");
  return `${value.getFullYear()}${pad(value.getMonth() + 1)}${pad(value.getDate())}_${pad(
    value.getHours(),
  )}${pad(value.getMinutes())}${pad(value.getSeconds())}`;
}

export function slugForRoute(route) {
  return route === "/"
    ? "home"
    : route
      .replace(/^\//, "")
      .replace(/\//g, "__")
      .replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function createOutputDir(prefix) {
  return ensureDir(path.join(QA_ARTIFACT_ROOT, `${prefix}_${nowSlug()}`));
}

export function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

export async function launchBrowser() {
  const executablePath = fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined;
  return chromium.launch({
    headless: HEADLESS,
    executablePath,
  });
}

export async function createLocaleContext(browser, { viewport, locale }) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
  });

  await context.addInitScript(
    ({ locale: initialLocale, storageKey }) => {
      try {
        window.localStorage.setItem(storageKey, initialLocale);
      } catch {
        // Ignore localStorage failures in the harness.
      }
      const applyLang = () => {
        document.documentElement?.setAttribute("lang", initialLocale);
      };

      if (document.documentElement) {
        applyLang();
      } else {
        window.addEventListener("DOMContentLoaded", applyLang, { once: true });
      }
    },
    { locale, storageKey: LOCALE_STORAGE_KEY },
  );

  return context;
}

export function buildUrl(route) {
  return new URL(route, BASE_URL).toString();
}

function dedupe(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value)))];
}

function summarizeBodyText(text) {
  return String(text || "").replace(/\s+/g, " ").trim().slice(0, 220);
}

function collectResponsiveMetrics() {
  const documentRoot = document.documentElement;
  const horizontalOverflow = documentRoot.scrollWidth - window.innerWidth > 1;

  const allInteractive = [
    ...document.querySelectorAll("button, a, input, select, textarea, [role='button']"),
  ];
  const visibleInteractive = allInteractive.filter((element) => {
    const rect = element.getBoundingClientRect();
    const styles = getComputedStyle(element);
    const className = typeof element.className === "string" ? element.className : "";
    const isSrOnly = className.includes("sr-only");
    const clipped =
      styles.clip === "rect(0px, 0px, 0px, 0px)" ||
      styles.clipPath.includes("inset(50%)") ||
      styles.clipPath.includes("inset(100%)");
    const fullyTransparent = Number.parseFloat(styles.opacity || "1") === 0;
    const ariaHidden = element.getAttribute("aria-hidden") === "true";

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      styles.visibility !== "hidden" &&
      styles.display !== "none" &&
      !isSrOnly &&
      !clipped &&
      !fullyTransparent &&
      !ariaHidden
    );
  });

  const tapViolations = visibleInteractive
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName.toLowerCase(),
        text: (element.textContent || "").trim().slice(0, 48),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    })
    .filter((entry) => entry.width < 44 || entry.height < 44);

  const grids = [...document.querySelectorAll("*")].filter((element) => {
    const styles = getComputedStyle(element);
    if (styles.display !== "grid") return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 280 && element.children.length > 1;
  });

  const multiColGridOnMobile =
    window.innerWidth < 768
      ? grids.some((element) => {
        const templateColumns = getComputedStyle(element).gridTemplateColumns;
        if (!templateColumns || templateColumns === "none") return false;
        const columns = templateColumns.split(" ").filter(Boolean).length;
        return columns > 1;
      })
      : false;

  const paragraphs = [...document.querySelectorAll("p")].slice(0, 160);
  const lineHeightRatios = paragraphs
    .map((paragraph) => {
      const styles = getComputedStyle(paragraph);
      const fontSize = parseFloat(styles.fontSize || "0");
      if (!fontSize) return 0;
      const lineHeight = styles.lineHeight;
      if (lineHeight === "normal") return 1.2;
      if (lineHeight.endsWith("px")) return parseFloat(lineHeight) / fontSize;
      const numericValue = parseFloat(lineHeight);
      return Number.isFinite(numericValue) ? numericValue : 1.2;
    })
    .filter((ratio) => ratio > 0);

  const bodyText = document.body?.innerText || "";

  return {
    horizontalOverflow,
    tapViolationsCount: tapViolations.length,
    tapViolationsTop: tapViolations.slice(0, 10),
    multiColGridOnMobile,
    minLineHeightRatio: lineHeightRatios.length ? Math.min(...lineHeightRatios) : null,
    hasConnectingConnecting: bodyText.includes("ConnectingConnecting"),
    hasBadHashrateFallback: bodyText.includes("986,972 EH/s") || bodyText.includes("986972 EH/s"),
  };
}

export async function inspectRoute(page, { route, locale, waitMs = 1200 }) {
  const consoleErrors = [];
  const pageErrors = [];

  const onConsole = (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  };

  const onPageError = (error) => {
    pageErrors.push(String(error));
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  try {
    const response = await page.goto(buildUrl(route), {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    });
    await page.waitForTimeout(waitMs);

    const bodyText = await page.locator("body").innerText().catch(() => "");
    const filteredConsoleErrors = dedupe(consoleErrors).filter(
      (entry) => !isAllowedConsoleError({ route, text: entry }),
    );
    const finalUrl = new URL(page.url());
    const finalPath = `${finalUrl.pathname}${finalUrl.search}`;
    const hasCrashBanner = bodyText.includes("Application error: a client-side exception has occurred");
    const sentinelViolations = findLocaleSentinelViolations({ route, locale, text: bodyText });

    return {
      route,
      locale,
      status: response?.status() ?? 0,
      finalUrl: finalPath,
      hasCrashBanner,
      consoleErrors: filteredConsoleErrors,
      pageErrors: dedupe(pageErrors),
      sentinelViolations,
      bodyExcerpt: summarizeBodyText(bodyText),
    };
  } catch (error) {
    return {
      route,
      locale,
      status: 0,
      finalUrl: safeCurrentPath(page),
      hasCrashBanner: false,
      consoleErrors: dedupe(consoleErrors).filter((entry) => !isAllowedConsoleError({ route, text: entry })),
      pageErrors: [...dedupe(pageErrors), error instanceof Error ? error.message : String(error)],
      sentinelViolations: [],
      bodyExcerpt: "",
    };
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }
}

function safeCurrentPath(page) {
  try {
    const currentUrl = new URL(page.url());
    return `${currentUrl.pathname}${currentUrl.search}`;
  } catch {
    return "";
  }
}

export function isRouteHealthy(result) {
  return (
    result.status > 0 &&
    result.status < 400 &&
    !result.hasCrashBanner &&
    result.consoleErrors.length === 0 &&
    result.pageErrors.length === 0 &&
    result.sentinelViolations.length === 0
  );
}

export async function inspectResponsiveRoute(page, { route, locale, waitMs = 1400 }) {
  const base = await inspectRoute(page, { route, locale, waitMs });
  const metrics =
    base.status > 0 && base.pageErrors.length === 0
      ? await page.evaluate(collectResponsiveMetrics)
      : {
        horizontalOverflow: false,
        tapViolationsCount: 0,
        tapViolationsTop: [],
        multiColGridOnMobile: false,
        minLineHeightRatio: null,
        hasConnectingConnecting: false,
        hasBadHashrateFallback: false,
      };

  const issues = [];

  if (base.status >= 400 || base.status === 0) {
    issues.push({ severity: "error", code: "http", message: `Unexpected status ${base.status}` });
  }
  if (base.hasCrashBanner) {
    issues.push({ severity: "error", code: "crash-banner", message: "Client crash banner rendered." });
  }
  if (base.consoleErrors.length > 0) {
    issues.push({ severity: "error", code: "console", message: base.consoleErrors[0] });
  }
  if (base.pageErrors.length > 0) {
    issues.push({ severity: "error", code: "pageerror", message: base.pageErrors[0] });
  }
  if (base.sentinelViolations.length > 0) {
    issues.push({
      severity: "error",
      code: "locale-sentinel",
      message: base.sentinelViolations[0].description,
    });
  }
  if (metrics.horizontalOverflow) {
    issues.push({ severity: "error", code: "overflow", message: "Horizontal overflow detected." });
  }
  if (metrics.multiColGridOnMobile) {
    issues.push({
      severity: "warning",
      code: "mobile-grid",
      message: "Multi-column grid detected on mobile viewport.",
    });
  }
  if (metrics.minLineHeightRatio !== null && metrics.minLineHeightRatio < 1.25) {
    issues.push({
      severity: "error",
      code: "line-height",
      message: `Minimum paragraph line-height ratio too low (${metrics.minLineHeightRatio.toFixed(2)}).`,
    });
  }
  if (
    metrics.minLineHeightRatio !== null &&
    metrics.minLineHeightRatio >= 1.25 &&
    metrics.minLineHeightRatio < 1.5
  ) {
    issues.push({
      severity: "warning",
      code: "line-height",
      message: `Paragraph line-height is compact (${metrics.minLineHeightRatio.toFixed(2)}).`,
    });
  }
  if (metrics.hasConnectingConnecting) {
    issues.push({
      severity: "error",
      code: "duplicate-copy",
      message: "Duplicated Connecting copy detected.",
    });
  }
  if (metrics.hasBadHashrateFallback) {
    issues.push({
      severity: "error",
      code: "bad-fallback-copy",
      message: "Suspicious hardcoded hashrate fallback detected.",
    });
  }
  if (metrics.tapViolationsCount > 0) {
    issues.push({
      severity: "warning",
      code: "tap-target",
      message: `${metrics.tapViolationsCount} interactive elements are below 44px.`,
    });
  }

  return {
    ...base,
    ...metrics,
    issues,
  };
}

export function hasBlockingResponsiveIssue(result) {
  return result.issues.some((issue) => issue.severity === "error");
}

export async function captureScreenshot(page, filePath) {
  ensureDir(path.dirname(filePath));
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}
