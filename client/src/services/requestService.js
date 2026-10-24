
import { apiRequest } from './api.js';

function unwrapRequestList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.requests)) return data.requests;
  if (Array.isArray(data?.data)) return data.data;

  return [];
}

export async function getRequests() {
  return unwrapRequestList(await apiRequest('/requests'));
}

export async function getRequestById(requestId) {
  if (!requestId) {
    throw new Error('Request ID is required.');
  }

  const data = await apiRequest(
    `/requests/${encodeURIComponent(requestId)}`
  );

  return data?.request ?? data?.data ?? data;
}

export async function createRequest(requestData) {
  if (!requestData?.recipient && !requestData?.recipientId) {
    throw new Error('A recipient is required to send a request.');
  }

  const data = await apiRequest('/requests', {
    method: 'POST',
    body: JSON.stringify(requestData),
  });

  return data?.request ?? data?.data ?? data;
}

export async function updateRequestStatus(requestId, status) {
  if (!requestId) {
    throw new Error('Request ID is required.');
  }

  if (!['accepted', 'declined'].includes(status)) {
    throw new Error('Status must be accepted or declined.');
  }

  const data = await apiRequest(
    `/requests/${encodeURIComponent(requestId)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }
  );

  return data?.request ?? data?.data ?? data;
}
