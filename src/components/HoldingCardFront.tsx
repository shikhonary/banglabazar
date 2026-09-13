import { QRCodeSVG } from "qrcode.react";
import gobLogo from "@/assets/gob-logo.jpg";
import unionLogo from "@/assets/union-logo.jpg";
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

// Star colors for info fields - each star's color can be configured independently
export const DEFAULT_STAR_COLORS = {
  name: "green",    // Color for মালিকের নাম star
  holding: "red", // Color for হোল্ডিং নং star
  ward: "green",    // Color for ওয়ার্ড নং star
  village: "red", // Color for গ্রাম/মহল্লা star
};

export const CardFront = ({
  holding,
  forExport = false,
  starColors,
}: {
  holding: HoldingCardType;
  forExport?: boolean;
  starColors?: Partial<typeof DEFAULT_STAR_COLORS>;
}) => {
  const stars = { ...DEFAULT_STAR_COLORS, ...starColors };

  return (
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
          <div className="absolute left-[0px] top-[2px] w-14 h-14 flex items-center justify-center" style={{ zIndex: 2 }}>
            <img src={gobLogo} alt="সরকার" className="w-14 h-14 object-contain" />
          </div>
          {/* Union Logo Right */}
          <div className="absolute right-[0px] top-[2px] w-14 h-14 flex items-center justify-center" style={{ zIndex: 2 }}>
            <img src={unionLogo} alt="ইউনিয়ন পরিষদ" className="w-14 h-14 object-contain" />
          </div>

          <div className="text-center" style={{ position: "relative", zIndex: 2 }}>
            {/* Top govt text */}
            <p
              style={{
                margin: 0,
                lineHeight: 1.1,
                fontSize: "9.5px",
                color: "black",
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
                fontSize: "18px",
                fontWeight: "bold",
                color: "#ff0004ff",
                letterSpacing: "2.1px",
                marginTop: "-10px",
                ...BENGALI_TEXT_STYLE,
              }}
            >
              বাঘড়া ইউনিয়ন পরিষদ
            </h1>

            {/* Sub-district & district */}
            <p
              style={{
                margin: 0,
                lineHeight: 1.05,
                fontSize: "12px",
                color: "#42479cff",
                fontWeight: "bold",
                marginTop: "-13px",
                ...BENGALI_TEXT_STYLE,
              }}
            >
              উপজেলা ঃ শ্রীনগর, জেলা ঃ মুন্সিগঞ্জ।
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
              opacity: 0.3,
            }}
          >
            <img src={unionLogo} alt="" className="w-[95px] h-[95px] object-contain" />
          </div>

          {/* Fields — left side, QR right */}
          <div className="flex" style={{ zIndex: 1, position: "relative" }}>
            {/* Left: info fields */}
            <div className="flex-1 space-y-0">

              {/* নাম */}
              <div className="flex items-center" style={{ ...BENGALI_TEXT_STYLE, marginBottom: "0px", marginTop: "-12px", lineHeight: 1.15 }}>
                <span style={{ display: "inline-flex", alignItems: "center", fontSize: "16px", fontWeight: 700, color: "#000000", whiteSpace: "nowrap", width: "94px", ...BENGALI_TEXT_STYLE }}>
                  <span style={{ color: stars.name, marginRight: "3px", fontSize: "14px", lineHeight: 1 }}>★</span>
                  <span style={{ letterSpacing: "-1.5px" }}>মালিকের নাম</span>
                  <span style={{ marginLeft: "auto", marginRight: "4px" }}>ঃ</span>
                </span>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "#000000", flex: 1, whiteSpace: "nowrap", letterSpacing: "-0.3px", ...BENGALI_TEXT_STYLE }}>
                  {holding.name}
                </span>
              </div>

              {/* হোল্ডিং নং */}
              <div className="flex items-center" style={{ ...BENGALI_TEXT_STYLE, marginBottom: "0px", marginTop: "-15px", lineHeight: 1.15 }}>
                <span style={{ display: "inline-flex", alignItems: "center", fontSize: "16px", fontWeight: 700, color: "#000000", whiteSpace: "nowrap", width: "94px", ...BENGALI_TEXT_STYLE }}>
                  <span style={{ color: stars.holding, marginRight: "3px", fontSize: "14px", lineHeight: 1 }}>★</span>
                  <span style={{ color: "red" }}>হোল্ডিং নং</span>
                  <span style={{ marginLeft: "auto", marginRight: "4px", color: "red" }}>ঃ</span>
                </span>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "red", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.3px", ...BENGALI_TEXT_STYLE }}>
                  {holding.holding_no}
                </span>
              </div>

              {/* ওয়ার্ড নং */}
              <div className="flex items-center" style={{ ...BENGALI_TEXT_STYLE, marginBottom: "0px", marginTop: "-15px", lineHeight: 1.15 }}>
                <span style={{ display: "inline-flex", alignItems: "center", fontSize: "16px", fontWeight: 700, color: "#ff0004ff", whiteSpace: "nowrap", width: "94px", ...BENGALI_TEXT_STYLE }}>
                  <span style={{ color: stars.ward, marginRight: "3px", fontSize: "14px", lineHeight: 1 }}>★</span>
                  <span style={{ color: "red" }}>ওয়ার্ড নং</span>
                  <span style={{ marginLeft: "auto", marginRight: "4px", color: "red" }}>ঃ</span>
                </span>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "red", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.3px", ...BENGALI_TEXT_STYLE }}>
                  {holding.ward_no}
                </span>
              </div>

              {/* গ্রাম/মহল্লা */}
              <div className="flex items-center" style={{ ...BENGALI_TEXT_STYLE, marginBottom: "0px", marginTop: "-15px", lineHeight: 1.15 }}>
                <span style={{ display: "inline-flex", alignItems: "center", fontSize: "16px", fontWeight: 700, color: "#000000", whiteSpace: "nowrap", width: "94px", ...BENGALI_TEXT_STYLE }}>
                  <span style={{ color: stars.village, marginRight: "3px", fontSize: "14px", lineHeight: 1 }}>★</span>
                  <span>গ্রাম/মহল্লা</span>
                  <span style={{ marginLeft: "auto", marginRight: "4px" }}>ঃ</span>
                </span>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "#B42574", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.3px", ...BENGALI_TEXT_STYLE }}>
                  {holding.village}
                </span>
              </div>
            </div>

            {/* Right: QR code */}
            <div style={{ zIndex: 2, flexShrink: 0, marginRight: "-4px", marginTop: "1px", position: "absolute", bottom: "2px", right: "2px" }} className="z-100">
              <QRCodeSVG
                value={[
                  "১০ নং বাংলাবাজার ইউনিয়ন পরিষদ",
                  `মালিকের নাম- ${holding.name}`,
                  `হোল্ডিং- ${holding.holding_no}`,
                  `ওয়ার্ড- ${holding.ward_no}`,
                  `এলাকা- ${holding.village}`,
                  // `ধার্য্যকৃত ট্যাক্সঃ ${holding.tax}/-`,
                ].join("\n")}
                size={90}
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
              fontWeight: "bold",
              ...BENGALI_TEXT_STYLE,
              paddingTop: "1px",
              lineHeight: 1,
              color: "#962954",
            }}
          >
            <span style={{ color: "red", marginTop: "-8px", letterSpacing: "2px" }}>* নিয়মিত ইউপি কর (ট্যাক্স) পরিশোধ করুন *</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardFront;
