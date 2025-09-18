const API_URL = process.env.NODE_ENV === 'production' 
  ? "/api"  // In production, use relative URLs (same domain)
  : "http://localhost:8000/api";  // In development, use localhost

export const getCampaigns = async () => {
  const response = await fetch(`${API_URL}/campaigns`);
  return response.json();
};

export const getInfluencers = async () => {
  const response = await fetch(`${API_URL}/influencers`);
  return response.json();
};

export const getNotes = async () => {
  const response = await fetch(`${API_URL}/notes`);
  return response.json();
};

export const getEvents = async () => {
  const response = await fetch(`${API_URL}/events`);
  return response.json();
};

export const getTasks = async () => {
  const response = await fetch(`${API_URL}/tasks`);
  return response.json();
};

export const getDeals = async () => {
  const response = await fetch(`${API_URL}/deals`);
  return response.json();
};

export const getMessages = async () => {
  const response = await fetch(`${API_URL}/messages`);
  return response.json();
};

export const getTimeline = async () => {
  const response = await fetch(`${API_URL}/timeline`);
  return response.json();
};
