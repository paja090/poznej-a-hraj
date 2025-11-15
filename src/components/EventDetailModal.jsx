import React from "react";

export default function EventDetailModal({ event, onClose, onReserve }) {
  if (!event) return null;

  React.useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

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
          className="absolute top-3 right-3 text-white/70 hover:text-white text-xl"
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
          <span className="absolute top-4 left-4 rounded-full border border-white/25 bg-black/40 px-4 py-1 text-xs font-semibold uppercase tracking-wide">
            {new Date(event.date) > new Date() ? "Nadcházející" : "Archiv"}
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Název */}
          <h2 className="text-2xl font-bold">{event.title}</h2>

          {/* Tagy */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag, i) => (
                <span
                  key={i}
                  className="text-[11px] px-3 py-1 rounded-full bg-white/10 border border-white/20"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Popis */}
          {event.description && (
            <p className="text-white/70 leading-relaxed">{event.description}</p>
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
              <span className="font-semibold">{event.price} Kč</span>
            </div>

            {"available" in event && (
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                👥 Zbývá míst:
                <br />
                <span className="font-semibold text-a2">{event.available}</span>
              </div>
            )}
          </div>

          {/* Program večera */}
          {event.program && event.program.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">📌 Program večera</h3>
              <ul className="space-y-1 text-white/70 text-sm">
                {event.program.map((p, i) => (
                  <li key={i}>• {p}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Dress Code */}
          {event.dressCode && (
            <div>
              <h3 className="text-lg font-semibold mb-2">👗 Dress code</h3>
              <p className="text-white/70 text-sm">{event.dressCode}</p>
            </div>
          )}

          {/* V ceně vstupenky */}
          {event.included && event.included.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">🎁 V ceně vstupenky</h3>
              <ul className="space-y-1 text-white/70 text-sm">
                {event.included.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Cíl akce */}
          {event.goals && event.goals.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">🎯 Cíl akce</h3>
              <ul className="space-y-1 text-white/70 text-sm">
                {event.goals.map((goal, i) => (
                  <li key={i}>• {goal}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Fotky */}
          <div>
            <h3 className="text-lg font-semibold mb-2">📸 Fotky z našich večerů</h3>
            <div className="grid grid-cols-3 gap-2">
              {(event.galleryImages && event.galleryImages.length > 0
                ? event.galleryImages
                : [null, null, null]
              ).map((img, i) => (
                <div
                  key={i}
                  className="h-20 bg-white/10 rounded-lg border border-white/10 overflow-hidden"
                >
                  {img ? (
                    <img src={img} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-white/30">
                      Foto
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mapa místa */}
          <div>
            <h3 className="text-lg font-semibold mb-2">🗺️ Mapa místa</h3>
            <div className="rounded-xl overflow-hidden border border-white/10">
              <iframe
                src={`https://www.google.com/maps?q=${encodeURIComponent(
                  event.place
                )}&output=embed`}
                className="w-full h-48"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>

          {/* Tlačítko rezervace */}
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

