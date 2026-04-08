import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { Loader2, LogOut, List, PlusCircle } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const DashboardLayout = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const initials = user.email ? user.email.substring(0, 2).toUpperCase() : "U";

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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 max-w-[calc(100vw-1rem)]">
                  <DropdownMenuLabel className="font-normal">
                    <p className="truncate text-sm font-medium">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/holdings")}>
                    <List className="mr-2 h-4 w-4" />
                    হোল্ডিং তালিকা
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/holdings/add")}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    নতুন হোল্ডিং
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    লগ আউট
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

