# Autoria de experiências — primeiro núcleo de cenas

## Produto

A imersão do leitor e a ferramenta de criação evoluem juntas. O escritor deve construir o lugar, a narrativa de exploração e a relação com o livro. Ayîvernî é o primeiro projeto; o modelo de cenas não depende de nomes ou capítulos específicos de Ayîvernî.

## O que o autor controla agora

| Camada | Controles |
| --- | --- |
| Identidade narrativa | Nome, convite de entrada e texto após explorar |
| Direção visual | Cenário base, imagem própria por upload/HTTPS, cores de ambiente e destaque |
| Atmosfera | Névoa, movimento e som próprio por upload/HTTPS; vento sintetizado opcional |
| Exploração | Até 16 pontos, posição percentual, título, texto e ficha relacionada |
| Revelação | Etapa para abrir a cena e etapa de cada ponto |
| Publicação | Salvar no rascunho, revisar e aplicar ao leitor por publicação explícita |

O editor oferece uma prévia da composição. Selecione um ponto e clique no cenário para movê-lo ou use os campos numéricos. A proporção fixa 16:9 mantém a relação entre imagem e coordenadas ao mudar de tela. Em celular, os marcadores são numerados e o texto aparece no painel de exploração.

## Sahkiz como exemplo

A primeira cena usa a arquitetura descrita nos dois textos fornecidos: árvores atravessando estruturas de metal e cristal, níveis conectados, elevadores e luz verde de reatores. É uma interpretação visual ilustrativa em SVG, sem estabelecer geografia ou dimensões canônicas novas.

Após o prólogo, o leitor pode explorar os reatores e a construção ao redor dos troncos. A praça só aparece após o capítulo 1. Os textos curtos se apoiam no material fornecido e remetem às fichas, cujas camadas continuam seguindo o progresso. Não se acrescentaram capítulos ou acontecimentos posteriores.

## Modelo e isolamento de rascunho

Cenas ficam em `world.scenes`. A validação limita campos, cores, URLs, posições, arquivos e vínculos. Um ponto não pode abrir uma ficha de etapa posterior à sua. A projeção do leitor omite cenas e pontos bloqueados. A lógica de renderização não contém o nome Sahkiz; esse nome pertence apenas ao conteúdo de exemplo.

Uploads usam chaves próprias em IndexedDB. Uma nova imagem no rascunho recebe uma chave nova; a cena publicada conserva a referência anterior. O catálogo, capítulos, fichas e cenas são publicados num único snapshot. Os dados continuam locais, sem sincronização entre navegadores.

O modelo de mundo passou a aceitar identificadores próprios e o progresso é separado por ID. A interface ainda administra um projeto local por vez: lista de projetos, importação/exportação e contas de escritores não foram implementadas.

## Experiência do leitor

Explorar um ponto registra o avanço da cena. Se houver ficha relacionada, conta como a exploração dessa ficha, sem repetir seus pontos. Ao explorar todos os pontos atualmente abertos, o texto final da cena convida à leitura. Não é necessário divulgar revelações futuras para criar um percurso.

Não há som automático. O áudio escolhido substitui a demonstração de vento. Mudança de rota ou aba encerra o som, inclusive quando a ativação ainda está sendo resolvida. Os movimentos têm controle próprio e respeitam o sistema.

## Limites antes da oferta comercial

O editor é um protótipo de autoria local, dentro do site privado do autor. Não há cobrança, contas de compradores, permissões por papel, entrega segura de extras pagos ou verificação externa de leitura. O catálogo completo permanece no cliente e pode ser inspecionado tecnicamente.

Para comercializar: persistência e mídia no servidor; projetos e contas separados; autorização do lado do servidor antes de entregar conteúdo; backups/versionamento; cotas e limpeza de arquivos; fluxo de publicação do autor; só então planos e venda de imersão. Esses itens são próximos marcos, não funcionalidades já entregues.
