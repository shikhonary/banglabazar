import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const AddHolding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    guardian_name: "",
    ward_no: "",
    holding_no: "",
    village: "",
    tax: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from("holding_cards").insert({
        name: form.name,
        guardian_name: form.guardian_name,
        ward_no: form.ward_no,
        holding_no: form.holding_no,
        village: form.village,
        tax: Number(form.tax) || 0,
      });
      if (error) throw error;
      toast({ title: "সফল!", description: "হোল্ডিং কার্ড সফলভাবে যোগ হয়েছে।" });
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

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>নতুন হোল্ডিং কার্ড</CardTitle>
          <CardDescription>নতুন হোল্ডিং কার্ড তৈরি করতে তথ্য পূরণ করুন।</CardDescription>
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
            <div className="sm:col-span-2 pt-2">
              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                হোল্ডিং কার্ড যোগ করুন
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddHolding;
