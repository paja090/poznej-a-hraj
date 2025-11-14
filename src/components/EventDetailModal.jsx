import React from "react";

export default function EventDetailModal({ event, onClose, onReserve }) {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b0f19] text-white w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-fadeIn relative">

        {/* Zavření */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/70 hover:text-white text-xl"
        >
          ✖
        </button>

        {/* Banner */}
        <div className="h-48 w-full bg-white/10 overflow-hidden">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-white/40">
              📸 Banner akce
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">

          {/* Titul + Tag */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{event.title}</h2>
            <span className="rounded-full border border-fuchsia-400/40 bg-white/10 px-4 py-1 text-xs font-semibold uppercase text-fuchsia-300">
              {new Date(event.date) > new Date() ? "Nadcházející" : "Archiv"}
            </span>
          </div>

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
          <div>
            <h3 className="text-lg font-semibold mb-2">📌 Program večera</h3>
            <ul className="space-y-1 text-white/70 text-sm">
              <li>• Úvod & seznamovací hry</li>
              <li>• Minihry & týmové výzvy</li>
              <li>• Hlavní interaktivní hra večera</li>
              <li>• Chill zóna / bar / dýmky</li>
              <li>• Volná zábava & networking</li>
            </ul>
          </div>

          {/* Mini galerie – zatím placeholder */}
          <div>
            <h3 className="text-lg font-semibold mb-2">📸 Fotky z našich večerů</h3>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-white/10 rounded-lg border border-white/10"
                />
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

          {/* CTA */}
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
