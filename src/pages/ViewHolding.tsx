import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Pencil, Trash2, Loader2, MapPin, User, Shield,
  Hash, Home, Banknote, CalendarDays,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import type { Tables } from "@/integrations/supabase/types";

type HoldingCard = Tables<"holding_cards">;

const ViewHolding = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [holding, setHolding] = useState<HoldingCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
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
      setHolding(data);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    const { error } = await supabase.from("holding_cards").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setDeleting(false);
      return;
    }
    toast({ title: "Deleted", description: "Holding card removed." });
    navigate("/holdings");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!holding) return null;

  const createdDate = new Date(holding.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const updatedDate = new Date(holding.updated_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const details = [
    { icon: User, label: "Holder Name", value: holding.name },
    { icon: Shield, label: "Guardian Name", value: holding.guardian_name },
    { icon: Hash, label: "Holding No", value: holding.holding_no, badge: true },
    { icon: Home, label: "Ward No", value: holding.ward_no, badge: true },
    { icon: MapPin, label: "Village", value: holding.village },
    { icon: Banknote, label: "Tax Amount", value: `৳${Number(holding.tax).toLocaleString()}`, highlight: true },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/holdings">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Holdings
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/holdings/edit/${holding.id}`}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Hero Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-accent/30 to-primary/5 px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary shrink-0">
              <User className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">{holding.name}</h1>
              <p className="text-muted-foreground">
                s/o <span className="font-medium text-foreground/80">{holding.guardian_name}</span>
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Badge variant="secondary" className="font-mono">
                  Holding #{holding.holding_no}
                </Badge>
                <Badge variant="outline" className="font-mono">
                  Ward {holding.ward_no}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {/* Details Grid */}
          <div className="grid divide-y sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
            {details.map((item, i) => (
              <div
                key={item.label}
                className={`flex items-center gap-4 px-6 py-5 ${
                  i >= details.length - 2 ? "" : "sm:border-b"
                } ${i % 2 === 0 && i < details.length - 2 ? "sm:border-b" : ""}`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted shrink-0">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </p>
                  {item.badge ? (
                    <Badge variant="secondary" className="mt-1 font-mono text-sm">
                      {item.value}
                    </Badge>
                  ) : item.highlight ? (
                    <p className="mt-0.5 text-lg font-bold text-primary">{item.value}</p>
                  ) : (
                    <p className="mt-0.5 text-base font-semibold text-foreground">{item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>Created: <span className="font-medium text-foreground/80">{createdDate}</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>Updated: <span className="font-medium text-foreground/80">{updatedDate}</span></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle>Delete Holding Card</DialogTitle>
            <DialogDescription className="pt-1">
              Are you sure you want to delete the holding card for{" "}
              <span className="font-semibold text-foreground">{holding.name}</span>
              {" "}(Holding #{holding.holding_no})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewHolding;
