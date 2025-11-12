const crew = [
  {
    name: "Marek",
    role: "Moderátor her",
    description: "Připravuje výzvy a dělá atmosféru.",
    photo: "https://i.pravatar.cc/200?img=12",
  },
  {
    name: "Petra",
    role: "Koordinátorka zábavy",
    description: "Propojuje hosty a hlídá flow večera.",
    photo: "https://i.pravatar.cc/200?img=47",
  },
  {
    name: "Tomáš",
    role: "DJ & Tech",
    description: "Hudba, světla a technika vyladěná na party.",
    photo: "https://i.pravatar.cc/200?img=33",
  },
];

export default function CrewSection() {
  return (
    <section id="crew" className="card mt-16 space-y-6">
      <h3 className="text-xl font-semibold text-white">The Crew</h3>
      <p className="text-sm text-white/60">Lidé, kteří za tím stojí 🎧</p>
      <div className="grid gap-6 md:grid-cols-3">
        {crew.map((m) => (
          <article
            key={m.name}
            className="group bg-white/5 border border-white/10 p-6 rounded-2xl text-center hover:border-a1/60 hover:bg-white/10 transition-all"
          >
            <img
              src={m.photo}
              alt={m.name}
              className="h-24 w-24 rounded-full mx-auto object-cover border border-white/20 shadow-md group-hover:scale-110 transition-transform"
            />
            <h4 className="mt-4 text-lg font-semibold text-white">{m.name}</h4>
            <p className="text-a2 text-sm">{m.role}</p>
            <p className="text-white/70 text-sm mt-2">{m.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

