import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('agendador_jwt');

  if (token) {
    const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    return next(
      req.clone({
        setHeaders: { Authorization: authHeader }
      })
    );
  }

  return next(req);
};
