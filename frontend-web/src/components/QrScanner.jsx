import { useEffect, useRef, useState } from "react";

function openDestination(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const destination = new URL(value, window.location.origin);
    if (destination.protocol !== "http:" && destination.protocol !== "https:") return false;
    window.location.assign(destination.href);
    return true;
  } catch {
    return false;
  }
}

export function QrScanner({ onClose }) {
  const videoRef = useRef(null);
  const [message, setMessage] = useState("Đưa mã QR vào khung hình để mở điểm tham quan.");

  useEffect(() => {
    let stream;
    let timer;
    let stopped = false;
    async function start() {
      if (!("BarcodeDetector" in window) || !navigator.mediaDevices?.getUserMedia) {
        setMessage("Trình duyệt chưa hỗ trợ quét QR trực tiếp. Hãy mở camera của thiết bị hoặc nhập liên kết từ mã QR.");
        return;
      }
      try {
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (stopped || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        timer = window.setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          const codes = await detector.detect(videoRef.current);
          if (codes[0]?.rawValue) {
            if (!openDestination(codes[0].rawValue)) setMessage("Mã QR không chứa liên kết web hợp lệ.");
          }
        }, 400);
      } catch {
        setMessage("Không thể mở camera. Hãy cho phép quyền camera hoặc dùng ứng dụng camera của thiết bị.");
      }
    }
    start();
    return () => {
      stopped = true;
      window.clearInterval(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="scanner-modal" role="dialog" aria-modal="true" aria-labelledby="scanner-title">
        <div className="scanner-modal__head"><div><span className="eyebrow">QUICK DISCOVERY</span><h2 id="scanner-title">Quét mã điểm đến</h2></div><button className="icon-button" onClick={onClose} aria-label="Close scanner">×</button></div>
        <div className="scanner-frame"><video ref={videoRef} playsInline muted /><span className="scanner-frame__corner scanner-frame__corner--tl" /><span className="scanner-frame__corner scanner-frame__corner--tr" /><span className="scanner-frame__corner scanner-frame__corner--bl" /><span className="scanner-frame__corner scanner-frame__corner--br" /></div>
        <p>{message}</p>
        <form className="qr-link-input" onSubmit={(event) => { event.preventDefault(); if (!openDestination(new FormData(event.currentTarget).get("destination"))) setMessage("Vui lòng nhập liên kết http hoặc https hợp lệ."); }}>
          Or paste a destination link<input name="destination" type="url" placeholder="https://…" />
          <button className="button button--primary" type="submit">Mở điểm đến</button>
        </form>
      </section>
    </div>
  );
}
