# Smart Placa — Landing Page

Site institucional estático (HTML/CSS/JS puro, sem build) com módulo de login para usuários cadastrados.

## Publicação

Este diretório é espelhado para o repositório público [`smart-placa-site`](https://github.com/klebercarvalho7/smart-placa-site), publicado via GitHub Pages em:

- **URL atual (GitHub Pages):** https://klebercarvalho7.github.io/smart-placa-site/
- **Domínio final:** www.smartplaca.com.br (pendente de apontamento DNS no registro.br)

O repositório principal (`smart-placa`) é privado; a landing fica num repositório público separado porque o GitHub Pages gratuito exige repositório público.

### Atualizar o site publicado

```bash
# a partir de uma cópia local do repo smart-placa-site (fora do Google Drive)
cp -r "apps/landing/." .
git add -A && git commit -m "atualiza landing" && git push
```

## Configurar o domínio próprio (quando formos apontar o DNS)

No registro.br, criar um registro **CNAME** para `www` apontando para `klebercarvalho7.github.io`, e um arquivo `CNAME` no repositório `smart-placa-site` contendo `www.smartplaca.com.br`. Depois, ativar "Enforce HTTPS" nas configurações de Pages do repositório.

## Login

O botão "Entrar" abre um modal que autentica em `/auth/login` da API e repassa a sessão ao Centro de Controle via fragmento de URL (`app.smartplaca.com.br/#access_token=...`). Em produção, a API deve estar em `api.smartplaca.com.br` (ver `login.js`).
