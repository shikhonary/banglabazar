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
        toast({ title: "ত্রুটি", description: "হোল্ডিং কার্ড পাওয়া যায়নি।", variant: "destructive" });
        navigate("/holdings");
        return;
      }
      setHolding(data);
      setLoading(false);
    };
    fetch();
  }, [id, navigate, toast]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    const { error } = await supabase.from("holding_cards").delete().eq("id", id);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
      setDeleting(false);
      return;
    }
    toast({ title: "মুছে ফেলা হয়েছে", description: "হোল্ডিং কার্ড সরানো হয়েছে।" });
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

  const createdDate = new Date(holding.created_at).toLocaleDateString("bn-BD", {
    year: "numeric", month: "long", day: "numeric",
  });
  const updatedDate = new Date(holding.updated_at).toLocaleDateString("bn-BD", {
    year: "numeric", month: "long", day: "numeric",
  });

  const details = [
    { icon: User, label: "কার্ডধারীর নাম", value: holding.name },
    { icon: Shield, label: "অভিভাবকের নাম", value: holding.guardian_name },
    { icon: Hash, label: "হোল্ডিং নং", value: holding.holding_no, badge: true },
    { icon: Home, label: "ওয়ার্ড নং", value: holding.ward_no, badge: true },
    { icon: MapPin, label: "গ্রাম/মহল্লা", value: holding.village },
    { icon: Banknote, label: "করের পরিমাণ", value: `৳${Number(holding.tax).toLocaleString()}`, highlight: true },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" asChild className="self-start">
          <Link to="/holdings">
            <ArrowLeft className="mr-2 h-4 w-4" /> হোল্ডিং তালিকায় ফিরুন
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none" asChild>
            <Link to={`/holdings/edit/${holding.id}`}>
              <Pencil className="mr-2 h-4 w-4" /> সম্পাদনা
            </Link>
          </Button>
          <Button variant="destructive" size="sm" className="flex-1 sm:flex-none" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> মুছুন
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-accent/30 to-primary/5 px-4 py-6 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary shrink-0">
              <User className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <div className="space-y-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{holding.name}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                পিতা: <span className="font-medium text-foreground/80">{holding.guardian_name}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="secondary" className="font-mono text-xs">
                  হোল্ডিং #{holding.holding_no}
                </Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  ওয়ার্ড {holding.ward_no}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {details.map((item, i) => (
              <div
                key={item.label}
                className={`flex items-center gap-3 px-4 py-4 sm:px-6 sm:py-5 border-b last:border-b-0 sm:last:border-b-0 ${
                  i % 2 === 0 ? "sm:border-r" : ""
                } ${i >= details.length - 2 ? "sm:border-b-0" : "sm:border-b"}`}
              >
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-muted shrink-0">
                  <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </p>
                  {item.badge ? (
                    <Badge variant="secondary" className="mt-0.5 font-mono text-xs sm:text-sm">
                      {item.value}
                    </Badge>
                  ) : item.highlight ? (
                    <p className="mt-0.5 text-base sm:text-lg font-bold text-primary">{item.value}</p>
                  ) : (
                    <p className="mt-0.5 text-sm sm:text-base font-semibold text-foreground truncate">{item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex flex-col gap-2 px-4 py-3 sm:px-6 sm:py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>তৈরি: <span className="font-medium text-foreground/80">{createdDate}</span></span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>আপডেট: <span className="font-medium text-foreground/80">{updatedDate}</span></span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle>হোল্ডিং কার্ড মুছুন</DialogTitle>
            <DialogDescription className="pt-1">
              আপনি কি নিশ্চিত যে <span className="font-semibold text-foreground">{holding.name}</span>
              {" "}(হোল্ডিং #{holding.holding_no}) এর হোল্ডিং কার্ড মুছতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>বাতিল</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              মুছুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewHolding;
