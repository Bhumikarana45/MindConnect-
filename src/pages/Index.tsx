import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Brain, Heart, BookOpen, Activity, Shield, Calendar, ArrowRight, Sparkles, Leaf, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import heroImage from "@/assets/hero-wellness.jpg";

const Index: React.FC = () => {
  const { user, role } = useAuth();

  const getDashboardLink = () => {
    if (role === "admin") return "/admin";
    if (role === "doctor") return "/doctor";
    return "/patient";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-primary/8 blur-3xl breathing-animation" />
          <div className="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-serenity/8 blur-3xl animate-float-delayed" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-healing/8 blur-3xl animate-float" />
        </div>

        <div className="container relative mx-auto px-4 pb-20 pt-16 md:pb-32 md:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left content */}
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary shadow-soft">
                <Leaf className="h-4 w-4" />
                Your mental wellness companion
              </div>
              <h1 className="mt-8 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-6xl">
                Take charge of your{" "}
                <span className="text-gradient">mental health</span>{" "}
                journey
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
                Track your mood, journal your thoughts, take professional assessments, and connect with certified mental health professionals — all in one safe, caring space.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                {user ? (
                  <Link to={getDashboardLink()}>
                    <Button size="lg" className="gap-2 rounded-xl bg-gradient-calm px-8 shadow-glow transition-all hover:shadow-elevated">
                      Go to Dashboard <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/signup">
                      <Button size="lg" className="gap-2 rounded-xl bg-gradient-calm px-8 shadow-glow transition-all hover:shadow-elevated">
                        Get Started Free <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link to="/login">
                      <Button variant="outline" size="lg" className="rounded-xl border-primary/20 hover:bg-primary/5">
                        Already have an account?
                      </Button>
                    </Link>
                  </>
                )}
              </div>
              {/* Trust indicators */}
              <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-healing" />
                  <span>HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-warmth" />
                  <span>Trusted by thousands</span>
                </div>
              </div>
            </div>

            {/* Right image */}
            <div className="animate-fade-in-up relative hidden lg:block">
              <div className="relative overflow-hidden rounded-3xl shadow-elevated">
                <img
                  src={heroImage}
                  alt="Calming abstract wellness illustration"
                  width={1920}
                  height={1080}
                  className="h-auto w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
              </div>
              {/* Floating cards */}
              <div className="absolute -bottom-6 -left-6 animate-float rounded-2xl border border-border bg-card p-4 shadow-elevated">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-calm">
                    <Heart className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold text-foreground">Mood Score</p>
                    <p className="text-xs text-muted-foreground">Feeling great today!</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-4 top-8 animate-float-delayed rounded-2xl border border-border bg-card p-4 shadow-elevated">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-serenity">
                    <Sparkles className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold text-foreground">AI Insights</p>
                    <p className="text-xs text-muted-foreground">Your trend is improving</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative px-4 py-24">
        <div className="absolute inset-0 bg-gradient-surface" />
        <div className="container relative mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-serenity/20 bg-serenity/5 px-4 py-2 text-sm font-medium text-serenity">
              <Sparkles className="h-4 w-4" />
              Features
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold text-foreground md:text-4xl">
              Everything you need for mental wellness
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Comprehensive tools designed to support your emotional health and connect you with professionals.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Heart, title: "Mood Tracking", desc: "Log daily moods with emojis and visualize emotional patterns over time with beautiful charts.", gradient: "bg-gradient-warmth", iconColor: "text-warmth" },
              { icon: BookOpen, title: "Private Journaling", desc: "Write freely and securely store your thoughts, reflections, and daily experiences.", gradient: "bg-gradient-serenity", iconColor: "text-serenity" },
              { icon: Activity, title: "PHQ-9 Assessment", desc: "Take clinically validated mental health screenings with instant severity analysis.", gradient: "bg-gradient-calm", iconColor: "text-primary" },
              { icon: Shield, title: "Emergency Support", desc: "Automatic detection of distress signals with immediate crisis guidance and resources.", gradient: "bg-destructive/20", iconColor: "text-destructive" },
              { icon: Calendar, title: "Appointment Booking", desc: "Book sessions with verified mental health professionals directly from the platform.", gradient: "bg-healing/10", iconColor: "text-healing" },
              { icon: Sparkles, title: "AI Insights", desc: "AI-powered mood analysis with personalized recommendations and trend reports.", gradient: "bg-gradient-hero", iconColor: "text-serenity" },
            ].map((f, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-border bg-card p-7 shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1.5"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`inline-flex rounded-xl p-3 ${f.gradient}`}>
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-24">
        <div className="container mx-auto">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              How it works
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Getting started with your mental wellness journey is simple and free.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              { step: "01", title: "Create Your Account", desc: "Sign up for free as a patient or a mental health professional.", icon: Users },
              { step: "02", title: "Track & Reflect", desc: "Log your moods, write journal entries, and take PHQ-9 assessments to understand your mental state.", icon: Heart },
              { step: "03", title: "Get Support", desc: "View AI-powered insights and book appointments with verified doctors when you need help.", icon: Sparkles },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-calm shadow-glow">
                  <item.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <div className="mt-2 font-display text-5xl font-extrabold text-primary/10">{item.step}</div>
                <h3 className="-mt-4 font-display text-xl font-semibold text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24">
        <div className="container mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-calm p-12 text-center shadow-elevated md:p-20">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary-foreground/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-primary-foreground/10 blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
                Start your wellness journey today
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-primary-foreground/80">
                Join thousands of people who are taking control of their mental health. It's free to get started.
              </p>
              <div className="mt-8">
                {user ? (
                  <Link to={getDashboardLink()}>
                    <Button size="lg" variant="secondary" className="rounded-xl px-8 font-semibold shadow-elevated">
                      Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/signup">
                    <Button size="lg" variant="secondary" className="rounded-xl px-8 font-semibold shadow-elevated">
                      Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-12">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-calm">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">MindConnect</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 MindConnect. Your mental health matters. 💚</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
