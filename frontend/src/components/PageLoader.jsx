export default function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#f8f9fa]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#db6747] animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading...</p>
      </div>
    </div>
  );
}
