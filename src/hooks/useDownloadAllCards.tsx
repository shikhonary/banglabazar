import { useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { toPng } from "html-to-image";
import { CardFront } from "@/components/HoldingCardFront";
import type { Tables } from "@/integrations/supabase/types";

type HoldingCard = Tables<"holding_cards">;

const BENGALI_FONT_FAMILY = "'SolaimanLipi', sans-serif";

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

const renderCardToImage = async (holding: HoldingCard): Promise<HTMLImageElement> => {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.zIndex = "-1";
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<CardFront holding={holding} />);

  await new Promise((r) => setTimeout(r, 300));

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

    const img = new Image();
    img.src = dataUrl;
    await new Promise<void>((res) => { img.onload = () => res(); });
    return img;
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

      const images: HTMLImageElement[] = [];
      for (let i = 0; i < holdings.length; i++) {
        setProgress({ current: i + 1, total: holdings.length });
        const img = await renderCardToImage(holdings[i]);
        images.push(img);
      }

      // Grid layout: 3 columns
      const cols = 3;
      const scale = 3;
      const padding = 30 * scale;
      const gap = 20 * scale;

      const cardW = images[0].width;
      const cardH = images[0].height;
      const rows = Math.ceil(images.length / cols);

      const totalW = padding * 2 + cols * cardW + (cols - 1) * gap;
      const totalH = padding * 2 + rows * cardH + (rows - 1) * gap;

      const canvas = document.createElement("canvas");
      canvas.width = totalW;
      canvas.height = totalH;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, totalW, totalH);

      images.forEach((img, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = padding + col * (cardW + gap);
        const y = padding + row * (cardH + gap);
        ctx.drawImage(img, x, y);
      });

      const link = document.createElement("a");
      link.download = "holding-cards.jpg";
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
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
