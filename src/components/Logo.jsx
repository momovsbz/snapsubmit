export default function Logo() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 rounded-2xl overflow-hidden mb-3 shadow-2xl shadow-primary/50 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/40 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-8 h-8 text-primary" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M35 30c-8 0-12 5-12 12v8c0 7 4 12 12 12h30c8 0 12-5 12-12v-8c0-7-4-12-12-12H35Z" />
          <circle cx="45" cy="48" r="5" fill="currentColor" />
          <circle cx="65" cy="48" r="5" fill="currentColor" />
          <path d="M50 65c4 3 10 5 15 5" />
          <text x="70" y="35" fontSize="16" fontWeight="bold" fill="currentColor">+</text>
        </svg>
      </div>
      <h1 className="font-heading text-2xl font-black text-foreground tracking-tight">
        Snapchat<span className="text-primary">+</span>
      </h1>
    </div>
  );
}