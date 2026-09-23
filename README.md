# AI Chat Deepgram

Projeto isolado e minimalista de chat texto → texto usando a Deepgram Voice Agent API com o modelo gerenciado `gpt-5.6-luna`.

## V1

- React + Vite + TypeScript
- `@deepgram/agents`
- Deepgram `gpt-5.6-luna`
- input textual via `injectUserMessage()`
- resposta via `conversation-text`
- token temporário gerado no backend (`/api/deepgram-token`)
- API key nunca vai para o bundle do navegador
- sessões curtas: abre por turno e fecha ao final da resposta
- histórico mantido no browser e reenviado como contexto no próximo turno
- slots de integração preparados para GitHub e Supabase

## Rodando

1. Instale dependências:

```bash
npm install
```

2. Crie `.env.local` a partir de `.env.example`:

```bash
DEEPGRAM_API_KEY=...
```

3. Para testar a UI apenas:

```bash
npm run dev
```

4. Para testar a UI + função `/api/deepgram-token` localmente, use Vercel Dev:

```bash
npx vercel dev
```

## Segurança

A chave `DEEPGRAM_API_KEY` é usada somente no endpoint server-side. O browser recebe um token temporário do endpoint oficial `POST https://api.deepgram.com/v1/auth/grant`.

Não use `VITE_DEEPGRAM_API_KEY`: variáveis com prefixo `VITE_` são expostas ao navegador.

## Arquitetura

```text
Browser / React
  ↓
/api/deepgram-token
  ↓
Deepgram /v1/auth/grant
  ↓ temporary token
Browser
  ↓ WebSocket via @deepgram/agents
Deepgram Voice Agent
  ↓
OpenAI gpt-5.6-luna (managed by Deepgram)
```

## Próximo milestone

Adicionar adapters reais de tools:

```text
src/tools/
  github/
  supabase/
  registry.ts
```

As tools devem executar no servidor. Tokens de GitHub/Supabase não devem ser expostos no front.

## Observação sobre texto puro

A Deepgram Voice Agent API continua sendo uma pipeline de voz. Mesmo usando `InjectUserMessage` e descartando o áudio no front, a configuração do agente possui etapa `speak`/TTS. Esta V1 é uma prova de arquitetura texto → agente → texto; depois de medir latência e custo reais, decidimos se mantemos esta pipeline ou se usamos um endpoint LLM dedicado para o chat textual.
