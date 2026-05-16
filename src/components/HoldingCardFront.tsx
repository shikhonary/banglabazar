import { QRCodeSVG } from "qrcode.react";
import gobLogo from "@/assets/gob-logo.jpg";
import unionLogo from "@/assets/union-logo.jpg";
import type { Tables } from "@/integrations/supabase/types";

type HoldingCardType = Tables<"holding_cards">;

const BENGALI_FONT_FAMILY = "'SolaimanLipi', sans-serif";
const BENGALI_TEXT_STYLE = {
  fontFamily: BENGALI_FONT_FAMILY,
  lineHeight: 1.6,
} as const;



export const CardFront = ({ holding, forExport = false }: { holding: HoldingCardType; forExport?: boolean }) => (
  <div
    className={`bengali-text overflow-hidden relative flex flex-col ${forExport ? "" : "rounded-sm"}`}
    style={{
      width: "3.3in",
      height: "2.05in",
      background: "#FFFFFF",
      ...(forExport ? {} : { boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #000000" }),
      ...BENGALI_TEXT_STYLE,
    }}
  >
    <div className="flex flex-col h-full w-full px-2 relative" style={{ zIndex: 1, ...BENGALI_TEXT_STYLE }}>
      {/* Header Section */}
      <div className="relative">
        {/* Union Logo Left */}
        <div className="absolute left-[-6px] top-[4px] w-14 h-14 flex items-center justify-center" style={{ zIndex: 2 }}>
          <img src={unionLogo} alt="ইউনিয়ন পরিষদ" className="w-14 h-14 object-contain" />
        </div>
        {/* GOB Logo Right */}
        <div className="absolute right-[-6px] top-[4px] w-14 h-14 flex items-center justify-center" style={{ zIndex: 2 }}>
          <img src={gobLogo} alt="সরকার" className="w-14 h-14 object-contain" />
        </div>

        <div className="text-center" style={{ position: "relative", zIndex: 2 }}>
          <p
            style={{
              margin: 0,
              lineHeight: 1,
              fontSize: "10px",
              // backgroundColor: "#000",
              color: "#000000",
              fontWeight: "bold",
              ...BENGALI_TEXT_STYLE,
            }}
          >
            গণপ্রজাতন্ত্রী বাংলাদেশ সরকার (স্থানীয় সরকার বিভাগ)
          </p>
          <h1
            style={{
              margin: "1px 0",
              lineHeight: 1,
              fontSize: "19px",
              fontWeight: "bold",
              color: "#e62224",
              letterSpacing: "-0.5px",
              marginTop: "-10px",
              ...BENGALI_TEXT_STYLE,
            }}
          >
            ২নং চৌয়ারা ইউনিয়ন পরিষদ
          </h1>
          <p
            style={{
              margin: 0,
              lineHeight: 1,
              fontSize: "10px",
              color: "#000000",
              fontWeight: "bold",
              marginTop: "-15px",
              ...BENGALI_TEXT_STYLE,
            }}
          >
            উপজেলা ঃ কুমিল্লা সদর দক্ষিণ, জেলা ঃ কুমিল্লা।
          </p>

          {/* Title with arrows */}
          <div className="flex items-center justify-center gap-2 relative -mt-1 rounded-full">
            <span
              style={{
                display: "inline-block",
                fontSize: "10px",
                fontWeight: "bold",
                color: "#008857",
                border: "2px solid #008857",
                padding: "0px 6px",
                paddingTop: "0px",
                backgroundColor: "#FFFFFF",
                borderRadius: "30px",
                ...BENGALI_TEXT_STYLE,
              }}
            >
              Holding Tax Card / হোল্ডিং কর কার্ড
            </span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="relative flex-1 px-1" style={{ marginTop: "1px", ...BENGALI_TEXT_STYLE }}>
        {/* Watermark Logo */}
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          style={{
            zIndex: 0,
            opacity: 0.12,
          }}
        >
          <img src={unionLogo} alt="" className="w-[98px] h-[98px] object-contain" />
        </div>

        <div className="space-y-0 pr-[95px] relative" style={{ zIndex: 1 }}>
          {/* মালিকের নাম */}
          <div className="flex items-center" style={{ ...BENGALI_TEXT_STYLE, color: "#000000", marginBottom: "0px", marginTop: "-5px", lineHeight: 1.1 }}>
            <span style={{ display: "inline-flex", fontSize: "12px", fontWeight: 700, color: "#000000", whiteSpace: "nowrap", width: "70px", ...BENGALI_TEXT_STYLE }}>
              <span>মালিকের নাম</span>
              <span style={{ marginLeft: "auto", marginRight: "4px" }}>ঃ</span>
            </span>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#000000", flex: 1, whiteSpace: "nowrap", letterSpacing: "-0.3px", ...BENGALI_TEXT_STYLE }}>
              {holding.name}
            </span>
          </div>

          {/* পিতা/স্বামী */}
          <div className="flex items-center" style={{ ...BENGALI_TEXT_STYLE, color: "#000000", marginBottom: "0px", marginTop: "-13px", lineHeight: 1.1 }}>
            <span style={{ display: "inline-flex", fontSize: "12px", fontWeight: 700, color: "#000000", whiteSpace: "nowrap", width: "70px", ...BENGALI_TEXT_STYLE }}>
              <span>পিতার নাম</span>
              <span style={{ marginLeft: "auto", marginRight: "4px" }}>ঃ</span>
            </span>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#000000", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.3px", ...BENGALI_TEXT_STYLE }}>
              {holding.guardian_name}
            </span>
          </div>

          {/* হোল্ডিং নং */}
          <div className="flex items-center" style={{ ...BENGALI_TEXT_STYLE, color: "#000000", marginBottom: "0px", marginTop: "-13px", lineHeight: 1.1 }}>
            <span style={{ display: "inline-flex", fontSize: "12px", fontWeight: 700, color: "#000000", whiteSpace: "nowrap", width: "70px", ...BENGALI_TEXT_STYLE }}>
              <span>হোল্ডিং নং</span>
              <span style={{ marginLeft: "auto", marginRight: "4px" }}>ঃ</span>
            </span>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#000000", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.3px", ...BENGALI_TEXT_STYLE }}>
              {holding.holding_no}
            </span>
          </div>

          {/* ওয়ার্ড নং */}
          <div className="flex items-center" style={{ ...BENGALI_TEXT_STYLE, color: "#000000", marginBottom: "0px", marginTop: "-13px", lineHeight: 1.1 }}>
            <span style={{ display: "inline-flex", fontSize: "12px", fontWeight: 700, color: "#000000", whiteSpace: "nowrap", width: "70px", ...BENGALI_TEXT_STYLE }}>
              <span>ওয়ার্ড নং</span>
              <span style={{ marginLeft: "auto", marginRight: "4px" }}>ঃ</span>
            </span>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#000000", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.3px", ...BENGALI_TEXT_STYLE }}>
              {holding.ward_no}
            </span>
          </div>

          {/* গ্রাম/পাড়া */}
          <div className="flex items-center" style={{ ...BENGALI_TEXT_STYLE, color: "#000000", marginBottom: "0px", marginTop: "-13px", lineHeight: 1.1 }}>
            <span style={{ display: "inline-flex", fontSize: "12px", fontWeight: 700, color: "#000000", whiteSpace: "nowrap", width: "70px", ...BENGALI_TEXT_STYLE }}>
              <span>গ্রাম/মহল্লা</span>
              <span style={{ marginLeft: "auto", marginRight: "4px" }}>ঃ</span>
            </span>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#000000", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.3px", ...BENGALI_TEXT_STYLE }}>
              {holding.village}
            </span>
          </div>
        </div>

        {/* QR Code */}
        <div className="absolute bottom-[6px] right-[-4px]" style={{ zIndex: 2 }}>
          <QRCodeSVG
            value={[
              "২নং চৌয়ারা ইউনিয়ন পরিষদ",
              `মালিকঃ ${holding.name}`,
              `হোল্ডিং- ${holding.holding_no}`,
              `ওয়ার্ড- ${holding.ward_no}`,
              `এলাকাঃ ${holding.village}`,
              `ধার্য্যকৃত ট্যাক্সঃ ${holding.tax}/-`,
            ].join("\n")}
            size={90}
            level="M"
            fgColor="#000000"
            bgColor="transparent"
          />
        </div>
      </div>
    </div>
  </div>
);

export default CardFront;
