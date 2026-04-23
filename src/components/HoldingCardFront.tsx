import { QRCodeSVG } from "qrcode.react";
import gobLogo from "@/assets/gob-logo.jpg";
import unionLogo from "@/assets/union-logo.jpg";
import bdMap from "@/assets/bd-map-watermark.png";
import type { Tables } from "@/integrations/supabase/types";

type HoldingCardType = Tables<"holding_cards">;

const BENGALI_FONT_FAMILY = "'SolaimanLipi', sans-serif";
const BENGALI_TEXT_STYLE = {
  fontFamily: BENGALI_FONT_FAMILY,
  lineHeight: 1.6,
} as const;

const FrontDetailRow = ({ label, value, color = "#000000", labelColor = "#008449" }: { label: string; value: string; color?: string; labelColor?: string }) => (
  <div className="flex items-baseline" style={{ ...BENGALI_TEXT_STYLE, color }}>
    <span
      style={{
        display: "flex",
        fontSize: "14px",
        fontWeight: 600,
        height: "8px",
        width: "75px",
        marginRight: "8px",
        color: labelColor,
        ...BENGALI_TEXT_STYLE,
      }}
    >
      <span>{label}</span>
      <span>ঃ</span>
    </span>
    <span
      style={{
        fontSize: "14px",
        fontWeight: 700,
        color: color,
        height: "8px",
        flex: 1,
        ...BENGALI_TEXT_STYLE,
      }}
    >
      {value}
    </span>
  </div>
);

export const CardFront = ({ holding, forExport = false }: { holding: HoldingCardType; forExport?: boolean }) => (
  <div
    className={`bengali-text overflow-hidden relative flex flex-col ${forExport ? "" : "rounded-sm"}`}
    style={{
      width: "3.3in",
      height: "2.05in",
      background: "#FDFDFD",
      ...(forExport ? {} : { boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #ccc" }),
      ...BENGALI_TEXT_STYLE,
    }}
  >
    <div className="flex flex-col h-full w-full p-2 relative" style={{ zIndex: 1, ...BENGALI_TEXT_STYLE }}>
      <div className="relative">
        <div className="absolute left-0 top-0 w-12 h-12 flex items-center justify-center" style={{ zIndex: 2 }}>
          <img src={gobLogo} alt="সরকার" className="w-12 h-12 object-contain" />
        </div>
        <div className="absolute right-0 top-0 w-12 h-12 flex items-center justify-center" style={{ zIndex: 2 }}>
          <img src={unionLogo} alt="ইউনিয়ন পরিষদ" className="w-12 h-12 object-contain" />
        </div>
        <div className="text-center px-8" style={{ position: "relative", zIndex: 2 }}>
          <p
            style={{
              margin: 0,
              lineHeight: 1,
              fontSize: "10px",
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
              fontSize: "18px",
              fontWeight: "bold",
              marginTop: "-14px",
              color: "#ef1e23",
              ...BENGALI_TEXT_STYLE,
            }}
          >
            ৪নং ফুলসূতি ইউনিয়ন পরিষদ
          </h1>
          <p
            style={{
              margin: 0,
              lineHeight: 0.6,
              fontSize: "12px",
              color: "#2e327b",
              marginTop: "-14px",
              fontWeight: "bold",
              letterSpacing: "0.5px",
              textShadow: "0 0 1px rgba(181,32,14,0.3)",
              ...BENGALI_TEXT_STYLE,
            }}
          >
            উপজেলা ঃ নগরকান্দা, জেলা ঃ ফরিদপুর।
          </p>
          <p style={{ margin: 0, marginTop: "-9px", ...BENGALI_TEXT_STYLE }}>
            <span
              style={{
                display: "inline-block",
                fontSize: "13px",
                fontWeight: "bold",
                color: "#00894d",
                border: "1px solid #db2b1e",
                borderRadius: "4px",
                padding: "0px 6px",
                lineHeight: 0,
                ...BENGALI_TEXT_STYLE,
              }}
            >
              হোল্ডিং স্মার্ট কার্ড
            </span>
          </p>
        </div>
      </div>

      <div className="relative flex-1" style={{ marginTop: "-12px", ...BENGALI_TEXT_STYLE }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 0,
            opacity: 1,
            backgroundImage: `url(${bdMap})`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center center",
            backgroundSize: "auto 110%",
          }}
        />
        <div className="space-y-2.5 pr-[74px] pb-[6px] relative" style={{ zIndex: 1 }}>
          <FrontDetailRow label="নাম" value={holding.name} color="#000000" labelColor="#602c91" />
          <FrontDetailRow label="হোল্ডিং নং" value={holding.holding_no} color="#000000" />
          <FrontDetailRow label="ওয়ার্ড নং" value={holding.ward_no} color="#000000" />
          <FrontDetailRow label="গ্রাম/মহল্লা" value={holding.village} color="#000000" />
        </div>
        <div className="absolute bottom-[2px] right-[2px]" style={{ zIndex: 2 }}>
          <QRCodeSVG
            value={[
              "মুছাপুর ইউনিয়ন পরিষদ",
              `মালিকের নাম: ${holding.name}`,
              `হোল্ডিং নং: ${holding.holding_no}`,
              `ওয়ার্ড নং: ${holding.ward_no}`,
              `গ্রাম/মহল্লা: ${holding.village}`,
            ].join("\n")}
            size={90}
            level="L"
            fgColor="#000000"
            bgColor="#ffffff"
          />
        </div>
      </div>
    </div>
  </div>
);

export default CardFront;
