import { useRef, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { CardFront } from "@/components/HoldingCardFront";
import type { Tables } from "@/integrations/supabase/types";

type HoldingCard = Tables<"holding_cards">;

const BENGALI_FONT_FAMILY = "'SolaimanLipi', sans-serif";

// Embedded CSS for font
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

const renderCardToImage = (holding: HoldingCard): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.zIndex = "-1";
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(<CardFront holding={holding} />);

    // Wait for render + fonts
    await new Promise((r) => setTimeout(r, 300));

    const cardEl = container.firstElementChild as HTMLElement;
    if (!cardEl) {
      root.unmount();
      container.remove();
      return reject(new Error("Card element not found"));
    }

    try {
      const css = await getSolaimanCss();
      const dataUrl = await toPng(cardEl, {
        pixelRatio: 3,
        cacheBust: true,
        fontEmbedCSS: css,
        style: { fontFamily: BENGALI_FONT_FAMILY, lineHeight: "1.6" },
      });
      resolve(dataUrl);
    } catch (err) {
      reject(err);
    } finally {
      root.unmount();
      container.remove();
    }
  });
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

      // Card dimensions in inches
      const cardW = 3.3;
      const cardH = 2.05;
      const margin = 0.3;
      const gap = 0.2;

      // A4 landscape for fitting more cards
      const pageW = 11.69; // A4 landscape width
      const pageH = 8.27;  // A4 landscape height

      const cols = Math.floor((pageW - 2 * margin + gap) / (cardW + gap));
      const rows = Math.floor((pageH - 2 * margin + gap) / (cardH + gap));
      const perPage = cols * rows;

      const pdf = new jsPDF({ orientation: "landscape", unit: "in", format: "a4" });

      for (let i = 0; i < holdings.length; i++) {
        setProgress({ current: i + 1, total: holdings.length });

        const pageIndex = Math.floor(i / perPage);
        const posOnPage = i % perPage;

        if (pageIndex > 0 && posOnPage === 0) {
          pdf.addPage();
        }

        const col = posOnPage % cols;
        const row = Math.floor(posOnPage / cols);
        const x = margin + col * (cardW + gap);
        const y = margin + row * (cardH + gap);

        const dataUrl = await renderCardToImage(holdings[i]);
        pdf.addImage(dataUrl, "PNG", x, y, cardW, cardH);
      }

      pdf.save("holding-cards.pdf");
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
