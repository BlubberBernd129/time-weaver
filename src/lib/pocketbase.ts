import PocketBase from 'pocketbase';

/**
 * Ermittelt die PocketBase API-URL basierend auf dem Browser-Hostname.
 * - Lokaler Zugriff (192.168.178.43 oder localhost): http://192.168.178.43:8090
 * - Remote-Zugriff (Cloudflare/Internet): https://api.nick-cloud.org
 */
function getPocketBaseUrl(): string {
  // Im Browser: Dynamische Erkennung basierend auf Hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Lokaler Zugriff - nutze lokale PocketBase-Instanz
    if (hostname === '192.168.178.43' || hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('🏠 Lokaler Zugriff erkannt - nutze lokale PocketBase API');
      return 'http://192.168.178.43:8090';
    }
  }
  
  // Remote-Zugriff oder SSR - nutze öffentliche API
  console.log('🌐 Remote-Zugriff - nutze öffentliche PocketBase API');
  return 'https://api.nick-cloud.org';
}

const POCKETBASE_URL = getPocketBaseUrl();

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

// Export der aktuellen API-URL für Debugging
export const getApiUrl = () => POCKETBASE_URL;
