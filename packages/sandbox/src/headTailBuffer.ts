/**
 * Memory-bounded accumulator that keeps the first N bytes and last N bytes
 * of a stream, dropping the middle. This prevents runaway commands (e.g.
 * `cat huge_file`) from consuming unbounded memory on the relay.
 */
export class HeadTailBuffer {
  private head: string;
  private tail: string;
  private _totalBytes = 0;
  private headFull = false;
  private readonly halfSize: number;

  constructor(halfSize: number) {
    this.halfSize = halfSize;
    this.head = "";
    this.tail = "";
  }

  append(text: string): void {
    this._totalBytes += text.length;

    if (!this.headFull) {
      this.head += text;
      if (this.head.length >= this.halfSize) {
        this.headFull = true;
        this.head = this.head.slice(0, this.halfSize);
      }
      return;
    }

    // Head is full — maintain a rolling tail buffer
    this.tail += text;
    if (this.tail.length > this.halfSize * 2) {
      this.tail = this.tail.slice(-this.halfSize);
    }
  }

  get totalBytes(): number {
    return this._totalBytes;
  }

  toString(): string {
    if (!this.headFull) return this.head;
    const tailSlice = this.tail.slice(-this.halfSize);
    return this.head + tailSlice;
  }
}
