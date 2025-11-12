const reviews = [
  { text: "Skvěle připravené aktivity, poznala jsem úžasné lidi.", name: "Anna" },
  { text: "Program odsýpal a moderátoři byli k nezaplacení.", name: "Jakub" },
  { text: "Parádní večer plný smíchu a přirozených seznámení.", name: "Eliška" },
];

export default function ReviewsSection() {
  return (
    <section id="reviews" className="card mt-16 space-y-6">
      <h3 className="text-xl font-semibold text-white">Recenze</h3>
      <p className="text-sm text-white/60">Co říkají účastníci 💬</p>
      <div className="grid gap-6 md:grid-cols-3">
        {reviews.map((r, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white/5 border border-white/10 p-5 shadow-lg hover:border-a1/50 transition"
          >
            <p className="text-white/80 mb-2">„{r.text}“</p>
            <p className="text-sm text-a2 font-semibold">— {r.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

