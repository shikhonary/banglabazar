import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Download, RefreshCw } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";
import { useIsMobile } from "@/hooks/use-mobile";
import gobLogo from "@/assets/gob-logo.jpg";
import unionLogo from "@/assets/union-logo.jpg";
import bdMap from "@/assets/bd-map.png";
import solaimanLipiEmbeddedCss from "@/styles/solaimanLipiEmbedded.css?raw";

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
      toast({ title: "ত্রুটি", description: "ডাউনলোড করতে সমস্যা হয়েছে।", variant: "destructive" });
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
        className="bengali-text mx-auto w-full max-w-[600px]"
        style={{
          perspective: "1200px",
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
              <CardFront holding={holding} isMobile={isMobile} />
            </div>
          </div>

          <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <div ref={backRef}>
              <CardBack isMobile={isMobile} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CardFront = ({ holding, isMobile }: { holding: HoldingCardType; isMobile: boolean }) => (
  <div
    className="bengali-text rounded-sm overflow-hidden relative flex flex-col"
    style={{
      width: "3.3in",
      height: "2.05in",
      background: "#FDFDFD",
      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      ...BENGALI_TEXT_STYLE,
    }}
  >
    {/* Bangladesh map watermark */}
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 0, opacity: 0.12 }}
    >
      <img src={bdMap} alt="" className="h-[75%] object-contain" />
    </div>

    {/* Main content */}
    <div className="flex flex-col h-full w-full p-2 relative" style={{ zIndex: 1, ...BENGALI_TEXT_STYLE }}>
      {/* Top header row: govt seal + text + union logo */}
      <div className="relative">
        {/* GOB logo - absolute left */}
        <div className="absolute left-0 top-0 w-12 h-12 flex items-center justify-center" style={{ zIndex: 2 }}>
          <img src={gobLogo} alt="সরকার" className="w-12 h-12 object-contain" />
        </div>

        {/* Union logo - absolute right */}
        <div className="absolute right-0 top-0 w-12 h-12 flex items-center justify-center" style={{ zIndex: 2 }}>
          <img src={unionLogo} alt="ইউনিয়ন পরিষদ" className="w-12 h-12 object-contain" />
        </div>

        {/* Center text */}
        <div className="text-center px-8">
          <p
            style={{
              margin: 0,
              lineHeight: 1,
              fontSize: "8px",
              color: "#173c97",
              fontWeight: "bold",
              ...BENGALI_TEXT_STYLE,
            }}
          >
            গণপ্রজাতন্ত্রী বাংলাদেশ সরকার (স্থানীয় সরকার বিভাগ)
          </p>
          <h1
            style={{
              margin: 0,
              lineHeight: 1,
              fontSize: "20px",
              fontWeight: "bold",
              marginTop: "-10px",
              color: "#ef1e23",
              ...BENGALI_TEXT_STYLE,
            }}
          >
            মুছাপুর ইউনিয়ন পরিষদ
          </h1>
          <p
            style={{
              margin: 0,
              lineHeight: 1,
              fontSize: "10px",
              color: "#de5038",
              marginTop: "-10px",
              fontWeight: "bold",
              ...BENGALI_TEXT_STYLE,
            }}
          >
            উপজেলা ঃ নগরকান্দা, জেলা ঃ ফরিদপুর।
          </p>
        </div>
      </div>

      {/* Details + QR section */}
      <div className="flex mt-1.5 flex-1 gap-2" style={BENGALI_TEXT_STYLE}>
        {/* Left: Details */}
        <div className="flex-1">
          <FrontDetailRow label="মালিকের নাম" value={holding.name} />
          <FrontDetailRow label="হোল্ডিং নং" value={holding.holding_no} />
          <FrontDetailRow label="ওয়ার্ড নং" value={holding.ward_no} />
          <FrontDetailRow label="গ্রাম/মহল্লা" value={holding.village} />
        </div>

        {/* Right: QR Code */}
        <div className="shrink-0 flex items-start justify-center pt-1">
          <div className="bg-white p-0.5 border border-gray-300">
            <QRCodeSVG
              value={`${window.location.origin}/invoice/${holding.id}`}
              size={60}
              level="M"
              fgColor="#000000"
              bgColor="#ffffff"
            />
          </div>
        </div>
      </div>

      {/* Bottom footer */}
      <div className="text-center mt-auto pt-0.5">
        <p
          style={{
            fontSize: "8px",
            fontWeight: 700,
            color: "#8B0000",
            fontFamily: "sans-serif",
            letterSpacing: "0.3px",
          }}
        >
          https://fulsutiup.faridpur.gov.bd
        </p>
      </div>
    </div>
  </div>
);

const FrontDetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline" style={BENGALI_TEXT_STYLE}>
    {/* Label container with fixed width and flex alignment */}
    <span
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: "9px",
        color: "#1a1a40",
        fontWeight: 600,
        marginTop: "-5px",
        width: "60px", // Increased slightly to ensure Bengali text fits
        marginRight: "8px",
        ...BENGALI_TEXT_STYLE,
      }}
    >
      <span>{label}</span>
      <span>ঃ</span>
    </span>

    {/* Value container */}
    <span
      style={{
        fontSize: "10px",
        fontWeight: 700,
        color: "#B22222",
        flex: 1, // Allows value to take up remaining space
        ...BENGALI_TEXT_STYLE,
      }}
    >
      {value}
    </span>
  </div>
);

