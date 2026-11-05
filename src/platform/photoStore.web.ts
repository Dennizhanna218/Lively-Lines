// 웹: 장면 사진은 용량이 커서 일반 저장소 대신 브라우저의 IndexedDB에 저장해요.
// 저장 전에 크기를 줄여서(긴 쪽 1000px, JPEG) 용량을 아껴요. (네이티브 버전은 photoStore.ts)

const DB = 'lovely-lines';
const STORE = 'photos';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

export const savePhoto = (id: string, dataUrl: string) => tx<void>('readwrite', (s) => s.put(dataUrl, id));
export const loadPhoto = (id: string) => tx<string | undefined>('readonly', (s) => s.get(id)).then((x) => x ?? null);
export const deletePhoto = (id: string) => tx<void>('readwrite', (s) => s.delete(id));

/** 사진 고르기(카메라 또는 앨범) → 줄인 사진(data URL) */
export function pickPhoto(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const max = 1000;
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * k);
        canvas.height = Math.round(img.height * k);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = () => resolve(null);
      img.src = url;
    };
    input.click();
  });
}
