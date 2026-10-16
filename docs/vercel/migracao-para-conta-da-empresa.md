# Mover este repositório para a Vercel da empresa

> Os quatro projetos Vercel que constroem este repositório vivem hoje numa conta
> pessoal. Este runbook descreve a passagem para a conta da empresa, com o
> estado de cada passo.
>
> O script `replay-env.sh`, ao lado, é o do passo 3. Os ficheiros exportados com
> as variáveis de ambiente (`*.production.env`) que ele lê **não** estão
> versionados, e não devem estar: têm chaves de terceiros. O `.gitignore` cobre
> `.env.vercel*` e `.vercel` desde o commit `e7c14b0`.

Recriar os projetos de raiz na conta da empresa, com o repositório a ficar onde
está (`github.com/hugumberto/retex-web`), e cortar os domínios fora de horas.

**Estado em 16/10/2026**

| Passo | |
|---|---|
| 1. Exportar as variáveis | ✅ feito |
| 2. Criar os quatro projetos | ✅ feito, por API |
| 3. Repor as variáveis | ✅ feito e conferido |
| 4. Validar os builds | ✅ os quatro em READY, cada um com a app certa |
| 5. Cortar os nove domínios | ⬜ **o que falta a sério** |
| 6. Limpeza | ⬜ |

**Falta ainda um acerto antes do passo 5:** a *Production Branch* dos dois
projetos de dev ficou em `main` e tem de ser `dev`. Não é configurável pela API
(três formas tentadas, todas recusadas) — é mesmo no dashboard, em cada
projeto: Settings → Git → Production Branch.

Destino: equipa **`tiago-8652's projects`** (Pro), que já tem os quatro
projetos. Vale a pena renomeá-la em Settings → General: o nome foi gerado pela
Vercel a partir de quem criou a conta.

## O que existe hoje

Conta pessoal `hugos-projects-c448e305`, quatro projetos a construir o mesmo
repositório (branch `main`/`dev`):

| Projeto | App | Node | Branch de produção | Domínios |
|---|---|---|---|---|
| `retex-web` | landing-page | 24.x | `main` | **7** — ver abaixo |
| `retex-web-portal` | portal | 22.x | `main` | `portal.retex.pt` |
| `dev-retex-web` | landing-page | 24.x | `dev` | `dev.retex.pt` |
| `dev-retex-portal` | portal | 22.x | `dev` | `portal-dev.retex.pt` |

### Os sete domínios do `retex-web`

Só um serve conteúdo; os outros seis são redirecionamentos 308 para ele.

| Domínio | Comportamento |
|---|---|
| `www.retex.pt` | **serve a landing** (canónico) |
| `retex.pt` | 308 → `www.retex.pt` |
| `retexid.pt` | 308 → `www.retex.pt` |
| `www.retexid.pt` | 308 → `www.retex.pt` |
| `retexid.com` | 308 → `www.retex.pt` |
| `www.retexid.com` | 308 → `www.retex.pt` |
| `retex-web.vercel.app` | domínio automático da Vercel, não migra |

> Os quatro `retexid.*` foram associados em 16/10/2026, já depois de este runbook
> ser escrito. Ver o anexo no fim.

### DNS

Tudo na **Amen** (`ns1/ns2.amenworld.com`), não na Vercel:

```
retex.pt             A      76.76.21.21
www.retex.pt         CNAME  cname.vercel-dns.com
retexid.pt           A      76.76.21.21
www.retexid.pt       CNAME  cname.vercel-dns.com
retexid.com          A      76.76.21.21
www.retexid.com      CNAME  cname.vercel-dns.com
portal.retex.pt      CNAME  cname.vercel-dns.com
portal-dev.retex.pt  CNAME  cname.vercel-dns.com
dev.retex.pt         CNAME  cname.vercel-dns.com
```

Estes valores **não mudam** com a troca de conta — são os mesmos para qualquer
projeto Vercel. O corte faz-se do lado da Vercel, não do DNS. Não existe registo
`_vercel` TXT em nenhum dos domínios, o que condiciona a ordem do passo 5.

