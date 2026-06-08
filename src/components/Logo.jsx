export default function Logo() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 rounded-xl overflow-hidden mb-2 shadow-lg shadow-primary/30">
        <img src="https://media.base44.com/images/public/6a26f9f976c66281507ebfba/9b266cad6_plus.png" alt="Snapchat+" className="w-full h-full object-cover" />
      </div>
      <h1 className="font-heading text-2xl font-black text-foreground tracking-tight">
        Snapchat<span className="text-primary">+</span>
      </h1>
    </div>
  );
}