import api from '@/lib/api';
import { CreateDeviceSessionData, DeviceSessionDTO } from '@/app/types/device-session';

export async function createDeviceSession(
  data: CreateDeviceSessionData,
): Promise<DeviceSessionDTO> {
  const response = await api.post<DeviceSessionDTO>('/device-session', data);
  return response.data;
}

export async function getMyDeviceSession(): Promise<DeviceSessionDTO> {
  const response = await api.get<DeviceSessionDTO>('/device-session/me');
  return response.data;
}
