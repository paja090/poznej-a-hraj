import React from "react";

const TAG_ICON_MAP = {
  "Soutěže": "🏆",
  "Minihry": "🎮",
  "Dýmky": "🔥",
  "Seznamovací": "❤️‍🔥",
  "Party": "🥳",
  "Kvízy": "🧠",
  "Týmové hry": "🤝",
  "Volná zábava": "🎉",
  "Speciální edice": "🎁",
  "Mikulášská": "🎅",
};

export default function EventDetailModal({ event, onClose, onReserve }) {
  if (!event) return null;

  // ESC zavření
  React.useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Slideshow fotek
  const images = Array.isArray(event.galleryImages)
    ? event.galleryImages
    : [];

  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (!images.length) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000); // 3s autoplay
    return () => clearInterval(interval);
  }, [images.length]);

  const goPrev = () => {
    if (!images.length) return;
    setCurrentIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const goNext = () => {
    if (!images.length) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const programItems = Array.isArray(event.program) ? event.program : [];
  const includedItems = Array.isArray(event.included) ? event.included : [];
  const goalsItems = Array.isArray(event.goals) ? event.goals : [];
  const tags = Array.isArray(event.tags) ? event.tags : [];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0b0f19] text-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl animate-fadeIn relative"
        onClick={(e) => e.stopPropagation()}
      >
       {/* Zavírací tlačítko */}
<button
  onClick={onClose}
  className="
    absolute 
    top-3 
    right-3 
    z-50 
    h-9 w-9 
    flex items-center justify-center
    rounded-full 
    bg-black/40 
    backdrop-blur 
    hover:bg-black/60 
    text-white/80 
    hover:text-white 
    transition
  "
>
  ✖
</button>


        {/* BANNER */}
        <div className="h-48 w-full overflow-hidden rounded-t-3xl relative">
          {event.bannerUrl ? (
            <img
              src={event.bannerUrl}
              alt={event.title}
              className="w-full h-full object-cover opacity-80"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-white/40 bg-white/10">
              📸 Banner akce
            </div>
          )}

          {/* Štítek (Nadcházející / Archiv) */}
          <span className="absolute top-4 left-4 rounded-full border border-white/25 bg-black/50 px-4 py-1 text-xs font-semibold uppercase tracking-wide">
            {event.date && new Date(event.date) > new Date()
              ? "Nadcházející"
              : "Archiv"}
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Název */}
          <h2 className="text-2xl font-bold">{event.title}</h2>

          {/* Tagy s ikonami */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, i) => {
                const icon = TAG_ICON_MAP[tag] || "#";
                return (
                  <span
                    key={`${tag}-${i}`}
                    className="text-[11px] px-3 py-1 rounded-full bg-white/5 border border-white/15 flex items-center gap-1"
                  >
                    <span>{icon}</span>
                    <span>{tag}</span>
                  </span>
                );
              })}
            </div>
          )}

          {/* Popis */}
          {event.description && (
            <p className="text-white/70 leading-relaxed">
              {event.description}
            </p>
          )}

          {/* Info blok */}
          <div className="grid grid-cols-2 gap-3 text-sm text-white/80">
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
              📅 Datum:
              <br />
              <span className="font-semibold">{event.date}</span>
            </div>

            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
              📍 Místo:
              <br />
              <span className="font-semibold">{event.place}</span>
            </div>

            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
              🎟️ Cena:
              <br />
              <span className="font-semibold">
                {event.price ? `${event.price} Kč` : "bude upřesněno"}
              </span>
            </div>

            {"available" in event && (
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                👥 Zbývá míst:
                <br />
                <span className="font-semibold text-a2">
                  {event.available}
                </span>
              </div>
            )}
          </div>

          {/* Program večera – TIMELINE */}
          {programItems.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">
                📌 Program večera
              </h3>
              <div className="space-y-3">
                {programItems.map((item, index) => {
                  const parts = item.split("–");
                  const time = parts[0]?.trim() || "";
                  const text = parts.slice(1).join("–").trim() || parts[0];

                  return (
                    <div
                      key={`${item}-${index}`}
                      className="flex items-start gap-3 text-sm"
                    >
                      {/* Timeline "čára" + tečka */}
                      <div className="flex flex-col items-center mt-1">
                        <div className="h-2 w-2 rounded-full bg-a2" />
                        {index < programItems.length - 1 && (
                          <div className="w-px flex-1 bg-white/15 mt-1" />
                        )}
                      </div>
                      {/* Text programu */}
                      <div>
                        {time && (
                          <p className="text-xs font-mono text-white/60">
                            {time}
                          </p>
                        )}
                        <p className="text-white/80">{text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dress code */}
          {event.dressCode && (
            <div>
              <h3 className="text-lg font-semibold mb-2">👗 Dress code</h3>
              <p className="text-white/70 text-sm">{event.dressCode}</p>
            </div>
          )}

          {/* V ceně vstupenky */}
          {includedItems.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">
                🎁 V ceně vstupenky
              </h3>
              <ul className="space-y-1 text-white/70 text-sm">
                {includedItems.map((item, i) => (
                  <li key={`${item}-${i}`}>• {item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Cíl akce */}
          {goalsItems.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">🎯 Cíl akce</h3>
              <ul className="space-y-1 text-white/70 text-sm">
                {goalsItems.map((goal, i) => (
                  <li key={`${goal}-${i}`}>• {goal}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Fotky – SLIDE SLIDESHOW */}
          <div>
            <h3 className="text-lg font-semibold mb-2">
              📸 Fotky z našich večerů
            </h3>

            {images.length > 0 ? (
              <div className="relative w-full h-40 rounded-xl overflow-hidden border border-white/10">
                {/* Slider */}
                <div
                  className="flex h-full transition-transform duration-500 ease-out"
                  style={{
                    transform: `translateX(-${currentIndex * 100}%)`,
                  }}
                >
                  {images.map((img, i) => (
                    <div
                      key={`${img}-${i}`}
                      className="w-full h-full flex-shrink-0"
                    >
                      <img
                        src={img}
                        alt={`Foto ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>

                {/* Šipky */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={goPrev}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-2 py-1 text-xs hover:bg-black/70"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-2 py-1 text-xs hover:bg-black/70"
                    >
                      →
                    </button>
                  </>
                )}

                {/* Dots */}
                {images.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCurrentIndex(i)}
                        className={`h-1.5 w-4 rounded-full ${
                          i === currentIndex
                            ? "bg-white"
                            : "bg-white/30"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-white/10 rounded-lg border border-white/10 grid place-items-center text-white/30 text-xs"
                  >
                    Foto
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mapa místa */}
          <div>
            <h3 className="text-lg font-semibold mb-2">🗺️ Mapa místa</h3>
            <div className="rounded-xl overflow-hidden border border-white/10">
              <iframe
                src={`https://www.google.com/maps?q=${encodeURIComponent(
                  event.place || ""
                )}&output=embed`}
                className="w-full h-48"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>

          {/* CTA – Rezervovat */}
          <button
            onClick={onReserve}
            className="w-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-500 py-3 rounded-xl text-lg font-semibold text-[#071022] shadow-lg hover:scale-[1.02] transition"
          >
            Rezervovat místo
          </button>
        </div>
      </div>
    </div>
  );
}

