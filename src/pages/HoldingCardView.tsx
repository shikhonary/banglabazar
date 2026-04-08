import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, RotateCcw } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import bdGovtSeal from "@/assets/bd-govt-seal.png";

type HoldingCardType = Tables<"holding_cards">;

const HoldingCardView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [holding, setHolding] = useState<HoldingCardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState(false);

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
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/holdings">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => setFlipped(!flipped)}>
          <RotateCcw className="mr-2 h-4 w-4" />
          {flipped ? "Front Side" : "Back Side"}
        </Button>
      </div>

      <div className="perspective-[1200px]">
        <div
          className={`relative w-full transition-transform duration-700 [transform-style:preserve-3d] ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          {/* Front Side */}
          <div className="[backface-visibility:hidden]">
            <CardFront holding={holding} />
          </div>

          {/* Back Side */}
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <CardBack />
          </div>
        </div>
      </div>
    </div>
  );
};

const CardFront = ({ holding }: { holding: HoldingCardType }) => (
  <div className="rounded-xl border-2 border-emerald-600 overflow-hidden bg-gradient-to-b from-green-50 via-yellow-50/30 to-green-50 shadow-xl relative">
    {/* Watermark */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
      <img src={bdGovtSeal} alt="" className="w-48 h-48 opacity-10" />
    </div>
    {/* Top Header */}
    <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700 text-white text-center py-3 px-4 relative z-10">
      <p className="text-[10px] tracking-wide opacity-90">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার (স্থানীয় সরকার বিভাগ)</p>
    </div>

    {/* Union Parishad Name Section */}
    <div className="text-center py-4 px-4 space-y-1 border-b border-emerald-200">
      <div className="flex items-center justify-center gap-3">
        {/* Left Emblem */}
        <div className="w-12 h-12 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center">
          <svg viewBox="0 0 40 40" className="w-8 h-8 text-emerald-700">
            <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M20 8 C20 8 12 16 12 22 C12 26.4 15.6 30 20 30 C24.4 30 28 26.4 28 22 C28 16 20 8 20 8Z" fill="currentColor" opacity="0.3" />
            <circle cx="20" cy="20" r="4" fill="currentColor" opacity="0.5" />
          </svg>
        </div>

        <div>
          <h1 className="text-lg font-bold text-emerald-800 leading-tight">৪নং ফুলসুতী ইউনিয়ন পরিষদ</h1>
          <p className="text-[10px] text-emerald-600">উপজেলা : নগরকান্দা, জেলা : ফরিদপুর</p>
        </div>

        {/* Right Emblem */}
        <div className="w-12 h-12 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center">
          <svg viewBox="0 0 40 40" className="w-8 h-8 text-emerald-700">
            <rect x="10" y="12" width="20" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <line x1="15" y1="16" x2="25" y2="16" stroke="currentColor" strokeWidth="1" />
            <line x1="15" y1="20" x2="25" y2="20" stroke="currentColor" strokeWidth="1" />
            <line x1="15" y1="24" x2="25" y2="24" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
      </div>
    </div>

    {/* Holding Card Title Badge */}
    <div className="flex justify-center -mt-3 relative z-10">
      <div className="bg-red-600 text-white px-6 py-1 rounded-full text-sm font-bold shadow-md border-2 border-red-700">
        হোল্ডিং স্মার্ট কার্ড
      </div>
    </div>

    {/* Card Details */}
    <div className="px-6 pt-4 pb-5 space-y-3">
      {/* QR Code area + Info */}
      <div className="flex gap-4">
        {/* QR Code Placeholder */}
        <div className="w-20 h-20 shrink-0 rounded-lg border-2 border-emerald-300 bg-white p-1 flex items-center justify-center">
          <div className="w-full h-full grid grid-cols-5 grid-rows-5 gap-[1px]">
            {Array.from({ length: 25 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-[1px] ${
                  [0,1,2,4,5,6,10,12,14,18,20,22,23,24].includes(i)
                    ? "bg-emerald-800"
                    : "bg-emerald-100"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-2">
          <DetailRow label="নাম" value={holding.name} />
          <DetailRow label="হোল্ডিং নং" value={holding.holding_no} />
          <DetailRow label="ওয়ার্ড নং" value={holding.ward_no} />
          <DetailRow label="গ্রাম/মহল্লা" value={holding.village} />
        </div>
      </div>

      {/* Tax Info */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
        <p className="text-xs text-emerald-600 mb-0.5">বার্ষিক কর (ট্যাক্স)</p>
        <p className="text-xl font-bold text-emerald-800">৳{Number(holding.tax).toLocaleString()}</p>
      </div>

      {/* Footer Note */}
      <div className="text-center pt-1">
        <p className="text-[10px] text-emerald-600 leading-relaxed">
          ★ নিয়মিত ইউপি কর (ট্যাক্স) পরিশোধ করুন ★
        </p>
      </div>
    </div>

    {/* Bottom Bar */}
    <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700 text-white text-center py-2 px-4">
      <p className="text-[10px] tracking-wide opacity-90">https://fulsutiup.faridpur.gov.bd</p>
    </div>
  </div>
);

const CardBack = () => (
  <div className="rounded-xl border-2 border-emerald-600 overflow-hidden bg-gradient-to-b from-green-50 via-yellow-50/30 to-green-50 shadow-xl">
    {/* Top Header */}
    <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700 text-white text-center py-3 px-4">
      <p className="text-sm font-bold">জরুরী প্রয়োজনে কল করুন</p>
    </div>

    <div className="px-6 py-5 space-y-4">
      {/* Emergency Numbers */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-red-800 font-medium">জাতীয়জরুরীসেবা সেবা</span>
          <span className="text-lg font-bold text-red-700 font-mono">৯৯৯</span>
        </div>
        <div className="h-px bg-red-200" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-red-800 font-medium">ফায়ার সার্ভিস</span>
          <span className="text-lg font-bold text-red-700 font-mono">১০২</span>
        </div>
        <div className="h-px bg-red-200" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-red-800 font-medium">পুলিশ সেবা</span>
          <span className="text-lg font-bold text-red-700 font-mono">১০০</span>
        </div>
      </div>

      {/* Message Section */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center space-y-2">
        <p className="text-sm text-emerald-800 font-semibold leading-relaxed">
          হোল্ডিং না আমার কুঁড়ে ঘর,
        </p>
        <p className="text-sm text-emerald-800 leading-relaxed">
          আখিরে দিব অল্প কর ।
        </p>
        <p className="text-sm text-emerald-800 leading-relaxed">
          হোল্ডিং সেবা পেতে হলে,
        </p>
        <p className="text-sm text-emerald-800 leading-relaxed">
          কার্ডটি সনে রাখুন ।
        </p>
      </div>

      {/* Government Seal */}
      <div className="flex justify-center">
        <div className="w-24 h-24 rounded-full border-2 border-emerald-300 bg-emerald-50 flex flex-col items-center justify-center opacity-60">
          <svg viewBox="0 0 60 60" className="w-12 h-12 text-emerald-600">
            <circle cx="30" cy="30" r="28" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="30" cy="30" r="22" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <path d="M30 12 L32 20 L40 20 L34 25 L36 33 L30 28 L24 33 L26 25 L20 20 L28 20 Z" fill="currentColor" opacity="0.3" />
            <text x="30" y="45" textAnchor="middle" fontSize="5" fill="currentColor" fontWeight="bold">সরকার</text>
          </svg>
          <p className="text-[8px] text-emerald-600 font-medium mt-0.5">বাংলাদেশ সরকার</p>
        </div>
      </div>

      {/* Terms */}
      <div className="text-center">
        <p className="text-[9px] text-muted-foreground leading-relaxed">
          এই কার্ডটি ফুলসুতী ইউনিয়ন পরিষদ কর্তৃক প্রদত্ত।
          <br />
          কার্ডটি হস্তান্তরযোগ্য নয়।
        </p>
      </div>
    </div>

    {/* Bottom Bar */}
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
