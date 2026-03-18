// Utility to clear all authentication data
export const clearAuthData = () => {
  // Clear localStorage token
  localStorage.removeItem('authToken');

  // Try to clear any non-httpOnly cookies (httpOnly cookies can only be cleared by server)
  // This covers cookies that might have been set without httpOnly flag
  document.cookie.split(";").forEach((c) => {
    const cookieName = c.split("=")[0].trim();
    // Clear for current domain
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    // Clear for base domain
    const domain = window.location.hostname;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
    // Clear for parent domain (e.g., .example.com)
    const parts = domain.split('.');
    if (parts.length > 2) {
      const baseDomain = '.' + parts.slice(-2).join('.');
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${baseDomain}`;
    }
  });
};
