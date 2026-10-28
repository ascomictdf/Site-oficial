# Site ICTDF

Site estático (HTML + CSS + JS, sem build obrigatório). Basta abrir `index.html` ou publicar a pasta em qualquer hospedagem.

## Páginas

| Arquivo | Página |
|---|---|
| `index.html` | Início |
| `sobre.html` | Sobre o ICTDF |
| `transplantes-e-cardiologia.html` | Serviços, doação de órgãos e horários de visita |
| `ensino.html` | Centro de Treinamento |
| `curso-acls.html` | Página de venda do ACLS |
| `curso-bls.html` | Página de venda do BLS |
| `pesquisa.html` | Pesquisa, PICV e documentos |
| `imprensa.html` | Notícias |
| `agendamento.html` | Pré-marcação de consultas, exames e orçamento |
| `convenios.html` | Convênios |
| `contato.html` | Fale Conosco |
| `transparencia.html` | Portal da Transparência |
| `privacidade.html`, `termos.html` | Páginas legais |

## Cabeçalho e rodapé

Ficam em `partials/`. Depois de editar, rode `node tools/sync-layout.mjs` para copiar para todas as páginas.

## Turmas dos cursos

As datas ficam no atributo `data-agenda` de `curso-acls.html` e `curso-bls.html`. Turmas cuja data já passou somem sozinhas.
Para que o botão de inscrição leve ao e-inscricao de cada turma, preencha `links`, por exemplo:

```json
"links": {"2026-11-07": "https://www.e-inscricao.com/ictdf/acls..."}
```

Sem link, o botão abre o WhatsApp da Central com a turma escolhida já escrita na mensagem.

## Formulários

Agendamento e contato não têm back-end: montam a mensagem e abrem o WhatsApp `(61) 9167-8053`. O número está em `assets/js/main.js` (`WHATSAPP`).

## Vídeo do topo da home

O vídeo que avança com o scroll é uma sequência de 294 quadros WebP em `assets/video/hero/` (12 quadros/s, 1280px, cerca de 12 MB), desenhada num canvas. Para trocar o vídeo:

```bash
ffmpeg -i novo-video.mp4 -vf "fps=12,scale=1280:-2" -c:v libwebp -quality 50 assets/video/hero/f%03d.webp
```

Depois atualize `data-count-frames` na seção `.scrolly` do `index.html` com o número de quadros gerados. Os textos aparecem conforme `data-in`/`data-out` (0 = início do vídeo, 1 = fim).

## Imagens

As fotos ficam em `assets/img/fotos/`, copiadas do site antigo e otimizadas (JPEG, até 1600px). Para trocar uma foto, substitua o arquivo mantendo o mesmo nome.
