import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import QRCode from "qrcode";

export default function Ticket() {
  const [params] = useSearchParams();
  const id = params.get("id");

  const [ticketUrl, setTicketUrl] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const url = `${window.location.origin}/#/ticket?id=${id}`;
    setTicketUrl(url);

    QRCode.toDataURL(url, { margin: 1, width: 400 }).then((data) => {
      setQrImage(data);
      setLoading(false);
    });
  }, [id]);

  if (!id) {
    return (
      <div style={{ padding: 32, fontFamily: "sans-serif" }}>
        <h2>Chyba</h2>
        <p>ID vstupenky nebylo nalezeno.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          padding: 32,
          fontFamily: "sans-serif",
        }}
      >
        Načítání vstupenky…
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "40px auto",
        padding: 32,
        fontFamily: "sans-serif",
        border: "1px solid #000",
        borderRadius: 12,
      }}
    >
      {/* HEADER */}
      <h1 style={{ fontSize: 24, marginBottom: 16, textAlign: "center" }}>
        Vstupenka – Poznej & Hraj
      </h1>

      {/* QR */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <img
          src={qrImage}
          alt="QR vstupenky"
          style={{
            width: 240,
            height: 240,
            objectFit: "contain",
          }}
        />
      </div>

      {/* INFO */}
      <p><strong>ID vstupenky:</strong> {id}</p>
      <p>
        <strong>Ověřit vstupenku online:</strong><br />
        {ticketUrl}
      </p>

      {/* PRINT BUTTON */}
      <div style={{ textAlign: "center", marginTop: 32 }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: "10px 20px",
            fontSize: 16,
            border: "1px solid #000",
            background: "white",
            cursor: "pointer",
          }}
        >
          🖨️ Vytisknout
        </button>
      </div>
    </div>
  );
}
