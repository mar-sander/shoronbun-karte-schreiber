# Shoronbun Karte Schreiber Ver.0.1 QA Report

実施日：2026-09-07  
総合判定：**CONDITIONAL PASS**

## 判定理由

ローカル実装、Chrome／Edgeの表示、A3横1ページ印刷、55列Schema、JUIZ IMPORT、SVGレーダー、ランク切替、端末一時保存はPASSです。

次の1点が次Stage待ちです。

1. Google OAuth Client IDをまだ作成・設定していないため、非公開Google Spreadsheetへの本番認証・実読書きは未実施です。

## 検証環境

- Windows
- Google Chrome 152.0.7977.82
- Microsoft Edge 152.0.4191.66
- 画面検証：1728 × 1080
- 印刷：CSS print mediaと各ブラウザの印刷エンジンからPDF出力
- フォント：Noto Sans JP、可変文章12px = 9pt

## 実装・画面

| 項目 | 結果 | 確認内容 |
|---|---|---|
| PCブラウザ操作 | PASS | Chrome／Edgeでconsole error、page errorとも0件 |
| 左右比率 | PASS | 1728px時、左1330.56px／右397.44px。右23.0％ |
| A3プレビュー | PASS | 420 × 297mm固定座標、縦横比1.41414、全体を等比縮小 |
| サイドバー | PASS | 独立スクロール、アコーディオン、固定印刷ボタン |
| UI reference | PASS | 左A3、右入力、上部データ選択、下部固定印刷の構成を維持 |
| 紙面reference | PASS | 正式PDFから作成した4961 × 3508px、300dpi下地を使用 |

## データ

| 項目 | 結果 | 確認内容 |
|---|---|---|
| 55列Schema | PASS | Excelテンプレートと列数・列名・列順が完全一致 |
| 基本情報 | PASS | display_nameを紙面の氏名欄へ表示 |
| radar 5値 | PASS | 1～5に正規化して即時反映 |
| Detailed評価 | PASS | 8評価、8コメントを反映 |
| Observation | PASS | 3欄を反映 |
| Prescription | PASS | 3欄を反映 |
| Key Phrase / Note | PASS | 両欄を反映 |
| rank | PASS | A、B、C-1、C-2、D-1、D-2の正式PNGへ切替 |
| 不正JSON | PASS | record_idを含む現在データが変化しないことを確認 |
| 正常JSON | PASS | display_name、score、rankが紙面へ即時反映 |

## レーダー・評価表示

| 項目 | 結果 | 確認内容 |
|---|---|---|
| 5軸・5段階 | PASS | SVG内に五角形グリッド5段、軸5本、数値1～5 |
| 色 | PASS | 線 `#DC2831`、塗り11％ |
| Marker Count | PASS | 0。SVG内circle要素なし |
| Detailed未選択 | PASS | 薄いグレー、weight 400 |
| Detailed選択 | PASS | 黒、weight 500。赤・下線・囲み・背景強調なし |
| 答案型 | PASS | 黒いチェックのみ |
| スタンプ資産 | PASS | 6ファイルすべて正式PNGとSHA-256一致 |

## 文字・overflow

サンプルレコードは文字・行ともoverflow 0件でした。60文字の全角日本語をテーマ欄へ入れた試験では `60 / 50 OVER` と `3 / 2 OVER` を表示し、フォントは9ptのまま維持しました。文章の削除、要約、自動縮小、枠拡張は行いません。

2026-09-07、実測結果とNo.Mの指導方針に基づく文字数・行数上限を正式値としてコードへ反映しました。文字種や改行により結果は変わるため、実運用ではブラウザ上の行数警告を最終判断にしてください。

| 欄 | 正式文字数 | 実測行数 | 正式行数 | 結果 |
|---|---:|---:|---:|---|
| テーマ・設問 | 50 | 2 | 2 | PASS |
| display_name | 15 | 1 | 1 | PASS |
| 総合所見 | 19 | 1 | 1 | PASS |
| Overall 気づいたこと | 32 | 2 | 2 | PASS |
| Detailed Check 各コメント | 45 | 2 | 2 | PASS |
| Observation① | 57 | 3 | 3 | PASS |
| Observation② | 57 | 3 | 3 | PASS |
| Observation③ | 57 | 3 | 3 | PASS |
| Prescription① | 57 | 3 | 3 | PASS |
| Prescription② | 57 | 3 | 3 | PASS |
| Prescription③ | 57 | 3 | 3 | PASS |
| Key Phrase | 35 | 1 | 2 | PASS |
| Note | 60 | 2 | 3 | PASS |

