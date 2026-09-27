# IASD BOT — plano de integração

Estado: planejamento; nenhum envio de WhatsApp ativado.

## Objetivo
Enviar avisos opt-in aos membros escalados, usando o número dedicado da igreja e a WhatsApp Business Platform (Cloud API) oficial. Meta mensal desejada: R$ 5 de tarifas de mensagens, sujeito a preços e taxas vigentes; bloquear novos disparos quando atingir limite configurado.

## Integração existente
O index.html utiliza Supabase e já possui cronogramas persistidos. Antes de codificar, confirmar estrutura de tabelas e permissões atuais; não presumir que cronograma equivale à escala individual. Não alterar projeção ou sorteador.

## MVP
1. Administrador registra nome, telefone E.164, consentimento com data/origem, função, data/hora e escala.
2. Uma tarefa agendada no servidor procura escalas para amanhã e hoje, no fuso America/Bahia, e gera avisos idempotentes por escala/tipo.
3. Uma Edge Function segura usa token da Meta guardado apenas como segredo no servidor; nunca no index.html nem no GitHub.
4. Templates de utilidade aprovados pela Meta para avisos proativos fora da janela de atendimento; webhook valida autenticidade e registra status/erros.
5. Painel exibe fila, enviados, falhas, confirmações, opt-out e custo estimado; reenvio manual controlado.
6. Respostas de confirmação somente depois de webhook configurado. Permitir parar avisos e apagar telefone conforme necessidade.

## Antes de ativar
- Confirmar chip ativo e apto a receber SMS ou chamada (já informado pelo proprietário).
- Cadastrar número no Meta Business e na WhatsApp Business Platform; não compartilhar códigos de verificação.
- Confirmar custo vigente por categoria/país, regras de cobrança e eventuais taxas de terceiros. R$ 5 não é garantia de custo total.
- Confirmar tabelas de escalas e permissões no Supabase e configurar ambiente de teste.
- Fazer envio de teste somente para número autorizado; ativar produção depois de aprovação.
