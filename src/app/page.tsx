import React from 'react';
import Link from 'next/link';
import { Shield, Sparkles, Clock, LineChart, ChevronRight, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-slate-100 min-h-screen">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center border border-indigo-400/20 shadow-md">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
              E-Grievance Portal
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-500/10">
                Register as Citizen
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col">
        <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Citizen Redressal System
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Lodge, Route, and Resolve Grievances{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-emerald-400">
                Intelligently
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              An enterprise-grade platform utilizing Groq AI models to classify, assign, and fast-track citizen concerns directly to the responsible departments in real time.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/25 py-6 px-8 rounded-xl text-base group">
                  File a Grievance
                  <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white py-6 px-8 rounded-xl text-base">
                  Track Grievance Status
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Spotlight */}
        <section className="py-16 bg-slate-950/40 border-y border-slate-800/60 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-white tracking-tight">Key Features of E-Grievance</h2>
              <p className="text-slate-400 mt-3">Advanced components working together to automate and simplify citizen service redressals.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl space-y-4 shadow-sm hover:border-indigo-500/50 transition-colors group">
                <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">AI Classification</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Grievances are analyzed immediately by Llama 3 models on Groq to determine target departments and confidence scores, removing manual dispatch overhead.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl space-y-4 shadow-sm hover:border-blue-500/50 transition-colors group">
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Real-Time SLA Tracking</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Automatic SLA timers flag overdue complaints using an intuitive color indicator, giving admins bird's-eye monitoring to prevent delays.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl space-y-4 shadow-sm hover:border-emerald-500/50 transition-colors group">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <LineChart className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Interactive Analytics</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Comprehensive metric counts for active, pending, resolved, and review status, plus automatic calculation of average department resolution time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Dashboard Section */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
              <div className="space-y-6">
                <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Empowering Administrators and Departments Alike
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  Our system offers dedicated dashboard workflows for three key user groups: Citizens log grievances; Department personnel review and resolve items assigned to their scope; and Super-admins coordinate resources, edit departments, and track global SLAs.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                    <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0" />
                    Role-Based Access Control Middleware
                  </div>
                  <div className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                    <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0" />
                    Supabase Secure Document Evidence Storage
                  </div>
                  <div className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                    <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0" />
                    Secure Department Staff Credentials Dispensation
                  </div>
                </div>
              </div>

              {/* Stat Counters Mockup */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-900/60 backdrop-blur-sm p-6 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Handled</span>
                  <div className="text-3xl sm:text-4xl font-bold text-white">4,892</div>
                  <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    100% Routed
                  </span>
                </div>
                
                <div className="bg-slate-900/60 backdrop-blur-sm p-6 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Avg Redress Time</span>
                  <div className="text-3xl sm:text-4xl font-bold text-white">1.8 Days</div>
                  <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    -40% SLA reduction
                  </span>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-sm p-6 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">AI Confidence Match</span>
                  <div className="text-3xl sm:text-4xl font-bold text-white">94.7%</div>
                  <span className="text-indigo-400 text-xs font-semibold flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Auto-categorized
                  </span>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-sm p-6 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">SLA Resolution</span>
                  <div className="text-3xl sm:text-4xl font-bold text-white">99.1%</div>
                  <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    On time redress
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-500" />
            <span className="text-sm font-semibold text-white">E-Grievance Redressal</span>
          </div>
          <p className="text-slate-500 text-xs">
            Academic Project. Powered by Supabase, Next.js, and Groq AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
