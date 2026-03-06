"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function MobileScanPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const html5QrCodeRef = useRef<unknown>(null);

  const startScanner = async () => {
    setError("");
    setScanning(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleScanResult(decodedText);
          scanner.stop().catch(() => {});
          setScanning(false);
        },
        () => {} // ignore errors during scanning
      );
    } catch (_err) {
      setError("카메라를 사용할 수 없습니다. 브라우저 카메라 권한을 확인해주세요.");
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        await (html5QrCodeRef.current as { stop: () => Promise<void> }).stop();
      }
    } catch (_e) {}
    setScanning(false);
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const handleScanResult = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === "location" && parsed.id) {
        router.push(`/mobile/check/${parsed.id}`);
      } else {
        setError("유효하지 않은 QR코드입니다.");
      }
    } catch {
      setError("QR코드를 읽을 수 없습니다.");
    }
  };

  const handleManualSearch = async () => {
    if (!manualCode.trim()) return;
    const res = await fetch(`/api/locations?search=${manualCode}`);
    const locations = await res.json();
    if (Array.isArray(locations) && locations.length > 0) {
      router.push(`/mobile/check/${locations[0].id}`);
    } else {
      setError("해당 위치를 찾을 수 없습니다.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-gray-900">QR 코드 스캔</h1>
        <p className="text-sm text-gray-500 mt-1">보관 위치의 QR코드를 스캔하세요</p>
      </div>

      {/* QR Scanner */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div id="qr-reader" className="w-full" style={{ minHeight: scanning ? 300 : 0 }} />

        {!scanning ? (
          <div className="p-6 text-center">
            <div className="w-20 h-20 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <Button onClick={startScanner} size="lg" className="w-full">
              카메라로 QR 스캔
            </Button>
          </div>
        ) : (
          <div className="p-4 text-center">
            <Button variant="danger" onClick={stopScanner} className="w-full">
              스캔 중지
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 text-center">
          {error}
        </div>
      )}

      {/* Manual Input */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-sm font-medium text-gray-700 mb-3">위치코드 직접 입력</h2>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="예: 1F-A-03"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
          />
          <Button onClick={handleManualSearch}>검색</Button>
        </div>
      </div>
    </div>
  );
}
