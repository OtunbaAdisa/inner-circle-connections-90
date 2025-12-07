import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import SuperAdminLogin from "./pages/admin/SuperAdminLogin";
import AdminDashboard from "./pages/admin/Dashboard";
import EventManagement from "./pages/admin/EventManagement";
import TableManagement from "./pages/admin/TableManagement";
import LogoManagement from "./pages/admin/LogoManagement";
import EventPage from "./pages/event/EventPage";
import CheckIn from "./pages/event/CheckIn";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin/login" element={<SuperAdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/events" element={<EventManagement />} />
            <Route path="/admin/events/:eventId/tables" element={<TableManagement />} />
            <Route path="/admin/events/:eventId/logos" element={<LogoManagement />} />
            <Route path="/event/:eventId" element={<EventPage />} />
            <Route path="/event/:eventId/checkin" element={<CheckIn />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
