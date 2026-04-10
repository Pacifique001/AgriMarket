export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:py-12">
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

      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/82 via-emerald-900/72 to-slate-950/78"></div>
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_42%),linear-gradient(to_bottom,rgba(255,255,255,0.08),transparent_28%)]"></div>

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1fr_1.05fr]">
        <div className="hidden lg:flex flex-col justify-center text-white pr-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-100 backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.9)]"></span>
            Connecting harvest to demand
          </div>
          <h1 className="mt-6 text-5xl font-black tracking-tight text-white drop-shadow-sm">
            AgroMarket AI
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-emerald-50/85">
            A faster way for farmers and buyers to connect, price crops fairly, and move produce with less friction.
          </p>

          <div className="mt-8 grid max-w-xl grid-cols-2 gap-4 text-sm text-emerald-50/90">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl shadow-lg shadow-black/10">
              <p className="text-2xl font-black text-white">12k+</p>
              <p className="mt-1">Farmers supported with market guidance</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl shadow-lg shadow-black/10">
              <p className="text-2xl font-black text-white">450+</p>
              <p className="mt-1">Verified buyers searching daily</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl shadow-lg shadow-black/10">
              <p className="text-2xl font-black text-white">SMS</p>
              <p className="mt-1">Designed for simple mobile access</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl shadow-lg shadow-black/10">
              <p className="text-2xl font-black text-white">Live</p>
              <p className="mt-1">Market pricing and demand signals</p>
            </div>
          </div>

          <div className="mt-8 max-w-xl rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl shadow-2xl shadow-black/10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-100/80">Market pulse</p>
                <p className="mt-2 text-lg font-semibold text-white">Sweet potatoes and maize are trending up</p>
              </div>
              <div className="rounded-full bg-emerald-300/20 px-3 py-1 text-xs font-bold text-emerald-100">
                +12% this week
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-emerald-50/90 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-white font-bold">High demand</p>
                <p className="mt-1">Sell when prices peak</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-white font-bold">Lower waste</p>
                <p className="mt-1">Move produce faster</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-white font-bold">Better margins</p>
                <p className="mt-1">Match buyers directly</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="mx-auto w-full max-w-3xl rounded-3xl border border-white/25 bg-white/92 p-6 shadow-2xl shadow-black/20 backdrop-blur-2xl sm:p-8 lg:p-10">
            <div className="mb-6 text-center lg:text-left">
              <h2 className="text-3xl font-extrabold text-green-800">AgroMarket AI</h2>
              <p className="mt-2 text-sm text-slate-600">Connecting harvest to demand</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}