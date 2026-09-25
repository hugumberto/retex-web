# Assets dos emails

Imagens servidas aos templates de email da API (`ASSETS_BASE_URL` + `/assets/emails/...`).

## Banner "O que NÃO recolhemos" (`donts-*`)

Usado em `package-confirmation`, `collection-confirmation` e `collection-reminder`.
O template escolhe o ficheiro pelo idioma do destinatário: `donts-{lang}.jpg` no
desktop e `donts-{lang}-mobile.jpg` abaixo de 600px (media query).

| Ficheiro | Dimensões | Notas |
| --- | --- | --- |
| `donts-pt.jpg` / `donts-pt-mobile.jpg` | 1200×233 / 600×120 | arte final |
| `donts-en.jpg` / `donts-en-mobile.jpg` | 1200×233 / 600×120 | arte final |
| `donts-es.jpg` / `donts-es-mobile.jpg` | 1200×233 / 600×120 | **cópia do EN** — substituir quando houver arte em espanhol |
| `donts-fr.jpg` / `donts-fr-mobile.jpg` | 1200×233 / 600×120 | **cópia do EN** — substituir quando houver arte em francês |

Ao substituir: manter o nome, o rácio (~5,15:1 no desktop, 5:1 no mobile) e
exportar em JPEG (peso do email). A versão desktop é servida a 600px de largura,
por isso 1200px dá densidade 2x; a mobile chega a ~400px de largura.

Ao acrescentar um idioma novo à API (`SUPPORTED_LANGUAGES`), acrescentar aqui o
par de ficheiros correspondente — o template não tem fallback em código.
