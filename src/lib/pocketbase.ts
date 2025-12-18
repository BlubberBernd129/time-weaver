import PocketBase from 'pocketbase';

const POCKETBASE_URL = import.meta.env.VITE_POCKETBASE_URL || 'https://api.nick-cloud.org';

export const pb = new PocketBase(POCKETBASE_URL);

// Persist auth state across page reloads
pb.authStore.onChange(() => {
  console.log('Auth state changed:', pb.authStore.isValid);
});

export const isAuthenticated = () => pb.authStore.isValid;

export const login = async (email: string, password: string) => {
  return await pb.collection('users').authWithPassword(email, password);
};

export const logout = () => {
  pb.authStore.clear();
};

export const getCurrentUser = () => pb.authStore.model;
