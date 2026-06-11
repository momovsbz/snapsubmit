import { base44 } from '@/api/base44Client';

export async function apiInvoke(name, payload = {}) {
  const res = await base44.functions.invoke(name, payload);
  return { data: res?.data };
}

export async function apiGet(name) {
  const res = await base44.functions.invoke(name, {});
  return { data: res?.data };
}