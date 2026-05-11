import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const questions = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead, or of hurting yourself in some way",
];

const options = [
  { label: "Not at all", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 },
];

const getSeverity = (score: number) => {
  if (score <= 4) return { level: "Minimal", color: "text-success", bg: "bg-success/10" };
  if (score <= 9) return { level: "Mild", color: "text-info", bg: "bg-info/10" };
  if (score <= 14) return { level: "Moderate", color: "text-accent", bg: "bg-accent/10" };
  if (score <= 19) return { level: "Moderately Severe", color: "text-warning", bg: "bg-warning/10" };
  return { level: "Severe", color: "text-destructive", bg: "bg-destructive/10" };
};

const PHQ9Test: React.FC = () => {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(9).fill(null));
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<{ score: number; severity: string } | null>(null);
  const [showEmergency, setShowEmergency] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("phq9_results")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setHistory(data || []);
  };

  useEffect(() => { fetchHistory(); }, [user]);

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[step] = value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (answers[step] === null) { toast.error("Please select an answer"); return; }
    if (step < 8) { setStep(step + 1); return; }
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (!user) return;
    const totalScore = answers.reduce((sum, a) => sum + (a || 0), 0);
    const severity = getSeverity(totalScore);
    setSaving(true);

    await supabase.from("phq9_results").insert({
      user_id: user.id,
      answers: answers as number[],
      total_score: totalScore,
      severity: severity.level,
    });

    setSaving(false);
    setResult({ score: totalScore, severity: severity.level });

    if (totalScore >= 20 || (answers[8] !== null && answers[8] >= 2)) {
      setShowEmergency(true);
    }

    fetchHistory();
  };

  const resetTest = () => {
    setAnswers(new Array(9).fill(null));
    setStep(0);
    setResult(null);
  };

  if (result) {
    const sev = getSeverity(result.score);
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl space-y-6">
          <Card className="shadow-elevated animate-scale-in text-center">
            <CardContent className="p-8">
              <div className={`mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full ${sev.bg}`}>
                {result.score >= 15 ? (
                  <AlertTriangle className={`h-8 w-8 ${sev.color}`} />
                ) : (
                  <CheckCircle2 className={`h-8 w-8 ${sev.color}`} />
                )}
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">Your PHQ-9 Score: {result.score}</h2>
              <p className={`mt-2 text-lg font-semibold ${sev.color}`}>{sev.level} Depression</p>
              <p className="mt-4 text-sm text-muted-foreground">
                {result.score <= 4 && "Your symptoms suggest minimal depression. Continue monitoring your well-being."}
                {result.score > 4 && result.score <= 9 && "Mild depression detected. Consider lifestyle changes and watchful monitoring."}
                {result.score > 9 && result.score <= 14 && "Moderate depression. We recommend consulting with a mental health professional."}
                {result.score > 14 && result.score <= 19 && "Moderately severe depression. Please consider professional treatment."}
                {result.score > 19 && "Severe depression detected. Please reach out to a mental health professional immediately."}
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button onClick={resetTest} variant="outline">Take Again</Button>
                {result.score > 9 && (
                  <Button onClick={() => window.location.href = "/patient/doctors"}>Find a Doctor</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Dialog */}
        <Dialog open={showEmergency} onOpenChange={setShowEmergency}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-display text-destructive">
                <AlertTriangle className="h-5 w-5" /> Urgent: Please Seek Help
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-foreground">
                Your responses indicate significant distress. We strongly encourage you to reach out for professional support.
              </p>
              <div className="rounded-lg bg-destructive/5 p-4">
                <p className="text-sm font-medium text-foreground">Emergency Resources:</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>• National Suicide Prevention: <strong>14416</strong></li>
                  <li>• Crisis Text Line: Text <strong>HOME</strong> to <strong>9999666555</strong></li>
                  <li>• Emergency Services: <strong>112</strong></li>
                </ul>
              </div>
              <Button className="w-full" onClick={() => { setShowEmergency(false); window.location.href = "/patient/doctors"; }}>
                Find a Doctor on MindConnect
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">PHQ-9 Assessment</h1>
          <p className="text-muted-foreground">Over the last 2 weeks, how often have you been bothered by the following?</p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardDescription>Question {step + 1} of 9</CardDescription>
              <div className="flex gap-1">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className={`h-1.5 w-6 rounded-full ${i <= step ? "bg-primary" : "bg-border"}`} />
                ))}
              </div>
            </div>
            <CardTitle className="mt-2 font-display text-lg">{questions[step]}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup key={step} value={answers[step] !== null ? answers[step]!.toString() : ""} onValueChange={(v) => handleAnswer(parseInt(v))}>
              <div className="space-y-3">
                {options.map((opt) => (
                  <Label
                    key={opt.value}
                    htmlFor={`opt-${step}-${opt.value}`}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem id={`opt-${step}-${opt.value}`} value={opt.value.toString()} />
                    <span className="text-sm font-medium text-foreground">{opt.label}</span>
                  </Label>
                ))}
              </div>
            </RadioGroup>
            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Previous</Button>
              <Button onClick={handleNext} disabled={answers[step] === null}>
                {step === 8 ? (saving ? "Submitting..." : "Submit") : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* History */}
        {history.length > 0 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display">Previous Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {history.map((h) => {
                  const sev = getSeverity(h.total_score);
                  return (
                    <div key={h.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="font-medium text-foreground">Score: {h.total_score}/27</p>
                        <p className={`text-sm font-medium ${sev.color}`}>{h.severity}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{format(new Date(h.created_at), "MMM d, yyyy")}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PHQ9Test;
