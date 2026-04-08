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
        toast({ title: "Error", description: "Holding card not found.", variant: "destructive" });
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
      toast({ title: "Updated", description: "Holding card updated successfully." });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/holdings"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Holdings</Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Edit Holding Card</CardTitle>
          <CardDescription>Update the holding card details below.</CardDescription>
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
                Save Changes
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/holdings")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditHolding;
