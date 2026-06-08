export default function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <span className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
          Chatify
        </span>
      </div>
    </header>
  );
}