import QRCode from "qrcode";

export async function generateQRCodeDataURL(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 300,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}

export async function generateQRCodeBuffer(data: string): Promise<Buffer> {
  return QRCode.toBuffer(data, {
    width: 300,
    margin: 2,
    type: "png",
  });
}

// ZPL 명령어 생성 (Zebra 라벨 프린터용)
export function generateZPLLabel(options: {
  locationCode: string;
  locationName: string;
  qrData: string;
  labelWidth?: number; // mm
  labelHeight?: number; // mm
}): string {
  const { locationCode, locationName, qrData, labelWidth = 60, labelHeight = 40 } = options;

  // ZPL 좌표 (dots, 203dpi 기준: 1mm ≈ 8dots)
  const dotsPerMm = 8;
  const width = labelWidth * dotsPerMm;
  const height = labelHeight * dotsPerMm;

  const qrX = Math.round(width * 0.1);
  const qrY = Math.round(height * 0.15);
  const textX = Math.round(width * 0.5);
  const codeY = Math.round(height * 0.2);
  const nameY = Math.round(height * 0.55);

  return `
^XA
^PW${width}
^LL${height}
^FO${qrX},${qrY}
^BQN,2,5
^FDQA,${qrData}^FS
^FO${textX},${codeY}
^A0N,40,40
^FD${locationCode}^FS
^FO${textX},${nameY}
^A0N,28,28
^FD${locationName}^FS
^XZ
`.trim();
}

// 네트워크 프린터로 ZPL 전송
export async function sendToLabelPrinter(
  zplCommand: string,
  printerIp: string,
  printerPort: number = 9100
): Promise<{ success: boolean; error?: string }> {
  try {
    // Node.js net 모듈 사용 (서버 사이드)
    const net = await import("net");

    return new Promise((resolve) => {
      const client = new net.Socket();

      client.connect(printerPort, printerIp, () => {
        client.write(zplCommand);
        client.end();
        resolve({ success: true });
      });

      client.on("error", (err) => {
        resolve({ success: false, error: err.message });
      });

      client.setTimeout(5000, () => {
        client.destroy();
        resolve({ success: false, error: "연결 시간 초과" });
      });
    });
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
