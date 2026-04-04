import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Plus, ArrowLeft, ToggleRight, ToggleLeft, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DynamicPricing from "@/components/DynamicPricing";
import type { PricingResult } from "@/lib/dynamicPricing";
import type { Tables } from "@/integrations/supabase/types";
import { NavLink } from "@/components/NavLink";

type Policy = Tables<"insurance_policies">;

const Policies = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [workerName, setWorkerName] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data: worker } = await supabase
        .from("workers")
        .select("id, name")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!worker) { navigate("/auth"); return; }
      setWorkerId(worker.id);
      setWorkerName(worker.name);
      fetchPolicies();
    };
    init();
  }, [navigate]);

  const fetchPolicies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("insurance_policies")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setPolicies(data);
    setLoading(false);
  };

  const createPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerId || !pricingResult) return;

    const { error } = await supabase.from("insurance_policies").insert({
      worker_id: workerId,
      policy_number: policyNumber.trim(),
      coverage_type: pricingResult.coverage,
      weekly_premium: pricingResult.weekly_premium,
      risk_score: pricingResult.risk_score,
      active: true,
      notes: notes.trim() || null,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Policy created!" });
      setShowCreate(false);
      setPolicyNumber("");
      setNotes("");
      setPricingResult(null);
      fetchPolicies();
    }
  };

  const togglePolicy = async (id: string, active: boolean) => {
    await supabase.from("insurance_policies").update({ active: !active }).eq("id", id);
    fetchPolicies();
  };

  const deletePolicy = async (id: string) => {
    await supabase.from("insurance_policies").delete().eq("id", id);
    fetchPolicies();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto px-4 pb-8">
        <div className="flex items-center gap-3 py-6">
          <NavLink to="/">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </NavLink>
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Insurance Policies</h1>
        </div>

        {!showCreate ? (
          <Button onClick={() => setShowCreate(true)} className="w-full mb-4">
            <Plus className="w-4 h-4 mr-2" /> Create New Policy
          </Button>
        ) : (
          <motion.div
            className="safety-card p-5 mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-sm font-semibold text-foreground mb-4">New Policy for {workerName}</h2>
            <form onSubmit={createPolicy} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Policy Number *</Label>
                <Input
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  placeholder="POL-001"
                  required
                  className="bg-secondary/50 border-border"
                />
              </div>

              <DynamicPricing onResult={setPricingResult} />

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes"
                  className="bg-secondary/50 border-border"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={!pricingResult} className="flex-1">
                  Create Policy
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading policies...</p>
        ) : policies.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No policies yet.</p>
        ) : (
          <div className="space-y-3">
            {policies.map((policy) => (
              <motion.div
                key={policy.id}
                className="safety-card p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">{policy.policy_number}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => togglePolicy(policy.id, policy.active)}>
                      {policy.active ? (
                        <ToggleRight className="w-5 h-5 text-success" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                    <button onClick={() => deletePolicy(policy.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Coverage: </span>
                    <span className="text-foreground">{policy.coverage_type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Premium: </span>
                    <span className="text-foreground font-semibold tabular-nums">₹{Number(policy.weekly_premium).toFixed(2)}/wk</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Risk: </span>
                    <span className="text-foreground tabular-nums">{((policy.risk_score ?? 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status: </span>
                    <span className={policy.active ? "text-success" : "text-muted-foreground"}>
                      {policy.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                {policy.notes && (
                  <p className="text-xs text-muted-foreground mt-2 italic">{policy.notes}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Policies;
