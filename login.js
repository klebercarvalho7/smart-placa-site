// Configuração por ambiente: em produção a API e o sistema web ficam em
// subdomínios próprios; em dev tudo aponta para localhost.
const CONFIG = {
  apiBaseUrl:
    location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:8000'
      : 'https://api.smartplaca.com.br',
  appUrl:
    location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:5173'
      : 'https://app.smartplaca.com.br',
};

const sobreposicao = document.getElementById('login-sobreposicao');
const form = document.getElementById('form-login');
const erroEl = document.getElementById('login-erro');
const botao = document.getElementById('login-botao');

for (const el of document.querySelectorAll('[data-abrir-login]')) {
  el.addEventListener('click', () => {
    sobreposicao.hidden = false;
    form.querySelector('input[name="email"]').focus();
  });
}
for (const el of document.querySelectorAll('[data-fechar-login]')) {
  el.addEventListener('click', () => (sobreposicao.hidden = true));
}
sobreposicao.addEventListener('click', (e) => {
  if (e.target === sobreposicao) sobreposicao.hidden = true;
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') sobreposicao.hidden = true;
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  erroEl.hidden = true;
  botao.disabled = true;
  botao.textContent = 'Entrando…';

  const dados = new FormData(form);
  try {
    const resp = await fetch(`${CONFIG.apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: dados.get('email'),
        senha: dados.get('senha'),
      }),
    });
    const corpo = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(corpo.detail ?? 'Não foi possível entrar. Verifique os dados.');
    }
    // Entrega os tokens ao sistema web pelo fragmento da URL (não vai ao servidor
    // nem fica no histórico do domínio da landing).
    const fragmento = new URLSearchParams({
      access_token: corpo.access_token,
      refresh_token: corpo.refresh_token,
    });
    window.location.href = `${CONFIG.appUrl}/#${fragmento}`;
  } catch (err) {
    erroEl.textContent =
      err instanceof TypeError
        ? 'Falha de conexão com o servidor. Tente novamente.'
        : err.message;
    erroEl.hidden = false;
  } finally {
    botao.disabled = false;
    botao.textContent = 'Entrar';
  }
});
