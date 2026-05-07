import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const moods = [
  { emoji: "😢", label: "Terrible", score: 1 },
  { emoji: "😟", label: "Bad", score: 2 },
  { emoji: "😐", label: "Okay", score: 3 },
  { emoji: "😊", label: "Good", score: 4 },
  { emoji: "😄", label: "Great", score: 5 },
];

const MoodTracker: React.FC = () => {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);

  const fetchEntries = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("mood_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setEntries(data || []);
  };

  useEffect(() => { fetchEntries(); }, [user]);

  const handleSave = async () => {
    if (selectedMood === null || !user) return;
    setSaving(true);
    const moodData = moods[selectedMood];
    const { error } = await supabase.from("mood_entries").insert({
      user_id: user.id,
      mood: moodData.label,
      mood_score: moodData.score,
      note: note || null,
    });
    setSaving(false);
if (error) { toast.error("Failed to save mood: " + error.message); return; }    toast.success("Mood logged!");
    setSelectedMood(null);
    setNote("");
    fetchEntries();
  };

  const chartData = [...entries].reverse().map((e) => ({
    date: format(new Date(e.created_at), "MMM d"),
    score: e.mood_score,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Mood Tracker</h1>
          <p className="text-muted-foreground">How are you feeling today?</p>
        </div>

        {/* Mood selection */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-center gap-4">
              {moods.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedMood(i)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 px-6 py-4 transition-all ${
                    selectedMood === i
                      ? "border-primary bg-primary/5 shadow-soft"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <span className="text-4xl">{m.emoji}</span>
                  <span className="text-sm font-medium text-foreground">{m.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-6 space-y-4">
              <Textarea
                placeholder="Add a note about your mood (optional)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="resize-none"
              />
              <Button onClick={handleSave} disabled={selectedMood === null || saving} className="w-full sm:w-auto">
                {saving ? "Saving..." : "Log Mood"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        {chartData.length > 1 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display">Mood Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(168, 55%, 42%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(168, 55%, 42%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 15%, 88%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="score" stroke="hsl(168, 55%, 42%)" fill="url(#moodGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent entries */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display">Recent Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No mood entries yet. Start logging!</p>
            ) : (
              <div className="space-y-3">
                {entries.slice(0, 10).map((e) => (
                  <div key={e.id} className="flex items-center gap-4 rounded-lg border border-border p-3">
                    <span className="text-2xl">{moods.find(m => m.label === e.mood)?.emoji || "😐"}</span>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{e.mood}</p>
                      {e.note && <p className="text-sm text-muted-foreground">{e.note}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground">{format(new Date(e.created_at), "MMM d, h:mm a")}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MoodTracker;
