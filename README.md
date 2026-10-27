# Lenora — descubra mundos

Um software de worldbuilding e exploração imersiva, começando por **Ayîvernî**, universo de **Os Dias de Aço e Luz — A Herdeira e a Sombra**.

O mundo é a porta de entrada. A leitura abre novas camadas de personagens, lugares e histórias; o atlas e a jornada levam o leitor de volta ao livro. O leitor interativo anterior continua como laboratório de uma das ferramentas do produto.

## Primeira versão da nova direção

- `#home`: portal de Ayîvernî, com atmosfera animada e arte orbital abstrata, sem representar geografia canônica.
- `#atlas`: descobertas, categorias e busca limitada ao que já está aberto. Nomes e descrições bloqueados não entram no HTML de cartões ou nos resultados.
- `#journey`: caminho de leitura, links oficiais configuráveis, conclusão sequencial declarada pelo leitor e conquistas.
- `#world-studio`: apresentação do mundo, capítulos, fichas e múltiplas revelações por capítulo. Rascunho e experiência publicada são separados.
- Gamificação inicial: 50 pontos por capítulo e 10 por descoberta explorada, sem repetir a recompensa pela mesma ação.
- Dados e publicação locais, por navegador. Não há contas, permissões de autor ou sincronização.

**Conteúdo inicial:** apenas uma apresentação pública do universo. Não foram inventados capítulos, links de leitura, personagens, lugares ou vínculos de revelação. Os capítulos e as fichas aprovadas precisam ser inseridos no estúdio a partir do cânone. Sem capítulos configurados, o portal indica essa preparação; não inventa um endereço para o livro.

A futura personalização e a venda de experiências de imersão fazem parte da direção de produto; cobrança, planos e acesso pago ainda não foram implementados. Consulte [docs/WORLD_DIRECTION.md](docs/WORLD_DIRECTION.md).

## Estado deste repositório

O código do protótipo está neste repositório, reconstruído a partir da implementação e das decisões registradas na conversa. A identidade da interface é **Lenora**.

A reconstrução não foi recuperada byte a byte do ambiente anterior. A hospedagem antiga ainda usa a versão anterior: um push neste repositório **não atualiza automaticamente o site publicado**.

## Executar localmente

Não há dependências de aplicação ou etapa de compilação. Com Python 3, na raiz do repositório:

```sh
python3 -m http.server 8080 --directory dist
```

Abra http://localhost:8080. Use um servidor HTTP em vez de abrir os arquivos diretamente.

Com Node.js 22 ou posterior:

```sh
npm run check
npm test
```

Não é necessário executar npm install. A pasta `dist` pode ser servida por uma hospedagem estática. Não há backend para configurar.

## Arquivos

- `dist/index.html`: estrutura e identidade Lenora.
- `dist/style.css`: interface responsiva, capas e microcena demonstrativa.
- `dist/core.js`: dados padrão, validação, armazenamento e vínculos de texto.
- `dist/app.js`: navegação e integração do portal com o leitor e editor anteriores.
- `dist/world-core.js`: validação, camadas de revelação, progressão e recompensas.
- `dist/world-experience.js`: portal, atlas, jornada e estúdio de worldbuilding.
- `dist/world.css`: direção visual, animações, responsividade e redução de movimento.
- `dist/media.js`: validação e persistência local de arquivos em IndexedDB.
- `dist/icon.svg`: ícone da aplicação.
- `tests/core.test.cjs`, `tests/media.test.cjs` e `tests/world.test.cjs`: testes com o runner nativo do Node.
- `tests/browser.cjs`: testes integrados de interface em Chromium.
- `docs/QA.md`: verificações realizadas e roteiro de testes de interface.

Dados antigos com prefixo `lumera-` são lidos como alternativa no mesmo domínio. Novas gravações usam `lenora-`. A mudança de domínio não transfere localStorage. Os arquivos de mídia são locais e persistem no mesmo navegador por IndexedDB. URLs temporárias de sessões anteriores não podem ser recuperadas. Não há transferência automática entre domínios ou dispositivos.

## Laboratório de leitura preservado

- Descoberta com busca e filtros, uma obra demonstrativa e duas capas conceituais.
- Biblioteca, progresso e preferências locais.
- Leitura por rolagem ou trechos, ajuste de fonte e tema.
- Trilha sintetizada por região, efeito sonoro em frase e ficha de personagem.
- Microcena em prévia junto ao trecho, por mouse, foco ou toque, com reprodução, fechamento e ampliação.
- Popup automático sugerido pelo autor; abertura e reprodução autorizadas separadamente pelo leitor.
- Editor de texto simples, configuração de interações, rascunho e restauração da versão anterior.
- Arquivos próprios de áudio, imagem e vídeo de até 25 MB cada, preservados ao recarregar.
- Substituição e remoção persistentes; falhas de gravação mantêm a mídia anterior.
- Restauração de mídia antes de abrir o leitor, sem reproduzir automaticamente.

