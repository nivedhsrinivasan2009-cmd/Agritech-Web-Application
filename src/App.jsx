import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";

// Layout
import Layout from "../Layout";

// Pages
import Home from "../Pages/Home";
import Events from "../Pages/Event";
import EventDetail from "../Pages/EventDetail";
import Activities from "../Pages/Activities";
import ActivityDetail from "../Pages/ActivityDetail";
import Shops from "../Pages/Shops";
import ShopDetail from "../Pages/ShopDetail";
import MapZones from "../Pages/MapZones";
import About from "../Pages/About";
import Assistant from "../Pages/Assistant";
import Login from "../Pages/Login";
import Profile from "../Pages/Profile";

// Admin Pages
import AdminLogin from "../Pages/Admin/AdminLogin";
import AdminLayout from "../Pages/Admin/AdminLayout";
import AdminDashboard from "../Pages/Admin/AdminDashboard";
import AdminEvents from "../Pages/Admin/AdminEvents";
import AdminActivities from "../Pages/Admin/AdminActivities";
import AdminShops from "../Pages/Admin/AdminShops";
import AdminZones from "../Pages/Admin/AdminZones";
import AdminAnnouncements from "../Pages/Admin/AdminAnnouncements";
import AdminStaff from "../Pages/Admin/AdminStaff";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 5, // 5 seconds - shorter for real-time updates from admin
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchOnMount: true,
    },
  },
});

// Cross-tab sync: Listen for localStorage changes from other tabs AND current tab
function CrossTabSync() {
  const qc = useQueryClient();

  useEffect(() => {
    const invalidateAllQueries = () => {
      // Invalidate all entity queries to refresh data
      // Visitor queries
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['activities'] });
      qc.invalidateQueries({ queryKey: ['shops'] });
      qc.invalidateQueries({ queryKey: ['locations'] });
      qc.invalidateQueries({ queryKey: ['announcements'] });
      // Admin queries
      qc.invalidateQueries({ queryKey: ['adminEvents'] });
      qc.invalidateQueries({ queryKey: ['adminActivities'] });
      qc.invalidateQueries({ queryKey: ['adminShops'] });
      qc.invalidateQueries({ queryKey: ['adminLocations'] });
      qc.invalidateQueries({ queryKey: ['adminAnnouncements'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      // Detail page queries (invalidate all that start with these)
      qc.invalidateQueries({ predicate: (query) =>
        ['event', 'activity', 'shop'].includes(query.queryKey[0])
      });
    };

    const handleStorageChange = (e) => {
      // React to gracia_ prefixed keys (our data) or sync timestamp
      if (e.key && (e.key.startsWith('gracia_'))) {
        console.log('Data changed in another tab:', e.key);
        invalidateAllQueries();
      }
    };

    // Listen for custom event (fires for current tab)
    const handleCustomChange = (e) => {
      console.log('Data changed in current tab:', e.detail?.key);
      invalidateAllQueries();
    };

    // Listen for storage events (fires when localStorage changes in OTHER tabs)
    window.addEventListener('storage', handleStorageChange);
    // Listen for custom events (fires in CURRENT tab)
    window.addEventListener('gracia-data-change', handleCustomChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('gracia-data-change', handleCustomChange);
    };
  }, [qc]);

  return null;
}

// Route to page name mapping
const routeToPageName = {
  "/": "Home",
  "/events": "Events",
  "/activities": "Activities",
  "/shops": "Shops",
  "/map": "MapZones",
  "/about": "About",
  "/assistant": "Assistant",
  "/login": "Login",
  "/profile": "Profile",
};

function AppRoutes() {
  const location = useLocation();
  const currentPageName = routeToPageName[location.pathname] || "Home";

  return (
    <Layout currentPageName={currentPageName}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/activities/:id" element={<ActivityDetail />} />
        <Route path="/shops" element={<Shops />} />
        <Route path="/shops/:id" element={<ShopDetail />} />
        <Route path="/map" element={<MapZones />} />
        <Route path="/about" element={<About />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CrossTabSync />
      <BrowserRouter>
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="activities" element={<AdminActivities />} />
            <Route path="shops" element={<AdminShops />} />
            <Route path="zones" element={<AdminZones />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="staff" element={<AdminStaff />} />
          </Route>

          {/* Visitor App Routes */}
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
