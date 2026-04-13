import { useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { CardFront } from "@/components/HoldingCardFront";
import type { Tables } from "@/integrations/supabase/types";
import gobLogo from "@/assets/gob-logo.jpg";
import unionLogo from "@/assets/union-logo.jpg";
import bdMap from "@/assets/bd-map-watermark.png";

type HoldingCard = Tables<"holding_cards">;

const BENGALI_FONT_FAMILY = "'SolaimanLipi', sans-serif";

const preloadImages = async () => {
  const srcs = [gobLogo, unionLogo, bdMap];
  await Promise.all(
    srcs.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
        })
    )
  );
};

let solaimanCssPromise: Promise<string> | null = null;
const getSolaimanCss = () => {
  if (!solaimanCssPromise) {
    solaimanCssPromise = import("@/styles/solaimanLipiEmbedded.css?raw").then((m) => m.default);
  }
  return solaimanCssPromise;
};

const ensureFont = async () => {
  const css = await getSolaimanCss();
  const styleId = "solaiman-lipi-embedded-font";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
  }
  await document.fonts.load("400 1em SolaimanLipi");
  await document.fonts.load("700 1em SolaimanLipi");
  await document.fonts.ready;
};

const renderCardToDataUrl = async (holding: HoldingCard): Promise<string> => {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.zIndex = "-1";
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<CardFront holding={holding} forExport />);

  await new Promise((r) => setTimeout(r, 500));

  const cardEl = container.firstElementChild as HTMLElement;
  if (!cardEl) {
    root.unmount();
    container.remove();
    throw new Error("Card element not found");
  }

  try {
    const css = await getSolaimanCss();
    const dataUrl = await toPng(cardEl, {
      pixelRatio: 3,
      cacheBust: true,
      fontEmbedCSS: css,
      style: { fontFamily: BENGALI_FONT_FAMILY, lineHeight: "1.6" },
    });
    return dataUrl;
  } finally {
    root.unmount();
    container.remove();
  }
};

export const useDownloadAllCards = () => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const downloadAll = useCallback(async (holdings: HoldingCard[]) => {
    if (!holdings.length) return;
    setDownloading(true);
    setProgress({ current: 0, total: holdings.length });

    try {
      await ensureFont();
      await preloadImages();

      const zip = new JSZip();

      for (let i = 0; i < holdings.length; i++) {
        setProgress({ current: i + 1, total: holdings.length });
        const dataUrl = await renderCardToDataUrl(holdings[i]);
        const base64 = dataUrl.split(",")[1];
        const fileName = `${holdings[i].holding_no}-${holdings[i].name}.png`;
        zip.file(fileName, base64, { base64: true });
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "holding-cards.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download all failed:", err);
      throw err;
    } finally {
      setDownloading(false);
      setProgress({ current: 0, total: 0 });
    }
  }, []);

  return { downloadAll, downloading, progress };
};
