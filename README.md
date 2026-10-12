# Ofoq AI Platform 🤖

منصة ذكاء اصطناعي داخلية لفريق أفق تك — تجمع Ollama (مجاني/محلي) وClaude API (للمهام المعقدة) مع توجيه ذكي أوتوماتيكي.

## المكونات

| المكوّن | التقنية | الوصف |
|---------|---------|-------|
| `gateway/` | NestJS + TypeORM + Postgres | API الرئيسي + Smart Router |
| `dashboard/` | Next.js 15 + Tailwind | لوحة تحكم عربية |
| `vscode-extension/` | VS Code Extension API | تكامل المحرر |
| `infra/` | Docker Compose + Traefik | البنية التحتية |

## التشغيل

### السيرفر (لأول مرة)
```bash
bash infra/scripts/setup.sh ai.your-domain.com admin@email.com sk-ant-...
```

### تحديث
```bash
bash infra/scripts/deploy.sh
```

### محلياً للتطوير
```bash
docker compose -f docker-compose.dev.yml up
```

## VS Code Extension
1. افتح `vscode-extension/`
2. `npm install && npm run compile`
3. F5 لتشغيل في debug mode
4. `Ctrl+Shift+P` → "Ofoq AI: إعدادات" لإدخال API URL والمفتاح
