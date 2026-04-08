import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const AddHolding = () => {
  const { user } = useAuth();
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
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("holding_cards").insert({
        user_id: user.id,
        name: form.name,
        guardian_name: form.guardian_name,
        ward_no: form.ward_no,
        holding_no: form.holding_no,
        village: form.village,
        tax: Number(form.tax) || 0,
      });
      if (error) throw error;
      toast({ title: "Success", description: "Holding card added successfully." });
      navigate("/holdings");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    { name: "name", label: "Name", type: "text", placeholder: "Card holder name" },
    { name: "guardian_name", label: "Guardian Name", type: "text", placeholder: "Father/Guardian name" },
    { name: "ward_no", label: "Ward No", type: "text", placeholder: "Ward number" },
    { name: "holding_no", label: "Holding No", type: "text", placeholder: "Holding number" },
    { name: "village", label: "Village", type: "text", placeholder: "Village name" },
    { name: "tax", label: "Tax (৳)", type: "number", placeholder: "Tax amount" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add Holding Card</CardTitle>
          <CardDescription>Fill in the details to create a new holding card.</CardDescription>
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
                Add Holding Card
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddHolding;
