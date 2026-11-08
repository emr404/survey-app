import { ref, onBeforeUnmount } from 'vue';
import type { DataValue } from '@/types/json';
import type { RequestController, RequestStatus, RequestOutcome } from '@/types/requests';
import { RequestGate } from '@/domain/requests';

const REQUEST_TIMEOUT_MS = 60000;

export function useTravelRequest(): RequestController {
  const gate = new RequestGate();
  const status = ref<RequestStatus>('idle');
  const error = ref('');
  let pendingTimeout: number | null = null;

  function clearTimeout(): void {
    if (pendingTimeout === null) return;
    window.clearTimeout(pendingTimeout);
    pendingTimeout = null;
  }

  function cancel(): void {
    gate.cancel();
    clearTimeout();
    status.value = 'cancelled';
    error.value = '';
  }

  async function run<T>(
    operation: (signal: AbortSignal) => Promise<T>,
    accept: (value: T) => void
  ): Promise<void> {
    clearTimeout();
    const { id, signal } = gate.begin();
    status.value = 'requesting';
    error.value = '';
    const timeout = window.setTimeout(() => {
      if (!gate.current(id)) return;
      gate.cancel();
      status.value = 'error';
      error.value = 'This request took too long. Your previous work is saved. Please retry.';
    }, REQUEST_TIMEOUT_MS);
    pendingTimeout = timeout;
    try {
      const result = await operation(signal).then<RequestOutcome<T>, RequestOutcome<T>>(
        (value) => ({ success: true, value }),
        (cause: DataValue) => ({
          success: false,
          message: cause instanceof Error ? cause.message : 'Something went wrong. Please retry.',
        })
      );
      if (!gate.current(id)) return;
      if (!result.success) {
        error.value = result.message;
        status.value = 'error';
        return;
      }
      accept(result.value);
      status.value = 'done';
    } catch {
      if (!gate.current(id)) return;
      error.value = 'Something went wrong. Your previous results are preserved. Please retry.';
      status.value = 'error';
    } finally {
      window.clearTimeout(timeout);
      if (pendingTimeout === timeout) pendingTimeout = null;
    }
  }

  onBeforeUnmount(() => {
    gate.cancel();
    clearTimeout();
  });
  return { status, error, run, cancel };
}
