import { apiFetch } from './api';

function buildQuery(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') searchParams.set(key, value);
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

/** POST /api/v1/feedbacks */
export async function createFeedback(payload, locale = 'vi') {
  return apiFetch('/feedbacks', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, locale);
}

/** GET /api/v1/feedbacks */
export async function searchFeedbacks(params = {}, locale = 'vi') {
  return apiFetch(`/feedbacks${buildQuery(params)}`, {}, locale);
}

/** PUT /api/v1/feedbacks/{id}/reply */
export async function replyFeedback(id, payload, locale = 'vi') {
  return apiFetch(`/feedbacks/${id}/reply`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, locale);
}

/** DELETE /api/v1/feedbacks/{id} */
export async function deleteFeedback(id, locale = 'vi') {
  return apiFetch(`/feedbacks/${id}`, {
    method: 'DELETE',
  }, locale);
}

/** GET /api/v1/feedbacks/my */
export async function getMyFeedbacks(locale = 'vi') {
  return apiFetch('/feedbacks/my', {}, locale);
}

/** PUT /api/v1/feedbacks/my/{id} */
export async function updateMyFeedback(id, payload, locale = 'vi') {
  return apiFetch(`/feedbacks/my/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, locale);
}

/** DELETE /api/v1/feedbacks/my/{id} */
export async function deleteMyFeedback(id, locale = 'vi') {
  return apiFetch(`/feedbacks/my/${id}`, {
    method: 'DELETE',
  }, locale);
}

/** GET /api/v1/feedbacks/stats */
export async function getFeedbackStats(params = {}, locale = 'vi') {
  return apiFetch(`/feedbacks/stats${buildQuery(params)}`, {}, locale);
}

/** GET /api/v1/feedbacks/public */
export async function getPublicFeedbacks(locale = 'vi') {
  return apiFetch('/feedbacks/public', {}, locale);
}

/** GET /api/v1/feedbacks/public/search */
export async function searchPublicFeedbacks(params = {}, locale = 'vi') {
  return apiFetch(`/feedbacks/public/search${buildQuery(params)}`, {}, locale);
}

/** GET /api/v1/feedbacks/public/stats */
export async function getPublicFeedbackStats(params = {}, locale = 'vi') {
  return apiFetch(`/feedbacks/public/stats${buildQuery(params)}`, {}, locale);
}
