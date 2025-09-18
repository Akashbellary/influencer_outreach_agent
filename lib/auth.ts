// Authentication utility functions

export async function logout() {
  try {
    // Call the backend logout endpoint
    const response = await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
    });
    
    // Clear local storage
    localStorage.removeItem('campaignio:auth');
    localStorage.removeItem('campaignio:user-data');
    localStorage.removeItem('campaignio:disclaimer-ack');
    localStorage.removeItem('campaignio:force-disclaimer');
    
    return response.json();
  } catch (error) {
    console.error('Logout error:', error);
    // Even if backend fails, clear local state
    localStorage.removeItem('campaignio:auth');
    localStorage.removeItem('campaignio:user-data');
    localStorage.removeItem('campaignio:disclaimer-ack');
    localStorage.removeItem('campaignio:force-disclaimer');
    
    return { success: true, message: 'Logged out successfully' };
  }
}

export function isAuthenticated(): boolean {
  return localStorage.getItem('campaignio:auth') === '1';
}

export function getCurrentUser() {
  try {
    const userData = localStorage.getItem('campaignio:user-data');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}