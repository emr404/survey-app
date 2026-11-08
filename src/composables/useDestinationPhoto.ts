import { ref, watch, onBeforeUnmount, Ref } from 'vue';
import type { DestinationImage } from '@/types/requests';
import { getDestinationPhoto, invalidateDestinationPhoto } from '@/services/photos';

interface PhotoLocation {
  name: string;
  country: string;
}
interface DestinationPhotoController {
  photo: Ref<DestinationImage | null>;
  pending: Ref<boolean>;
  failed: Ref<boolean>;
  imageFailed(): void;
}

export function useDestinationPhoto(location: () => PhotoLocation): DestinationPhotoController {
  const photo = ref<DestinationImage | null>(null);
  const pending = ref(true);
  const failed = ref(false);
  let controller: AbortController | null = null;

  function imageFailed(): void {
    failed.value = true;
    const { name, country } = location();
    invalidateDestinationPhoto(name, country);
  }

  watch(
    location,
    async ({ name, country }) => {
      controller?.abort();
      const current = new AbortController();
      controller = current;
      photo.value = null;
      pending.value = true;
      failed.value = false;
      try {
        const result = await getDestinationPhoto(name, country, current.signal);
        if (current.signal.aborted) return;
        photo.value = result;
      } catch {
        if (!current.signal.aborted) failed.value = true;
      } finally {
        if (!current.signal.aborted) pending.value = false;
      }
    },
    { immediate: true }
  );

  onBeforeUnmount(() => controller?.abort());
  return { photo, pending, failed, imageFailed };
}
