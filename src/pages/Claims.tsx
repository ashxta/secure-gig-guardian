import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileWarning, Plus, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { NavLink } from "@/components/NavLink";

type Claim = Tables<"claims">;
type Policy = Tables<"insurance_policies">;

const statusColors: Record<string, string> = {
  pending: "text-warning",
  approved: "text-success",
  rejected: "text-destructive",
  paid: "text-primary",
};

const Claims = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState("");
  const [claimType, setClaimType] = useState("");
  const [triggerReason, setTriggerReason] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [claimNotes, setClaimNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data: worker } = await supabase
        .from("workers")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!worker) { navigate("/auth"); return; }
      setWorkerId(worker.id);
      fetchData();
    };
    init();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    const [claimsRes, policiesRes] = await Promise.all([
      supabase.from("claims").select("*").order("created_at", { ascending: false }),
      supabase.from("insurance_policies").select("*").eq("active", true),
    ]);
    if (claimsRes.data) setClaims(claimsRes.data);
    if (policiesRes.data) setPolicies(policiesRes.data);
    setLoading(false);
  };

  const createClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerId || !selectedPolicy) return;

    const { error } = await supabase.from("claims").insert({
      worker_id: workerId,
      policy_id: selectedPolicy,
      claim_type: claimType.trim(),
      trigger_reason: triggerReason.trim(),
      payout_amount: parseFloat(payoutAmount) || 0,
      notes: claimNotes.trim() || null,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Claim submitted!" });
      setShowCreate(false);
      setSelectedPolicy("");
      setClaimType("");
      setTriggerReason("");
      setPayoutAmount("");
      setClaimNotes("");
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto px-4 pb-8">
        <div className="flex items-center gap-3 py-6">
          <NavLink to="/">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </NavLink>
          <FileWarning className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Claims Management</h1>
        </div>

        {!showCreate ? (
          <Button onClick={() => setShowCreate(true)} className="w-full mb-4">
            <Plus className="w-4 h-4 mr-2" /> File New Claim
          </Button>
        ) : (
          <motion.div
            className="safety-card p-5 mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-sm font-semibold text-foreground mb-4">New Claim</h2>
            <form onSubmit={createClaim} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Policy *</Label>
                <Select value={selectedPolicy} onValueChange={setSelectedPolicy}>
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue placeholder="Select active policy" />
                  </SelectTrigger>
                  <SelectContent>
                    {policies.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.policy_number} — {p.coverage_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Claim Type *</Label>
                <Select value={claimType} onValueChange={setClaimType}>
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Heavy Rain">Heavy Rain</SelectItem>
                    <SelectItem value="Heatwave">Heatwave</SelectItem>
                    <SelectItem value="Air Quality">Air Quality</SelectItem>
                    <SelectItem value="Traffic Disruption">Traffic Disruption</SelectItem>
                    <SelectItem value="Government Restriction">Government Restriction</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Trigger Reason *</Label>
                <Input
                  value={triggerReason}
                  onChange={(e) => setTriggerReason(e.target.value)}
                  placeholder="e.g. Rainfall exceeded 50mm/hr"
                  required
                  className="bg-secondary/50 border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Payout Amount (₹)</Label>
                <Input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="120"
                  min="0"
                  className="bg-secondary/50 border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <Input
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                  placeholder="Additional details"
                  className="bg-secondary/50 border-border"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={!selectedPolicy || !claimType} className="flex-1">
                  Submit Claim
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading claims...</p>
        ) : claims.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No claims filed yet.</p>
        ) : (
          <div className="space-y-3">
            {claims.map((claim) => (
              <motion.div
                key={claim.id}
                className="safety-card p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">{claim.claim_type}</span>
                  <span className={`text-xs font-semibold uppercase ${statusColors[claim.status] || "text-muted-foreground"}`}>
                    {claim.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{claim.trigger_reason}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Payout: </span>
                    <span className="text-foreground font-semibold tabular-nums">₹{Number(claim.payout_amount).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Filed: </span>
                    <span className="text-foreground">{new Date(claim.triggered_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {claim.notes && (
                  <p className="text-xs text-muted-foreground mt-2 italic">{claim.notes}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Claims;
