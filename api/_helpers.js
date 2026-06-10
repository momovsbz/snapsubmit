const memoryStore = globalThis.__snapsubmitMemory || (globalThis.__snapsubmitMemory = { submissions: [], adminInactive: false });

const json = (status, payload) => new Response(JSON.stringify(payload), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

export function ok(payload) { return json(200, payload); }
export function fail(status, message) { return json(status, { error: message }); }

export function createSubmissionRecord({ snapchat, telephone, operateur, ip, country, browser, status = 'pending' }) {
  const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const record = {
    id,
    snapchat,
    telephone,
    operateur,
    status,
    ip_address: ip,
    country,
    browser,
    created_at: new Date().toISOString(),
  };
  memoryStore.submissions.unshift(record);
  return record;
}

export function getSubmissionById(id) {
  return memoryStore.submissions.find((item) => item.id === id) || null;
}

export function updateSubmissionStatus(id, status) {
  const record = getSubmissionById(id);
  if (!record) return null;
  record.status = status;
  return record;
}

export function getStore() {
  return memoryStore;
}
