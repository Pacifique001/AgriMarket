import Link from "next/link";
import {
  Sprout,
  TrendingUp,
  Users,
  ShieldCheck,
  ArrowRight,
  BarChart3,
  Globe2
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)]">
      {/* --- Hero Section --- */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster="https://images.pexels.com/photos/28468190/pexels-photo-28468190.jpeg?cs=srgb&dl=pexels-renni-28468190.jpg&fm=jpg"
        >
          <source
            src="https://videos.pexels.com/video-files/33822003/14354848_1920_1080_30fps.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/80 via-emerald-900/70 to-slate-950/70"></div>
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_42%),linear-gradient(to_bottom,rgba(255,255,255,0.08),transparent_28%)]"></div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 text-emerald-800 text-sm font-medium mb-6 animate-fade-in shadow-sm">
            <TrendingUp size={16} />
            <span>Real-time AI Price Predictions now active</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6 drop-shadow-sm">
            Connecting Rwandan Harvests to <span className="text-emerald-300">Market Demand</span>
          </h1>

          <p className="text-xl text-emerald-50/90 mb-10 leading-relaxed max-w-3xl mx-auto">
            Eliminate price exploitation and reduce post-harvest losses.
            Our AI-powered platform directly connects farmers with verified buyers
            across the country for fair, transparent trade.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register" className="btn-primary flex items-center gap-2 px-8 py-4 text-lg">
              Start Selling Harvest <ArrowRight size={20} />
            </Link>
            <Link href="/auth/login" className="px-8 py-4 text-lg font-semibold text-white/90 hover:text-white transition-colors">
              I am a Buyer →
            </Link>
          </div>
        </div>
      </section>

      {/* --- Value Proposition Grid --- */}
      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-8 bg-white hover:border-green-300 transition-all group">
              <div className="w-12 h-12 bg-green-100 text-green-700 rounded-lg flex items-center justify-center mb-6 group-hover:bg-green-700 group-hover:text-white transition-colors">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Price Prediction</h3>
              <p className="text-slate-600">
                Stop guessing. Our AI analyzes historical trends and regional demand to suggest
                the most profitable selling price for your crop.
              </p>
            </div>

            <div className="card p-8 bg-white hover:border-green-300 transition-all group">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center mb-6 group-hover:bg-amber-700 group-hover:text-white transition-colors">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Matching</h3>
              <p className="text-slate-600">
                Our engine instantly matches your harvest with verified buyers looking for
                exactly what you've grown, based on your location.
              </p>
            </div>

            <div className="card p-8 bg-white hover:border-green-300 transition-all group">
              <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-700 group-hover:text-white transition-colors">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Verified Trading</h3>
              <p className="text-slate-600">
                Trade with confidence. Every buyer and farmer on our platform is verified,
                ensuring secure transactions and reliable logistics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Targeted Role Section --- */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Built for the <span className="text-green-700">Rwandan Farmer</span></h2>
            <ul className="space-y-4">
              {[
                "Receive price alerts via SMS (no smartphone required)",
                "Identify which crops are in high demand before planting",
                "Access a wide network of hotels, exporters, and wholesalers",
                "Built-in logistics matching to move your harvest faster"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 bg-green-100 text-green-700 rounded-full p-1">
                    <ArrowRight size={14} />
                  </div>
                  <span className="text-slate-700 font-medium">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link href="/auth/register" className="btn-primary inline-block">
                Create Farmer Profile
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-green-200/50 rounded-2xl blur-xl"></div>
            <div className="relative card aspect-video bg-[url('https://images.unsplash.com/photo-1595841696677-54897f2893c3?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center">
              {/* Overlay for data visualization feel */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                <div className="bg-white/90 backdrop-blur p-4 rounded-lg w-fit">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Live Market Gap</p>
                  <p className="text-lg font-bold text-slate-900">Sweet Potatoes: High Demand</p>
                  <p className="text-sm text-green-700">+12% Price Increase in Musanze</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Footer Statistics --- */}
      <section className="py-12 bg-green-900 text-green-50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-yellow-400">12,000+</p>
            <p className="text-sm opacity-80 uppercase tracking-wide">Farmers Enrolled</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-yellow-400">450</p>
            <p className="text-sm opacity-80 uppercase tracking-wide">Verified Buyers</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-yellow-400">25 Districts</p>
            <p className="text-sm opacity-80 uppercase tracking-wide">Coverage</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-yellow-400">85%</p>
            <p className="text-sm opacity-80 uppercase tracking-wide">Post-Harvest Recovery</p>
          </div>
        </div>
      </section>
    </div>
  );
}