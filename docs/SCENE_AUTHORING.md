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

## Montagem audiovisual

Cada cena aceita `timeline` com planos `{id,type,name,key,src,duration,start,transition,movement}`. Mídias do autor usam chaves IndexedDB; `src` é reservado aos SVGs ilustrativos empacotados em `assets/`. Não se aceitam scripts, URLs arbitrárias ou caminhos de arquivo como origem de planos. A imagem de fundo e o áudio ambiental continuam independentes. No modo mapa, a imagem permanece fixa para manter a relação dos pontos com os lugares; a linha do tempo guardada só é exibida no modo cena.

Durações de 0,08 a 120 segundos por plano, até 60 planos/10 minutos. O início recorta o trecho de vídeo, cuja extensão é verificada na prévia. A montagem conserva a ordem de seleção dos arquivos. Alterações nos planos entram na prévia ao clicar “Prévia e exportação”. O atalho stop motion ajusta só as imagens para 0,125 s e corte seco. Movimentos disponíveis: fixo, aproximar, afastar, esquerda e direita.

Um único renderizador Canvas serve editor, leitura e exportação. Reprodução é manual, vídeos são silenciosos e a exportação não contém trilha sonora. O formato inicial de saída é WebM via MediaRecorder, em tempo real, sem conversão MP4 e sem renderização em servidor. Pausar, buscar ou sair da página/aba cancela a exportação; o arquivo só é entregue após concluir a sequência. Navegadores sem suporte apresentam aviso. Redução de movimento suprime movimentos de câmera; a leitura não inicia vídeos automaticamente.

`placements` permite home, ficha (`entity:id`) ou capítulo (`chapter:id`) com `after=0` no início ou número de parágrafo. A posição é numérica; reescrever capítulos pode exigir reposicionar cenas. A validação rejeita parágrafos inexistentes. Não há limite do recurso a personagens ou lugares: todas as categorias de ficha usam o mesmo bloco.

## Mapas em camadas

O tipo `mode=map` usa imagem importada ou HTTPS e pontos com destino `sceneId`. O mapa de destino deve ser criado e salvo antes de vinculá-lo. O ponto pode combinar ficha e destino. Primeiro clique/toque mostra informações; segundo no mesmo ponto entra no destino. Um botão explícito oferece a mesma ação por teclado. O caminho de navegação permite voltar aos níveis superiores.

O grafo é validado: destinos existentes, sem autorreferência/ciclos, e etapa do ponto compatível com o destino e a ficha. Camadas/pontos bloqueados não têm títulos ou conteúdo projetados na interface. O exemplo de Ayîvernî é um esquema de relações, não uma cartografia aprovada. O autor controla suas imagens e posições percentuais.

As configurações antigas só recebem exemplos novos quando correspondem exatamente ao seed anterior sem customizações. Mundos personalizados conservam seu conteúdo; eles podem criar mapas e sequências no editor.

## Entrada direta para mapas

O Estúdio de mundos oferece “Mapas · criar e organizar regiões” (`#maps-studio`). A árvore mostra todos os mapas do rascunho, inclusive os ainda fechados para leitores. Cada item tem “Editar mapa” e “Adicionar região dentro”. O formulário cria o novo mapa e seu ponto no mapa de origem numa única gravação; também permite aproveitar um mapa existente, rejeitando duplicatas e ciclos. A região recebe uma etapa compatível com o mapa que a contém. Imagens podem ser enviadas na criação ou no editor direto (`#map-editor/id`). O ponto inicial fica no centro e pode ser reposicionado no mapa de origem.
