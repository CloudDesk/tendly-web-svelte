import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const protectedPaths = ['/employees', '/shifts', '/attendance', '/leave', '/payroll'];
  const isProtectedRoute = protectedPaths.some(path => event.url.pathname.startsWith(path));
  
  if (isProtectedRoute) {
    const token = event.cookies.get('token');
    if (!token) {
      return new Response('Redirect', { 
        status: 303, 
        headers: { 
          Location: '/login',
          'Set-Cookie': 'redirectTo=' + event.url.pathname + '; Path=/' 
        } 
      });
    }
  }

  const response = await resolve(event);
  return response;
}; 