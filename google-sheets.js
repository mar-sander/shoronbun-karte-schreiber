import { FIELDS, recordToRow, rowToRecord, validateSchema } from "./schema.js";

const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

export class GoogleSheetsStore {
  constructor(config, onStatus) {
    this.config = config;
    this.onStatus = onStatus;
    this.accessToken = "";
    this.tokenClient = null;
    this.rowsByRecordId = new Map();
  }

  get configured() {
    return Boolean(this.config.googleClientId && !this.config.googleClientId.startsWith("YOUR_"));
  }

  get connected() { return Boolean(this.accessToken); }

  async authorize() {
    if (!this.configured) throw new Error("Google OAuth Client IDが未設定です。config.jsを設定してください。");
    await this.waitForGIS();
    return new Promise((resolve, reject) => {
      const callback = (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        this.accessToken = response.access_token;
        this.onStatus?.("connected");
        resolve(response);
      };
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: this.config.googleClientId,
        scope: SCOPE,
        callback,
        error_callback: (error) => reject(new Error(error.message || error.type || "Google認証を完了できませんでした。")),
      });
      this.tokenClient.requestAccessToken({ prompt: this.accessToken ? "" : "consent" });
    });
  }

  async loadRecords() {
    this.requireToken();
    const range = `${this.config.sheetName}!A:BC`;
    const data = await this.request(this.valuesUrl(range, "?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE"));
    const rows = data.values || [];
    if (!rows.length) throw new Error("診断データシートにヘッダーがありません。");
    const headers = rows[0];
    const schema = validateSchema(headers);
    if (!schema.valid) throw new Error(`55列Schema不一致（列数 ${schema.count}、不足 ${schema.missing.join(", ") || "なし"}）`);
    this.rowsByRecordId.clear();
    const records = rows.slice(1).map((row, index) => ({ row, rowNumber: index + 2 }))
      .filter(({ row }) => row.some((cell) => cell !== "" && cell !== null))
      .map(({ row, rowNumber }) => {
      const record = rowToRecord(headers, row);
      if (record.record_id) this.rowsByRecordId.set(String(record.record_id), rowNumber);
      return record;
    });
    return records;
  }

  async saveRecord(record) {
    this.requireToken();
    const row = recordToRow(record);
    const existingRow = this.rowsByRecordId.get(String(record.record_id));
    if (existingRow) {
      const range = `${this.config.sheetName}!A${existingRow}:BC${existingRow}`;
      await this.request(this.valuesUrl(range, "?valueInputOption=USER_ENTERED"), {
        method: "PUT",
        body: JSON.stringify({ range, majorDimension: "ROWS", values: [row] }),
      });
      return { action: "updated", row: existingRow };
    }
    const range = `${this.config.sheetName}!A:BC`;
    const query = "?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS";
    const result = await this.request(`${this.valuesUrl(range)}:append${query}`, {
      method: "POST",
      body: JSON.stringify({ range, majorDimension: "ROWS", values: [row] }),
    });
    const updatedRange = result.updates?.updatedRange || "";
    const match = updatedRange.match(/![A-Z]+(\d+):/);
    if (match) this.rowsByRecordId.set(String(record.record_id), Number(match[1]));
    return { action: "created", row: match ? Number(match[1]) : null };
  }

  valuesUrl(range, query = "") {
    return `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(this.config.spreadsheetId)}/values/${encodeURIComponent(range)}${query}`;
  }

  async request(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    if (response.status === 401) {
      this.accessToken = "";
      this.onStatus?.("expired");
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error?.message || `Google Sheets APIエラー ${response.status}`);
    return payload;
  }

  requireToken() {
    if (!this.accessToken) throw new Error("Google Sheetsに接続できません。先にGoogleへ接続してください。");
  }

  async waitForGIS() {
    const started = Date.now();
    while (!window.google?.accounts?.oauth2) {
      if (Date.now() - started > 10000) throw new Error("Google Identity Servicesを読み込めませんでした。");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

export { SCOPE, FIELDS };
