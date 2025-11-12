const images = [
  "https://picsum.photos/seed/party01/800/533",
  "https://picsum.photos/seed/party02/800/533",
  "https://picsum.photos/seed/party03/800/533",
  "https://picsum.photos/seed/party04/800/533",
  "https://picsum.photos/seed/party05/800/533",
  "https://picsum.photos/seed/party06/800/533",
];

export default function GallerySection() {
  return (
    <section id="gallery" className="card mt-16 space-y-6">
      <h3 className="text-xl font-semibold text-white">Momentky z večerů</h3>
      <p className="text-sm text-white/60">
        📸 Sdílej své fotky s hashtagem <strong>#poznejahraj</strong> a objev se i ty!
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt="Momentka"
            className="rounded-2xl border border-white/10 object-cover h-40 w-full hover:scale-105 hover:border-a1/60 transition-transform"
          />
        ))}
      </div>
    </section>
  );
}

