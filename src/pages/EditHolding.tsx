import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const EditHolding = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    guardian_name: "",
    ward_no: "",
    holding_no: "",
    village: "",
    tax: "",
  });

  useEffect(() => {
    const fetchHolding = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("holding_cards")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        toast({ title: "ত্রুটি", description: "হোল্ডিং কার্ড পাওয়া যায়নি।", variant: "destructive" });
        navigate("/holdings");
        return;
      }
      setForm({
        name: data.name,
        guardian_name: data.guardian_name,
        ward_no: data.ward_no,
        holding_no: data.holding_no,
        village: data.village,
        tax: String(data.tax),
      });
      setLoading(false);
    };
    fetchHolding();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("holding_cards")
        .update({
          name: form.name,
          guardian_name: form.guardian_name,
          ward_no: form.ward_no,
          holding_no: form.holding_no,
          village: form.village,
          tax: Number(form.tax) || 0,
        })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "সফল!", description: "হোল্ডিং কার্ড সফলভাবে আপডেট হয়েছে।" });
      navigate("/holdings");
    } catch (error: any) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    { name: "name", label: "নাম", type: "text", placeholder: "কার্ডধারীর নাম" },
    { name: "guardian_name", label: "অভিভাবকের নাম", type: "text", placeholder: "পিতা/অভিভাবকের নাম" },
    { name: "ward_no", label: "ওয়ার্ড নং", type: "text", placeholder: "ওয়ার্ড নম্বর" },
    { name: "holding_no", label: "হোল্ডিং নং", type: "text", placeholder: "হোল্ডিং নম্বর" },
    { name: "village", label: "গ্রাম/মহল্লা", type: "text", placeholder: "গ্রামের নাম" },
    { name: "tax", label: "কর (৳)", type: "number", placeholder: "করের পরিমাণ" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/holdings"><ArrowLeft className="mr-2 h-4 w-4" /> হোল্ডিং তালিকায় ফিরুন</Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>হোল্ডিং কার্ড সম্পাদনা</CardTitle>
          <CardDescription>নিচের তথ্য আপডেট করুন।</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <Label htmlFor={field.name}>{field.label}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form[field.name as keyof typeof form]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}
            <div className="sm:col-span-2 pt-2 flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                সংরক্ষণ করুন
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/holdings")}>
                বাতিল
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditHolding;
