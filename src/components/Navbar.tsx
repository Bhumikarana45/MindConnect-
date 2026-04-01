import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Brain, LogOut, Menu, X } from "lucide-react";

const Navbar: React.FC = () => {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const getDashboardLink = () => {
    if (role === "admin") return "/admin";
    if (role === "doctor") return "/doctor";
    return "/patient";
  };

  const isAuthPage = ["/login", "/signup"].includes(location.pathname);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-calm">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">MindConnect</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-4 md:flex">
          {!user && !isAuthPage && (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
          {user && (
            <>
              <Link to={getDashboardLink()}>
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              {role === "admin" && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm">Admin</Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-card p-4 md:hidden">
          <div className="flex flex-col gap-2">
            {!user && !isAuthPage && (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">Log in</Button>
                </Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Get Started</Button>
                </Link>
              </>
            )}
            {user && (
              <>
                <Link to={getDashboardLink()} onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
                </Link>
                {role === "admin" && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">Admin</Button>
                  </Link>
                )}
                <Button variant="ghost" className="w-full justify-start" onClick={() => { signOut(); setMobileOpen(false); }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
