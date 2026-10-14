import { useEffect, useRef, useState, useId } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, Square } from "lucide-react";
import { Button } from "./ui/button";
import { useLanguage } from "../lib/i18n";
export default function BarcodeScanner({ onScan }) {
  const id = "scanner-" + useId().replace(/:/g, "");
  const scanner = useRef(null);
  const active = useRef(true);
  const callback = useRef(onScan);
  callback.current = onScan;
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const stop = async () => {
    const s = scanner.current;
    if (s?.isScanning) await s.stop();
    if (active.current) setRunning(false);
  };
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      const s = scanner.current;
      if (s?.isScanning)
        s.stop()
          .then(() => s.clear())
          .catch(() => {});
    };
  }, []);
  const start = async () => {
    setBusy(true);
    setError("");
    try {
      if (!window.isSecureContext)
        throw new Error("Для камеры нужен HTTPS или localhost");
      const s = new Html5Qrcode(id);
      scanner.current = s;
      let handled = false;
      await s.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 160 } },
        (text) => {
          if (handled) return;
          handled = true;
          callback.current(text);
          stop().catch(() => {});
        },
        () => {},
      );
      if (!active.current) {
        await s.stop();
        s.clear();
        return;
      }
      setRunning(s.isScanning);
    } catch (e) {
      if (active.current)
        setError(
          "Не удалось открыть камеру. Разрешите доступ в браузере или введите штрих-код вручную. " +
            (e.message || ""),
        );
    } finally {
      if (active.current) setBusy(false);
    }
  };
  const { t } = useLanguage();
  return (
    <div className="barcode-scanner">
      <div className={`camera-area ${running ? "running" : ""}`}>
        <div id={id} />
        {!running && (
          <div className="camera-placeholder">
            <div className="scan-reticle">
              <Camera size={42} />
            </div>
            <h3>Сканируйте штрих-код</h3>
            <p>Разместите код внутри рамки камеры</p>
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="danger-text scanner-error">
          {error}
        </p>
      )}
      <Button
        disabled={busy}
        variant={running ? "outline" : "default"}
        onClick={
          running ? () => stop().catch((e) => setError(e.message)) : start
        }
      >
        {running ? <Square size={17} /> : <Camera size={17} />}{" "}
        {busy ? "Запуск…" : t(running ? "Остановить" : "Запустить камеру")}
      </Button>
    </div>
  );
}
