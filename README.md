# Shoronbun Karte Schreiber Ver.0.1

診断データを読み込み、ブラウザ上でA3横のShoronbun Karteを確認・修正し、そのまま1ページで印刷するPRINT FIRST Webアプリです。PowerPoint、Word、Excelを実行環境として使用しません。

## 現在の判定

**CONDITIONAL PASS**

ローカル環境での入力、JUIZ IMPORT、A3プレビュー、overflow警告、端末の一時保存、Chrome／Edge印刷エンジンによるA3横1ページ出力は確認済みです。本番Google OAuthは未設定で、非公開Google Sheetへの実接続は次StageでNo.Mが行います。文字数上限の実測結果は [QA_REPORT.md](QA_REPORT.md) を確認してください。

## すぐに試す

### Windows

1. このフォルダー内の `start-local.bat` をダブルクリックします。
2. ブラウザで `http://localhost:8080` が開きます。
3. 終了時は、開いた黒い画面で `Ctrl+C` を押します。

Pythonが見つからない場合は、Visual Studio CodeのLive Server等でこのフォルダーをローカル配信してください。ES Modulesを使用しているため、`index.html`を `file://` で直接開く方式は対象外です。

## 基本操作

1. 右側の入力欄を編集します。左側のA3プレビューへ即時反映されます。
2. JUIZのSchreiber形式JSONは「JUIZ IMPORT」へ貼り付け、「JSONを反映」を押します。
3. 「保存・チェック」で必須項目、文字数、実表示行数を確認します。
4. 「印刷」を押します。

印刷設定は次を使用してください。

- 用紙：A3
- 向き：横
- 余白：なし
- 倍率：100％
- ヘッダーとフッター：オフ

印刷時はサイドバー、操作ボタン、Web画面背景を非表示にし、カルテだけを出力します。

## JUIZ IMPORT

Schema Ver.1.0のフィールドを含むJSONオブジェクトを受け付けます。`data` 内のオブジェクト、または1件だけを含む配列にも対応します。不正JSON、範囲外のレーダー値、未定義rank・評価を検出した場合、現在のカルテは更新しません。

## データと保存

- 正式正本：Google Sheets
- 端末保存：IndexedDB上の作業中ドラフト／通信断対策のみ
- クラウド保存：明示的な「Google Sheetsへ保存」操作のみ
- 新規レコード：診断データの末尾へ追加
- 既存レコード：`record_id` が一致する行を更新
- 日時：`Asia/Tokyo` 基準

正式Schemaは `診断データ` シートの55列と列順まで一致させています。氏名欄には `display_name` だけを使用します。

## Google Sheetsを有効にする

初期状態では認証が無効です。認証に失敗しても、手動入力、JUIZ IMPORT、A3プレビュー、印刷は使用できます。

次Stageでは [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) に従い、`config.js` の `googleClientId` だけを設定してください。Client Secret、Refresh Token、Access Tokenをファイルへ保存しないでください。

## GitHub Pages配置

このフォルダーの中身をGitHub Pagesの公開ルートへそのまま配置できます。今回のStageでは、リポジトリ作成、push、Pull Request、merge、GitHub Pages公開を行っていません。

Google OAuthのAuthorized JavaScript originには、リポジトリ名を含むURLではなく `https://<GitHubユーザー名>.github.io` のoriginを登録します。実際の公開URLは次Stageで確定してください。

## 主なファイル

- `index.html`：画面とA3紙面
- `styles.css`：PC画面、A3固定座標、印刷CSS
- `app.js`：入力、SVGレーダー、JSON取込、overflow、IndexedDB
- `schema.js`：正式55列Schema、選択肢、暫定上限
- `google-sheets.js`：Google Identity Services／Sheets API接続
- `config.js`：実行時設定。現在はClient ID未設定
- `config.example.js`：設定例
- `assets/karte-master.png`：正式PDFから300dpiで作成した固定紙面下地
- `assets/A.png` ほか：正式ランクスタンプ6種
- `qa-evidence/`：PC画面とA3印刷の検証画像

## セキュリティ

- Spreadsheet IDとブラウザ向けOAuth Client IDは秘密情報ではありません。
- Google Sheetは非公開のまま維持してください。
- OAuth Access Tokenはメモリ上だけで使用し、localStorageやIndexedDBへ保存しません。
- GitHub PagesへClient Secret、Secret Key、Refresh Token、Access Tokenを置かないでください。
- Sheets APIの権限範囲はファイル単位に限定できないため、固定Spreadsheet ID以外へアクセスしない実装としています。詳細は認証手順書を確認してください。

## 参照基準

A3紙面は `Shoronbun_Karte_Master_Ver1.0.pptx`／PDF、KARTE RED `#DC2831`、正式PNGスタンプを基準にしています。操作画面はSchreiber完成イメージの左プレビュー・右サイドバー・アコーディオン・固定印刷ボタンという構成意図を反映しています。
