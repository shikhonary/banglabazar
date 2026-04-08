import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Download } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";
import { useIsMobile } from "@/hooks/use-mobile";
import bdGovtSeal from "@/assets/bd-govt-seal.png";
import bdNationalEmblem from "@/assets/bd-national-emblem.png";
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
        return new Promise<HTMLImageElement>((res) => { img.onload = () => res(img); });
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
      const { data, error } = await supabase
        .from("holding_cards")
        .select("*")
        .eq("id", id)
        .single();

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
    <div className="max-w-2xl mx-auto px-3 sm:px-4 md:px-0">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/holdings">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant={!flipped ? "default" : "outline"}
            size="sm"
            onClick={() => setFlipped(false)}
            className={!flipped ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md" : ""}
          >
            সামনে
          </Button>
          <Button
            variant={flipped ? "default" : "outline"}
            size="sm"
            onClick={() => setFlipped(true)}
            className={flipped ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md" : ""}
          >
            পেছনে
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
              <CardFront holding={holding} />
            </div>
          </div>

          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div ref={backRef}>
              <CardBack />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CARD_ASPECT = 1.586; // ISO ID-1 standard (w:h)

const CardFront = ({ holding, isMobile }: { holding: HoldingCardType; isMobile: boolean }) => (
  <div
    className="bengali-text rounded-xl border-2 border-emerald-600 overflow-hidden shadow-xl relative flex flex-col"
    style={{
      background: "linear-gradient(to bottom, #f0fdf4, rgba(254,252,232,0.3), #f0fdf4)",
      ...(isMobile ? {} : { aspectRatio: `${CARD_ASPECT} / 1` }),
      ...BENGALI_TEXT_STYLE,
    }}
  >
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
      <img src={bdGovtSeal} alt="" className="w-36 h-36 opacity-10" />
    </div>

    {/* Top bar */}
    <div
      className="text-white text-center py-1.5 px-3 relative z-10"
      style={{
        background: "linear-gradient(to right, #047857, #059669, #047857)",
        ...BENGALI_TEXT_STYLE,
      }}
    >
      <p className="text-[8px] sm:text-[9px] tracking-wide opacity-90">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার (স্থানীয় সরকার বিভাগ)</p>
    </div>

    {/* Header with emblems */}
    <div className="text-center py-1 px-3 border-b border-emerald-200" style={BENGALI_TEXT_STYLE}>
      <div className="flex items-center justify-center gap-2">
        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-emerald-400 flex items-center justify-center bg-white shrink-0">
          <img src={bdGovtSeal} alt="বাংলাদেশ সরকার" className="w-5 h-5 sm:w-7 sm:h-7 object-contain" />
        </div>
        <div>
          <h1 className="text-sm sm:text-base font-bold text-emerald-800 leading-tight">৪নং ফুলসুতী ইউনিয়ন পরিষদ</h1>
          <p className="text-[8px] sm:text-[9px] text-emerald-600">উপজেলা : নগরকান্দা, জেলা : ফরিদপুর</p>
        </div>
        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-emerald-400 flex items-center justify-center bg-white shrink-0">
          <img src={bdNationalEmblem} alt="জাতীয় প্রতীক" className="w-5 h-5 sm:w-7 sm:h-7 object-contain" />
        </div>
      </div>
    </div>

    {/* Badge */}
    <div className="flex justify-center -mt-2.5 relative z-10" style={BENGALI_TEXT_STYLE}>
      <div className="bg-red-600 text-white px-3 sm:px-5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold shadow-md border-2 border-red-700">
        হোল্ডিং স্মার্ট কার্ড
      </div>
    </div>

    {/* Main content - horizontal layout */}
    <div className="px-3 sm:px-4 pt-1.5 pb-1 flex-1 flex flex-col justify-between relative z-10" style={BENGALI_TEXT_STYLE}>
      <div className="flex gap-3 items-start">
        {/* QR Code */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-lg border-2 border-emerald-300 bg-white p-0.5 flex items-center justify-center">
          <QRCodeSVG
            value={`${window.location.origin}/holdings/card/${holding.id}`}
            size={52}
            level="M"
            fgColor="#065f46"
            bgColor="#ffffff"
          />
        </div>

        {/* Details */}
        <div className="flex-1 space-y-1">
          <DetailRow label="নাম" value={holding.name} />
          <DetailRow label="হোল্ডিং নং" value={holding.holding_no} />
          <DetailRow label="ওয়ার্ড নং" value={holding.ward_no} />
          <DetailRow label="গ্রাম/মহল্লা" value={holding.village} />
        </div>

        {/* Tax box */}
        <div className="shrink-0 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-center" style={BENGALI_TEXT_STYLE}>
          <p className="text-[9px] text-emerald-600 mb-0.5">বার্ষিক কর</p>
          <p className="text-base sm:text-lg font-bold text-emerald-800">৳{Number(holding.tax).toLocaleString()}</p>
        </div>
      </div>

      <div className="text-center" style={BENGALI_TEXT_STYLE}>
        <p className="text-[9px] text-emerald-600 leading-relaxed">★ নিয়মিত ইউপি কর (ট্যাক্স) পরিশোধ করুন ★</p>
      </div>
    </div>

    {/* Bottom bar */}
    <div
      className="text-white text-center py-1 px-4"
      style={{
        background: "linear-gradient(to right, #047857, #059669, #047857)",
        ...BENGALI_TEXT_STYLE,
      }}
    >
      <p className="text-[9px] tracking-wide opacity-90">https://fulsutiup.faridpur.gov.bd</p>
    </div>
  </div>
);

const CardBack = ({ isMobile }: { isMobile: boolean }) => (
  <div
    className="bengali-text rounded-xl border-2 border-emerald-600 overflow-hidden shadow-xl relative flex flex-col"
    style={{
      background: "linear-gradient(to bottom, #f0fdf4, rgba(254,252,232,0.3), #f0fdf4)",
      ...(isMobile ? {} : { aspectRatio: `${CARD_ASPECT} / 1` }),
      ...BENGALI_TEXT_STYLE,
    }}
  >
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
      <img src={bdGovtSeal} alt="" className="w-36 h-36 opacity-10" />
    </div>

    {/* Top bar */}
    <div
      className="text-white text-center py-1.5 px-4 relative z-10"
      style={{
        background: "linear-gradient(to right, #047857, #059669, #047857)",
        ...BENGALI_TEXT_STYLE,
      }}
    >
      <p className="text-xs font-bold">জরুরী প্রয়োজনে কল করুন</p>
    </div>

    {/* Main content - two columns */}
    <div className="px-4 py-2 flex-1 flex gap-3 relative z-10" style={BENGALI_TEXT_STYLE}>
      {/* Left: Emergency numbers */}
      <div className="flex-1 bg-red-50/35 border border-red-200 rounded-lg p-2 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-red-800 font-medium">জাতীয় জরুরী সেবা</span>
          <span className="text-sm font-bold text-red-700">৯৯৯</span>
        </div>
        <div className="h-px bg-red-200" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-red-800 font-medium">ফায়ার সার্ভিস</span>
          <span className="text-sm font-bold text-red-700">১০২</span>
        </div>
        <div className="h-px bg-red-200" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-red-800 font-medium">পুলিশ সেবা</span>
          <span className="text-sm font-bold text-red-700">১০০</span>
        </div>
      </div>

      {/* Right: Poem + disclaimer */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="bg-emerald-50/35 border border-emerald-200 rounded-lg p-2 text-center space-y-0.5" style={BENGALI_TEXT_STYLE}>
          <p className="text-xs text-emerald-800 font-semibold leading-relaxed">হোল্ডিং না আমার কুঁড়ে ঘর,</p>
          <p className="text-xs text-emerald-800 leading-relaxed">আখিরে দিব অল্প কর ।</p>
          <p className="text-xs text-emerald-800 leading-relaxed">হোল্ডিং সেবা পেতে হলে,</p>
          <p className="text-xs text-emerald-800 leading-relaxed">কার্ডটি সনে রাখুন ।</p>
        </div>

        <div className="text-center mt-1" style={BENGALI_TEXT_STYLE}>
          <p className="text-[8px] text-muted-foreground leading-relaxed">
            এই কার্ডটি ফুলসুতী ইউনিয়ন পরিষদ কর্তৃক প্রদত্ত। কার্ডটি হস্তান্তরযোগ্য নয়।
          </p>
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div
      className="text-white text-center py-1 px-4"
      style={{
        background: "linear-gradient(to right, #047857, #059669, #047857)",
        ...BENGALI_TEXT_STYLE,
      }}
    >
      <p className="text-[9px] tracking-wide opacity-90">https://fulsutiup.faridpur.gov.bd</p>
    </div>
  </div>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline gap-2" style={BENGALI_TEXT_STYLE}>
    <span className="text-xs text-emerald-700 font-medium whitespace-nowrap min-w-[70px]">{label} :</span>
    <span className="text-sm font-bold text-foreground border-b border-dashed border-emerald-300 flex-1 pb-0.5">
      {value}
    </span>
  </div>
);

export default HoldingCardView;
