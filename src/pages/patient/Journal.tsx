import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, BookOpen, Trash2 } from "lucide-react";

const Journal: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const fetchEntries = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setEntries(data || []);
  };

  useEffect(() => { fetchEntries(); }, [user]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim() || !user) return;
    setSaving(true);
    const { error } = await supabase.from("journal_entries").insert({
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
    });
    setSaving(false);
    if (error) { toast.error("Failed to save entry"); return; }
    toast.success("Journal entry saved!");
    setTitle("");
    setContent("");
    setOpen(false);
    fetchEntries();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("journal_entries").delete().eq("id", id);
    toast.success("Entry deleted");
    fetchEntries();
    setSelectedEntry(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Journal</h1>
            <p className="text-muted-foreground">Write down your thoughts and reflections.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> New Entry</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">New Journal Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Textarea placeholder="Write your thoughts..." value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[200px] resize-none" />
                <Button onClick={handleSave} disabled={saving || !title.trim() || !content.trim()} className="w-full">
                  {saving ? "Saving..." : "Save Entry"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {entries.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center py-16 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/30" />
              <h3 className="mt-4 font-display text-lg font-semibold text-foreground">No journal entries yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Start writing to track your mental wellness journey.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <Card
                key={entry.id}
                className="cursor-pointer shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5"
                onClick={() => setSelectedEntry(entry)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-1 font-display text-base">{entry.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">{format(new Date(entry.created_at), "MMM d, yyyy • h:mm a")}</p>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{entry.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* View entry dialog */}
        <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">{selectedEntry?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-xs text-muted-foreground">{selectedEntry && format(new Date(selectedEntry.created_at), "MMMM d, yyyy • h:mm a")}</p>
              <p className="whitespace-pre-wrap text-sm text-foreground">{selectedEntry?.content}</p>
              <Button variant="destructive" size="sm" className="gap-2" onClick={() => handleDelete(selectedEntry?.id)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete Entry
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Journal;
