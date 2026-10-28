# Validação e limites

## Base inspecionada

Commit `6ff99c5d67a821f3bb557bd049d10bfa1f2b44e5`, branch `main`. Havia somente essa branch e nenhum PR aberto na inspeção. O aplicativo já continha descoberta, busca/filtros, biblioteca, leitura/progresso, preferências, estúdio/rascunho, áudio e microcenas. Não foi reconstruído novamente.

A execução [39466057301](https://github.com/Crhysantis/lenora/actions/runs/39466057301) terminou com sucesso em 20/10/2026, incluindo os sete cenários de navegador originais. Os avisos anteriores de que não havia testes de interface estavam desatualizados.

## Evolução

Persistência dos três arquivos de autoria (trilha, efeito e imagem/vídeo de microcena) em IndexedDB. O aplicativo aguarda a restauração antes de renderizar a rota, recria as URLs de mídia e mantém reprodução condicionada ao consentimento existente. A interface aguarda a gravação antes de permitir prévia ou saída do estúdio. Substituições só trocam o arquivo ativo após o commit da transação; remoções seguem a mesma regra.

O formato do rascunho e as chaves de localStorage não foram alterados. Arquivos antigos que existiam apenas em memória não podem ser migrados. Não há novas dependências de aplicação nem backend.

## Cobertura automatizada

- `npm run check`: sintaxe dos módulos e do runner de navegador.
- `npm test`: dez testes de lógica, incluindo os sete originais; validação de tipos, tamanho e arquivo vazio; IndexedDB indisponível; falha de commit após requisição de gravação.
- `npm run test:browser`: onze cenários em Chromium, com resultados em `test-results/results.json` e screenshots de desktop/celular:
  1. Navegação, busca/filtro e biblioteca persistente.
  2. Microcena por mouse, reprodução, fechamento e Escape.
  3. Validação, prévia, recarga e restauração de rascunho.
  4. Consentimento de popup automático e ausência de repetição.
  5. Leitura sem interações e desativação de áudio.
  6. Popup por toque e limites de tela no celular.
  7. Imagem: upload, recarga, substituição e remoção persistentes.
  8. Trilha e efeito WAV restaurados e reproduzíveis.
  9. Vídeo WebM restaurado, sem autoplay ou áudio não autorizado.
  10. Falhas de substituição/remoção preservam o arquivo anterior, inclusive após recarga.
  11. IndexedDB bloqueado: aviso visível, leitor e texto utilizáveis.

O workflow `.github/workflows/check.yml` executa esses comandos em push e PR e retém evidências. A execução local dos dez testes de lógica passou. A instalação local do Chromium não foi possível neste ambiente; a execução de interface é feita pelo CI. Os resultados e evidências desta alteração estão nos checks do [PR #1](https://github.com/Crhysantis/lenora/pull/1).

## Verificação manual restante

- Safari/iOS e Firefox; formatos e codecs reais usados pelos autores.
- Percepção de áudio, fones, tela cheia e troca de aba durante reprodução.
- Zoom, fonte ampliada, teclado e preferência de redução de movimento em dispositivos reais.
- Limites de armazenamento em dispositivos com pouco espaço.

## Limites do produto

Protótipo de uma obra/capítulo com dados locais, sem autenticação, sincronização, comunidade, pagamentos, PWA ou publicação multiusuário. Dados de mídia dependem do navegador e podem ser removidos ao limpar os dados do site ou por políticas de armazenamento. Mantenha os arquivos originais. Os testes não equivalem a validação multiusuário ou a todos os codecs e navegadores.

## Nova direção: mundos

O portal padrão agora é Ayîvernî. O leitor anterior permanece em `#reading-demo`, `#reader` e `#studio`; seus dados e mídia foram preservados. O PR de mundos parte da branch do PR #1, sem integrar automaticamente nenhum deles à main.

Dezoito testes de lógica passaram localmente. Oito testes novos cobrem a semente sem fatos inventados, omissão de revelações futuras, sequência e idempotência, visitas/pontos, progresso inválido, links/IDs/camadas inválidos, múltiplas camadas e separação de rascunho/publicação.

A suíte de navegador contém catorze cenários: onze fluxos anteriores e três novos para portal/jornada persistente, autoria/publicação/revelação progressiva e celular com redução de movimento. O teste móvel anterior foi ajustado para capturar a viewport, evitando que uma captura de página inteira altere a posição do marcador e feche o popup antes da reprodução. A execução da base anterior revelou essa instabilidade; não se presume que ela estivesse aprovada.

Os testes de mundo usam nomes, links example.org e conteúdos fictícios exclusivamente no código de teste. O catálogo distribuído não contém esses dados nem revela cânone futuro.

## Primeiro percurso canônico

Somente o prólogo e o capítulo 1 fornecidos pelo autor foram inseridos. O leitor do portal permite completar a primeira etapa, abrir nove descobertas, ler a segunda e abrir mais cinco, além de quatro camadas novas. Oito testes anteriores de mundo foram mantidos; quatro casos adicionais verificam os números e conteúdos do percurso, incerteza histórica, migração sem sobrescrever personalização e leitura sequencial por URL. A suíte tem 22 testes de lógica e 15 cenários de navegador.

## Cenas customizáveis

A suíte tem 32 testes de lógica e 18 cenários de navegador. Os casos novos verificam projeção de cenas/pontos por etapa, URLs/cores/posições e vínculos inválidos, modelo reutilizável, rascunho separado, migração sem sobrescrever personalizações e chaves próprias de mídia. No navegador, há percurso por cenas, edição/publicação e recarga de imagem própria, criação de outro lugar, celular/redução de movimento e som apenas após consentimento com encerramento ao navegar.

## Cinema e mapas

Testes unitários cobrem montagem mista, limites, referências de arquivo, transições, posicionamento após parágrafos, migração sem substituir personalizações e grafos de mapas sem ciclos. A suíte Chromium inclui exportação e reimportação de WebM real, upload ordenado, falha de quota, publicação de posições, proteção de leitura, mapas em dois cliques, upload de cartografia e layout móvel com redução de movimento.
