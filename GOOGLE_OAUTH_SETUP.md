# Google認証セットアップ手順

対象：Shoronbun Karte Schreiber Ver.0.1、No.M本人の個人Googleアカウント、非公開Spreadsheet

今回のソースは、ブラウザだけで動作するGoogle Identity ServicesのToken Modelを使用します。ユーザー操作で短時間のAccess Tokenを取得し、Sheets API v4をRESTで呼び出します。Client SecretとRefresh Tokenを必要としないため、GitHub Pagesで成立します。Googleはブラウザ向けToken ModelからAPIをREST／CORSで呼ぶ方式を案内しています。

- [Google Identity Services: Use the token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model)
- [Google Sheets API: Read and write cell values](https://developers.google.com/workspace/sheets/api/guides/values)

## 事前確認

- Spreadsheet ID：`1QCzraX01iBZe4Xxfr9hwLWAl_Si_pMzPyAVrQH0FBGY`
- データシート：`診断データ`
- locale：`ja_JP`
- timezone：`Asia/Tokyo`
- Sheetの共有設定：非公開のまま
- 使用アカウント：No.Mの個人Googleアカウント

## 1. Google Cloud Projectを用意する

1. [Google Cloud Console](https://console.cloud.google.com/) を開きます。
2. 画面上部のプロジェクト選択から新規Projectを作成するか、Schreiber専用の既存Projectを選びます。
3. Project名は例として `Shoronbun Karte Schreiber` とします。

この操作は次StageでNo.Mが行います。今回のStageでは作成していません。

## 2. Google Sheets APIを有効にする

1. Cloud Consoleの「APIとサービス」または「APIライブラリ」を開きます。
2. `Google Sheets API` を検索します。
3. 「有効にする」を押します。

Drive APIは今回の固定Spreadsheet読書きには不要です。

## 3. Google Auth Platformを設定する

Google Cloud Consoleのメニューから「Google Auth platform」を開きます。現在の画面では主にBranding、Audience、Data Access、Clientsを設定します。

### Branding

1. App nameに `Shoronbun Karte Schreiber` を入力します。
2. User support emailにNo.Mのメールアドレスを選びます。
3. Developer contact informationにもNo.Mの連絡先を設定します。

### Audience

1. 個人Googleアカウントで使うため、利用可能な選択肢ではExternalを選びます。
2. Testing状態で運用する場合、Test usersへNo.MのGoogleアカウントを追加します。
3. 不特定多数向けに公開しません。

### Data Access

次のScopeを追加します。

`https://www.googleapis.com/auth/spreadsheets`

このScopeはSheetsの読書きに必要ですが、Googleの仕様上、特定の1ファイルだけへOAuth権限を限定できません。Schreiber側は固定Spreadsheet IDだけを呼び出します。Google公式のScope説明も、Sheets ScopeがSpreadsheetファイル単位に限定されないことを明記しています。

- [Choose Google Sheets API scopes](https://developers.google.com/workspace/sheets/api/scopes)

`drive.file` は権限を限定しやすい推奨Scopeですが、アプリで作成・選択したファイル向けです。今回の既存固定Spreadsheetへ確実に読書きする初期構成では、`spreadsheets` Scopeを使用します。方式変更が必要な場合は、Google Picker等を含む別Stageとして検討してください。

## 4. OAuth Client IDを作る

1. Google Auth platformの「Clients」を開きます。
2. 「Create Client」を押します。
3. Application typeで「Web application」を選びます。
4. 名前を例として `Schreiber GitHub Pages` とします。
5. Authorized JavaScript originsへ、実際に使用するoriginを追加します。

ローカル検証例：

`http://localhost:8080`

GitHub Pages例：

`https://<GitHubユーザー名>.github.io`

originにはパスを含めません。たとえば公開URLが `https://example.github.io/schreiber/` でも、登録するoriginは `https://example.github.io` です。ワイルドカードは使えません。Google公式手順では、JavaScript originはschemeとhostname、必要ならportで構成します。

- [Create access credentials for a Web application](https://developers.google.com/workspace/guides/create-credentials#web-client-id)
- [OAuth 2.0 for Client-side Web Applications](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)

Token Modelのpopup callbackを使用するため、Authorized redirect URIsは通常空欄で構いません。

6. 作成後に表示されるClient IDをコピーします。Client Secretは使用しません。

## 5. SchreiberへClient IDを設定する

1. `config.example.js` を参考に `config.js` を開きます。
2. `googleClientId` の空文字を、作成したWeb application Client IDへ置き換えます。
3. `spreadsheetId` と `sheetName` は変更せず保存します。

設定例：

```js
window.SCHREIBER_CONFIG = {
  googleClientId: "1234567890-example.apps.googleusercontent.com",
  spreadsheetId: "1QCzraX01iBZe4Xxfr9hwLWAl_Si_pMzPyAVrQH0FBGY",
  sheetName: "診断データ",
};
```

ブラウザ向けClient IDはページから見える前提の識別子です。次の値は絶対に書かないでください。

- Client Secret
- Secret Key
- Refresh Token
- Access Token
- Googleアカウントのパスワード

## 6. ローカル動作確認

1. `start-local.bat` を起動します。
2. `http://localhost:8080` を開きます。
3. 「Googleへ接続」を押します。
4. No.Mの個人Googleアカウントを選び、Sheets権限を確認します。
5. 上部の再読み込みを押し、`診断データ` のレコード一覧が表示されることを確認します。
6. テスト用の1件だけを読み込み、内容を変更して「Google Sheetsへ保存」を押します。
7. Google Sheetを直接開き、同じ `record_id` の行が更新されたことを確認します。
8. 新規テストでは、新しい `record_id` が末尾に1行追加されることを確認します。

大量登録は行わないでください。Sheetの公開共有設定を変更しないでください。

## 7. GitHub Pagesでの確認

1. 次StageでGitHub Pagesを公開した後、実URLのoriginをOAuth Clientへ追加します。
2. ページをHTTPSで開きます。
3. 「Googleへ接続」から認証します。
4. 読み込み、既存更新、新規保存を各1件だけ確認します。
5. Chrome／Edgeの印刷プレビューで、A3・横・余白なし・1ページを確認します。

## よくある認証失敗

### origin_mismatch

現在のscheme、hostname、portがAuthorized JavaScript originsと一致していません。GitHub Pagesではリポジトリのパスを除いたoriginを登録します。設定反映まで少し待ち、ページを再読み込みします。

### access_denied / popup_closed

アカウント選択や同意画面を閉じた可能性があります。No.MのTest userアカウントで再度「Googleへ接続」を押します。ブラウザがpopupをブロックしていないか確認します。

### 401 / invalid_token

Access Tokenの有効期限が切れています。「Googleへ接続」から再認証します。SchreiberはRefresh Tokenを保存しません。

### 403: Google Sheets API has not been used / disabled

対象Cloud ProjectでGoogle Sheets APIを有効にします。別ProjectのClient IDを設定していないか確認します。

### 403: insufficient authentication scopes

Data AccessとコードのScopeが `https://www.googleapis.com/auth/spreadsheets` になっているか確認し、必要ならGoogleアカウント側で以前の同意を取り消して再認証します。

### 404 / Unable to parse range

Spreadsheet IDとシート名 `診断データ` を確認します。シート名や1行目の55列ヘッダーを変更しないでください。

### Google Identity Servicesを読み込めない

ネットワーク、広告ブロック、組織ポリシー、Content Security Policyを確認します。公式ライブラリ `https://accounts.google.com/gsi/client` へのアクセスが必要です。

## 本番前チェック

- No.M以外をTest userへ追加していない
- Google Sheetが非公開
- Authorized JavaScript originsが必要なoriginだけ
- `config.js` にClient ID以外の認証情報がない
- Access Tokenをブラウザ保存していない
- 正式55列ヘッダーが一致
- 少量の接続試験だけで既存レコードを確認
