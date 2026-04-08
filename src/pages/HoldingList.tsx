import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus, Loader2, FileUp, Search, MoreHorizontal, Eye, Pencil, Trash2, CreditCard,
  LayoutDashboard, MapPin, Banknote, Users, ChevronLeft, ChevronRight, SlidersHorizontal,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Tables } from "@/integrations/supabase/types";

type HoldingCard = Tables<"holding_cards">;

const HoldingList = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [wardFilter, setWardFilter] = useState("all");
  const [villageFilter, setVillageFilter] = useState("");
  const [holdingFilter, setHoldingFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<HoldingCard | null>(null);

  const { data: holdings, isLoading } = useQuery({
    queryKey: ["holdings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("holding_cards")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("holding_cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holdings"] });
      toast({ title: "Deleted", description: "Holding card removed." });
      setDeleteItem(null);
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });


  const activeFilterCount = [search, villageFilter, wardFilter !== "all" ? wardFilter : "", holdingFilter !== "all" ? holdingFilter : ""].filter(Boolean).length;
  const clearFilters = () => { setSearch(""); setVillageFilter(""); setWardFilter("all"); setHoldingFilter("all"); setPage(1); };

  const filtered = useMemo(() => {
    if (!holdings) return [];
    return holdings.filter((h) => {
      const matchSearch = !search || [h.name, h.guardian_name, h.holding_no, h.village]
        .some((v) => v?.toLowerCase().includes(search.toLowerCase()));
      const matchWard = wardFilter === "all" || h.ward_no === wardFilter;
      const matchVillage = !villageFilter || h.village?.toLowerCase().includes(villageFilter.toLowerCase());
      const matchHolding = holdingFilter === "all" || h.holding_no === holdingFilter;
      return matchSearch && matchWard && matchVillage && matchHolding;
    });
  }, [holdings, search, wardFilter, villageFilter, holdingFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safeePage = Math.min(page, totalPages);
  const paginated = useMemo(() => filtered.slice((safeePage - 1) * perPage, safeePage * perPage), [filtered, safeePage]);

  const totalTax = useMemo(() => filtered.reduce((s, h) => s + Number(h.tax), 0), [filtered]);
  const uniqueVillages = useMemo(() => new Set(filtered.map((h) => h.village)).size, [filtered]);
  const uniqueWards = useMemo(() => new Set(filtered.map((h) => h.ward_no)).size, [filtered]);


  const stats = [
    { label: "মোট হোল্ডিং", value: filtered.length, icon: LayoutDashboard, color: "text-primary" },
    { label: "ওয়ার্ড", value: uniqueWards, icon: MapPin, color: "text-blue-600" },
    { label: "গ্রাম", value: uniqueVillages, icon: Users, color: "text-emerald-600" },
    { label: "মোট কর", value: `৳${totalTax.toLocaleString()}`, icon: Banknote, color: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">হোল্ডিং তালিকা</h2>
          <p className="text-muted-foreground">সকল হোল্ডিং কার্ড পরিচালনা করুন।</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/holdings/import"><FileUp className="mr-2 h-4 w-4" /> ইম্পোর্ট</Link>
          </Button>
          <Button asChild>
            <Link to="/holdings/add"><Plus className="mr-2 h-4 w-4" /> নতুন যোগ</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters - Desktop & Tablet */}
      <Card className="border-dashed hidden sm:block">
        <CardContent className="p-4">
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="নাম, অভিভাবক খুঁজুন..." className="pl-9 bg-background" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="গ্রাম খুঁজুন..." className="pl-9 bg-background" value={villageFilter} onChange={(e) => { setVillageFilter(e.target.value); setPage(1); }} />
            </div>
             <Select value={wardFilter} onValueChange={(v) => { setWardFilter(v); setPage(1); }}>
              <SelectTrigger className="bg-background"><SelectValue placeholder="ওয়ার্ড" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সকল ওয়ার্ড</SelectItem>
                {Array.from({ length: 9 }, (_, i) => String(i + 1)).map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={holdingFilter} onValueChange={(v) => { setHoldingFilter(v); setPage(1); }}>
              <SelectTrigger className="bg-background"><SelectValue placeholder="হোল্ডিং" /></SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">সকল হোল্ডিং</SelectItem>
                {Array.from({ length: 200 }, (_, i) => String(i + 1)).map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {activeFilterCount > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">সক্রিয়:</span>
              {search && <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => { setSearch(""); setPage(1); }}>অনুসন্ধান: {search} <span className="ml-0.5 opacity-60">&times;</span></Badge>}
              {villageFilter && <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => { setVillageFilter(""); setPage(1); }}>গ্রাম: {villageFilter} <span className="ml-0.5 opacity-60">&times;</span></Badge>}
              {wardFilter !== "all" && <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => { setWardFilter("all"); setPage(1); }}>ওয়ার্ড: {wardFilter} <span className="ml-0.5 opacity-60">&times;</span></Badge>}
              {holdingFilter !== "all" && <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => { setHoldingFilter("all"); setPage(1); }}>হোল্ডিং: {holdingFilter} <span className="ml-0.5 opacity-60">&times;</span></Badge>}
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={clearFilters}>সব মুছুন</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters - Mobile */}
      {/* Filters - Mobile */}
      <Card className="border-dashed sm:hidden">
        <CardContent className="p-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="খুঁজুন..." className="pl-9 bg-background" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 relative">
                  <SlidersHorizontal className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle>ফিল্টার</SheetTitle>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-1.5">
                     <Label className="text-xs text-muted-foreground">গ্রাম</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="গ্রাম খুঁজুন..." className="pl-9" value={villageFilter} onChange={(e) => { setVillageFilter(e.target.value); setPage(1); }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">ওয়ার্ড</Label>
                      <Select value={wardFilter} onValueChange={(v) => { setWardFilter(v); setPage(1); }}>
                        <SelectTrigger><SelectValue placeholder="ওয়ার্ড" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">সকল ওয়ার্ড</SelectItem>
                          {Array.from({ length: 9 }, (_, i) => String(i + 1)).map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">হোল্ডিং</Label>
                      <Select value={holdingFilter} onValueChange={(v) => { setHoldingFilter(v); setPage(1); }}>
                        <SelectTrigger><SelectValue placeholder="হোল্ডিং" /></SelectTrigger>
                        <SelectContent className="max-h-60">
                          <SelectItem value="all">সকল হোল্ডিং</SelectItem>
                          {Array.from({ length: 200 }, (_, i) => String(i + 1)).map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={clearFilters}>সব মুছুন</Button>
                    <Button className="flex-1" onClick={() => setFilterOpen(false)}>প্রয়োগ করুন</Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          {activeFilterCount > 0 && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {search && <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => { setSearch(""); setPage(1); }}>অনুসন্ধান: {search} <span className="ml-0.5 opacity-60">&times;</span></Badge>}
              {villageFilter && <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => { setVillageFilter(""); setPage(1); }}>গ্রাম: {villageFilter} <span className="ml-0.5 opacity-60">&times;</span></Badge>}
              {wardFilter !== "all" && <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => { setWardFilter("all"); setPage(1); }}>ওয়ার্ড: {wardFilter} <span className="ml-0.5 opacity-60">&times;</span></Badge>}
              {holdingFilter !== "all" && <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => { setHoldingFilter("all"); setPage(1); }}>হোল্ডিং: {holdingFilter} <span className="ml-0.5 opacity-60">&times;</span></Badge>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !filtered.length ? (
        <div className="py-16 text-center text-muted-foreground">
         {holdings?.length ? "ফিল্টারের সাথে কোনো ফলাফল মেলেনি।" : "এখনো কোনো হোল্ডিং কার্ড নেই। প্রথমটি যোগ করুন!"}
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="grid gap-3 grid-cols-1 md:hidden">
            {paginated.map((h, i) => (
              <Card key={h.id} className="overflow-hidden">
                <div className="flex items-start justify-between p-4 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                      {(safeePage - 1) * perPage + i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground leading-tight">{h.name}</p>
                      <p className="text-xs text-muted-foreground">পিতা: {h.guardian_name}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       <DropdownMenuItem onClick={() => navigate(`/holdings/${h.id}`)}>
                        <Eye className="mr-2 h-4 w-4" /> দেখুন
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/holdings/card/${h.id}`)}>
                        <CreditCard className="mr-2 h-4 w-4" /> কার্ড দেখুন
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/holdings/edit/${h.id}`)}>
                        <Pencil className="mr-2 h-4 w-4" /> সম্পাদনা
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteItem(h)}>
                        <Trash2 className="mr-2 h-4 w-4" /> মুছুন
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="grid grid-cols-3 gap-2 px-4 pb-3">
                   <div className="rounded-md bg-muted/50 px-2.5 py-1.5 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">হোল্ডিং</p>
                    <p className="text-sm font-semibold text-foreground">{h.holding_no}</p>
                  </div>
                  <div className="rounded-md bg-muted/50 px-2.5 py-1.5 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">ওয়ার্ড</p>
                    <p className="text-sm font-semibold text-foreground">{h.ward_no}</p>
                  </div>
                  <div className="rounded-md bg-muted/50 px-2.5 py-1.5 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">কর</p>
                    <p className="text-sm font-semibold text-primary">৳{Number(h.tax).toLocaleString()}</p>
                  </div>
                </div>
                <div className="border-t px-4 py-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {h.village}
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-10 text-center">#</TableHead>
                      <TableHead>নাম</TableHead>
                      <TableHead>অভিভাবক</TableHead>
                      <TableHead>হোল্ডিং</TableHead>
                      <TableHead>ওয়ার্ড</TableHead>
                      <TableHead>গ্রাম</TableHead>
                      <TableHead className="text-right">কর (৳)</TableHead>
                      <TableHead className="w-12 text-center">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((h, i) => (
                      <TableRow key={h.id}>
                        <TableCell className="text-center text-xs text-muted-foreground font-mono">{(safeePage - 1) * perPage + i + 1}</TableCell>
                        <TableCell className="font-medium">{h.name}</TableCell>
                        <TableCell>{h.guardian_name}</TableCell>
                        <TableCell><Badge variant="outline">{h.holding_no}</Badge></TableCell>
                        <TableCell><Badge variant="secondary">{h.ward_no}</Badge></TableCell>
                        <TableCell>{h.village}</TableCell>
                        <TableCell className="text-right font-mono">{Number(h.tax).toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/holdings/${h.id}`)}>
                                <Eye className="mr-2 h-4 w-4" /> দেখুন
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/holdings/card/${h.id}`)}>
                                <CreditCard className="mr-2 h-4 w-4" /> কার্ড দেখুন
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/holdings/edit/${h.id}`)}>
                                <Pencil className="mr-2 h-4 w-4" /> সম্পাদনা
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteItem(h)}>
                                <Trash2 className="mr-2 h-4 w-4" /> মুছুন
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                দেখাচ্ছে {(safeePage - 1) * perPage + 1}–{Math.min(safeePage * perPage, filtered.length)} / {filtered.length}
              </p>
              <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">প্রতি পৃষ্ঠায়</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={safeePage <= 1} onClick={() => setPage(safeePage - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - safeePage) <= 1)
                .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("ellipsis");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "ellipsis" ? (
                    <span key={`e${idx}`} className="px-1 text-muted-foreground">…</span>
                  ) : (
                    <Button key={p} variant={p === safeePage ? "default" : "outline"} size="icon" className="h-8 w-8 text-xs" onClick={() => setPage(p)}>
                      {p}
                    </Button>
                  )
                )}
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={safeePage >= totalPages} onClick={() => setPage(safeePage + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-lg">হোল্ডিং কার্ড মুছুন</DialogTitle>
            <DialogDescription className="pt-1">
              আপনি কি নিশ্চিত যে <span className="font-semibold text-foreground">{deleteItem?.name}</span>
              {deleteItem?.holding_no && (
                <> (হোল্ডিং #{deleteItem.holding_no})</>
              )} এর হোল্ডিং কার্ড মুছতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteItem(null)}>
              বাতিল
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteItem && deleteMutation.mutate(deleteItem.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              মুছুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default HoldingList;

