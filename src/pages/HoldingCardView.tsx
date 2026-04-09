import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Download, RefreshCw } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { toPng } from "html-to-image";
import { useIsMobile } from "@/hooks/use-mobile";
import solaimanLipiEmbeddedCss from "@/styles/solaimanLipiEmbedded.css?raw";
import cardBackImg from "@/assets/card-back.jpg";
import { CardFront } from "@/components/HoldingCardFront";

type HoldingCardType = Tables<"holding_cards">;

const BENGALI_FONT_FAMILY = "'SolaimanLipi', sans-serif";
const BENGALI_TEXT_STYLE = {
  fontFamily: BENGALI_FONT_FAMILY,
  lineHeight: 1.6,
} as const;

const ensureEmbeddedFontCss = () => {
  if (typeof document === "undefined") return;

  const styleId = "solaiman-lipi-embedded-font";
  if (document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = solaimanLipiEmbeddedCss;
  document.head.appendChild(style);
};

const HoldingCardView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [holding, setHolding] = useState<HoldingCardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const flipContainerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureEmbeddedFontCss();
    void document.fonts.load("400 1em SolaimanLipi");
    void document.fonts.load("700 1em SolaimanLipi");
  }, []);

  const downloadCard = async () => {
    if (!holding) return;
    setDownloading(true);

    const frontEl = frontRef.current;
    const backEl = backRef.current;
    const flipContainer = flipContainerRef.current;
    const wrapper = wrapperRef.current;

    if (!frontEl || !backEl || !flipContainer || !wrapper) {
      setDownloading(false);
      return;
    }

    const origTransform = flipContainer.style.transform;
    const origTransition = flipContainer.style.transition;
    const origTransformStyle = flipContainer.style.transformStyle;
    const origWrapperPerspective = wrapper.style.perspective;

    const backDiv = backEl.parentElement;
    const frontDiv = frontEl.parentElement;
    const origBackTransform = backDiv?.style.transform || "";
    const origBackBfv = backDiv?.style.backfaceVisibility || "";
    const origFrontBfv = frontDiv?.style.backfaceVisibility || "";
    const origBackPos = backDiv?.style.position || "";
    const origBackInset = backDiv?.style.inset || "";

    try {
      flipContainer.style.transition = "none";
      flipContainer.style.transform = "none";
      flipContainer.style.transformStyle = "flat";
      wrapper.style.perspective = "none";

      // Show both sides stacked vertically
      if (frontDiv) frontDiv.style.backfaceVisibility = "visible";
      if (backDiv) {
        backDiv.style.position = "relative";
        backDiv.style.inset = "auto";
        backDiv.style.transform = "none";
        backDiv.style.backfaceVisibility = "visible";
      }

      ensureEmbeddedFontCss();
      await document.fonts.load("400 1em SolaimanLipi");
      await document.fonts.load("700 1em SolaimanLipi");
      await document.fonts.ready;
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      await new Promise((r) => setTimeout(r, 200));

      const scale = 3;
      const exportOptions = {
        pixelRatio: scale,
        cacheBust: true,
        includeQueryParams: true,
        fontEmbedCSS: solaimanLipiEmbeddedCss,
        style: { fontFamily: BENGALI_FONT_FAMILY, lineHeight: "1.6" },
        useCORS: true,
        allowTaint: false,
      } as Parameters<typeof toPng>[1];

      // Capture both sides separately
      const frontPng = await toPng(frontEl, exportOptions);
      const backPng = await toPng(backEl, exportOptions);

      // Load both images
      const loadImg = (src: string) => {
        const img = new Image();
        img.src = src;
        return new Promise<HTMLImageElement>((res) => {
          img.onload = () => res(img);
        });
      };

      const [frontImg, backImg] = await Promise.all([loadImg(frontPng), loadImg(backPng)]);

      // Combine vertically with padding and gap
      const padding = 40 * scale;
      const gap = 60 * scale;
      const maxW = Math.max(frontImg.width, backImg.width) + padding * 2;
      const totalH = padding + frontImg.height + gap + backImg.height + padding;

      const canvas = document.createElement("canvas");
      canvas.width = maxW;
      canvas.height = totalH;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, maxW, totalH);

      const frontX = Math.round((maxW - frontImg.width) / 2);
      const backX = Math.round((maxW - backImg.width) / 2);
      ctx.drawImage(frontImg, frontX, padding);
      ctx.drawImage(backImg, backX, padding + frontImg.height + gap);

      const link = document.createElement("a");
      link.download = `holding-card-${holding.holding_no}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();

      toast({ title: "সফল!", description: "কার্ড ডাউনলোড হয়েছে।" });
    } catch {
      toast({
        title: "ত্রুটি",
        description: "ডাউনলোড করতে সমস্যা হয়েছে।",
        variant: "destructive",
      });
    } finally {
      flipContainer.style.transform = origTransform;
      flipContainer.style.transition = origTransition;
      flipContainer.style.transformStyle = origTransformStyle;
      wrapper.style.perspective = origWrapperPerspective;

      if (frontDiv) {
        frontDiv.style.backfaceVisibility = origFrontBfv;
      }
      if (backDiv) {
        backDiv.style.position = origBackPos;
        backDiv.style.inset = origBackInset;
        backDiv.style.transform = origBackTransform;
        backDiv.style.backfaceVisibility = origBackBfv;
      }

      setDownloading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const { data, error } = await supabase.from("holding_cards").select("*").eq("id", id).single();

      if (error || !data) {
        toast({
          title: "Error",
          description: "Holding card not found.",
          variant: "destructive",
        });
        navigate("/holdings");
        return;
      }

      setHolding(data);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!holding) return null;

  return (
    <div className="max-w-2xl mx-auto overflow-x-hidden px-3 sm:px-4 md:px-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 sm:mb-6">
        <Button variant="ghost" size="sm" asChild className="shrink-0">
          <Link to="/holdings">
            <ArrowLeft className="mr-2 h-4 w-4" /> ফিরুন
          </Link>
        </Button>

        <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFlipped((f) => !f)}
            className="border-emerald-600 bg-emerald-600 text-white shadow-md hover:bg-emerald-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {flipped ? "সামনে" : "পেছনে"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadCard()}
            disabled={downloading}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            ডাউনলোড
          </Button>
        </div>
      </div>

      <div
        ref={wrapperRef}
        className="bengali-text mx-auto"
        style={{
          perspective: "1200px",
          width: "3.3in",
          ...BENGALI_TEXT_STYLE,
        }}
      >
        <div
          ref={flipContainerRef}
          className="relative transition-transform duration-700 ease-in-out"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <div className="relative" style={{ backfaceVisibility: "hidden" }}>
            <div ref={frontRef}>
              <CardFront holding={holding} />
            </div>
          </div>

          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div ref={backRef}>
              <CardBack isMobile={isMobile} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// CardFront is now imported from @/components/HoldingCardFront

const CardBack = () => (
  <div
    className="rounded-sm overflow-hidden"
    style={{
      width: "3.3in",
      height: "2.05in",
      border: "1px solid #ccc",
    }}
  >
    <img
      src={cardBackImg}
      alt="Card Back"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "fill",
        display: "block",
      }}
    />
  </div>
);
export default HoldingCardView;