const CardBack = ({ isMobile }: { isMobile: boolean }) => (
  <div
    className="bengali-text rounded-sm overflow-hidden relative flex flex-col"
    style={{
      width: "3.3in",
      height: "2.05in",
      background: "#FDFDFD",
      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      ...BENGALI_TEXT_STYLE,
    }}
  >
    {/* Bangladesh flag watermark */}
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 0, opacity: 0.15 }}
    >
      <div style={{ width: "80%", height: "60%", background: "#006a4e", position: "relative", borderRadius: "2px" }}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "40%",
            aspectRatio: "1",
            borderRadius: "50%",
            background: "#f42a41",
          }}
        />
      </div>
    </div>

    {/* Main content */}
    <div className="flex flex-col h-full w-full p-2 relative" style={{ zIndex: 1, ...BENGALI_TEXT_STYLE }}>
      {/* 1. Top Header */}
      <div className="flex justify-between items-start">
        <p style={{ color: "#8B0000", fontSize: "7px", fontWeight: 700, ...BENGALI_TEXT_STYLE }}>
          ৪৫ দিনের মধ্যে জন্ম ও মৃত্যু নিবন্ধন করুন।
        </p>
        <p style={{ color: "#8B0000", fontSize: "7px", fontWeight: 700, textAlign: "right", ...BENGALI_TEXT_STYLE }}>
          সময়মত ইউপি কর পরিশোধ করুন।
        </p>
      </div>

      {/* 2. Middle Section */}
      <div className="flex mt-1.5 flex-1 gap-1.5" style={BENGALI_TEXT_STYLE}>
        {/* Left: Emergency Table (~55%) */}
        <div style={{ width: "55%", border: "1px solid #000", ...BENGALI_TEXT_STYLE }}>
          <div style={{ borderBottom: "1px solid #000", textAlign: "center", padding: "1px 4px" }}>
            <span style={{ color: "#E32636", fontWeight: 600, fontSize: "8px", ...BENGALI_TEXT_STYLE }}>
              জরুরী প্রয়োজনে কল করুন
            </span>
          </div>
          <div style={{ borderBottom: "1px solid #000", padding: "1px 4px" }}>
            <span style={{ color: "#1A1A40", fontSize: "7px", ...BENGALI_TEXT_STYLE }}>
              পল্লী বিদ্যুৎ ঃ ০১৭৬৯-৪০০২২৪
            </span>
          </div>
          <div style={{ borderBottom: "1px solid #000", padding: "1px 4px" }}>
            <span style={{ color: "#1A1A40", fontSize: "7px", ...BENGALI_TEXT_STYLE }}>
              ফায়ার সার্ভিস ঃ ০১৯০১-০২০৯১৮
            </span>
          </div>
          <div style={{ borderBottom: "1px solid #000", padding: "1px 4px" }}>
            <span style={{ color: "#1A1A40", fontSize: "7px", ...BENGALI_TEXT_STYLE }}>
              উপজেলা স্বাস্থ্য কমপ্লেক্স ঃ ০১৭৩০-৩২৪৫৩৭
            </span>
          </div>
          <div style={{ textAlign: "center", padding: "1px 4px" }}>
            <span style={{ color: "#0000CD", fontWeight: 700, fontSize: "9px", ...BENGALI_TEXT_STYLE }}>
              জরুরী সেবা ঃ ৯৯৯
            </span>
          </div>
        </div>

        {/* Right: Signature & Info (~45%) */}
        <div style={{ width: "45%", ...BENGALI_TEXT_STYLE }} className="flex flex-col items-center justify-between">
          <p style={{ color: "#228B22", fontSize: "7px", textAlign: "center", ...BENGALI_TEXT_STYLE }}>
            ইউপি সেবা পেতে কার্ডটি সঙ্গে আনুন।
          </p>

          {/* Signature placeholder */}
          <div style={{ height: "24px", width: "60px" }} className="flex items-center justify-center">
            <div style={{ borderBottom: "1px solid #333", width: "100%" }} />
          </div>

          <div style={{ textAlign: "center", lineHeight: 1.2, ...BENGALI_TEXT_STYLE }}>
            <p style={{ color: "#000080", fontWeight: 700, fontSize: "8px" }}>মোহাম্মদ হোসেন ভূঁইয়া</p>
            <p style={{ color: "#000", fontSize: "7px" }}>চেয়ারম্যান</p>
            <p style={{ color: "#228B22", fontSize: "7px" }}>মুছাপুর ইউনিয়ন পরিষদ</p>
            <p style={{ color: "#FF0000", fontSize: "7px" }}>রায়পুরা, নরসিংদী।</p>
          </div>
        </div>
      </div>

      {/* 3. Bottom Footer */}
      <div className="mt-1 text-center">
        <p
          style={{
            color: "#8B0000",
            fontWeight: 700,
            fontSize: "9px",
            fontFamily: "sans-serif",
            letterSpacing: "0.5px",
          }}
        >
          https://musapurup.narsingdi.gov.bd/
        </p>
      </div>
    </div>
  </div>
);

export default HoldingCardView;
