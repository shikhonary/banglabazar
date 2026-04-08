import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Tables } from "@/integrations/supabase/types";
import bdGovtSeal from "@/assets/bd-govt-seal.png";

import unionParishadLogo from "@/assets/union-parishad-logo.png";
import solaimanLipiEmbeddedCss from "@/styles/solaimanLipiEmbedded.css?raw";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";

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

const PublicInvoice = () => {
  const { id } = useParams<{ id: string }>();
  const [holding, setHolding] = useState<HoldingCardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureEmbeddedFontCss();
    void document.fonts.load("400 1em SolaimanLipi");
    void document.fonts.load("700 1em SolaimanLipi");
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) { setNotFound(true); setLoading(false); return; }
      const { data, error } = await supabase
        .from("holding_cards")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setHolding(data);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const downloadPdf = async () => {
    if (!invoiceRef.current || !holding) return;
    setDownloading(true);

    try {
      ensureEmbeddedFontCss();
      await document.fonts.load("400 1em SolaimanLipi");
      await document.fonts.load("700 1em SolaimanLipi");
      await document.fonts.ready;
      await new Promise((r) => setTimeout(r, 200));

      const scale = 3;
      const dataUrl = await toPng(invoiceRef.current, {
        pixelRatio: scale,
        cacheBust: true,
        fontEmbedCSS: solaimanLipiEmbeddedCss,
        style: { fontFamily: BENGALI_FONT_FAMILY, lineHeight: "1.6" },
      });

      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((res) => { img.onload = () => res(); });

      const imgWidthPx = img.width;
      const imgHeightPx = img.height;

      // A4 width in mm = 210, with margins
      const pdfWidth = 210;
      const margin = 10;
      const contentWidth = pdfWidth - margin * 2;
      const contentHeight = (imgHeightPx / imgWidthPx) * contentWidth;
      const pdfHeight = contentHeight + margin * 2;

      const pdf = new jsPDF({
        orientation: contentHeight > contentWidth ? "portrait" : "landscape",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
      });

      pdf.addImage(dataUrl, "PNG", margin, margin, contentWidth, contentHeight);
      pdf.save(`invoice-${holding.holding_no}.pdf`);
    } catch {
      console.error("PDF download failed");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (notFound || !holding) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white" style={BENGALI_TEXT_STYLE}>
        <img src={bdGovtSeal} alt="" className="mb-4 h-16 w-16 opacity-40" />
        <h1 className="text-xl font-bold text-emerald-800">হোল্ডিং কার্ড পাওয়া যায়নি</h1>
        <p className="mt-2 text-sm text-muted-foreground">এই লিঙ্কটি সঠিক নয় অথবা কার্ডটি মুছে ফেলা হয়েছে।</p>
      </div>
    );
  }

  const publicUrl = `${window.location.origin}/invoice/${holding.id}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white px-3 py-6 sm:px-6 sm:py-10" style={BENGALI_TEXT_STYLE}>
      <div className="mx-auto max-w-lg">
        {/* Download button */}
        <div className="mb-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadPdf}
            disabled={downloading}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            PDF ডাউনলোড
          </Button>
        </div>

        {/* Invoice content - captured for PDF */}
        <div ref={invoiceRef} className="bg-white rounded-2xl p-4 sm:p-6">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <img src={bdGovtSeal} alt="বাংলাদেশ সরকার" className="h-10 w-10 sm:h-12 sm:w-12" />
              <div>
                <p className="text-[10px] text-emerald-600">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার (স্থানীয় সরকার বিভাগ)</p>
                <h1 className="text-lg font-bold text-emerald-800 sm:text-xl">৪নং ফুলসুতী ইউনিয়ন পরিষদ</h1>
                <p className="text-xs text-emerald-600">উপজেলা : নগরকান্দা, জেলা : ফরিদপুর</p>
              </div>
              <img src={unionParishadLogo} alt="ইউনিয়ন পরিষদ" className="h-10 w-10 sm:h-12 sm:w-12" />
            </div>
            <div className="mx-auto mt-2 inline-block rounded-full bg-red-600 px-5 py-1 text-xs font-bold text-white shadow-md">
              হোল্ডিং ইনভয়েস
            </div>
          </div>

          {/* Invoice Card */}
          <div className="rounded-xl border-2 border-emerald-300 bg-white p-4 shadow-lg sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
              {/* QR Code */}
              <div className="flex shrink-0 justify-center">
                <div className="rounded-lg border-2 border-emerald-200 bg-white p-1.5">
                  <QRCodeSVG
                    value={publicUrl}
                    size={90}
                    level="M"
                    fgColor="#065f46"
                    bgColor="#ffffff"
                  />
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 space-y-2.5">
                <InvoiceRow label="নাম" value={holding.name} />
                <InvoiceRow label="অভিভাবক" value={holding.guardian_name} />
                <InvoiceRow label="হোল্ডিং নং" value={holding.holding_no} />
                <InvoiceRow label="ওয়ার্ড নং" value={holding.ward_no} />
                <InvoiceRow label="গ্রাম/মহল্লা" value={holding.village} />
              </div>
            </div>

            {/* Tax section */}
            <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
              <p className="text-xs text-emerald-600">বার্ষিক কর (ট্যাক্স)</p>
              <p className="text-2xl font-bold text-emerald-800">৳{Number(holding.tax).toLocaleString()}</p>
            </div>

            <p className="mt-4 text-center text-[10px] text-muted-foreground">
              এই ইনভয়েসটি ফুলসুতী ইউনিয়ন পরিষদ কর্তৃক প্রদত্ত। ★ নিয়মিত ইউপি কর (ট্যাক্স) পরিশোধ করুন ★
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-emerald-600">https://fulsutiup.faridpur.gov.bd</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const InvoiceRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline gap-2" style={BENGALI_TEXT_STYLE}>
    <span className="min-w-[80px] whitespace-nowrap text-xs font-medium text-emerald-700">{label} :</span>
    <span className="flex-1 border-b border-dashed border-emerald-300 pb-0.5 text-sm font-bold text-foreground">
      {value}
    </span>
  </div>
);

export default PublicInvoice;
