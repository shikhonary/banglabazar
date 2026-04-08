import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Plus, Trash2, Loader2 } from "lucide-react";
import ExcelImport from "@/components/ExcelImport";

const HoldingList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ["holdings-count"] });
      queryClient.invalidateQueries({ queryKey: ["holdings-tax"] });
      toast({ title: "Deleted", description: "Holding card removed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Holding Cards</h2>
          <p className="text-muted-foreground">Manage all holding card records.</p>
        </div>
        <Button asChild>
          <Link to="/holdings/add">
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Link>
        </Button>
      </div>

      <ExcelImport />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !holdings?.length ? (
            <div className="py-12 text-center text-muted-foreground">
              No holding cards yet. Add your first one!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Guardian</TableHead>
                  <TableHead>Ward</TableHead>
                  <TableHead>Holding No</TableHead>
                  <TableHead>Village</TableHead>
                  <TableHead className="text-right">Tax (৳)</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.name}</TableCell>
                    <TableCell>{h.guardian_name}</TableCell>
                    <TableCell>{h.ward_no}</TableCell>
                    <TableCell>{h.holding_no}</TableCell>
                    <TableCell>{h.village}</TableCell>
                    <TableCell className="text-right">{Number(h.tax).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(h.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HoldingList;
