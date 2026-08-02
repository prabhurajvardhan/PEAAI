/**
 * Pixel Buffer - Efficient pixel data manipulation
 * 
 * Features:
 * - ImageData manipulation
 * - Batch pixel operations
 * - Efficient read/write
 * - Color format handling
 * - Blend modes (replace, alpha, add, multiply)
 */

import { IColor, IPixelBatch, BlendMode } from '../types';

export interface IPixelBuffer {
  setPixel(x: number, y: number, color: IColor): void;
  getPixel(x: number, y: number): IColor;
  setPixelBatch(pixels: IPixelBatch): void;
  fill(color: IColor): void;
  copy(): IPixelBuffer;
  blend(other: IPixelBuffer, x: number, y: number, mode: BlendMode): void;
  resize(width: number, height: number): void;
  getWidth(): number;
  getHeight(): number;
  toImageData(): ImageData;
  clear(): void;
}

export class PixelBuffer implements IPixelBuffer {
  private width: number;
  private height: number;
  private data: Uint8ClampedArray;
  private imageData: ImageData | null = null;

  constructor(width: number, height: number) {
    if (width <= 0 || height <= 0) {
      throw new Error('Width and height must be positive');
    }

    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  setPixel(x: number, y: number, color: IColor): void {
    if (!this.isValidCoord(x, y)) {
      return;
    }

    const index = this.getIndex(x, y);
    this.data[index] = this.clampColor(color.r);
    this.data[index + 1] = this.clampColor(color.g);
    this.data[index + 2] = this.clampColor(color.b);
    this.data[index + 3] = this.clampColor(color.a);
    this.imageData = null;
  }

  getPixel(x: number, y: number): IColor {
    if (!this.isValidCoord(x, y)) {
      return { r: 0, g: 0, b: 0, a: 0 };
    }

    const index = this.getIndex(x, y);
    return {
      r: this.data[index],
      g: this.data[index + 1],
      b: this.data[index + 2],
      a: this.data[index + 3],
    };
  }

  setPixelBatch(pixels: IPixelBatch): void {
    for (const { x, y, color } of pixels.pixels) {
      this.setPixel(x, y, color);
    }
  }

  fill(color: IColor): void {
    const r = this.clampColor(color.r);
    const g = this.clampColor(color.g);
    const b = this.clampColor(color.b);
    const a = this.clampColor(color.a);

    for (let i = 0; i < this.data.length; i += 4) {
      this.data[i] = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
      this.data[i + 3] = a;
    }
    this.imageData = null;
  }

  copy(): IPixelBuffer {
    const newBuffer = new PixelBuffer(this.width, this.height);
    newBuffer.data.set(this.data);
    return newBuffer;
  }

  blend(other: IPixelBuffer, offsetX: number, offsetY: number, mode: BlendMode): void {
    const otherWidth = other.getWidth();
    const otherHeight = other.getHeight();

    for (let y = 0; y < otherHeight; y++) {
      for (let x = 0; x < otherWidth; x++) {
        const targetX = x + offsetX;
        const targetY = y + offsetY;

        if (!this.isValidCoord(targetX, targetY)) {
          continue;
        }

        const srcColor = other.getPixel(x, y);
        const dstColor = this.getPixel(targetX, targetY);
        const blendedColor = this.blendColors(srcColor, dstColor, mode);
        this.setPixel(targetX, targetY, blendedColor);
      }
    }
  }

  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) {
      throw new Error('Width and height must be positive');
    }

    if (width === this.width && height === this.height) {
      return;
    }

    const newData = new Uint8ClampedArray(width * height * 4);
    const copyWidth = Math.min(width, this.width);
    const copyHeight = Math.min(height, this.height);

    for (let y = 0; y < copyHeight; y++) {
      for (let x = 0; x < copyWidth; x++) {
        const oldIndex = this.getIndex(x, y);
        const newIndex = y * width * 4 + x * 4;
        newData[newIndex] = this.data[oldIndex];
        newData[newIndex + 1] = this.data[oldIndex + 1];
        newData[newIndex + 2] = this.data[oldIndex + 2];
        newData[newIndex + 3] = this.data[oldIndex + 3];
      }
    }

    this.width = width;
    this.height = height;
    this.data = newData;
    this.imageData = null;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  toImageData(): ImageData {
    if (!this.imageData || this.imageData.width !== this.width || this.imageData.height !== this.height) {
      // Create a copy of the data to avoid SharedArrayBuffer issues
      const dataCopy = new Uint8ClampedArray(this.data);
      this.imageData = new ImageData(dataCopy, this.width, this.height);
    }
    return this.imageData;
  }

  clear(): void {
    this.fill({ r: 0, g: 0, b: 0, a: 0 });
  }

  getData(): Uint8ClampedArray {
    return this.data;
  }

  setData(data: Uint8ClampedArray): void {
    if (data.length !== this.width * this.height * 4) {
      throw new Error('Data length mismatch');
    }
    this.data.set(data);
    this.imageData = null;
  }

  private isValidCoord(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  private getIndex(x: number, y: number): number {
    return (y * this.width + x) * 4;
  }

  private clampColor(value: number): number {
    return Math.max(0, Math.min(255, Math.round(value)));
  }

  private blendColors(src: IColor, dst: IColor, mode: BlendMode): IColor {
    switch (mode) {
      case 'replace':
        return src;

      case 'alpha':
        const alphaSrc = src.a / 255;
        const alphaDst = dst.a / 255;
        const outAlpha = alphaSrc + alphaDst * (1 - alphaSrc);
        
        if (outAlpha === 0) {
          return { r: 0, g: 0, b: 0, a: 0 };
        }

        return {
          r: (src.r * alphaSrc + dst.r * alphaDst * (1 - alphaSrc)) / outAlpha,
          g: (src.g * alphaSrc + dst.g * alphaDst * (1 - alphaSrc)) / outAlpha,
          b: (src.b * alphaSrc + dst.b * alphaDst * (1 - alphaSrc)) / outAlpha,
          a: outAlpha * 255,
        };

      case 'add':
        return {
          r: src.r + dst.r,
          g: src.g + dst.g,
          b: src.b + dst.b,
          a: Math.min(255, src.a + dst.a),
        };

      case 'multiply':
        return {
          r: (src.r * dst.r) / 255,
          g: (src.g * dst.g) / 255,
          b: (src.b * dst.b) / 255,
          a: (src.a * dst.a) / 255,
        };

      default:
        return src;
    }
  }
}

export { PixelBuffer as default };
