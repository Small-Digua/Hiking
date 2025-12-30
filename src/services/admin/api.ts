import { supabase } from '../supabase';

const API_URL = 'http://localhost:5000/api';

const getHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token || ''}`
  };
};

export const adminApi = {
  // Users
  getUsers: async (params: any) => {
    const headers = await getHeaders();
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/users?${query}`, { headers });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  createUser: async (data: any) => {
    const headers = await getHeaders();
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  updateUser: async (id: string, data: any) => {
    const headers = await getHeaders();
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  deleteUser: async (id: string) => {
    const headers = await getHeaders();
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Routes
  getRoutes: async (params: any) => {
    const headers = await getHeaders();
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/routes?${query}`, { headers });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  createRoute: async (data: any) => {
    const headers = await getHeaders();
    const res = await fetch(`${API_URL}/routes`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  updateRoute: async (id: string, data: any) => {
    const headers = await getHeaders();
    const res = await fetch(`${API_URL}/routes/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  deleteRoute: async (id: string) => {
    const headers = await getHeaders();
    const res = await fetch(`${API_URL}/routes/${id}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Cities
  getCities: async (params: any) => {
    const headers = await getHeaders();
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/cities?${query}`, { headers });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  createCity: async (data: any) => {
    const headers = await getHeaders();
    const res = await fetch(`${API_URL}/cities`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  updateCity: async (id: string, data: any) => {
    const headers = await getHeaders();
    const res = await fetch(`${API_URL}/cities/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  deleteCity: async (id: string) => {
    const headers = await getHeaders();
    const res = await fetch(`${API_URL}/cities/${id}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};
