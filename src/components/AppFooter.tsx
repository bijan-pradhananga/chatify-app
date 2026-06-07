export default function AppFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-50 dark:bg-gray-800 border-t border-slate-200 dark:border-gray-700 mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 py-8 max-w-7xl mx-auto gap-4">
        <div className="flex flex-col items-center md:items-start gap-1">
          <span className="text-lg font-bold text-slate-900 dark:text-gray-100">Chatify</span>
          <span className="text-sm font-medium text-slate-500 dark:text-gray-400">© {currentYear} Chatify. Secure & Encrypted.</span>
        </div>
      </div>
    </footer>
  )
}