正式上限反映後の限定QAでは、上限定義、Noto Sans JP 9pt固定、既存サンプルoverflow 0件、`OVER`警告、JavaScript構文、変更範囲を確認し、すべてPASSでした。Chrome／Edge印刷、全機能回帰、OAuthは今回再実行していません。

## 印刷

| 項目 | Chrome | Edge |
|---|---|---|
| A3 landscape | PASS | PASS |
| ページ数 | 1 | 1 |
| PDFページサイズ | 1191.12 × 841.92pt | 1191.12 × 841.92pt |
| サイドバー・操作UI非表示 | PASS | PASS |
| paper transform解除 | PASS | PASS |
| 紙面外要素 | 0件 | 0件 |
| 文字切れ | サンプルでなし | サンプルでなし |

印刷PDFをPNGへ再レンダリングして目視確認しました。最終的な物理プリンター固有の余白・給紙差は、次StageでNo.Mが使用機器からテスト印刷してください。

検証画像：

- [Chrome PC画面](qa-evidence/chrome-screen.png)
- [Chrome A3印刷レンダリング](qa-evidence/chrome-a3-print.png)

## Google Sheets・認証

| 項目 | 結果 | 確認内容 |
|---|---|---|
| 現行方式確認 | PASS | Google Identity Services Token Model + Sheets API v4 REST/CORSがGitHub Pagesで成立 |
| 秘密情報 | PASS | Client Secret、Refresh Token、Access Tokenのハードコードなし |
| Token保存 | PASS | Access Tokenはメモリのみ。IndexedDBへ保存しない |
| 未設定時フォールバック | PASS | 手動入力、JSON取込、プレビュー、印刷を継続 |
| 読み込み設計 | PASS | `診断データ!A:BC`、55列照合後にレコード化 |
| 既存更新設計 | PASS | 物理行番号を保持し、record_id一致行をPUT更新 |
| 新規保存設計 | PASS | 55値を末尾へappend |
| モック試験 | PASS | 空行を挟む行番号、55列PUT、55列appendを確認 |
| 本番OAuth | 未実施 | 禁止事項に従いCloud Consoleと実アカウントを操作せず停止 |

参考：

- [Google Identity Services Token Model](https://developers.google.com/identity/oauth2/web/guides/use-token-model)
- [Google Sheets API values](https://developers.google.com/workspace/sheets/api/guides/values)
- [Google Sheets API scopes](https://developers.google.com/workspace/sheets/api/scopes)

## 個人情報・禁止事項

- 氏名用の正式Schemaは `display_name` のみです。
- 正式フルネーム用フィールドは存在しません。
- Google Sheetの共有設定を変更していません。
- GitHub push、PR、merge、Pages公開を行っていません。
- Google Cloud Project、OAuth Client ID、認証設定を作成・変更していません。
- PPTX、正式PDF、正式スタンプPNGを変更していません。

## 次StageでNo.Mが行うこと

1. `GOOGLE_OAUTH_SETUP.md` に従ってGoogle Cloud Project、Sheets API、OAuth consent、Web application Client IDを設定する。
2. `config.js` へブラウザ向けClient IDだけを記入する。
3. No.Mの個人GoogleアカウントをTest userとして認証する。
4. 非公開の正式Spreadsheetで、読み込み・既存1件更新・新規1件追加を確認する。
5. GitHub Pages公開URLをAuthorized JavaScript originsへ追加する。
6. Chrome／Edgeの実印刷プレビューと使用プリンターでA3横1枚を確認する。

## 実機レビュー限定修正（2026-09-07）

基本情報欄の配置、診断日の一体表示、Observation／Prescription本文間隔、Detailed Check選択コントラスト、No.欄、READ／THINK／WRITE／GROW字間、レーダー周辺の白被りと「5」重複、Node／npx起動バッチを限定修正しました。省リソースQAのみ実施し、Chrome／Edge完全印刷、OAuth、Google Sheets書込、全機能回帰は再実行していません。

検証画像：[修正後A3プレビュー](qa-evidence/chrome-review-stage.png)
