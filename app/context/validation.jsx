/**
 * É pra validar os 2 formatos de email.
 *   - aluno:    nome@alunos.utfpr.edu.br
 *   - servidor: nome@utfpr.edu.br
 */
export const isValidUTFPREmail = (email) => {
  const trimmed = email.trim().toLowerCase();
  const regex = /^[a-z0-9._%+\-]+@(alunos\.)?utfpr\.edu\.br$/;
  return regex.test(trimmed);
};

export const getEmailError = (email) => {
  if (!email || email.trim() === '') {
    return 'O e-mail é obrigatório.';
  }
  if (!isValidUTFPREmail(email)) {
    return 'Use seu e-mail institucional (ex: nome@alunos.utfpr.edu.br)';
  }
  return null;
};

export const getPasswordError = (password) => {
  if (!password || password.trim() === '') {
    return 'A senha é obrigatória.';
  }
  if (password.length < 6) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  return null;
};
