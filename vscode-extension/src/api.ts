import * as vscode from "vscode";
import axios from "axios";

export class OfoqApi {
  private static getConfig() {
    const config = vscode.workspace.getConfiguration("ofoq");
    return {
      apiUrl: config.get<string>("apiUrl", ""),
      apiKey: config.get<string>("apiKey", ""),
      defaultProvider: config.get<string>("defaultProvider", "auto"),
    };
  }

  static async sendMessage(conversationId: string, message: string): Promise<any> {
    const { apiUrl, apiKey, defaultProvider } = this.getConfig();

    if (!apiUrl || !apiKey) {
      throw new Error("يرجى إعداد الاتصال أولاً عبر: Ofoq AI: إعدادات");
    }

    const response = await axios.post(
      `${apiUrl}/chat/conversations/${conversationId}/messages`,
      { message, provider: defaultProvider, stream: false },
      { headers: { "x-api-key": apiKey }, timeout: 120000 }
    );

    return response.data;
  }

  static async createConversation(): Promise<string> {
    const { apiUrl, apiKey } = this.getConfig();
    const response = await axios.post(
      `${apiUrl}/chat/conversations`,
      { title: "VS Code Session" },
      { headers: { "x-api-key": apiKey } }
    );
    return response.data.id;
  }

  static isConfigured(): boolean {
    const { apiUrl, apiKey } = this.getConfig();
    return !!(apiUrl && apiKey);
  }
}
