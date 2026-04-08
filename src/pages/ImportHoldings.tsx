import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Upload, Loader2, FileSpreadsheet, CheckCircle2, X, FileUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as XLSX from "xlsx";

const normalizeHeader = (value: string) =>
  value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();

const HEADER_MAP: Record<string, string> = {
  [normalizeHeader("নাম")]: "name",
  [normalizeHeader("পিতা/স্বামীর নাম")]: "guardian_name",
  [normalizeHeader("অভিভাবক")]: "guardian_name",
  [normalizeHeader("হোল্ডিং নং")]: "holding_no",
  [normalizeHeader("হোল্ডিং")]: "holding_no",
  [normalizeHeader("ওয়ার্ড নং")]: "ward_no",
  [normalizeHeader("ওয়ার্ড নং")]: "ward_no",
  [normalizeHeader("ওয়ার্ড")]: "ward_no",
  [normalizeHeader("ওয়ার্ড")]: "ward_no",
  [normalizeHeader("গ্রামের নাম")]: "village",
  [normalizeHeader("গ্রাম")]: "village",
  [normalizeHeader("ধার্যকৃত বাৎসরিক কর")]: "tax",
  [normalizeHeader("কর")]: "tax",
  [normalizeHeader("bvg")]: "name",
  [normalizeHeader("wcZv/¯^vgxi bvg")]: "guardian_name",
  [normalizeHeader("†nvwìs bs")]: "holding_no",
  [normalizeHeader("IqvW© bs")]: "ward_no",
  [normalizeHeader("MÖv‡gi bvg")]: "village",
  [normalizeHeader("avh©K…Z evrmwiK Ki")]: "tax",
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

const ImportHoldings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<HoldingRow[]>([]);

  const parseFile = (file: File) => {
    setFileName(file.name);
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
                    toast({ title: "ত্রুটি", description: "সঠিক সারি পাওয়া যায়নি। কলাম হেডার চেক করুন।", variant: "destructive" });
          return;
        }
        setPreview(valid);
      } catch {
        toast({ title: "ত্রুটি", description: "ফাইল পার্স করতে সমস্যা হয়েছে।", variant: "destructive" });
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
      toast({ title: "সফল!", description: `${rows.length}টি হোল্ডিং কার্ড সফলভাবে ইম্পোর্ট হয়েছে।` });
      queryClient.invalidateQueries({ queryKey: ["holdings"] });
      queryClient.invalidateQueries({ queryKey: ["holdings-count"] });
      queryClient.invalidateQueries({ queryKey: ["holdings-tax"] });
      navigate("/holdings");
    } catch (error: unknown) {
      toast({ title: "ত্রুটি", description: error instanceof Error ? error.message : "ইম্পোর্ট ব্যর্থ হয়েছে", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const clearPreview = () => {
    setPreview([]);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">হোল্ডিং ইম্পোর্ট</h2>
        <p className="text-muted-foreground">এক্সেল বা CSV ফাইল আপলোড করে বাল্ক ইম্পোর্ট করুন।</p>
      </div>

      {/* Upload area */}
      {preview.length === 0 && (
        <Card>
          <CardContent className="p-0">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-border p-12 text-center transition-colors hover:border-primary hover:bg-accent/30"
            >
              <div className="rounded-full bg-accent p-4">
                <FileUp className="h-8 w-8 text-primary" />
              </div>
              <div>
               <p className="text-lg font-medium text-foreground">এক্সেল বা CSV ফাইল আপলোড করতে ক্লিক করুন</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  .xlsx, .xls এবং .csv ফরম্যাট সাপোর্ট করে
                </p>
              </div>
            </button>
          </CardContent>
        </Card>
      )}

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

      {/* Preview */}
      {preview.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-accent p-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{fileName}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    {preview.length}টি সারি ইম্পোর্টের জন্য প্রস্তুত
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={clearPreview}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>নাম</TableHead>
                    <TableHead>অভিভাবক</TableHead>
                    <TableHead>হোল্ডিং নং</TableHead>
                    <TableHead>ওয়ার্ড নং</TableHead>
                    <TableHead>গ্রাম</TableHead>
                    <TableHead className="text-right">কর (৳)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((r, i) => (
                    <TableRow key={i} className="group">
                      <TableCell className="text-center text-muted-foreground font-mono text-xs">
                        {i + 1}
                      </TableCell>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.guardian_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.holding_no}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{r.ward_no || "—"}</Badge>
                      </TableCell>
                      <TableCell>{r.village}</TableCell>
                      <TableCell className="text-right font-mono">
                        {r.tax.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between border-t px-6 py-4">
              <p className="text-sm text-muted-foreground">
                মোট কর: <span className="font-semibold text-foreground">৳{preview.reduce((s, r) => s + r.tax, 0).toLocaleString()}</span>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={clearPreview}>বাতিল</Button>
                <Button onClick={handleImport} disabled={importing}>
                  {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {preview.length}টি হোল্ডিং ইম্পোর্ট
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImportHoldings;