## Limitações atuais

Não há autenticação, backend, comunidade multiusuário, pagamentos, geração de IA, PWA ou modo offline. O perfil é demonstrativo. Texto e preferências usam localStorage. Mídia usa IndexedDB, com URLs temporárias recriadas na abertura. Limpar dados do site, usar outro navegador ou a remoção automática de dados pelo navegador pode apagar os arquivos. Não há backup ou sincronização; mantenha os originais. Em caso de armazenamento bloqueado ou sem espaço, a operação de mídia falha com aviso, preservando o arquivo anterior. A microcena padrão é uma animação CSS, não vídeo gerado por IA.

No laboratório de texto anterior (`#reading-demo`, `#reader` e `#studio`), há uma configuração de trilha/efeito/lore/microcena por rascunho. Os vínculos usam números de trechos e correspondência textual, ainda sem IDs estáveis. A paginação é por trecho, não pela altura da tela. O editor avançado HTML/CSS ainda não foi implementado.

## Decisões de produto

- Conta única de leitor e autor; piloto por convite com até 50 participantes e orçamento inicial zero, sujeito a cotas de mídia e tráfego.
- Público inicial a partir de 14 anos; sem conteúdo sexual explícito no piloto.
- Série → obras/volumes → capítulos, temporadas opcionais e textos independentes.
- Rascunhos, prévia, agendamento, versões e colaboradores com funções específicas.
- Editor visual e futuro HTML/CSS restrito e isolado, sem JavaScript de autores.
- Texto independente das interações, que o leitor pode desligar.
- Trilha por passagem, áudio em frases e fichas de personagens, núcleos e locais.
- Microcenas contextuais sem deslocar o texto; prévia sob demanda como padrão.
- Abertura automática não implica reprodução automática; áudio exige autorização. Evitar reabertura automática ao voltar ao mesmo trecho.
- Feed, seguidores, comentários, curtidas e repostagens; sem mensagens privadas inicialmente.
- Comentários nas obras ocultos até o leitor escolher vê-los.
- Descoberta por gênero, idioma, novidades e curadoria, com espaço para novos autores.
- Português e inglês planejados; protótipo atual em português.
- Recursos de leitura gratuitos, inclusive download autorizado pelo autor.
- Autores poderão pagar por ferramentas avançadas e capacidade adicional de mídia.
- Apoio voluntário, acesso antecipado e conteúdo exclusivo; taxas ainda indefinidas.
- IA para geração de imagens e vídeos financiada por créditos em etapa futura; inicialmente mídia criada fora da plataforma.
- Gamificação opcional e narrativas ramificadas em etapas futuras.
- Integração Kindle/Kobo a pesquisar, sem promessa de sincronização.

## Prioridades do piloto

1. Autores publicarem com facilidade.
2. Leitores retornarem para novos capítulos.

## Arquitetura

Protótipo estático em HTML, CSS e JavaScript, sem framework. Rotas por hash, Web Audio API e IntersectionObserver. A posição de leitura é estimada pela visibilidade e permanência do trecho; não há rastreamento dos olhos.

Arquitetura alvo: aplicação web instalável, módulos de identidade/permissões, conteúdo editorial, mídia/interações, leitura, comunidade e administração. Banco para registros, armazenamento separado para mídia e permissões verificadas no servidor. Interações com vínculos estáveis e fichas de lore com revelação progressiva para evitar spoilers. Fornecedores, cotas e custos ainda precisam ser validados.

## Validação

A inspeção da base `6ff99c5` confirmou que o núcleo já existia em `dist`: descoberta, biblioteca, leitura, estúdio e microcenas. A execução de CI dessa base passou em 20/10/2026, incluindo sete cenários de navegador. A documentação anterior ainda indicava esses testes como pendentes.

A evolução mantém essa arquitetura e acrescenta persistência de mídia, sem recriar o aplicativo. `npm run check` verifica sintaxe; `npm test` executa dezoito testes de lógica. `npm run test:browser` executa catorze cenários integrados em Chromium, incluindo autoria de mundo, revelação progressiva, visualização em celular e os fluxos de leitura/mídia preservados. O workflow do GitHub instala Playwright e Chromium e guarda resultados e screenshots.

Para executar a interface de testes localmente, instale o runner e seu navegador (dependências apenas de desenvolvimento):

```sh
npm install --no-save --package-lock=false playwright@1.56.1
npx playwright install chromium
npm run test:browser
```

Consulte [docs/QA.md](docs/QA.md) para a cobertura e as limitações.

## Próximos passos

1. Conectar o texto/link oficial e as fichas aprovadas do primeiro percurso de Ayîvernî.
2. Integrar ilustrações, ambientes e mídia canônicos ao atlas.
3. Implementar backend, autenticação, permissões e progressão no servidor antes do piloto multiusuário.
4. Validar a experiência de Ayîvernî com leitores; depois evoluir personalização e monetização.
