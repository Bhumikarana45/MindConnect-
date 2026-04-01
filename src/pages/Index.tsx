import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Brain, Heart, BookOpen, Activity, Shield, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

const Index: React.FC = () => {
  const { user, role } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-surface">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 md:py-32">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-info/10 blur-3xl" />
        </div>
        <div className="container relative mx-auto text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <Sparkles className="h-4 w-4" />
            Your mental wellness companion
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-extrabold leading-tight text-foreground md:text-6xl">
            Take charge of your <span className="text-gradient">mental health</span> journey
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Track your mood, journal your thoughts, take professional assessments, and connect with certified mental health professionals — all in one place.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {user ? (
              <Link to={role === "admin" ? "/admin" : role === "doctor" ? "/doctor" : "/patient"}>
                <Button size="lg" className="gap-2">
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/signup">
                  <Button size="lg" className="gap-2 px-8">
                    Get Started Free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">Already have an account?</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20">
        <div className="container mx-auto">
          <h2 className="text-center font-display text-3xl font-bold text-foreground">Everything you need for mental wellness</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
            Comprehensive tools designed to support your emotional health and connect you with professionals.
          </p>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Heart, title: "Mood Tracking", desc: "Log daily moods and visualize emotional patterns over time.", color: "text-destructive" },
              { icon: BookOpen, title: "Journaling", desc: "Write freely and securely store your thoughts and reflections.", color: "text-info" },
              { icon: Activity, title: "PHQ-9 Assessment", desc: "Take clinically validated mental health screenings.", color: "text-primary" },
              { icon: Shield, title: "Emergency Support", desc: "Automatic detection of distress signals with immediate guidance.", color: "text-destructive" },
              { icon: Calendar, title: "Appointment Booking", desc: "Book sessions with verified mental health professionals.", color: "text-success" },
              { icon: Sparkles, title: "AI Insights", desc: "AI-powered mood analysis with personalized recommendations.", color: "text-accent" },
            ].map((f, i) => (
              <div key={i} className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated hover:-translate-y-1">
                <div className={`inline-flex rounded-lg bg-secondary p-3 ${f.color}`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-display font-semibold text-foreground">MindConnect</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 MindConnect. Your mental health matters.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
