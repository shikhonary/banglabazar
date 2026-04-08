import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AddHolding from "./pages/AddHolding";
import HoldingList from "./pages/HoldingList";
import ImportHoldings from "./pages/ImportHoldings";
import EditHolding from "./pages/EditHolding";
import ViewHolding from "./pages/ViewHolding";
import HoldingCardView from "./pages/HoldingCardView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/holdings" element={<HoldingList />} />
              <Route path="/holdings/add" element={<AddHolding />} />
              <Route path="/holdings/edit/:id" element={<EditHolding />} />
              <Route path="/holdings/card/:id" element={<HoldingCardView />} />
              <Route path="/holdings/:id" element={<ViewHolding />} />
              <Route path="/holdings/import" element={<ImportHoldings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
