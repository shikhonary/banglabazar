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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  Plus, Loader2, FileUp, Search, MoreHorizontal, Eye, Pencil, Trash2,
  LayoutDashboard, MapPin, Banknote, Users, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type HoldingCard = Tables<"holding_cards">;

const HoldingList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [wardFilter, setWardFilter] = useState("all");
  const [villageFilter, setVillageFilter] = useState("");
  const [holdingFilter, setHoldingFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [viewItem, setViewItem] = useState<HoldingCard | null>(null);
  const [editItem, setEditItem] = useState<HoldingCard | null>(null);
  const [editForm, setEditForm] = useState({ name: "", guardian_name: "", ward_no: "", holding_no: "", village: "", tax: "" });

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
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<HoldingCard> }) => {
      const { error } = await supabase.from("holding_cards").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holdings"] });
      toast({ title: "Updated", description: "Holding card updated." });
      setEditItem(null);
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const wards = useMemo(() => [...new Set(holdings?.map((h) => h.ward_no).filter(Boolean))].sort(), [holdings]);
  const villages = useMemo(() => [...new Set(holdings?.map((h) => h.village).filter(Boolean))].sort(), [holdings]);

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

  const openEdit = (h: HoldingCard) => {
    setEditItem(h);
    setEditForm({ name: h.name, guardian_name: h.guardian_name, ward_no: h.ward_no, holding_no: h.holding_no, village: h.village, tax: String(h.tax) });
  };

  const saveEdit = () => {
    if (!editItem) return;
    updateMutation.mutate({
      id: editItem.id,
      data: { ...editForm, tax: Number(editForm.tax) || 0 },
    });
  };

  const stats = [
    { label: "Total Holdings", value: filtered.length, icon: LayoutDashboard, color: "text-primary" },
    { label: "Wards", value: uniqueWards, icon: MapPin, color: "text-blue-600" },
    { label: "Villages", value: uniqueVillages, icon: Users, color: "text-emerald-600" },
    { label: "Total Tax", value: `৳${totalTax.toLocaleString()}`, icon: Banknote, color: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Holding Cards</h2>
          <p className="text-muted-foreground">Manage all holding card records.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/holdings/import"><FileUp className="mr-2 h-4 w-4" /> Import</Link>
          </Button>
          <Button asChild>
            <Link to="/holdings/add"><Plus className="mr-2 h-4 w-4" /> Add New</Link>
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

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, guardian..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={wardFilter} onValueChange={(v) => { setWardFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Ward" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Wards</SelectItem>
            {Array.from({ length: 9 }, (_, i) => String(i + 1)).map((w) => (
              <SelectItem key={w} value={w}>{`Ward ${w}`}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Filter by village..."
          className="w-full sm:w-44"
          value={villageFilter}
          onChange={(e) => { setVillageFilter(e.target.value); setPage(1); }}
        />
        <Select value={holdingFilter} onValueChange={(v) => { setHoldingFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Holding" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="all">All Holdings</SelectItem>
            {Array.from({ length: 200 }, (_, i) => String(i + 1)).map((h) => (
              <SelectItem key={h} value={h}>{`Holding ${h}`}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !filtered.length ? (
        <div className="py-16 text-center text-muted-foreground">
          {holdings?.length ? "No results match your filters." : "No holding cards yet. Add your first one!"}
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
                      <p className="text-xs text-muted-foreground">s/o {h.guardian_name}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewItem(h)}>
                        <Eye className="mr-2 h-4 w-4" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(h)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteMutation.mutate(h.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="grid grid-cols-3 gap-2 px-4 pb-3">
                  <div className="rounded-md bg-muted/50 px-2.5 py-1.5 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Holding</p>
                    <p className="text-sm font-semibold text-foreground">{h.holding_no}</p>
                  </div>
                  <div className="rounded-md bg-muted/50 px-2.5 py-1.5 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ward</p>
                    <p className="text-sm font-semibold text-foreground">{h.ward_no}</p>
                  </div>
                  <div className="rounded-md bg-muted/50 px-2.5 py-1.5 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tax</p>
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
                      <TableHead>Name</TableHead>
                      <TableHead>Guardian</TableHead>
                      <TableHead>Holding</TableHead>
                      <TableHead>Ward</TableHead>
                      <TableHead>Village</TableHead>
                      <TableHead className="text-right">Tax (৳)</TableHead>
                      <TableHead className="w-12 text-center">Actions</TableHead>
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
                              <DropdownMenuItem onClick={() => setViewItem(h)}>
                                <Eye className="mr-2 h-4 w-4" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(h)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteMutation.mutate(h.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
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
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(safeePage - 1) * perPage + 1}–{Math.min(safeePage * perPage, filtered.length)} of {filtered.length}
            </p>
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

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Holding Card Details</DialogTitle>
            <DialogDescription>Full details for this holding card.</DialogDescription>
          </DialogHeader>
          {viewItem && (
            <div className="grid gap-3 text-sm">
              {[
                ["Name", viewItem.name],
                ["Guardian", viewItem.guardian_name],
                ["Holding No", viewItem.holding_no],
                ["Ward No", viewItem.ward_no],
                ["Village", viewItem.village],
                ["Tax", `৳${Number(viewItem.tax).toLocaleString()}`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b pb-2 last:border-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Holding Card</DialogTitle>
            <DialogDescription>Update the holding card details below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { key: "name", label: "Name", type: "text" },
              { key: "guardian_name", label: "Guardian Name", type: "text" },
              { key: "holding_no", label: "Holding No", type: "text" },
              { key: "ward_no", label: "Ward No", type: "text" },
              { key: "village", label: "Village", type: "text" },
              { key: "tax", label: "Tax (৳)", type: "number" },
            ].map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                <Input
                  type={f.type}
                  value={editForm[f.key as keyof typeof editForm]}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HoldingList;
