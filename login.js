// Login da web com escolha de perfil (docs/14).
//
// Cidadão entra por CPF, agente por e-mail funcional. Perguntar quem é ANTES
// de mostrar o formulário evita um campo de identificação ambíguo ("CPF ou
// e-mail") e permite validar o CPF enquanto a pessoa digita.

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

const PERFIS = {
  cidadao: {
    titulo: 'Entrar como cidadão',
    sub: 'Use o CPF cadastrado no aplicativo.',
    rotulo: 'CPF',
    tipo: 'text',
    inputmode: 'numeric',
    aviso: 'Suas consultas e denúncias ficam registradas em log de auditoria.',
  },
  agente: {
    titulo: 'Entrar como agente público',
    sub: 'Use o e-mail funcional fornecido pelo seu órgão.',
    rotulo: 'E-mail funcional',
    tipo: 'email',
    inputmode: 'email',
    aviso: 'Acesso restrito e auditado. MFA obrigatório em produção.',
  },
};

const sobreposicao = document.getElementById('login-sobreposicao');
const areaEscolha = document.getElementById('login-escolha');
const areaFormulario = document.getElementById('login-form-area');
const form = document.getElementById('form-login');
const erroEl = document.getElementById('login-erro');
const botao = document.getElementById('login-botao');
const campoIdentificador = document.getElementById('campo-identificador');
const textoIdentificador = document.getElementById('texto-identificador');
const tituloForm = document.getElementById('login-form-titulo');
const subForm = document.getElementById('login-form-sub');
const avisoForm = document.getElementById('login-aviso');

let perfilAtual = null;

function abrir() {
  sobreposicao.hidden = false;
  mostrarEscolha();
}

function fechar() {
  sobreposicao.hidden = true;
  erroEl.hidden = true;
}

function mostrarEscolha() {
  perfilAtual = null;
  areaEscolha.hidden = false;
  areaFormulario.hidden = true;
  erroEl.hidden = true;
  form.reset();
}

function mostrarFormulario(perfil) {
  perfilAtual = perfil;
  const cfg = PERFIS[perfil];
  tituloForm.textContent = cfg.titulo;
  subForm.textContent = cfg.sub;
  textoIdentificador.textContent = cfg.rotulo;
  campoIdentificador.type = cfg.tipo;
  campoIdentificador.inputMode = cfg.inputmode;
  campoIdentificador.value = '';
  avisoForm.textContent = cfg.aviso;

  areaEscolha.hidden = true;
  areaFormulario.hidden = false;
  erroEl.hidden = true;
  campoIdentificador.focus();
}

// ---------------------------------------------------------------- CPF

function soDigitos(valor) {
  return (valor || '').replace(/\D/g, '');
}

function cpfValido(cpf) {
  const n = soDigitos(cpf);
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
  for (const tamanho of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < tamanho; i += 1) {
      soma += Number(n[i]) * (tamanho + 1 - i);
    }
    let digito = (soma * 10) % 11;
    if (digito === 10) digito = 0;
    if (digito !== Number(n[tamanho])) return false;
  }
  return true;
}

function aplicarMascaraCpf(valor) {
  const n = soDigitos(valor).slice(0, 11);
  if (n.length <= 3) return n;
  if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`;
  if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
}

campoIdentificador.addEventListener('input', () => {
  if (perfilAtual !== 'cidadao') return;
  campoIdentificador.value = aplicarMascaraCpf(campoIdentificador.value);
});

// ------------------------------------------------------------- eventos

for (const el of document.querySelectorAll('[data-abrir-login]')) {
  el.addEventListener('click', abrir);
}
for (const el of document.querySelectorAll('[data-fechar-login]')) {
  el.addEventListener('click', fechar);
}
for (const el of document.querySelectorAll('[data-perfil]')) {
  el.addEventListener('click', () => mostrarFormulario(el.dataset.perfil));
}
document.getElementById('login-voltar').addEventListener('click', mostrarEscolha);

sobreposicao.addEventListener('click', (e) => {
  if (e.target === sobreposicao) fechar();
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  // Esc volta um passo antes de fechar: quem escolheu o perfil errado não
  // precisa reabrir o modal do zero.
  if (!sobreposicao.hidden && !areaFormulario.hidden) mostrarEscolha();
  else fechar();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  erroEl.hidden = true;

  const bruto = campoIdentificador.value.trim();
  if (perfilAtual === 'cidadao' && !cpfValido(bruto)) {
    erroEl.textContent = 'CPF inválido. Confira os números.';
    erroEl.hidden = false;
    return;
  }

  botao.disabled = true;
  botao.textContent = 'Entrando…';

  const identificador = perfilAtual === 'cidadao' ? soDigitos(bruto) : bruto;
  try {
    const resp = await fetch(`${CONFIG.apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identificador,
        senha: document.getElementById('campo-senha').value,
      }),
    });
    const corpo = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(corpo.detail ?? 'Não foi possível entrar. Verifique os dados.');
    }
    // Entrega os tokens ao sistema web pelo fragmento da URL (não vai ao
    // servidor nem fica no histórico do domínio da landing).
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
