import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, TrendingDown, Minus, AlertTriangle, Heart } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { toast } from "sonner";

const AIInsights: React.FC = () => {
  const { user } = useAuth();
  const [moodEntries, setMoodEntries] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [moods, journals] = await Promise.all([
        supabase
          .from("mood_entries")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("journal_entries")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      setMoodEntries(moods.data || []);
      setJournalEntries(journals.data || []);
      setDataLoading(false);
    };
    fetchData();
  }, [user]);

  const chartData = [...moodEntries].reverse().map((e) => ({
    date: format(new Date(e.created_at), "MMM d"),
    score: e.mood_score,
    mood: e.mood,
  }));

  const avgScore = moodEntries.length > 0
    ? moodEntries.reduce((sum, e) => sum + e.mood_score, 0) / moodEntries.length
    : 0;

  const recentAvg = moodEntries.slice(0, 7).length > 0
    ? moodEntries.slice(0, 7).reduce((sum, e) => sum + e.mood_score, 0) / moodEntries.slice(0, 7).length
    : 0;

  const olderAvg = moodEntries.slice(7, 14).length > 0
    ? moodEntries.slice(7, 14).reduce((sum, e) => sum + e.mood_score, 0) / moodEntries.slice(7, 14).length
    : 0;

  const trend = moodEntries.length < 3 ? "neutral" : recentAvg > olderAvg + 0.3 ? "improving" : recentAvg < olderAvg - 0.3 ? "declining" : "stable";

  const generateInsight = async () => {
    if (moodEntries.length < 3) {
      toast.error("Log at least 3 mood entries for AI insights.");
      return;
    }
    setLoading(true);
    
    const moodSummary = moodEntries.slice(0, 14).map(e => `${format(new Date(e.created_at), "MMM d")}: ${e.mood} (${e.mood_score}/5)${e.note ? ` - "${e.note}"` : ""}`).join("\n");
    const journalSummary = journalEntries.slice(0, 5).map(e => `${e.title}: ${e.content.substring(0, 100)}`).join("\n");

    try {
      const response = await supabase.functions.invoke("ai-mood-insights", {
        body: { moodSummary, journalSummary, avgScore: avgScore.toFixed(1), trend },
      });
      
      if (response.error) throw response.error;
      setInsight(response.data?.insight || "Unable to generate insight at this time.");
    } catch {
      // Fallback local insight
      const insights = [];
      if (trend === "declining") {
        insights.push("📉 Your mood has been trending downward recently. Consider speaking with a mental health professional or trying mindfulness exercises.");
      } else if (trend === "improving") {
        insights.push("📈 Great news! Your mood has been improving. Keep doing what's working for you.");
      } else {
        insights.push("📊 Your mood has been relatively stable. Consistency is a good sign.");
      }
      if (avgScore < 2.5) {
        insights.push("⚠️ Your average mood is on the lower side. We recommend booking a consultation with a doctor on MindConnect.");
      } else if (avgScore >= 4) {
        insights.push("🌟 You've been feeling great overall! Continue your positive habits.");
      }
      if (moodEntries.some(e => e.mood_score <= 1)) {
        insights.push("🧘 We noticed some very low mood days. On difficult days, try deep breathing exercises, journaling, or reaching out to someone you trust.");
      }
      setInsight(insights.join("\n\n"));
    }
    setLoading(false);
  };

  const getMoodLabel = (score: number) => {
    if (score >= 4.5) return "Excellent";
    if (score >= 3.5) return "Good";
    if (score >= 2.5) return "Fair";
    if (score >= 1.5) return "Low";
    return "Very Low";
  };

  if (dataLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> AI Mood Insights
          </h1>
          <p className="text-muted-foreground">AI-powered analysis of your mood patterns and journal entries.</p>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <Heart className="mx-auto h-6 w-6 text-primary mb-2" />
              <p className="text-3xl font-bold text-foreground">{avgScore.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Avg Mood ({getMoodLabel(avgScore)})</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              {trend === "improving" ? <TrendingUp className="mx-auto h-6 w-6 text-success mb-2" /> :
               trend === "declining" ? <TrendingDown className="mx-auto h-6 w-6 text-destructive mb-2" /> :
               <Minus className="mx-auto h-6 w-6 text-muted-foreground mb-2" />}
              <p className="text-xl font-bold text-foreground capitalize">{trend}</p>
              <p className="text-sm text-muted-foreground">Recent Trend</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <Sparkles className="mx-auto h-6 w-6 text-accent mb-2" />
              <p className="text-3xl font-bold text-foreground">{moodEntries.length}</p>
              <p className="text-sm text-muted-foreground">Entries Analyzed</p>
            </CardContent>
          </Card>
        </div>

        {/* Mood trend chart */}
        {chartData.length > 1 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display">30-Day Mood Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="insightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(168, 55%, 42%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(168, 55%, 42%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 15%, 88%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 12 }} />
                  <Tooltip content={({ active, payload }) => {
                    if (active && payload?.length) {
                      return (
                        <div className="rounded-lg bg-card border border-border p-3 shadow-lg">
                          <p className="text-sm font-medium">{payload[0].payload.date}</p>
                          <p className="text-sm text-muted-foreground">{payload[0].payload.mood} ({payload[0].value}/5)</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Area type="monotone" dataKey="score" stroke="hsl(168, 55%, 42%)" fill="url(#insightGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* AI Analysis */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insight ? (
              <div className="whitespace-pre-line text-sm text-foreground leading-relaxed rounded-lg bg-secondary/50 p-4">
                {insight}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click the button below to generate an AI-powered analysis of your mood patterns.
              </p>
            )}
            <Button onClick={generateInsight} disabled={loading || moodEntries.length < 3} className="mt-4 gap-2">
              <Sparkles className="h-4 w-4" />
              {loading ? "Analyzing..." : insight ? "Refresh Analysis" : "Generate Insights"}
            </Button>

            {avgScore < 2.5 && moodEntries.length >= 3 && (
              <div className="mt-4 flex items-start gap-3 rounded-lg bg-destructive/5 border border-destructive/20 p-4">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">We recommend seeking support</p>
                  <p className="text-sm text-muted-foreground mt-1">Your mood patterns suggest you might benefit from talking to a professional.</p>
                  <Button size="sm" className="mt-2" onClick={() => window.location.href = "/patient/doctors"}>
                    Find a Doctor
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AIInsights;