O `retexid.com` tem **DNSSEC ligado** (o `.pt` não). Irrelevante enquanto a zona
ficar na Amen; só seria preciso desligá-lo antes de alguma vez mudar os
nameservers para a Vercel.

> **Renovação:** o painel da Amen tinha um alerta de expiração associado ao
> `retex.pt` — encaminhado para o responsável a 16/10/2026. Fica o registo
> porque é o ponto único de falha de todo o conjunto: com seis domínios a
> redirecionar para `www.retex.pt`, se o principal expirar não cai só o site,
> cai tudo o que aponta para ele.

## Pré-requisitos

- [x] Seres membro da equipa da empresa na Vercel, com permissão para criar projetos
- [x] A conta de destino com uma **conta de GitHub ligada à Vercel** e com acesso a
      `hugumberto/retex-web` — feito a 16/10/2026. Não basta ter permissões no
      repositório: sem a ligação, `GET /v1/integrations/git-namespaces` vem
      vazio e nenhum projeto se cria
- [ ] Acesso ao painel de DNS da Amen (só para confirmar; não deve ser preciso mexer)
- [x] Valores das variáveis de ambiente — exportados no passo 1

## 1. Exportar as variáveis da conta antiga — **feito em 16/10/2026**

Exportadas as dos quatro projetos, em `production`, `preview` e `development`,
para a pasta de trabalho da sessão (fora do repositório). O comando, caso seja
preciso repetir:

```bash
npx vercel login                                          # conta antiga
npx vercel link --yes --project retex-web-portal          # repete por projeto
npx vercel env pull <destino>.env --environment production
```

Das 25 variáveis que o `env pull` traz por projeto, só 4 a 5 são definidas por
ti — as restantes são do sistema da Vercel (`VERCEL_*`, `TURBO_*`) e não se
recriam.

> O `.gitignore` do `retex-web` passou entretanto a cobrir `.vercel` e
> `.env.vercel*` (commit `e7c14b0`), mas estes ficheiros têm segredos: o melhor
> é mantê-los fora do repositório de qualquer forma.

Variáveis que o código usa (`grep` em `packages/*/src`):

O que está de facto definido, por projeto:

| Projeto | `NX_APP` | `NEXT_PUBLIC_API_URL` | `PORTAL_URL` | TomTom |
|---|---|---|---|---|
| `retex-web` | — | `api.retex.pt` | `portal.retex.pt` | url + chave |
| `retex-web-portal` | `portal` | `api.retex.pt` | — | url + chave |
| `dev-retex-web` | — | `api-dev.retex.pt` | `portal-dev.retex.pt` | url + chave |
| `dev-retex-portal` | `portal` | `api-dev.retex.pt` | — | url + chave |

O `NX_APP` só existe nos portais: nos projetos da landing o `vercel.json` já cai
em `landing-page` por omissão. **Pôr `NX_APP=portal` num projeto da landing faz
o `retex.pt` servir o portal** — é o erro mais fácil de cometer nesta migração.

O `NEXT_PUBLIC_PORTAL_URL` só existe nos projetos da landing, e está certo: é lá
que é usado (`RegistrationForm`, `NavCtaLink`, `lib/portal.ts`), nunca no portal.
A chave da TomTom é a mesma nos quatro projetos.

Duas notas:

- O `dev-retex-portal` tem as variáveis marcadas como **Secret** na conta
  antiga: o `env pull` devolve `[SENSITIVE]` em vez dos valores, que ficam
  ilegíveis para sempre. Foram reconstruídos por inferência (ver o script do
  passo 3). Marcar um `NEXT_PUBLIC_*` como Secret não protege nada — o valor
  acaba no bundle do browser — mas impede de o voltar a ler.
- Nenhum projeto tem `NEXT_PUBLIC_DEV_LOGIN_EMAIL`/`PASSWORD` definidos, o que
  explica o login do `portal-dev` aparecer sempre vazio. Não os acrescentes aos
  projetos de produção: `NEXT_PUBLIC_` é o prefixo que o Next inlina no bundle.

