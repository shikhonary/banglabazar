import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, LayoutDashboard, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { data: holdings } = useQuery({
    queryKey: ["holdings-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("holding_cards")
        .select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: totalTax } = useQuery({
    queryKey: ["holdings-tax"],
    queryFn: async () => {
      const { data } = await supabase.from("holding_cards").select("tax");
      return data?.reduce((sum, r) => sum + Number(r.tax), 0) ?? 0;
    },
  });

  const stats = [
    { label: "Total Holdings", value: String(holdings ?? 0), icon: LayoutDashboard },
    { label: "Total Tax", value: `৳${totalTax?.toLocaleString() ?? 0}`, icon: BarChart3 },
    { label: "Villages", value: "—", icon: Users },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your holding cards.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Index;
