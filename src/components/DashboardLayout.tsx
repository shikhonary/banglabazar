import { Outlet, useNavigate } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";

const DashboardLayout = () => {
  const navigate = useNavigate();


  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 shrink-0 border-b bg-card">
            <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-4">
              <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger className="shrink-0" />
                <h1 className="truncate text-base font-bold text-foreground sm:text-lg">হোল্ডিং কার্ড ম্যানেজার</h1>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/holdings/add")}
                className="hidden sm:flex"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                নতুন হোল্ডিং
              </Button>
            </div>
          </header>
          <main className="container flex-1 overflow-y-auto overflow-x-hidden py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;

