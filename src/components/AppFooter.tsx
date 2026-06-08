export default function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
        <div className="flex flex-col items-center gap-1 md:items-start">
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Chatify
          </span>

          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            © {currentYear} Chatify. Secure & Encrypted.
          </span>
        </div>
      </div>
    </footer>
  );
}