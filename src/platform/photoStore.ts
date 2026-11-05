// 네이티브 앱용 장면 사진 저장 (웹 버전은 photoStore.web.ts).
// 지금은 기본 저장소에 넣어 두고, 네이티브로 전환할 때 expo-image-picker(사진 고르기)와
// expo-file-system(파일 저장)으로 바꾸면 돼요.
import AsyncStorage from '@react-native-async-storage/async-storage';

const key = (id: string) => 'll:photo:' + id;

export const savePhoto = (id: string, dataUrl: string) => AsyncStorage.setItem(key(id), dataUrl);
export const loadPhoto = (id: string) => AsyncStorage.getItem(key(id));
export const deletePhoto = (id: string) => AsyncStorage.removeItem(key(id));

export async function pickPhoto(): Promise<string | null> {
  return null; // TODO(네이티브 전환): expo-image-picker
}
