# 2E Spectrum — デプロイ手順

このフォルダには、サイト本体（`index.html`）と、AIアシスタントを動かす
サーバー側の関数（`api/assistant.js`）が入っています。
Vercelに無料でデプロイすると、そのままインターネット上で公開でき、
AIアシスタントも実際に動作します。

```
2e-spectrum-deploy/
├── index.html          ← サイト本体（そのまま）
├── api/
│   └── assistant.js    ← Gemini APIキーを安全に保管するサーバー関数
├── package.json
├── vercel.json
└── .gitignore
```

---

## ステップ1：Google Gemini APIキーを取得する（無料）

1. https://aistudio.google.com にアクセスし、Googleアカウントでログイン
2. 左メニューの「Get API key」→「Create API key」をクリック
3. 表示されたキー（`AIzaSy...` のような文字列）をコピーして、
   どこかに一時的に控えておく（後でVercelに登録します）

無料枠：Gemini 2.5 Flashで1日1,500リクエストまで無料（クレジットカード登録不要）。

---

## ステップ2：Vercelアカウントを作る（無料）

1. https://vercel.com にアクセスし、「Sign Up」
2. GitHubアカウントでのサインアップが一番簡単（GitHubアカウントがない場合は
   先に https://github.com で作成）

---

## ステップ3：このフォルダをGitHubにアップロードする

Vercelは基本的にGitHubリポジトリからデプロイします。

1. GitHubで新しいリポジトリを作成（例: `2e-spectrum-site`）
2. このフォルダの中身一式をそのリポジトリにアップロード
   （GitHubの「Add file → Upload files」でドラッグ&ドロップでもOK）

---

## ステップ4：Vercelでデプロイする

1. Vercelのダッシュボードで「Add New... → Project」
2. 先ほど作ったGitHubリポジトリを選択して「Import」
3. 設定はそのままで「Deploy」をクリック
   （Framework Presetは "Other" のままで問題ありません）
4. 数十秒でデプロイが完了し、`https://あなたのプロジェクト名.vercel.app`
   のようなURLが発行されます

この時点ではまだ`GEMINI_API_KEY`を登録していないため、AIアシスタントは
自動的にローカルのキーワード応答（オフライン版）にフォールバックします
（エラーにはなりません）。

---

## ステップ5：APIキーをVercelに登録する

1. Vercelのプロジェクトページ →「Settings」タブ →「Environment Variables」
2. 以下を入力：
   - **Key**: `GEMINI_API_KEY`
   - **Value**: ステップ1でコピーしたキー
   - **Environment**: Production / Preview / Development すべてにチェック
3. 「Save」をクリック
4. 画面上部の「Deployments」タブ → 最新のデプロイの「...」メニュー →
   「Redeploy」をクリック（環境変数は再デプロイ後に反映されます）

---

## ステップ6：動作確認

デプロイされたURL（`https://あなたのプロジェクト名.vercel.app`）を開き、
ページ下部の「AI学習アシスタント」セクションでチャットに質問を入力して
みてください。Geminiからの回答が返ってくれば成功です。

もし何も反応しない、またはローカル応答（あらかじめ用意した固定回答）しか
返ってこない場合は：
- Vercelの「Deployments」→ 該当デプロイの「Functions」ログでエラーを確認
- `GEMINI_API_KEY` のスペルミスがないか確認
- 環境変数登録後に再デプロイを忘れていないか確認

---

## 費用について

- Gemini API：1日1,500リクエストまで無料（Gemini 2.5 Flash）
- Vercel：Hobbyプランは個人利用なら無料
- 独自ドメインを使わない限り、ドメイン費用もかかりません

無料枠は各社の方針変更で今後変わる可能性があります。アクセスが急増した
場合は、Vercelのダッシュボードで使用量を確認してください。

---

## 今後の拡張アイデア

- `api/assistant.js` の `SYSTEM_PROMPT` を編集すれば、アシスタントの
  口調や回答範囲を自由に調整できます
- 会話ログを保存したい場合は、Vercel KV や Supabase などの無料枠データ
  ベースと組み合わせることも可能です
- レート制限（同じユーザーからの連投を防ぐ）を追加したい場合は、
  `api/assistant.js` にIPベースの簡易カウンターを実装できます
