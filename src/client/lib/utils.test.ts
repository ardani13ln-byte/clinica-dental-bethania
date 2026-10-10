import { describe, it, expect } from "vitest";
import { toIsoDate, gtDayBounds, localDateTime, minutesOfDay } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

describe("toIsoDate", () => {
  it("formatea fecha local YYYY-MM-DD", () => {
    expect(toIsoDate(new Date(2026, 9, 10, 23, 59))).toBe("2026-10-10");
  });
});

describe("gtDayBounds", () => {
  it("cubre el dia GT como rango UTC (00:00 GT = 06:00Z)", () => {
    const { ini, fin } = gtDayBounds("2026-10-10");
    expect(ini).toBe("2026-10-10T06:00:00.000Z");
    expect(fin).toBe("2026-10-11T06:00:00.000Z");
  });
});

describe("localDateTime", () => {
  it("ancla hora GT con offset -06:00", () => {
    expect(localDateTime("2026-10-11", 540)).toBe("2026-10-11T09:00:00-06:00");
  });
});

describe("minutesOfDay", () => {
  it("respeta offsets ISO", () => {
    expect(minutesOfDay("2026-10-11T09:00:00-06:00")).toBe(540);
  });
});

describe("buildWhatsAppUrl", () => {
  it("agrega 502 a numeros de 8 digitos y codifica el mensaje", () => {
    const url = buildWhatsAppUrl("12345678", "2026-10-11T09:00:00-06:00", "Juan Perez", "Limpieza");
    expect(url.startsWith("https://wa.me/50212345678?text=")).toBe(true);
    expect(decodeURIComponent(url)).toContain("Juan Perez");
  });
  it("conserva numeros con codigo de pais", () => {
    const url = buildWhatsAppUrl("+502 87654321", "2026-10-11T09:00:00-06:00", "Ana", null);
    expect(url.startsWith("https://wa.me/50287654321?text=")).toBe(true);
  });
});
