import { CloudRain, Thermometer, Wind, Car, Shield, FileWarning, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StatusHeader from "@/components/StatusHeader";
import RiskPulse from "@/components/RiskPulse";
import PayoutBanner from "@/components/PayoutBanner";
import TelemetryCard from "@/components/TelemetryCard";
import MicroLedger from "@/components/MicroLedger";
import PolicyCard from "@/components/PolicyCard";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";

const telemetry = [
  { icon: CloudRain, label: "Rainfall", value: "18.2", unit: "mm/hr", status: "critical" as const },
  { icon: Thermometer, label: "Temperature", value: "34", unit: "°C", status: "elevated" as const },
  { icon: Wind, label: "AQI", value: "187", unit: "index", status: "elevated" as const },
  { icon: Car, label: "Traffic", value: "Low", unit: "flow", status: "normal" as const },
];

const Index = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto px-4 pb-8">
        <StatusHeader />

        {/* Auth / Navigation bar */}
        <div className="mt-2 flex gap-2">
          {isLoggedIn ? (
            <>
              <NavLink to="/policies" className="flex-1">
                <Button variant="outline" className="w-full text-xs gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Policies
                </Button>
              </NavLink>
              <NavLink to="/claims" className="flex-1">
                <Button variant="outline" className="w-full text-xs gap-1.5">
                  <FileWarning className="w-3.5 h-3.5" /> Claims
                </Button>
              </NavLink>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                <LogOut className="w-4 h-4 text-muted-foreground" />
              </Button>
            </>
          ) : (
            <NavLink to="/auth" className="w-full">
              <Button className="w-full text-xs">Sign In / Register</Button>
            </NavLink>
          )}
        </div>
        
        <div className="mt-4">
          <PayoutBanner />
        </div>

        <div className="mt-6">
          <RiskPulse level="warning" value={72} label="Heavy rainfall approaching threshold · AQI elevated" />
        </div>

        <div className="mt-6">
          <span className="data-label mb-3 block">Live Telemetry</span>
          <div className="grid grid-cols-2 gap-3">
            {telemetry.map((t, i) => (
              <TelemetryCard key={t.label} {...t} index={i} />
            ))}
          </div>
        </div>

        <div className="mt-6">
          <PolicyCard />
        </div>

        <div className="mt-6">
          <MicroLedger />
        </div>

        <footer className="mt-8 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.1em]">
            Your income, protected by the atmosphere.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