As duas `DEV_LOGIN_*` só têm efeito fora de produção (`NODE_ENV !== 'production'`
em `auth/login/page.tsx`), e num build de produção o ramo é eliminado. Ainda
assim, não as leves para os projetos de produção novos: são credenciais num
`NEXT_PUBLIC_`, que é o prefixo que o Next inlina no bundle do browser.

## 2. Criar os quatro projetos — **feito em 16/10/2026**

Criados por API, com os nomes iguais aos da conta antiga (não colidem: os nomes
são por equipa). O CLI não serve para isto — não aceita Root nem Output
Directory — mas a API aceita:

```bash
POST https://api.vercel.com/v11/projects?teamId=<team>
{
  "name": "retex-web-portal",
  "framework": "nextjs",
  "gitRepository": {"type": "github", "repo": "hugumberto/retex-web"},
  "outputDirectory": "packages/portal/.next"
}
```

| Definição | Valor | Como ficou |
|---|---|---|
| Framework | Next.js | no corpo do POST |
| Root Directory | a raiz (o `vercel.json` está lá) | por omissão, `null` |
| Build / Install Command | os do `vercel.json` | por omissão, `null` |
| Output Directory | `packages/portal/.next` ou `packages/landing-page/.next` | no corpo do POST |
| Node | 24.x nas landings, 22.x nos portais | `PATCH /v9/projects/<id>` com `{"nodeVersion":"22.x"}` |
| Production Branch | `main` / `dev` | ⚠️ **não** é configurável por API — ver abaixo |

Duas armadilhas da API, descobertas à força:

- O `nodeVersion` é recusado no **POST** de criação (`should NOT have additional
  property`), mas aceite num **PATCH** a seguir.
- A *Production Branch* não é configurável de todo: rejeitada como `link`,
  como `gitRepository.productionBranch` e como campo de topo; o endpoint
  `POST /projects/<id>/link` aceita a chamada mas ignora-a. Fica para o
  dashboard.

**Pré-requisito que bloqueia tudo:** a conta de destino tem de ter uma conta de
GitHub ligada à Vercel (não basta ter permissões no repositório). Confirma-se com
`GET /v1/integrations/git-namespaces?provider=github` — se vier vazio, nenhum
projeto se consegue criar ligado ao repositório.

Não foram adicionados domínios nesta fase, de propósito: a validação faz-se
pelos URLs `*.vercel.app`.

## 3. Repor as variáveis — **feito em 16/10/2026**

O `replay-env.sh` repõe as variáveis dos quatro projetos em `production` e
`preview`, lendo os valores exportados no passo 1 e usando os inferidos no caso
do `dev-retex-portal`. **Corre-o a partir da pasta onde estão os ficheiros
`*.production.env`** — a cópia versionada aqui não os tem ao lado, e sem eles o
script não escreve quase nada:

```bash
./replay-env.sh --dry-run                 # mostra o que faria, sem escrever
./replay-env.sh tiago-8652s-projects      # aplica
```

O ensaio não precisa de sessão iniciada nem dos projetos criados. A aplicação
precisa das duas coisas.

> **A armadilha que custou umas tentativas:** o `vercel env add` recusa-se a
> gravar um valor que lhe pareça uma credencial num `NEXT_PUBLIC_` sem
> confirmação, e pede-a de forma interativa — num script, falha em silêncio. Foi
> o que aconteceu à chave da TomTom, nas oito tentativas, enquanto tudo o resto
> entrava. O script passou a usar `--type config --yes` (commit `3780f0a`); o
> valor continua a ir por stdin, para não aparecer na lista de processos.
>
> A mensagem de falha do script é genérica ("já existe?"). Se alguma variável
> falhar, corre o mesmo `vercel env add` à mão, sem silenciar o `stderr`.

