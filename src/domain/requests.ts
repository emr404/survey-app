// Cancellation is cooperative; the sequence check also rejects late, non-cooperative responses.
export class RequestGate {
  private sequence = 0;
  private controller: AbortController | null = null;
  begin(): { id: number; signal: AbortSignal } {
    this.controller?.abort();
    this.controller = new AbortController();
    return { id: ++this.sequence, signal: this.controller.signal };
  }
  current(id: number): boolean {
    return id === this.sequence && this.controller !== null && !this.controller.signal.aborted;
  }
  cancel(): void {
    this.controller?.abort();
    this.sequence++;
    this.controller = null;
  }
}
