import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, Loader2, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

// Normalize headers so visually identical Bengali text matches reliably
const normalizeHeader = (value: string) =>
  value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

// Supports Unicode Bengali, alternate Bengali spellings, Bijoy-encoded Bengali, and English headers
const HEADER_MAP: Record<string, string> = {
  // Unicode Bengali
  [normalizeHeader("নাম")]: "name",
  [normalizeHeader("পিতা/স্বামীর নাম")]: "guardian_name",
  [normalizeHeader("অভিভাবক")]: "guardian_name",
  [normalizeHeader("হোল্ডিং নং")]: "holding_no",
  [normalizeHeader("হোল্ডিং")]: "holding_no",
  [normalizeHeader("ওয়ার্ড নং")]: "ward_no",
  [normalizeHeader("ওয়ার্ড নং")]: "ward_no",
  [normalizeHeader("ওয়ার্ড")]: "ward_no",
  [normalizeHeader("ওয়ার্ড")]: "ward_no",
  [normalizeHeader("গ্রামের নাম")]: "village",
  [normalizeHeader("গ্রাম")]: "village",
  [normalizeHeader("ধার্যকৃত বাৎসরিক কর")]: "tax",
  [normalizeHeader("কর")]: "tax",
  // Bijoy-encoded headers
  [normalizeHeader("bvg")]: "name",
  [normalizeHeader("wcZv/¯^vgxi bvg")]: "guardian_name",
  [normalizeHeader("†nvwìs bs")]: "holding_no",
  [normalizeHeader("IqvW© bs")]: "ward_no",
  [normalizeHeader("MÖv‡gi bvg")]: "village",
  [normalizeHeader("avh©K…Z evrmwiK Ki")]: "tax",
  // English fallbacks
  [normalizeHeader("name")]: "name",
  [normalizeHeader("guardian name")]: "guardian_name",
  [normalizeHeader("holding no")]: "holding_no",
  [normalizeHeader("ward no")]: "ward_no",
  [normalizeHeader("village")]: "village",
  [normalizeHeader("tax")]: "tax",
};

const POSITIONAL_FIELDS = ["name", "guardian_name", "holding_no", "ward_no", "village", "tax"];

interface HoldingRow {
  name: string;
  guardian_name: string;
  holding_no: string;
  ward_no: string;
  village: string;
  tax: number;
}

const ExcelImport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<HoldingRow[]>([]);

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        const mapped: HoldingRow[] = jsonData.map((row) => {
          const result: Record<string, unknown> = {};
          const entries = Object.entries(row);

          for (const [header, value] of entries) {
            const field = HEADER_MAP[normalizeHeader(String(header))];
            if (field) {
              result[field] = field === "tax" ? Number(value) || 0 : String(value ?? "").trim();
            }
          }

          // Always backfill missing fields positionally so partial header mismatches still import correctly
          const values = entries.map(([, value]) => value);
          POSITIONAL_FIELDS.forEach((field, index) => {
            const current = result[field];
            if ((current === undefined || current === "") && index < values.length && values[index] != null) {
              result[field] = field === "tax" ? Number(values[index]) || 0 : String(values[index]).trim();
            }
          });

          return {
            name: String(result.name ?? ""),
            guardian_name: String(result.guardian_name ?? ""),
            holding_no: String(result.holding_no ?? ""),
            ward_no: String(result.ward_no ?? ""),
            village: String(result.village ?? ""),
            tax: Number(result.tax ?? 0),
          };
        });

        const valid = mapped.filter((r) => r.name && r.holding_no);
        if (!valid.length) {
          toast({ title: "Error", description: "No valid rows found. Check column headers.", variant: "destructive" });
          return;
        }
        setPreview(valid);
      } catch {
        toast({ title: "Error", description: "Failed to parse file.", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!user || !preview.length) return;
    setImporting(true);
    try {
      const rows = preview.map((r) => ({ ...r, user_id: user.id }));
      const { error } = await supabase.from("holding_cards").insert(rows);
      if (error) throw error;
      toast({ title: "Success", description: `${rows.length} holding cards imported.` });
      setPreview([]);
      if (fileRef.current) fileRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["holdings"] });
      queryClient.invalidateQueries({ queryKey: ["holdings-count"] });
      queryClient.invalidateQueries({ queryKey: ["holdings-tax"] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Choose Excel/CSV
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) parseFile(file);
          }}
        />
        {preview.length > 0 && (
          <Button onClick={handleImport} disabled={importing}>
            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Import {preview.length} rows
          </Button>
        )}
      </div>

      {preview.length > 0 && (
        <div className="rounded-lg border overflow-auto max-h-64">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">নাম</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">অভিভাবক</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">হোল্ডিং</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">ওয়ার্ড</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">গ্রাম</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">কর</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.guardian_name}</td>
                  <td className="px-3 py-2">{r.holding_no}</td>
                  <td className="px-3 py-2">{r.ward_no}</td>
                  <td className="px-3 py-2">{r.village}</td>
                  <td className="px-3 py-2 text-right">{r.tax}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExcelImport;