Estado final, conferido por `GET /v10/projects/<p>/env`: cada projeto com
exatamente as variáveis que tinha na conta antiga, em `production` e `preview` —
`NX_APP` só nos portais, `NEXT_PUBLIC_PORTAL_URL` só nas landings.

## 4. Validar os builds — **feito em 16/10/2026**

Disparado um deploy por projeto, da branch certa, por
`POST /v13/deployments` com `gitSource`. Os quatro acabaram em **READY**.

A verificação que interessa é qual app cada projeto compilou — é aqui que o
`NX_APP` trocado se denuncia. Os URLs `*.vercel.app` de uma equipa Pro estão
protegidos por SSO e respondem 302 a quem não tem sessão, por isso confirmou-se
pelos registos de build:

```bash
GET /v3/deployments/<id>/events   # procurar "Successfully ran target build for project"
```

| Projeto | App compilada | Node |
|---|---|---|
| `retex-web` | `@retex-web/landing-page` | 24.x |
| `retex-web-portal` | `@retex-web/portal` | 22.x |
| `dev-retex-web` | `@retex-web/landing-page` | 24.x |
| `dev-retex-portal` | `@retex-web/portal` | 22.x |

O que falta validar só é possível depois do corte, com os domínios já no sítio:
login no portal, o chip de ambiente a apontar à API certa, e a triagem a ler um
código de teste (`2026-H3KCBJ` na base de dev).

## 5. Cortar os domínios (fora de horas)

São **nove nomes** ao todo, não três. Um domínio só pode estar num projeto
Vercel de cada vez e, como não há registo `_vercel` TXT em nenhum, a conta nova
não consegue verificá-lo enquanto a antiga o tiver. Daí a ordem — é aqui que
estão os minutos de indisponibilidade:

Por domínio:

1. Projeto **antigo** → Settings → Domains → remover o domínio
2. Projeto **novo** → Settings → Domains → adicionar o mesmo domínio
3. Se for um dos redirecionamentos, escolher **Redirect to** → `www.retex.pt`,
   **308**. Isto **não vem** com o domínio: um domínio movido sem esta
   configuração passa a servir a landing em vez de redirecionar
4. A Vercel confirma que o DNS já aponta para ela e emite o certificado
5. Confirmar em `https://<domínio>` — sem erro de certificado, e com o 308 nos
   que são redirecionamentos

### Ordem

Do menos exposto para o mais exposto, para que qualquer surpresa apareça onde
não dói:

| # | Domínio | Projeto de destino | Comportamento |
|---|---|---|---|
| 1 | `portal-dev.retex.pt` | portal dev | serve |
| 2 | `dev.retex.pt` | landing dev | serve |
| 3 | `retexid.pt` | landing | 308 → `www.retex.pt` |
| 4 | `www.retexid.pt` | landing | 308 → `www.retex.pt` |
| 5 | `retexid.com` | landing | 308 → `www.retex.pt` |
| 6 | `www.retexid.com` | landing | 308 → `www.retex.pt` |
| 7 | `portal.retex.pt` | portal | serve |
| 8 | `www.retex.pt` | landing | **serve** |
| 9 | `retex.pt` | landing | 308 → `www.retex.pt` |

Os `retexid.*` vêm antes dos principais de propósito: são domínios sem tráfego,
e servem de segundo ensaio — já com a configuração de redirecionamento, que os
dois primeiros não exercitam.

O `www.retex.pt` é o único que serve conteúdo e é o alvo de cinco
redirecionamentos: enquanto ele estiver a meio do corte, os redirecionamentos já
movidos apontam para um domínio em transição. Por isso fica no fim, com o
`retex.pt` logo atrás.

Se a Vercel pedir um `_vercel` TXT para verificação, acrescenta-se o registo na
Amen, espera-se a propagação e repete-se o passo 2. É o cenário que faz o corte
passar de minutos a mais tempo, e é a razão de começar pelos de dev.

### Verificação no fim

