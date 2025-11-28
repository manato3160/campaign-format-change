# データナレッジ ドキュメント

## 概要

このドキュメントは、`応募規約・当選DM 自動生成用マスターシート - シート1.csv` を基に作成されたデータナレッジの説明です。

データナレッジファイル: `data-knowledge.json`

## ファイル構成

### 1. フィールドマッピング (`fieldMappings`)

CSVファイルの各項目とシステムのフィールドID、プレースホルダーの対応関係を定義しています。

#### 基本情報 (`basic`)
- **会社名**: `company_name` → `[company_name]`
- **キャンペーン名**: `campaign_name` → `[campaign_name]`
- **プライバシーポリシーURL**: `privacy_policy_url` → `[privacy_policy_url]`

#### 日程情報 (`schedule`)
- **応募期間（開始）**: `start_date` → `[start_date]`
- **応募期間（終了）**: `end_date` → `[end_date]`
- **当選DM送付予定日**: `dm_send_date` → `[dm_send_date]`
- **フォーム入力締切日**: `form_deadline` → `[form_deadline]`
- **賞品発送予定日**: `shipping_date` → `[shipping_date]`
- **フォームURL**: `form_url` → `[form_url]`

#### 賞品情報 (`prizes`)
- **賞品名1-5**: `prize_1` ~ `prize_5` → `[prize_1]` ~ `[prize_5]`
- **合計人数**: `total_winners` → `[total_winners]`

**注意**: 賞品名2-5は任意項目で、空欄や「（不要なら空白）」の場合は生成時に除外されます。

#### 応募方法 (`steps`)
- **STEP2-5**: `step_2` ~ `step_5` → `[step_2]` ~ `[step_5]`

**注意**: 
- STEP1は各テンプレートに固定で含まれています
- STEP3-5は任意項目で、空欄の場合はテンプレートから該当行が削除されます
- テンプレート内では `[STEP3_LINE]`, `[STEP4_LINE]`, `[STEP5_LINE]` として使用されます

#### SNSアカウント情報 (`social`)

各プラットフォームごとに、アカウント名、ID、URLの3項目があります：

- **LINE**: `line_name`, `line_id`, `line_url` （現在のシステムには未実装）
- **X (Twitter)**: `x_name`, `x_id`, `x_url`
- **Instagram**: `ig_name`, `ig_id`, `ig_url`
- **TikTok**: `tiktok_name`, `tiktok_id`, `tiktok_url`

### 2. テンプレートキー (`templateKeys`)

#### 対応プラットフォーム
- LINE（未実装）
- X (Twitter)
- Instagram (IG)
- TikTok

#### 抽選種類
- **事後抽選**: 応募期間終了後に抽選を実施
- **即時**: 応募と同時に抽選結果がわかる

#### 現在実装されているテンプレート
1. `IG/事後抽選` - Instagram事後抽選用
2. `X/事後抽選` - X事後抽選用
3. `X/即時` - X即時抽選用
4. `TikTok/事後抽選` - TikTok事後抽選用

#### CSVには記載されているが未実装のテンプレート
- `TikTok/即時` - TikTok即時抽選用
- `LINE/事後抽選` - LINE事後抽選用

### 3. 特殊プレースホルダー (`specialPlaceholders`)

#### `[PRIZE_LIST_DISPLAY]`
- **用途**: 応募規約テンプレートで賞品リストを表示
- **生成ロジック**: `prize_1`から`prize_5`までを「、」で結合し、空欄や「（不要なら空白）」を除外
- **例**: `A賞：デジタルギフト券、B賞：オリジナルTシャツ`

#### `[PRIZE_LINE_1]` ~ `[PRIZE_LINE_5]`
- **用途**: 当選DMテンプレートで各賞品を行ごとに表示
- **生成ロジック**: 各賞品が空欄または「（不要なら空白）」の場合は、その行全体を削除
- **マッピング**: 
  - `[PRIZE_LINE_1]` → `prize_1`
  - `[PRIZE_LINE_2]` → `prize_2`
  - 以下同様

#### `[STEP3_LINE]`, `[STEP4_LINE]`, `[STEP5_LINE]`
- **用途**: 応募規約テンプレートで応募ステップを行ごとに表示
- **生成ロジック**: 
  - 各ステップが空欄の場合は、その行全体を削除
  - 値がある場合は「STEPn：[内容]」形式に置換
- **マッピング**: 
  - `[STEP3_LINE]` → `step_3`
  - `[STEP4_LINE]` → `step_4`
  - `[STEP5_LINE]` → `step_5`

### 4. プレースホルダーマッピング (`placeholderMapping`)

CSVファイルで使用されるプレースホルダー形式（例：`[会社名]`）と、システムで使用されるプレースホルダー形式（例：`[company_name]`）の対応表です。

## 重要な注意事項

### 日付フォーマット
- **CSV形式**: `2025年12月1日（月）10:00` のような詳細な形式
- **システム形式**: `2025/01/15` のような簡潔な形式
- どちらの形式でも入力可能ですが、システム内部では簡潔な形式が推奨されます

### 空欄値の処理
以下の項目が空欄や「（不要なら空白）」の場合、生成時に該当行が削除されます：
- 賞品名2-5
- STEP3-5の応募方法
- 各種SNSアカウント情報（該当プラットフォームを使用しない場合）

### 未実装機能
- **LINEプラットフォーム**: CSVには記載されていますが、現在のシステムには未実装です
- **TikTok/即時テンプレート**: CSVには記載されていますが、現在のシステムには未実装です

## 使用方法

1. **データナレッジファイルの参照**
   ```typescript
   import knowledge from './data-knowledge.json';
   ```

2. **フィールドマッピングの取得**
   ```typescript
   const fieldMapping = knowledge.fieldMappings.basic[0];
   // { csvFieldName: "会社名", systemFieldId: "company_name", ... }
   ```

3. **プレースホルダーの変換**
   ```typescript
   const csvPlaceholder = "[会社名]";
   const systemPlaceholder = knowledge.placeholderMapping.csvToSystem[csvPlaceholder];
   // "[company_name]"
   ```

4. **テンプレートキーの確認**
   ```typescript
   const availableTemplates = knowledge.templateKeys.lotteryTypes
     .filter(t => !t.note) // 未実装を除外
     .map(t => t.key);
   ```

## 更新履歴

- **v1.0.0** (2025-01-27): 初版作成
  - CSVファイル `応募規約・当選DM 自動生成用マスターシート - シート1.csv` を基に作成

