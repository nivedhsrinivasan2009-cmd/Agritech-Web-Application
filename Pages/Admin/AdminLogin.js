import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/localDataService";

/**
 * AdminLogin - Redirects to unified login page
 *
 * This component checks if the user is already logged in as staff,
 * and redirects accordingly:
 * - If already logged in: go to admin dashboard
 * - If not logged in: go to unified login with staff portal selected
 */
export default function AdminLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAndRedirect() {
      try {
        // Check if already logged in as staff
        const staff = await api.adminAuth.getCurrentStaff();
        if (staff) {
          // Already logged in, go to dashboard
          navigate("/admin", { replace: true });
          return;
        }
      } catch (e) {
        // Not logged in
      }

      // Redirect to unified login page with staff portal pre-selected
      navigate("/login?portal=staff", { replace: true });
    }

    checkAndRedirect();
  }, [navigate]);

  // Show nothing while redirecting (or could show a loading spinner)
  return null;
}
