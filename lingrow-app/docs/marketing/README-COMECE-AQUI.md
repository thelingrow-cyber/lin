# Lingrow — Marketing & Crescimento: Comece Aqui

Este é o índice-mestre. Todos os documentos de estratégia e execução de crescimento estão listados abaixo **na ordem em que você deve usá-los**. Última atualização: 2026-07-19.

---

## Como está organizado

Há dois tipos de documento:
- **Estratégia** — o "porquê" e o "o quê" (ler uma vez, consultar quando tiver dúvida).
- **Execução** — o "faça isto agora" (material pronto pra usar).

---

## 1. Entender o terreno (estratégia — ler primeiro)

| Documento | O que é |
|-----------|---------|
| `../user-personas.md` | Quem é o Mateus (70%) e a Clara (30%). Toda peça fala com eles. |
| `../competitor-analysis.md` | Posicionamento dos concorrentes (produto). |
| `competitor-content-formats-2026-07.md` | **Teardown de conteúdo/formato:** o que Duolingo, criadores BR e apps postam hoje, e onde está o espaço vazio do Lingrow. |
| `brand-positioning.md` / `brand-identity.md` | Voz, promessa, identidade visual. |

## 2. O plano (estratégia — a espinha dorsal)

| Documento | O que é |
|-----------|---------|
| `growth-plan-organico-2026-07.md` | **O motor de conteúdo contínuo:** linha editorial, os 7 formatos, grade semanal, influencer em 3 tiers, funil e métricas, rampa de 90 dias. |
| `launch-playbook-2026-07.md` | **A ordem de lançamento em 4 fases:** destravar a porta → pré-lançamento (build-in-public + waitlist + semear) → semana de lançamento → pós (content-market fit → escalar). Contém a sequência mestra. |

## 3. Executar (material pronto — use agora)

| Documento | Fase | O que é |
|-----------|------|---------|
| `content-scripts-lote-01.md` | Contínuo | 14 roteiros prontos pra gravar (2 semanas). |
| `waitlist-landing-copy.md` | Pré-lançamento | Copy da landing de waitlist + mecânicas de referral + e-mails. |
| `seeding-comunidades.md` | Pré-lançamento | Planilha das 15-20 comunidades + templates de post + calendário de semeadura. |
| `launch-assets-ph-apple-aso.md` | Lançamento | Product Hunt + pitch de featuring Apple + ficha ASO com palavras-chave. |
| `content-engine-launch-sprint.md` | Lançamento | Sprint de 7 dias com prompts de IA pra gerar conteúdo sob demanda. |
| `influencer-briefing.md` | Lançamento | Briefing pronto pra enviar aos criadores + tracking UTM. |

---

## A sequência mestra (o que fazer, em ordem)

> Detalhe completo em `launch-playbook-2026-07.md`. Resumo:

1. **Hoje (só você — nenhum agente faz):**
   - Aplicar a migration `008_secure_app_config_secret.sql` no SQL Editor do Supabase (segurança — ver `../security-audit-2026-07-19.md`).
   - Retomar o contrato de apps pagos da Apple + as chaves do RevenueCat (`../stories/revenuecat-setup-checklist.md`).
2. **Esta semana:**
   - Decidir o gap de conteúdo (completar as 600 frases ou ajustar a promessa do onboarding — ver auditoria P1).
   - Montar a landing de waitlist (`waitlist-landing-copy.md`).
   - **Começar o build-in-public** — não espere o app estar na loja.
3. **Semanas 1-2:** entrar nas comunidades só ajudando (`seeding-comunidades.md`); ASO da loja.
4. **Semanas 3-4:** menções nas comunidades + "procuro testers"; submeter pitch Apple; alinhar 5 criadores.
5. **Semana de lançamento:** Product Hunt + onda de criadores + comunidades + e-mail à waitlist (`launch-assets-ph-apple-aso.md`).
6. **Pós:** achar content-market fit → ligar o loop de share card → escalar só o que provou.

---

## O que está travado e em quem

| Bloqueio | Dono | Desbloqueia |
|----------|------|-------------|
| Contrato de apps pagos Apple | Você (manual) | Toda a cobrança / lançamento |
| Chaves RevenueCat (`appl_...` + segredo webhook) | Você (manual) | Ligar o paywall |
| Migration 008 aplicada em produção | Você (Dashboard) | Segurança antes do webhook real |
| Decisão do gap de conteúdo (600 frases) | Você + @dev | O balde não vazar |

---

*Índice mantido por @aiox-master (Orion). Quando um documento novo entrar, adicione uma linha aqui.*
