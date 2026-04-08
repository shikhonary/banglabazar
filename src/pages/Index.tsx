import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  MapPin,
  Banknote,
  Users,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  CreditCard,
  FileUp,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CHART_COLORS = [
  "hsl(230, 70%, 55%)",
  "hsl(160, 60%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(340, 65%, 55%)",
  "hsl(200, 70%, 50%)",
  "hsl(280, 60%, 55%)",
  "hsl(15, 75%, 55%)",
  "hsl(175, 55%, 45%)",
  "hsl(50, 80%, 50%)",
];

const Index = () => {
  const { data: holdings, isLoading } = useQuery({
    queryKey: ["dashboard-holdings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("holding_cards")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const stats = useMemo(() => {
    if (!holdings) return { total: 0, totalTax: 0, villages: 0, wards: 0 };
    const villages = new Set(holdings.map((h) => h.village));
    const wards = new Set(holdings.map((h) => h.ward_no));
    const totalTax = holdings.reduce((s, h) => s + Number(h.tax), 0);
    return { total: holdings.length, totalTax, villages: villages.size, wards: wards.size };
  }, [holdings]);

  const wardData = useMemo(() => {
    if (!holdings) return [];
    const map = new Map<string, { count: number; tax: number }>();
    holdings.forEach((h) => {
      const existing = map.get(h.ward_no) || { count: 0, tax: 0 };
      map.set(h.ward_no, { count: existing.count + 1, tax: existing.tax + Number(h.tax) });
    });
    return Array.from(map.entries())
      .map(([ward, v]) => ({ ward: `ওয়ার্ড ${ward}`, count: v.count, tax: v.tax }))
      .sort((a, b) => a.ward.localeCompare(b.ward));
  }, [holdings]);

  const villageData = useMemo(() => {
    if (!holdings) return [];
    const map = new Map<string, number>();
    holdings.forEach((h) => map.set(h.village, (map.get(h.village) || 0) + 1));
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [holdings]);

  const recentHoldings = useMemo(() => (holdings || []).slice(0, 5), [holdings]);

  const statCards = [
    {
      label: "মোট হোল্ডিং",
      value: stats.total,
      icon: LayoutDashboard,
      gradient: "from-primary/10 to-primary/5",
      iconColor: "text-primary",
      border: "border-primary/20",
    },
    {
      label: "মোট কর",
      value: `৳${stats.totalTax.toLocaleString()}`,
      icon: Banknote,
      gradient: "from-amber-500/10 to-amber-500/5",
      iconColor: "text-amber-600",
      border: "border-amber-200",
    },
    {
      label: "গ্রাম/মহল্লা",
      value: stats.villages,
      icon: Users,
      gradient: "from-emerald-500/10 to-emerald-500/5",
      iconColor: "text-emerald-600",
      border: "border-emerald-200",
    },
    {
      label: "ওয়ার্ড সংখ্যা",
      value: stats.wards,
      icon: MapPin,
      gradient: "from-blue-500/10 to-blue-500/5",
      iconColor: "text-blue-600",
      border: "border-blue-200",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">ড্যাশবোর্ড</h2>
          <p className="text-sm text-muted-foreground">হোল্ডিং কার্ড ম্যানেজমেন্ট সিস্টেমের সারসংক্ষেপ</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/holdings/import">
              <FileUp className="mr-2 h-4 w-4" /> ইম্পোর্ট
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/holdings/add">
              <PlusCircle className="mr-2 h-4 w-4" /> নতুন হোল্ডিং
            </Link>
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card
            key={s.label}
            className={`relative overflow-hidden border ${s.border} bg-gradient-to-br ${s.gradient}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{s.value}</p>
                </div>
                <div className={`rounded-xl bg-background/80 p-2.5 shadow-sm ${s.iconColor}`}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Bar chart - ward distribution */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">ওয়ার্ড ভিত্তিক হোল্ডিং</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {wardData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={wardData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="ward"
                    tick={{ fontSize: 11, fill: "hsl(220, 10%, 45%)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(220, 10%, 45%)" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(220, 15%, 90%)",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [value, "হোল্ডিং"]}
                  />
                  <Bar dataKey="count" fill="hsl(230, 70%, 55%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                ডাটা নেই
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie chart - village distribution */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">গ্রাম ভিত্তিক বিন্যাস</CardTitle>
          </CardHeader>
          <CardContent>
            {villageData.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={villageData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {villageData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(220, 15%, 90%)",
                        fontSize: 12,
                      }}
                      formatter={(value: number, _: string, entry: { payload: { name: string } }) => [
                        value,
                        entry.payload.name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
                  {villageData.map((v, i) => (
                    <div key={v.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      {v.name} ({v.value})
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                ডাটা নেই
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent holdings */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">সাম্প্রতিক হোল্ডিং</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground">
              <Link to="/holdings">
                সব দেখুন <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">লোড হচ্ছে...</div>
          ) : recentHoldings.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              এখনো কোনো হোল্ডিং কার্ড নেই
            </div>
          ) : (
            <div className="divide-y">
              {recentHoldings.map((h) => (
                <Link
                  key={h.id}
                  to={`/holdings/card/${h.id}`}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50 sm:px-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <CreditCard className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{h.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ওয়ার্ড {h.ward_no} • {h.village}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-foreground">৳{Number(h.tax).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">#{h.holding_no}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <Link to="/holdings/add">
          <Card className="cursor-pointer border-dashed transition-all hover:border-primary/40 hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <PlusCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">নতুন হোল্ডিং যোগ</p>
                <p className="text-xs text-muted-foreground">নতুন হোল্ডিং কার্ড তৈরি করুন</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/holdings/import">
          <Card className="cursor-pointer border-dashed transition-all hover:border-emerald-400/40 hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <FileUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">এক্সেল ইম্পোর্ট</p>
                <p className="text-xs text-muted-foreground">বাল্ক ডাটা আপলোড করুন</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/holdings">
          <Card className="cursor-pointer border-dashed transition-all hover:border-blue-400/40 hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <LayoutDashboard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">সকল হোল্ডিং</p>
                <p className="text-xs text-muted-foreground">হোল্ডিং তালিকা দেখুন</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default Index;
