import * as vscode from "vscode";
import { OfoqChatPanel } from "./chatPanel";
import { OfoqApi } from "./api";

export function activate(context: vscode.ExtensionContext) {
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.text = "$(robot) Ofoq AI";
  statusBar.command = "ofoq.chat";
  statusBar.tooltip = "فتح Ofoq AI (Ctrl+Shift+A)";
  statusBar.show();
  context.subscriptions.push(statusBar);

  context.subscriptions.push(
    vscode.commands.registerCommand("ofoq.chat", () => {
      OfoqChatPanel.createOrShow(context.extensionUri, context);
    }),

    vscode.commands.registerCommand("ofoq.explainCode", async () => {
      const code = getSelectedCode();
      if (!code) return;
      OfoqChatPanel.createOrShow(context.extensionUri, context);
      OfoqChatPanel.sendMessage(`اشرح لي هذا الكود بالتفصيل:\n\`\`\`\n${code}\n\`\`\``);
    }),

    vscode.commands.registerCommand("ofoq.fixCode", async () => {
      const code = getSelectedCode();
      if (!code) return;
      OfoqChatPanel.createOrShow(context.extensionUri, context);
      OfoqChatPanel.sendMessage(`أصلح هذا الكود وبيّن ما الخطأ:\n\`\`\`\n${code}\n\`\`\``);
    }),

    vscode.commands.registerCommand("ofoq.improveCode", async () => {
      const code = getSelectedCode();
      if (!code) return;
      OfoqChatPanel.createOrShow(context.extensionUri, context);
      OfoqChatPanel.sendMessage(`حسّن هذا الكود من ناحية الأداء والقراءة:\n\`\`\`\n${code}\n\`\`\``);
    }),

    vscode.commands.registerCommand("ofoq.writeTests", async () => {
      const code = getSelectedCode();
      if (!code) return;
      OfoqChatPanel.createOrShow(context.extensionUri, context);
      OfoqChatPanel.sendMessage(`اكتب اختبارات شاملة لهذا الكود:\n\`\`\`\n${code}\n\`\`\``);
    }),

    vscode.commands.registerCommand("ofoq.configure", async () => {
      const apiUrl = await vscode.window.showInputBox({
        prompt: "رابط Ofoq AI Gateway",
        value: vscode.workspace.getConfiguration("ofoq").get("apiUrl", ""),
        placeHolder: "https://your-server.com/api/v1",
      });
      if (apiUrl) await vscode.workspace.getConfiguration("ofoq").update("apiUrl", apiUrl, true);

      const apiKey = await vscode.window.showInputBox({
        prompt: "مفتاح API (من Dashboard → مفاتيح API)",
        password: true,
        value: vscode.workspace.getConfiguration("ofoq").get("apiKey", ""),
      });
      if (apiKey) {
        await vscode.workspace.getConfiguration("ofoq").update("apiKey", apiKey, true);
        vscode.window.showInformationMessage("✅ تم حفظ إعدادات Ofoq AI");
      }
    })
  );
}

function getSelectedCode(): string | null {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { vscode.window.showWarningMessage("لا يوجد محرر نشط"); return null; }
  const selection = editor.selection;
  if (selection.isEmpty) { vscode.window.showWarningMessage("حدد الكود أولاً"); return null; }
  return editor.document.getText(selection);
}

export function deactivate() {}
