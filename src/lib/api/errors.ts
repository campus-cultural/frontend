export class AuthSessionError extends Error {
  constructor(message = 'Sessão expirada. Faça login novamente.') {
    super(message);
    this.name = 'AuthSessionError';
  }
}

export function isAuthSessionError(error: unknown): error is AuthSessionError {
  return error instanceof AuthSessionError;
}
