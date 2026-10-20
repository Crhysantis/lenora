# Validação e limites

Esta versão foi reconstruída a partir do código e das decisões registrados na conversa. Não é uma cópia binária recuperada do ambiente anterior.

## Verificado antes de enviar

- Compilação sintática do JavaScript no runtime disponível.
- Sete casos de teste da lógica independente de interface: capítulo padrão, validação dos vínculos, escape de HTML, vínculos sobrepostos, normalização de preferências, leitura de armazenamento legado e armazenamento bloqueado/corrompido.
- Os mesmos testes foram incluídos para execução com o runner nativo do Node.

## Ainda necessário no navegador

1. Descoberta → leitura → estúdio → salvar e visualizar.
2. Biblioteca e progresso após recarregar.
3. Mouse, toque e teclado no marcador de microcena; Play/Pausa, fechar e ampliar.
4. Autor sugere abertura automática; leitor autoriza; popup abre ao chegar ao trecho, sem repetição ao voltar.
5. Sem autorização: popup não abre automaticamente e áudio não toca.
6. Vídeo automático sem áudio autorizado permanece mudo.
7. Ler sem interações remove marcadores, áudio e cenas.
8. Trocar página, rota ou aba interrompe mídia.
9. Validar popup em celular, com zoom e fonte ampliada; conferir preferência de redução de movimento.
10. Enviar arquivos reais, testar formatos, remoção e perda esperada de mídia ao recarregar.

A execução completa de interface desta reconstrução ainda não foi validada. Os testes de lógica não substituem QA visual, testes de áudio ou testes multiusuário.