```bash
for d in retex.pt www.retex.pt retexid.pt www.retexid.pt retexid.com \
         www.retexid.com portal.retex.pt portal-dev.retex.pt dev.retex.pt; do
  printf '%-22s ' "$d"
  curl -s -o /dev/null -w '%{http_code} -> %{redirect_url}\n' --max-time 15 "https://$d/"
done
```

Esperado: `200` no `www.retex.pt`, `portal.retex.pt`, `portal-dev.retex.pt` e
`dev.retex.pt` (este pode dar 307 para o login); `308 -> https://www.retex.pt/`
nos restantes cinco.

## 6. Depois do corte

- [ ] Os **nove** domínios respondem como na tabela do passo 5, com certificado válido
- [ ] Os cinco redirecionamentos devolvem 308 e não 200 (um 200 significa que o
      *Redirect to* se perdeu na passagem e o domínio está a servir a landing)
- [ ] Login no portal de produção
- [ ] Um deploy novo (push para `dev`) constrói **só** nos projetos novos
- [ ] Os checks do GitHub nos PRs passam a mostrar os projetos novos
- [ ] Apagar os quatro projetos antigos — só depois de um ou dois dias de confiança;
      enquanto existirem, cada push constrói duas vezes e paga-se duas vezes
- [ ] Apagar os ficheiros `.env.vercel-*` da máquina

## Rollback

Enquanto os projetos antigos existirem, voltar atrás é o passo 5 ao contrário:
remover o domínio do projeto novo e adicioná-lo outra vez ao antigo. O DNS nunca
chega a mexer, portanto não há propagação pelo meio.

---

# Anexo: domínios `retexid.pt` e `retexid.com` — **feito em 16/10/2026**

Os dois domínios (e os respetivos `www`) redirecionam para `www.retex.pt` com
308. Ficaram associados ao `retex-web` da **conta antiga**, porque era onde a
landing vivia nesse dia — logo, entram no corte do passo 5 como os restantes.

## O que foi alterado

**Na Amen**, em cada uma das duas zonas, só dois registos:

| Nome | Tipo | Antes | Agora |
|---|---|---|---|
| `retexid.pt` | A | `81.88.57.70` | `76.76.21.21` |
| `www.retexid.pt` | CNAME | `onstatic-pt.setupdns.net.` | `cname.vercel-dns.com.` |
| `retexid.com` | A | `81.88.57.70` | `76.76.21.21` |
| `www.retexid.com` | CNAME | `onstatic-pt.setupdns.net.` | `cname.vercel-dns.com.` |

Tudo o resto ficou intacto — em particular os registos de email das duas zonas
(MX, SPF, o SRV de `_autodiscover`, e os CNAME de `autoconfig`, `mail` e `ftp`,
todos para `securemail.pro`), confirmados depois de gravar.

**Na Vercel**, os quatro nomes foram adicionados ao projeto `retex-web` com
`redirect: www.retex.pt` e `redirectStatusCode: 308`.

> Nota de método: o CLI (`vercel domains add`) adiciona domínios mas **não**
> configura redirecionamentos — esse campo só existe na API e no dashboard.
> Usou-se `POST /v10/projects/{id}/domains` com o corpo
> `{"name": ..., "redirect": "www.retex.pt", "redirectStatusCode": 308}`.

## Verificado

```
https://retexid.pt       308 -> https://www.retex.pt/
https://www.retexid.pt   308 -> https://www.retex.pt/
https://retexid.com      308 -> https://www.retex.pt/
https://www.retexid.com  308 -> https://www.retex.pt/
```

Certificados emitidos nos quatro, e a Vercel dá-os todos como `verified`.

## Se o retexid vier a ser a marca principal

Isto inverte-se: o `www.retexid.pt` passaria a servir conteúdo e o `retex.pt` a
redirecionar para lá. Implica rever o `NEXT_PUBLIC_PORTAL_URL`, as ligações nos
emails da API e o que os motores de busca já tiverem indexado do 308 atual —
mudar de canónico depois de indexado é bem mais caro do que decidi-lo agora.
