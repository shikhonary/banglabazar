import { QRCodeSVG } from "qrcode.react";
import gobLogo from "@/assets/gob-logo.jpg";
import unionLogo from "@/assets/union-logo.png";
import bdNationalEmblem from "@/assets/bd-national-emblem.png";
import type { Tables } from "@/integrations/supabase/types";

type HoldingCardType = Tables<"holding_cards">;

const BENGALI_FONT_FAMILY = "'SolaimanLipi', sans-serif";
const BENGALI_TEXT_STYLE = {
  fontFamily: BENGALI_FONT_FAMILY,
  lineHeight: 1.6,
} as const;

const LABEL_COLOR = "#058749"; // green for labels
const VALUE_COLOR = "#000000"; // purple/indigo for values

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
        {/* GOB Logo Left */}
        <div className="absolute right-[-6px] top-[2px] w-14 h-14 flex items-center justify-center" style={{ zIndex: 2 }}>
          <img src={gobLogo} alt="সরকার" className="w-14 h-14 object-contain" />
        </div>
        {/* Union Logo Right */}
        <div className="absolute left-[-6px] top-[2px] w-14 h-14 flex items-center justify-center" style={{ zIndex: 2 }}>
          <img src={unionLogo} alt="ইউনিয়ন পরিষদ" className="w-14 h-14 object-contain" />
        </div>

        <div className="text-center" style={{ position: "relative", zIndex: 2 }}>
          {/* Top govt text */}
          <p
            style={{
              margin: 0,
              lineHeight: 1.1,
              fontSize: "9.5px",
              color: "#35368aff",
              fontWeight: "bold",
              paddingTop: "2px",
              marginTop: "4px",
              ...BENGALI_TEXT_STYLE,
            }}
          >
            গণপ্রজাতন্ত্রী বাংলাদেশ সরকার (স্থানীয় সরকার বিভাগ)
          </p>

          {/* Union name — large red */}
          <h1
            style={{
              margin: "0",
              lineHeight: 1.05,
              fontSize: "16px",
              fontWeight: "bold",
              color: "#ff0004ff",
              letterSpacing: "-0.5px",
              marginTop: "-10px",
              ...BENGALI_TEXT_STYLE,
            }}
          >
            ১০ নং বাংলাবাজার ইউনিয়ন পরিষদ
          </h1>

          {/* Sub-district & district */}
          <p
            style={{
              margin: 0,
              lineHeight: 1.05,
              fontSize: "9.5px",
              color: "#f0161aff",
              fontWeight: "bold",
              marginTop: "-15px",
              ...BENGALI_TEXT_STYLE,
            }}
          >
            উপজেলা ঃ মুন্সিগঞ্জ সদর, জেলা ঃ মুন্সিগঞ্জ।
          </p>

        </div>
      </div>

      {/* Content Section */}
      <div className="relative flex-1 px-1" style={{ marginTop: "1px", ...BENGALI_TEXT_STYLE }}>
        {/* Watermark — Bangladesh national emblem */}
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          style={{
            zIndex: 0,
            opacity: 0.4,
          }}
        >
          <img src={bdNationalEmblem} alt="" className="w-[95px] h-[95px] object-contain" />
        </div>

        {/* Fields — left side, QR right */}
        <div className="flex" style={{ zIndex: 1, position: "relative" }}>
          {/* Left: info fields */}
          <div className="flex-1 space-y-0">

            {/* নাম */}
            <div className="flex items-center" style={{ ...BENGALI_TEXT_STYLE, marginBottom: "0px", marginTop: "-8px", lineHeight: 1.15 }}>
              <span style={{ display: "inline-flex", fontSize: "16px", fontWeight: 700, color: "#000000", whiteSpace: "nowrap", ...BENGALI_TEXT_STYLE }}>
                <span style={{ width: "72px", letterSpacing: "-1.5px" }}>মালিকের নাম</span>
                <span style={{ marginRight: "4px" }}>ঃ</span>
              </span>
              <span style={{ fontSize: "15x", fontWeight: 700, color: "#000000", flex: 1, whiteSpace: "nowrap", letterSpacing: "-0.3px", ...BENGALI_TEXT_STYLE }}>
                {holding.name}
              </span>
            </div>

            {/* হোল্ডিং নং */}
            <div className="flex items-center" style={{ ...BENGALI_TEXT_STYLE, marginBottom: "0px", marginTop: "-17px", lineHeight: 1.15 }}>
              <span style={{ display: "inline-flex", fontSize: "16px", fontWeight: 700, color: "#000000", whiteSpace: "nowrap", width: "82px", ...BENGALI_TEXT_STYLE }}>
                <span>হোল্ডিং নং</span>
                <span style={{ marginLeft: "auto", marginRight: "4px" }}>ঃ</span>
              </span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: VALUE_COLOR, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.3px", ...BENGALI_TEXT_STYLE }}>
                {holding.holding_no}
              </span>
            </div>

            {/* ওয়ার্ড নং */}
            <div className="flex items-center" style={{ ...BENGALI_TEXT_STYLE, marginBottom: "0px", marginTop: "-17px", lineHeight: 1.15 }}>
              <span style={{ display: "inline-flex", fontSize: "16px", fontWeight: 700, color: "#ff0004ff", whiteSpace: "nowrap", width: "82px", ...BENGALI_TEXT_STYLE }}>
                <span>ওয়ার্ড নং</span>
                <span style={{ marginLeft: "auto", marginRight: "4px" }}>ঃ</span>
              </span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#ff0004ff", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.3px", ...BENGALI_TEXT_STYLE }}>
                {holding.ward_no}
              </span>
            </div>

            {/* গ্রাম/মহল্লা */}
            <div className="flex items-center" style={{ ...BENGALI_TEXT_STYLE, marginBottom: "0px", marginTop: "-17px", lineHeight: 1.15 }}>
              <span style={{ display: "inline-flex", fontSize: "16px", fontWeight: 700, color: "#000000", whiteSpace: "nowrap", width: "82px", ...BENGALI_TEXT_STYLE }}>
                <span>গ্রাম/মহল্লা</span>
                <span style={{ marginLeft: "auto", marginRight: "4px" }}>ঃ</span>
              </span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#000000", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.3px", ...BENGALI_TEXT_STYLE }}>
                {holding.village}
              </span>
            </div>
          </div>

          {/* Right: QR code */}
          <div style={{ zIndex: 2, flexShrink: 0, marginRight: "-4px", marginTop: "1px", position: "absolute", bottom: "-12px", right: "2px" }} className="z-100">
            <QRCodeSVG
              value={[
                "১০ নং বাংলাবাজার ইউনিয়ন পরিষদ",
                `মালিকের নাম- ${holding.name}`,
                `হোল্ডিং- ${holding.holding_no}`,
                `ওয়ার্ড- ${holding.ward_no}`,
                `এলাকা- ${holding.village}`,
                // `ধার্য্যকৃত ট্যাক্সঃ ${holding.tax}/-`,
              ].join("\n")}
              size={91}
              level="M"
              fgColor="#000000"
              bgColor="transparent"
            />
          </div>
        </div>

        {/* Bottom tax reminder text */}
        <div
          style={{
            position: "absolute",
            bottom: "0px",
            left: "-4px",
            right: "-4px",
            textAlign: "center",
            fontSize: "12px",
            width: "71%",
            fontWeight: "bold",
            ...BENGALI_TEXT_STYLE,
            paddingTop: "1px",
            lineHeight: 1,
            color: "#962954",
          }}
        >
          <span style={{ color: "#017024ff", marginBottom: "-4px", marginTop: "-4px" }}>* ৪৫ দিনের মধ্যে জন্ম ও মৃত্যু নিবন্ধন *</span><br />
          <span style={{ color: "#35368aff", marginTop: "-8px" }}>* নিয়মিত ইউপি কর (ট্যাক্স) পরিশোধ করুন *</span>
        </div>
      </div>
    </div>
  </div>
);

export default CardFront;
