import { store } from '@/store';
import { HistoryEntry } from '@/domain/types';
import { newId } from '@/domain/ids';
export function logChange(kind: HistoryEntry['kind'], label: string, changes: string[] = []): void {
  store.commit('LOG', { id: newId(), at: new Date().toISOString(), kind, label, changes });
}
