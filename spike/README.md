# Spike técnico: enquete nativa em grupo

**Status: NÃO VALIDADO EM GRUPO REAL.** Este experimento usa Baileys, integração não oficial sujeita a mudanças e restrições de conta.

## Execução manual
1. Use uma conta de teste e um grupo com participantes que concordaram em testar.
2. Instale Node.js >=22 e execute `npm install`.
3. Configure `TEST_GROUP_JID` com o identificador do grupo aprovado e `CONFIRM_TEST_GROUP=yes`.
4. Execute `npm run spike:poll`; faça o pareamento do dispositivo pelo fluxo suportado pelo Baileys. **O código atual não renderiza o QR**: para parear, será necessário acrescentar um renderizador de QR local ou usar uma sessão de teste já autenticada.
5. Digite SEND para publicar uma única enquete e solicite votos, troca de voto e reconexão.

## Evidências e critérios GO/NO-GO
- Enquete aparece nativamente com exatamente Interesse e ✨, uma escolha.
- Evento de voto é recebido, descriptografado e vinculado ao participante correto.
- Troca de voto, dois votantes, repetição e reconexão não duplicam eventos.
- O arquivo local `.local-evidence/poll-events.json` é apenas diagnóstico; os IDs dos votantes são parcialmente mascarados e não comprovam identificação estável entre LID/JID.
- **NO-GO** se os eventos não chegarem, não houver identidade confiável, ou a reconexão perder o estado.
- Não publicar sessão, credenciais, IDs de grupo nem logs pessoais no GitHub.

Referência: https://github.com/WhiskeySockets/Baileys/blob/master/README.md

**Atenção:** Este spike não integra o motor, não persiste votos em PostgreSQL e não comprova ordenação cronológica real.
