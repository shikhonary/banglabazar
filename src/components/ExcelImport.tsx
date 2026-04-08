import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, Loader2, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

// Map headers to database fields using positional fallback
// Supports Unicode Bengali, Bijoy-encoded Bengali, and English headers
const HEADER_MAP: Record<string, string> = {
  // Unicode Bengali
  "নাম": "name",
  "পিতা/স্বামীর নাম": "guardian_name",
  "হোল্ডিং নং": "holding_no",
  "ওয়ার্ড নং": "ward_no",
  "গ্রামের নাম": "village",
  "ধার্যকৃত বাৎসরিক কর": "tax",
  // Bijoy-encoded headers (using Unicode escapes for safety)
  "bvg": "name",
  "wcZv/\u00AF^vgxi bvg": "guardian_name",
  "\u2020nvw\u00ECs bs": "holding_no",
  "IqvW\u00A9 bs": "ward_no",
  "M\u00D6v\u2021gi bvg": "village",
  "avh\u00A9K\u2026Z evrmwiK Ki": "tax",
  // English fallbacks
  "name": "name",
  "guardian name": "guardian_name",
  "holding no": "holding_no",
  "ward no": "ward_no",
  "village": "village",
  "tax": "tax",
};

// Positional fallback: if no headers match, use column order
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
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

        const mapped: HoldingRow[] = jsonData.map((row) => {
          const result: Record<string, any> = {};
          const entries = Object.entries(row);

          // Try header-based mapping first
          let matched = 0;
          for (const [header, value] of entries) {
            const trimmed = header.trim();
            const field = HEADER_MAP[trimmed];
            if (field) {
              result[field] = field === "tax" ? Number(value) || 0 : String(value).trim();
              matched++;
            }
          }

          // Positional fallback if no headers matched
          if (matched === 0) {
            const values = entries.map(([, v]) => v);
            POSITIONAL_FIELDS.forEach((field, i) => {
              if (i < values.length && values[i] != null) {
                result[field] = field === "tax" ? Number(values[i]) || 0 : String(values[i]).trim();
              }
            });
          }
          return {
            name: result.name || "",
            guardian_name: result.guardian_name || "",
            holding_no: result.holding_no || "",
            ward_no: result.ward_no || "",
            village: result.village || "",
            tax: result.tax || 0,
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
