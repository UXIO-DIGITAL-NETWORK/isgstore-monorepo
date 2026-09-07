import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { compressImage } from "@/lib/imageCompression";

/**
 * The skip rules are the load-bearing part: each one exists because converting
 * that kind of file loses something the upload was meant to preserve (a
 * vector, an animation, an already-optimised encode). The happy path is
 * belt-and-braces — the API re-encodes anyway.
 */

const file = (name: string, type: string, bytes: BlobPart = "x") => new File([bytes], name, { type });

/** jsdom ships no canvas or ImageBitmap; stand both up so the path is exercisable. */
function stubCanvas({ blobType = "image/webp", blobSize = 10 } = {}) {
  const canvases: HTMLCanvasElement[] = [];

  globalThis.createImageBitmap = vi.fn(async () =>
    ({ width: 4000, height: 2000, close: vi.fn() }) as unknown as ImageBitmap,
  );

  HTMLCanvasElement.prototype.getContext = vi.fn(function (this: HTMLCanvasElement) {
    canvases.push(this);
    return { drawImage: vi.fn() } as unknown as CanvasRenderingContext2D;
  }) as unknown as HTMLCanvasElement["getContext"];

  HTMLCanvasElement.prototype.toBlob = vi.fn((callback: BlobCallback) => {
    callback(new Blob(["y".repeat(blobSize)], { type: blobType }));
  });

  return canvases;
}

describe("compressImage", () => {
  const originalCreateImageBitmap = globalThis.createImageBitmap;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.createImageBitmap = originalCreateImageBitmap;
  });

  it("re-encodes a jpeg to webp and renames it", async () => {
    stubCanvas();

    const result = await compressImage(file("photo.jpg", "image/jpeg", "x".repeat(5000)));

    expect(result.type).toBe("image/webp");
    expect(result.name).toBe("photo.webp");
  });

  it("caps the longest edge at 1920 and keeps the aspect ratio", async () => {
    const canvases = stubCanvas();

    await compressImage(file("banner.jpg", "image/jpeg", "x".repeat(5000)));

    expect(canvases[0].width).toBe(1920);
    expect(canvases[0].height).toBe(960);
  });

  it("leaves an SVG alone", async () => {
    const svg = file("logo.svg", "image/svg+xml");

    expect(await compressImage(svg)).toBe(svg);
  });

  it("leaves an ICO alone", async () => {
    const ico = file("favicon.ico", "image/vnd.microsoft.icon");

    expect(await compressImage(ico)).toBe(ico);
  });

  it("leaves a PDF alone", async () => {
    const pdf = file("proof.pdf", "application/pdf");

    expect(await compressImage(pdf)).toBe(pdf);
  });

  it("leaves an animated gif alone", async () => {
    stubCanvas();
    // Two Graphic Control Extension blocks — one per frame.
    const frames = new Uint8Array([0x21, 0xf9, 0x04, 0x00, 0x21, 0xf9, 0x04, 0x00]);
    const gif = file("spinner.gif", "image/gif", frames);

    expect(await compressImage(gif)).toBe(gif);
  });

  it("still converts a static gif", async () => {
    stubCanvas();
    const gif = file("static.gif", "image/gif", new Uint8Array([0x21, 0xf9, 0x04, 0x00]));

    expect((await compressImage(gif)).type).toBe("image/webp");
  });

  it("keeps the original when the browser cannot encode webp", async () => {
    stubCanvas({ blobType: "image/png" });
    const jpeg = file("photo.jpg", "image/jpeg");

    expect(await compressImage(jpeg)).toBe(jpeg);
  });

  it("keeps the original when nothing was resized and the result grew", async () => {
    stubCanvas({ blobSize: 5000 });
    globalThis.createImageBitmap = vi.fn(async () =>
      ({ width: 100, height: 100, close: vi.fn() }) as unknown as ImageBitmap,
    );

    const png = file("icon.png", "image/png", "x".repeat(100));

    expect(await compressImage(png)).toBe(png);
  });

  it("keeps the original when the image cannot be decoded at all", async () => {
    globalThis.createImageBitmap = vi.fn(async () => {
      throw new Error("decode failed");
    });

    const broken = file("broken.png", "image/png");

    expect(await compressImage(broken)).toBe(broken);
  });
});
