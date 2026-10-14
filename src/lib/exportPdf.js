import { money } from "./utils";
export async function exportPdf(data) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF();
  // Rasterize report text with browser fonts so Cyrillic is embedded reliably offline.
  const pages = [
    [
      "SANAQ — Отчёт магазина",
      new Date().toLocaleString("ru-KZ"),
      "",
      `Продажи сегодня: ${money(data.today)}`,
      `Продажи за 7 дней: ${money(data.week)}`,
      `Стоимость склада: ${money(data.stockValue)}`,
      `Товаров с низким остатком: ${data.low.length}`,
      "",
      "Продажи за последние 7 дней",
      ...data.days.map((d) => `${d.label}: ${money(d.value)}`),
      "",
      "Нужно заказать",
      ...data.low.map(
        (p) => `${p.name} — ${p.quantity} шт. / минимум ${p.min_stock}`,
      ),
    ],
  ];
  const lines = pages.flat();
  const chunks = [];
  let current = [];
  const measure = document.createElement("canvas").getContext("2d");
  measure.font = "24px Arial";
  for (const line of lines) {
    let wrapped = "";
    for (const word of line.split(" ")) {
      if (measure.measureText(wrapped + " " + word).width > 980) {
        current.push(wrapped);
        wrapped = word;
      } else wrapped += (wrapped ? " " : "") + word;
    }
    current.push(wrapped);
  }
  for (let i = 0; i < current.length; i += 30)
    chunks.push(current.slice(i, i + 30));
  chunks.forEach((chunk, index) => {
    if (index) pdf.addPage();
    const canvas = document.createElement("canvas");
    canvas.width = 1240;
    canvas.height = 1754;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 1240, 1754);
    ctx.fillStyle = "#0F2A4A";
    ctx.fillRect(0, 0, 1240, 18);
    chunk.forEach((line, i) => {
      ctx.font = i === 0 && index === 0 ? "bold 36px Arial" : "24px Arial";
      ctx.fillText(line, 100, 120 + i * 48);
    });
    ctx.font = "18px Arial";
    ctx.fillStyle = "#7a8696";
    ctx.fillText(`SANAQ · ${index + 1} / ${chunks.length}`, 100, 1680);
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
  });
  pdf.save("SANAQ-report.pdf");
}
