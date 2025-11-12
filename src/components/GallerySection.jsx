import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function GallerySection() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    const loadGallery = async () => {
      try {
        const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const imgs = snap.docs.map((d) => d.data());
        setImages(imgs);
      } catch (err) {
        console.error("Chyba při načítání galerie:", err);
      }
    };
    loadGallery();
  }, []);

  return (
    <section id="gallery" className="card mt-16 space-y-6">
      <h3 className="text-xl font-semibold text-white">Momentky z večerů</h3>
      <p className="text-sm text-white/60">
        📸 Sdílej své fotky s hashtagem <strong>#poznejahraj</strong> a objev se i ty!
      </p>
      {images.length === 0 ? (
        <p className="text-white/50 text-sm">Načítám galerii...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img, i) => (
            <img
              key={i}
              src={img.url}
              alt={img.name || "momentka"}
              className="rounded-lg border border-white/10 shadow-md"
            />
          ))}
        </div>
      )}
    </section>
  );
}

