export default function Logo() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 rounded-2xl overflow-hidden mb-3 shadow-2xl shadow-black/50">
        <img src="https://media.base44.com/images/public/6a26f9f976c66281507ebfba/fc39e3845_plus.png" alt="Snapchat+" className="w-full h-full object-cover" />
      </div>
      <h1 className="font-heading text-4xl font-black text-foreground tracking-tight">
        Snapchat<span className="text-primary">+</span>
      </h1>
      <p className="text-muted-foreground text-sm mt-1">Activez Snapchat+ gratuitement pendant 1 an !</p>
    </div>
  );
}