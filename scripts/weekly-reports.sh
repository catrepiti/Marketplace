#!/bin/bash
# Geração automática de relatórios semanais — chamado pelo LaunchAgent
# com.aure.marketplace-reports toda segunda-feira às 08:00.

PROJECT_DIR="$HOME/marketplace-hub"
PORT=3000
URL="http://localhost:$PORT"
LOG="$PROJECT_DIR/reports-cron.log"

SECRET=$(grep '^REPORTS_CRON_SECRET=' "$PROJECT_DIR/.env" | cut -d'"' -f2)
if [ -z "$SECRET" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERRO: REPORTS_CRON_SECRET não encontrado no .env" >> "$LOG"
  exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Gerando relatórios semanais..." >> "$LOG"

# Sobe o servidor se não estiver rodando
if ! curl -sf -o /dev/null --max-time 5 "$URL"; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Servidor fora do ar, iniciando..." >> "$LOG"
  cd "$PROJECT_DIR" || exit 1
  nohup npm run dev >> "$PROJECT_DIR/server.log" 2>&1 &
  for _ in $(seq 1 30); do
    sleep 3
    if curl -sf -o /dev/null --max-time 5 "$URL"; then break; fi
  done
fi

if ! curl -sf -o /dev/null --max-time 5 "$URL"; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERRO: servidor não subiu, abortando" >> "$LOG"
  exit 1
fi

RESULT=$(curl -sf -X POST --max-time 600 "$URL/api/reports" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: $SECRET" \
  -d '{}')
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Resultado: $RESULT" >> "$LOG"
