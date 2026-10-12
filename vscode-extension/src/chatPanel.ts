import * as vscode from "vscode";
import { OfoqApi } from "./api";

export class OfoqChatPanel {
  public static currentPanel: OfoqChatPanel | undefined;
  private static pendingMessage: string | undefined;

  private readonly _panel: vscode.WebviewPanel;
  private _conversationId: string | undefined;
  private _context: vscode.ExtensionContext;

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    this._panel = panel;
    this._context = context;
    this._panel.webview.html = this._getHtml();
    this._panel.onDidDispose(() => { OfoqChatPanel.currentPanel = undefined; });
    this._panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg.command === "send") await this._handleSend(msg.text);
      if (msg.command === "newConversation") this._conversationId = undefined;
    });

    // Check config on open
    if (!OfoqApi.isConfigured()) {
      this._panel.webview.postMessage({ command: "error", text: "⚠️ يرجى إعداد الاتصال: Ctrl+Shift+P → Ofoq AI: إعدادات" });
    }
  }

  static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
    if (OfoqChatPanel.currentPanel) {
      OfoqChatPanel.currentPanel._panel.reveal(vscode.ViewColumn.Two);
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      "ofoqChat", "Ofoq AI", vscode.ViewColumn.Two,
      { enableScripts: true, retainContextWhenHidden: true }
    );
    OfoqChatPanel.currentPanel = new OfoqChatPanel(panel, context);

    if (OfoqChatPanel.pendingMessage) {
      setTimeout(() => {
        OfoqChatPanel.currentPanel?._handleSend(OfoqChatPanel.pendingMessage!);
        OfoqChatPanel.pendingMessage = undefined;
      }, 500);
    }
  }

  static sendMessage(text: string) {
    if (OfoqChatPanel.currentPanel) {
      OfoqChatPanel.currentPanel._handleSend(text);
    } else {
      OfoqChatPanel.pendingMessage = text;
    }
  }

  private async _handleSend(text: string) {
    this._panel.webview.postMessage({ command: "userMessage", text });
    this._panel.webview.postMessage({ command: "loading", value: true });

    try {
      if (!this._conversationId) {
        this._conversationId = await OfoqApi.createConversation();
      }
      const result = await OfoqApi.sendMessage(this._conversationId, text);
      this._panel.webview.postMessage({
        command: "aiMessage",
        text: result.content,
        routing: result.routing,
      });
    } catch (err: any) {
      this._panel.webview.postMessage({
        command: "error",
        text: err.response?.data?.message || err.message || "خطأ في الاتصال",
      });
    } finally {
      this._panel.webview.postMessage({ command: "loading", value: false });
    }
  }

  private _getHtml(): string {
    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ofoq AI</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Tahoma, sans-serif; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); height: 100vh; display: flex; flex-direction: column; }
  #header { padding: 10px 16px; border-bottom: 1px solid var(--vscode-panel-border); display: flex; align-items: center; justify-content: space-between; }
  #header h2 { font-size: 14px; font-weight: 600; }
  #new-btn { font-size: 11px; padding: 3px 8px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: pointer; }
  #messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
  .msg { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; }
  .msg.user { background: var(--vscode-button-background); color: var(--vscode-button-foreground); align-self: flex-end; border-bottom-right-radius: 4px; }
  .msg.ai { background: var(--vscode-input-background); border: 1px solid var(--vscode-panel-border); align-self: flex-start; border-bottom-left-radius: 4px; }
  .msg.error { background: #3b1a1a; border-color: #f87171; color: #fca5a5; align-self: center; }
  .routing { font-size: 10px; opacity: 0.5; margin-top: 6px; }
  .dots span { animation: blink 1.2s infinite; display: inline-block; }
  .dots span:nth-child(2) { animation-delay: 0.2s; }
  .dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes blink { 0%, 80%, 100% { opacity: 0; } 40% { opacity: 1; } }
  #input-area { padding: 10px 12px; border-top: 1px solid var(--vscode-panel-border); display: flex; gap: 8px; }
  #input { flex: 1; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 8px; padding: 8px 12px; font-size: 13px; resize: none; font-family: inherit; }
  #send { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 8px; padding: 8px 14px; cursor: pointer; font-size: 13px; }
  #send:disabled { opacity: 0.4; cursor: default; }
  code { background: rgba(0,0,0,0.3); padding: 1px 4px; border-radius: 3px; font-size: 12px; }
</style>
</head>
<body>
<div id="header">
  <h2>🤖 Ofoq AI</h2>
  <button id="new-btn" onclick="newConversation()">محادثة جديدة</button>
</div>
<div id="messages"><div class="msg ai">مرحباً! أنا مساعدك في الكود. حدد كوداً من المحرر أو اسألني مباشرة.</div></div>
<div id="input-area">
  <textarea id="input" rows="2" placeholder="اسألني... (Enter للإرسال)"></textarea>
  <button id="send" onclick="send()">إرسال</button>
</div>
<script>
  const vscode = acquireVsCodeApi();
  const messages = document.getElementById('messages');
  const input = document.getElementById('input');
  const sendBtn = document.getElementById('send');
  let loading = false;

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });

  function send() {
    const text = input.value.trim();
    if (!text || loading) return;
    input.value = '';
    vscode.postMessage({ command: 'send', text });
  }

  function newConversation() {
    messages.innerHTML = '<div class="msg ai">محادثة جديدة بدأت!</div>';
    vscode.postMessage({ command: 'newConversation' });
  }

  window.addEventListener('message', (e) => {
    const { command, text, routing, value } = e.data;
    if (command === 'userMessage') addMsg(text, 'user');
    if (command === 'aiMessage') {
      const extra = routing ? \`<div class="routing">\${routing.provider === 'claude' ? '🧠 Claude' : '⚡ Ollama'} · \${routing.model}</div>\` : '';
      addMsg(text + extra, 'ai', true);
    }
    if (command === 'error') addMsg(text, 'error');
    if (command === 'loading') setLoading(value);
  });

  function addMsg(text, cls, html = false) {
    const existing = messages.querySelector('.loading-dots');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.className = 'msg ' + cls;
    if (html) div.innerHTML = text.replace(/\\n/g, '<br>');
    else div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function setLoading(on) {
    loading = on;
    sendBtn.disabled = on;
    if (on) {
      const div = document.createElement('div');
      div.className = 'msg ai loading-dots';
      div.innerHTML = '<div class="dots"><span>•</span><span>•</span><span>•</span></div>';
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    } else {
      messages.querySelector('.loading-dots')?.remove();
    }
  }
</script>
</body>
</html>`;
  }
}
