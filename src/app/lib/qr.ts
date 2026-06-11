import QRCode from "qrcode";

// 매장 손님 폼 QR(PNG 800px) 다운로드. 새 그린 톤(ink·card)으로.
export async function downloadStoreQR(slug: string) {
  const url = `${location.origin}/s?store=${encodeURIComponent(slug)}`;
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, url, {
    width: 800,
    margin: 2,
    color: { dark: "#12301d", light: "#f2f7ef" },
    errorCorrectionLevel: "M",
  });
  await new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `voxpop-qr-${slug}.png`;
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); resolve(); }, 1000);
    }, "image/png");
  });
}

export function storeFormUrl(slug: string) {
  return `${location.origin}/s?store=${encodeURIComponent(slug)}`;
}
