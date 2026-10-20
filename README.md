# Lenora

Histórias para ler, ouvir e sentir.

Plataforma de publicação literária seriada para novos escritores, com interações audiovisuais opcionais e controle da experiência pelo leitor. Nome anterior do protótipo: Lumera.

## Estado deste repositório

Documentação inicial consolidada. **A transferência do código-fonte do protótipo ainda está pendente**, pois o ambiente que contém os arquivos está indisponível. A renomeação da interface publicada para Lenora também está pendente. Um push neste repositório não atualiza automaticamente a hospedagem existente.

## Implementado no protótipo publicado

- Descoberta com busca e filtros, uma obra demonstrativa e duas capas conceituais.
- Biblioteca, progresso e preferências locais.
- Leitura por rolagem ou trechos, ajuste de fonte e tema.
- Trilha sintetizada por região, efeito sonoro em frase e ficha de personagem.
- Microcena em prévia junto ao trecho, por mouse, foco ou toque, com reprodução, fechamento e ampliação.
- Popup automático sugerido pelo autor; abertura e reprodução autorizadas separadamente pelo leitor.
- Editor de texto simples, configuração de interações, rascunho e restauração da versão anterior.
- Teste de arquivos próprios de áudio, imagem e vídeo de até 25 MB cada.

## Limitações atuais

Não há autenticação, backend, comunidade multiusuário, pagamentos, geração de IA, PWA ou modo offline. O perfil é demonstrativo. Texto e preferências usam localStorage. Mídia usa URLs temporárias em memória e se perde ao recarregar. A microcena padrão é uma animação CSS, não vídeo gerado por IA.

Há uma configuração de trilha/efeito/lore/microcena por rascunho. Os vínculos usam números de trechos e correspondência textual, ainda sem IDs estáveis. A paginação é por trecho, não pela altura da tela. O editor avançado HTML/CSS ainda não foi implementado.

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

## Validação realizada no protótipo

- Verificação sintática do JavaScript.
- Navegação da descoberta ao capítulo.
- Abertura, reprodução e fechamento da prévia de microcena.
- Correção do conflito com a propriedade global window.top que impedia a inicialização.

Ainda pendem testes completos em dispositivos, acessibilidade, popup automático e persistência. Verificação sintática não substitui testes funcionais.

## Próximos passos

1. Recuperar e transferir o código-fonte exato do protótipo.
2. Aplicar Lenora na interface, preservando dados locais existentes.
3. Adicionar instruções de execução e verificação automática ao repositório.
4. Evoluir múltiplas interações, vínculos estáveis, editor e persistência de mídia.
5. Implementar autenticação, permissões e publicação real antes do piloto.
