import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Download } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { toJpeg } from "html-to-image";
import bdGovtSeal from "@/assets/bd-govt-seal.png";
import bdNationalEmblem from "@/assets/bd-national-emblem.png";

type HoldingCardType = Tables<"holding_cards">;

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

  const downloadCard = async (side: "front" | "back") => {
    if (!holding) return;
    setDownloading(true);

    const targetRef = side === "front" ? frontRef.current : backRef.current;
    const flipContainer = flipContainerRef.current;
    const wrapper = wrapperRef.current;

    if (!targetRef || !flipContainer || !wrapper) {
      setDownloading(false);
      return;
    }

    // Save original styles
    const origTransform = flipContainer.style.transform;
    const origTransition = flipContainer.style.transition;
    const origTransformStyle = flipContainer.style.transformStyle;
    const origWrapperPerspective = wrapper.style.perspective;

    // For back side, we need to show it; for front side, reset rotation
    const backDiv = backRef.current?.parentElement;
    const frontDiv = frontRef.current?.parentElement;
    const origBackTransform = backDiv?.style.transform || "";
    const origBackBfv = backDiv?.style.backfaceVisibility || "";
    const origFrontBfv = frontDiv?.style.backfaceVisibility || "";

    try {
      // Temporarily flatten 3D for clean capture
      flipContainer.style.transition = "none";
      flipContainer.style.transform = "none";
      flipContainer.style.transformStyle = "flat";
      wrapper.style.perspective = "none";

      if (side === "back") {
        if (frontDiv) frontDiv.style.display = "none";
        if (backDiv) {
          backDiv.style.position = "relative";
          backDiv.style.transform = "none";
          backDiv.style.backfaceVisibility = "visible";
        }
      } else {
        if (backDiv) backDiv.style.display = "none";
        if (frontDiv) {
          frontDiv.style.backfaceVisibility = "visible";
        }
      }

      // Wait for layout reflow
      await new Promise((r) => setTimeout(r, 200));

      const scale = 3;
      const width = targetRef.scrollWidth;
      const height = targetRef.scrollHeight;

      const dataUrl = await domtoimage.toJpeg(targetRef, {
        quality: 0.95,
        width: width * scale,
        height: height * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        },
      });

      const link = document.createElement("a");
      link.download = `holding-card-${side}-${holding.holding_no}.jpg`;
      link.href = dataUrl;
      link.click();

      toast({ title: "সফল!", description: `${side === "front" ? "সামনের" : "পেছনের"} কার্ড ডাউনলোড হয়েছে।` });
    } catch {
      toast({ title: "ত্রুটি", description: "ডাউনলোড করতে সমস্যা হয়েছে।", variant: "destructive" });
    } finally {
      // Restore all styles
      flipContainer.style.transform = origTransform;
      flipContainer.style.transition = origTransition;
      flipContainer.style.transformStyle = origTransformStyle;
      wrapper.style.perspective = origWrapperPerspective;

      if (frontDiv) {
        frontDiv.style.display = "";
        frontDiv.style.backfaceVisibility = origFrontBfv;
      }
      if (backDiv) {
        backDiv.style.display = "";
        backDiv.style.position = "";
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
        toast({ title: "Error", description: "Holding card not found.", variant: "destructive" });
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
            onClick={() => downloadCard(flipped ? "back" : "front")}
            disabled={downloading}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            ডাউনলোড
          </Button>
        </div>
      </div>

      <div ref={wrapperRef} className="mx-auto w-full max-w-[640px]" style={{ perspective: "1200px", fontFamily: "'SolaimanLipi', sans-serif" }}>
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

const CardFront = ({ holding }: { holding: HoldingCardType }) => (
  <div className="rounded-xl border-2 border-emerald-600 overflow-hidden bg-gradient-to-b from-green-50 via-yellow-50/30 to-green-50 shadow-xl relative flex flex-col">
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
      <img src={bdGovtSeal} alt="" className="w-48 h-48 opacity-10" />
    </div>

    <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700 text-white text-center py-2 sm:py-3 px-3 sm:px-4 relative z-10">
      <p className="text-[9px] sm:text-[10px] tracking-wide opacity-90">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার (স্থানীয় সরকার বিভাগ)</p>
    </div>

    <div className="text-center py-2 sm:py-3 px-3 sm:px-4 space-y-1 border-b border-emerald-200">
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-emerald-400 flex items-center justify-center bg-white shrink-0">
          <img src={bdGovtSeal} alt="বাংলাদেশ সরকার" className="w-7 h-7 sm:w-10 sm:h-10 object-contain" />
        </div>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-emerald-800 leading-tight">৪নং ফুলসুতী ইউনিয়ন পরিষদ</h1>
          <p className="text-[9px] sm:text-[10px] text-emerald-600">উপজেলা : নগরকান্দা, জেলা : ফরিদপুর</p>
        </div>

        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-emerald-400 flex items-center justify-center bg-white shrink-0">
          <img src={bdNationalEmblem} alt="জাতীয় প্রতীক" className="w-7 h-7 sm:w-10 sm:h-10 object-contain" />
        </div>
      </div>
    </div>

    <div className="flex justify-center -mt-3 relative z-10">
      <div className="bg-red-600 text-white px-4 sm:px-6 py-1 rounded-full text-xs sm:text-sm font-bold shadow-md border-2 border-red-700">
        হোল্ডিং স্মার্ট কার্ড
      </div>
    </div>

    <div className="px-4 sm:px-6 pt-3 pb-3 space-y-2 flex-1 flex flex-col justify-between">
      <div className="flex gap-3 sm:gap-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg border-2 border-emerald-300 bg-white p-1 flex items-center justify-center">
          <div className="w-full h-full grid grid-cols-5 grid-rows-5 gap-[1px]">
            {Array.from({ length: 25 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-[1px] ${
                  [0, 1, 2, 4, 5, 6, 10, 12, 14, 18, 20, 22, 23, 24].includes(i)
                    ? "bg-emerald-800"
                    : "bg-emerald-100"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <DetailRow label="নাম" value={holding.name} />
          <DetailRow label="হোল্ডিং নং" value={holding.holding_no} />
          <DetailRow label="ওয়ার্ড নং" value={holding.ward_no} />
          <DetailRow label="গ্রাম/মহল্লা" value={holding.village} />
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
        <p className="text-xs text-emerald-600 mb-0.5">বার্ষিক কর (ট্যাক্স)</p>
        <p className="text-xl font-bold text-emerald-800">৳{Number(holding.tax).toLocaleString()}</p>
      </div>

      <div className="text-center pt-1">
        <p className="text-[10px] text-emerald-600 leading-relaxed">★ নিয়মিত ইউপি কর (ট্যাক্স) পরিশোধ করুন ★</p>
      </div>
    </div>

    <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700 text-white text-center py-2 px-4">
      <p className="text-[10px] tracking-wide opacity-90">https://fulsutiup.faridpur.gov.bd</p>
    </div>
  </div>
);

const CardBack = () => (
  <div className="rounded-xl border-2 border-emerald-600 overflow-hidden bg-gradient-to-b from-green-50 via-yellow-50/30 to-green-50 shadow-xl relative flex flex-col">
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
      <img src={bdGovtSeal} alt="" className="w-48 h-48 opacity-10" />
    </div>

    <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700 text-white text-center py-3 px-4 relative z-10">
      <p className="text-sm font-bold">জরুরী প্রয়োজনে কল করুন</p>
    </div>

    <div className="px-6 py-4 space-y-3 flex-1 flex flex-col justify-evenly relative z-10">
      <div className="bg-red-50/35 border border-red-200 rounded-lg p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-red-800 font-medium">জাতীয়জরুরীসেবা সেবা</span>
          <span className="text-lg font-bold text-red-700">৯৯৯</span>
        </div>
        <div className="h-px bg-red-200" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-red-800 font-medium">ফায়ার সার্ভিস</span>
          <span className="text-lg font-bold text-red-700">১০২</span>
        </div>
        <div className="h-px bg-red-200" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-red-800 font-medium">পুলিশ সেবা</span>
          <span className="text-lg font-bold text-red-700">১০০</span>
        </div>
      </div>

      <div className="bg-emerald-50/35 border border-emerald-200 rounded-lg p-3 text-center space-y-1">
        <p className="text-sm text-emerald-800 font-semibold leading-relaxed">হোল্ডিং না আমার কুঁড়ে ঘর,</p>
        <p className="text-sm text-emerald-800 leading-relaxed">আখিরে দিব অল্প কর ।</p>
        <p className="text-sm text-emerald-800 leading-relaxed">হোল্ডিং সেবা পেতে হলে,</p>
        <p className="text-sm text-emerald-800 leading-relaxed">কার্ডটি সনে রাখুন ।</p>
      </div>

      <div className="text-center">
        <p className="text-[9px] text-muted-foreground leading-relaxed">
          এই কার্ডটি ফুলসুতী ইউনিয়ন পরিষদ কর্তৃক প্রদত্ত।
          <br />
          কার্ডটি হস্তান্তরযোগ্য নয়।
        </p>
      </div>
    </div>

    <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700 text-white text-center py-2 px-4">
      <p className="text-[10px] tracking-wide opacity-90">https://fulsutiup.faridpur.gov.bd</p>
    </div>
  </div>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline gap-2">
    <span className="text-xs text-emerald-700 font-medium whitespace-nowrap min-w-[70px]">{label} :</span>
    <span className="text-sm font-bold text-foreground border-b border-dashed border-emerald-300 flex-1 pb-0.5">
      {value}
    </span>
  </div>
);

export default HoldingCardView;
