
import { CampaignData, Platform, TemplateKey } from '../types';
import { getPlatformFromTemplate } from '../constants';

// 日本語プレースホルダー→英語IDのマッピング
const PLACEHOLDER_MAPPING: Record<string, string> = {
    '[キャンペーン名]': '[campaign_name]',
    '[会社名]': '[company_name]',
    '[賞品名1]': '[prize_1]',
    '[賞品名2]': '[prize_2]',
    '[賞品名3]': '[prize_3]',
    '[賞品名4]': '[prize_4]',
    '[賞品名5]': '[prize_5]',
    '[賞品名1数量]': '[prize_1_quantity]',
    '[賞品名2数量]': '[prize_2_quantity]',
    '[賞品名3数量]': '[prize_3_quantity]',
    '[賞品名4数量]': '[prize_4_quantity]',
    '[賞品名5数量]': '[prize_5_quantity]',
    '[応募期間開始]': '[start_date]',
    '[応募期間終了]': '[end_date]',
    '[フォームURL]': '[form_url]',
    '[フォーム入力締切日]': '[form_deadline]',
    '[賞品発送日]': '[shipping_date]',
    '[DM送付日]': '[dm_send_date]',
    '[合計人数]': '[total_winners]',
    '[プライバシーポリシーURL]': '[privacy_policy_url]',
    '[Xアカウント名]': '[x_name]',
    '[XアカウントID]': '[x_id]',
    '[XアカウントURL]': '[x_url]',
    '[IGアカウント名]': '[ig_name]',
    '[IGアカウントID]': '[ig_id]',
    '[IGアカウントURL]': '[ig_url]',
    '[TikTokアカウント名]': '[tiktok_name]',
    '[TikTokアカウントID]': '[tiktok_id]',
    '[TikTokアカウントURL]': '[tiktok_url]',
    '[お問い合わせメールアドレス]': '[contact_email]',
    '[フォーム注意書き]': '[form_note]',
    '[応募方法_STEP2]': '[step_2]',
    '[応募方法_STEP3]': '[step_3]',
    '[応募方法_STEP4]': '[step_4]',
    '[応募方法_STEP5]': '[step_5]',
    '[当選率アップ文言]': '[win_rate_up_text]',
    '[問い合わせ期間開始]': '[contact_period_start]',
    '[問い合わせ期間終了]': '[contact_period_end]',
};

// Markdown記号を削除してWordに貼り付け可能な形式に変換
const removeMarkdown = (text: string): string => {
    let cleaned = text;
    
    // 見出し記号を削除（#、##、###）
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
    
    // リスト記号を削除（- または *）
    cleaned = cleaned.replace(/^[-*]\s+/gm, '');
    
    // 太字記号を削除（**text**）
    cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1');
    
    // 水平線を削除（---）
    cleaned = cleaned.replace(/^---+$/gm, '');
    
    // コードブロック記号を削除（```）
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
    
    // インラインコードを削除（`text`）
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
    
    // 余分な空行を整理（3行以上連続する空行を2行に）
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned.trim();
};

// 日本語プレースホルダーを英語IDに変換
const convertJapanesePlaceholders = (template: string): string => {
    let converted = template;
    Object.entries(PLACEHOLDER_MAPPING).forEach(([japanese, english]) => {
        converted = converted.replace(new RegExp(japanese.replace(/[\[\]]/g, '\\$&'), 'g'), english);
    });
    return converted;
};

// 曜日を取得する関数
const getWeekday = (date: Date): string => {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return weekdays[date.getDay()];
};

// YYYY-MM-DD形式の日付文字列をDateオブジェクトに変換（タイムゾーン問題を回避）
const parseDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

// 日付と時間を結合して表示形式に変換（曜日を含む）
const formatDateTime = (
    date: string,
    hour: string = '',
    minute: string = '',
    forceTime: boolean = false,
    defaultHour: string = '00',
    defaultMinute: string = '00'
): string => {
    if (!date) return '';
    const dateObj = parseDate(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const weekday = getWeekday(dateObj);

    const hasHour = hour !== undefined && hour !== null && hour !== '';
    const hasMinute = minute !== undefined && minute !== null && minute !== '';

    // forceTimeが指定されている場合はデフォルト値で補完して必ず時間を表示
    if (forceTime || (hasHour && hasMinute)) {
        const formattedHour = (hasHour ? hour : defaultHour).padStart(2, '0');
        const formattedMinute = (hasMinute ? minute : defaultMinute).padStart(2, '0');
        return `${year}年${month}月${day}日（${weekday}）${formattedHour}:${formattedMinute}`;
    }
    return `${year}年${month}月${day}日（${weekday}）`;
};

// 日付のみを表示形式に変換（曜日を含む）
const formatDate = (date: string): string => {
    if (!date) return '';
    const dateObj = parseDate(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const weekday = getWeekday(dateObj);
    return `${year}年${month}月${day}日（${weekday}）`;
};

// 英語IDのプレースホルダーを実際の値に置換
const replacePlaceholders = (template: string, data: CampaignData): string => {
    let processed = template;

    // 日付と時間を結合したフィールドを先に処理
    // start_date + start_time_hour + start_time_minute → start_date
    // 応募期間は常に時間を表示（時間が入力されていない場合は00:00をデフォルトとして使用）
    if (data.start_date) {
        const formatted = formatDateTime(
            data.start_date,
            data.start_time_hour,
            data.start_time_minute,
            true,  // forceTimeをtrueにして常に時間を表示
            '00',  // デフォルト時
            '00'   // デフォルト分
        );
        processed = processed.replace(/\[start_date\]/g, formatted);
    }

    // end_date + end_time_hour + end_time_minute → end_date
    // 応募期間は常に時間を表示（時間が入力されていない場合は23:59をデフォルトとして使用）
    if (data.end_date) {
        const formatted = formatDateTime(
            data.end_date,
            data.end_time_hour,
            data.end_time_minute,
            true,  // forceTimeをtrueにして常に時間を表示
            '23',  // デフォルト時
            '59'   // デフォルト分
        );
        processed = processed.replace(/\[end_date\]/g, formatted);
    }

    // form_deadline_date + form_deadline_hour + form_deadline_minute → form_deadline
    if (data.form_deadline_date) {
        const formatted = formatDateTime(
            data.form_deadline_date,
            data.form_deadline_hour,
            data.form_deadline_minute,
            true,
            '23',
            '59'
        );
        processed = processed.replace(/\[form_deadline\]/g, formatted);
    }

    // 当選DM送付予定日（年月旬形式）
    if (data.dm_send_year && data.dm_send_month && data.dm_send_period) {
        // dm_send_yearが2桁の場合は20を前に付ける
        const year = data.dm_send_year.length === 2 ? `20${data.dm_send_year}` : data.dm_send_year;
        const formatted = `${year}年${data.dm_send_month}月${data.dm_send_period}`;
        processed = processed.replace(/\[dm_send_date\]/g, formatted);
    }

    // 賞品発送予定日（年月旬形式）
    if (data.shipping_year && data.shipping_month && data.shipping_period) {
        // shipping_yearが2桁の場合は20を前に付ける
        const year = data.shipping_year.length === 2 ? `20${data.shipping_year}` : data.shipping_year;
        const formatted = `${year}年${data.shipping_month}月${data.shipping_period}`;
        processed = processed.replace(/\[shipping_date\]/g, formatted);
    }

    // 問い合わせ期間開始（日付のみ）
    if (data.contact_period_start_date) {
        const formatted = formatDate(data.contact_period_start_date);
        processed = processed.replace(/\[contact_period_start\]/g, formatted);
    }

    // 問い合わせ期間終了（日付のみ）
    if (data.contact_period_end_date) {
        const formatted = formatDate(data.contact_period_end_date);
        processed = processed.replace(/\[contact_period_end\]/g, formatted);
    }

    // 一般置換（すべての[key]フィールド、ただし上記で処理済みのものは除く）
    Object.keys(data).forEach(key => {
        // 日付・時間関連のフィールドはスキップ
        if (key.includes('_hour') || key.includes('_minute') || 
            key === 'start_date' || key === 'end_date' || 
            key === 'form_deadline_date' || 
            key === 'dm_send_year' || key === 'dm_send_month' || key === 'dm_send_period' ||
            key === 'shipping_year' || key === 'shipping_month' || key === 'shipping_period' ||
            key === 'contact_period_start_date' || key === 'contact_period_end_date') {
            return;
        }
        const regex = new RegExp(`\\[${key}\\]`, 'g');
        processed = processed.replace(regex, data[key] || '');
    });

    return processed;
};

// 賞品リストの準備（カンマ区切り）
const preparePrizeList = (data: CampaignData): string => {
    return [
        data.prize_1,
        data.prize_2,
        data.prize_3,
        data.prize_4,
        data.prize_5
    ].filter(p => {
        const val = p ? p.trim() : '';
        return val && val !== '（不要なら空白）' && val !== '(不要なら空白)';
    }).join('、');
};

// 動的ステップ行の処理（日本語プレースホルダー変換前に実行）
const processStepLines = (template: string, data: CampaignData): string => {
    let processed = template;
    const steps = [
        { tag: '\\[応募方法_STEP3\\]', content: data.step_3, num: 3 },
        { tag: '\\[応募方法_STEP4\\]', content: data.step_4, num: 4 },
        { tag: '\\[応募方法_STEP5\\]', content: data.step_5, num: 5 },
    ];

    steps.forEach(step => {
        if (step.content && step.content.trim()) {
            // テンプレートに既に「**STEP3：**」が含まれているため、STEP番号は付けずに内容だけを置換
            processed = processed.replace(new RegExp(step.tag, 'g'), step.content);
        } else {
            // タグを含む行全体を削除
            const lineToRemove = new RegExp(`.*${step.tag}.*\\n?`, 'g');
            processed = processed.replace(lineToRemove, '');
        }
    });

    return processed;
};

// 動的賞品行の処理（DM用・同梱レター用、日本語プレースホルダー変換前に実行）
const processPrizeLines = (template: string, data: CampaignData, includeQuantity: boolean = false): string => {
    let processed = template;
    const prizeLines = [
        { tag: '\\[賞品名1\\]', content: data.prize_1, quantity: data.prize_1_quantity || '' },
        { tag: '\\[賞品名2\\]', content: data.prize_2, quantity: data.prize_2_quantity || '' },
        { tag: '\\[賞品名3\\]', content: data.prize_3, quantity: data.prize_3_quantity || '' },
        { tag: '\\[賞品名4\\]', content: data.prize_4, quantity: data.prize_4_quantity || '' },
        { tag: '\\[賞品名5\\]', content: data.prize_5, quantity: data.prize_5_quantity || '' },
    ];

    prizeLines.forEach(line => {
        const val = line.content ? line.content.trim() : '';
        if (val && val !== '（不要なら空白）' && val !== '(不要なら空白)') {
            let replacement = val;
            if (includeQuantity && line.quantity && line.quantity.trim()) {
                // 「・賞品名　数量」の形式
                replacement = `${val}　${line.quantity.trim()}`;
            }
            processed = processed.replace(new RegExp(line.tag, 'g'), replacement);
        } else {
            // タグを含む行全体を削除
            const lineToRemove = new RegExp(`.*${line.tag}.*\\n?`, 'g');
            processed = processed.replace(lineToRemove, '');
        }
    });

    return processed;
};

// 賞品リスト表示の処理（規約用、箇条書き形式）
const processPrizeListDisplay = (template: string, data: CampaignData, templateKey?: TemplateKey): string => {
    let processed = template;
    const prizes = [
        { tag: '\\[賞品名1\\]', quantityTag: '\\[賞品名1数量\\]', content: data.prize_1, quantity: data.prize_1_quantity },
        { tag: '\\[賞品名2\\]', quantityTag: '\\[賞品名2数量\\]', content: data.prize_2, quantity: data.prize_2_quantity },
        { tag: '\\[賞品名3\\]', quantityTag: '\\[賞品名3数量\\]', content: data.prize_3, quantity: data.prize_3_quantity },
        { tag: '\\[賞品名4\\]', quantityTag: '\\[賞品名4数量\\]', content: data.prize_4, quantity: data.prize_4_quantity },
        { tag: '\\[賞品名5\\]', quantityTag: '\\[賞品名5数量\\]', content: data.prize_5, quantity: data.prize_5_quantity },
    ];

    // 有効な賞品の数をカウント
    const validPrizes = prizes.filter(prize => {
        const val = prize.content ? prize.content.trim() : '';
        return val && val !== '（不要なら空白）' && val !== '(不要なら空白)';
    });
    const prizeCount = validPrizes.length;
    
    // 花王テンプレート（X/花王、IG/花王）の場合、商品が複数ある時の特別な形式を適用
    const isKaoTemplate = templateKey === 'X/花王' || templateKey === 'IG/花王';
    
    prizes.forEach(prize => {
        const val = prize.content ? prize.content.trim() : '';
        if (val && val !== '（不要なら空白）' && val !== '(不要なら空白)') {
            // 賞品名を置換
            processed = processed.replace(new RegExp(prize.tag, 'g'), val);
            // 数量を置換（数量がある場合のみ）
            const quantityVal = prize.quantity ? prize.quantity.trim() : '';
            if (quantityVal && quantityVal !== '（不要なら空白）' && quantityVal !== '(不要なら空白)') {
                processed = processed.replace(new RegExp(prize.quantityTag, 'g'), quantityVal);
            } else {
                // 数量がない場合は数量タグを削除
                processed = processed.replace(new RegExp(prize.quantityTag, 'g'), '');
            }
        } else {
            // 空の賞品の行全体を削除（・[賞品名X][賞品名X数量]の行）
            const lineToRemove = new RegExp(`・\\s*${prize.tag}\\s*${prize.quantityTag}\\s*\\n?`, 'g');
            processed = processed.replace(lineToRemove, '');
        }
    });
    
    // 花王テンプレートで商品が複数ある場合の処理（商品リスト処理後）
    if (isKaoTemplate && prizeCount > 1) {
        // [KAO_PRIZE_FORMAT]が存在する場合のみ処理
        if (processed.includes('[KAO_PRIZE_FORMAT]')) {
            // 「応募者の中から抽選で合計[合計人数]名様に以下商品をプレゼント」を「当選者[合計人数]名様に、以下の商品セットをプレゼントいたします。」に置換
            processed = processed.replace(
                /応募者の中から抽選で合計\[合計人数\]名様に以下商品をプレゼント/g,
                '当選者[合計人数]名様に、以下の商品セットをプレゼントいたします。'
            );
            // [KAO_PRIZE_FORMAT]を「セット内容」に置換
            processed = processed.replace(/\[KAO_PRIZE_FORMAT\]/g, 'セット内容');
        }
        
        // 商品リストの最後に「のセット」を追加（必ず実行）
        // 「### プレゼントの内容」セクションから「### 応募方法」セクションまでの範囲で商品行を探す
        const lines = processed.split('\n');
        let prizeSectionStart = -1;
        let prizeSectionEnd = -1;
        
        // 「### プレゼントの内容」セクションの開始位置を探す
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('### プレゼントの内容') || lines[i].includes('プレゼントの内容')) {
                prizeSectionStart = i;
                break;
            }
        }
        
        // 「### 応募方法」セクションの開始位置を探す（プレゼント内容セクションの終了位置）
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('### 応募方法') || lines[i].includes('応募方法')) {
                prizeSectionEnd = i;
                break;
            }
        }
        
        // プレゼント内容セクション内で最後の商品行（・で始まる行）を探す
        let lastPrizeLineIndex = -1;
        const searchStart = prizeSectionStart >= 0 ? prizeSectionStart : 0;
        const searchEnd = prizeSectionEnd >= 0 ? prizeSectionEnd : lines.length;
        
        for (let i = searchEnd - 1; i >= searchStart; i--) {
            const trimmedLine = lines[i].trim();
            // 「・」で始まり、「セット内容」や「のセット」ではない行を探す
            if (trimmedLine.startsWith('・') && !trimmedLine.includes('セット内容') && trimmedLine !== 'のセット') {
                lastPrizeLineIndex = i;
                break;
            }
        }
        
        // 「のセット」がまだ追加されていない場合のみ追加
        if (lastPrizeLineIndex >= 0) {
            // 次の行をチェックして「のセット」が既にあるか確認
            const nextLineIndex = lastPrizeLineIndex + 1;
            const nextLine = nextLineIndex < lines.length ? lines[nextLineIndex].trim() : '';
            if (nextLine !== 'のセット') {
                lines.splice(lastPrizeLineIndex + 1, 0, 'のセット');
                processed = lines.join('\n');
            }
        }
    } else if (processed.includes('[KAO_PRIZE_FORMAT]')) {
        // 花王テンプレートでも商品が1つ以下の場合、または[KAO_PRIZE_FORMAT]が残っている場合は削除
        processed = processed.replace(/\[KAO_PRIZE_FORMAT\]\n?/g, '');
    }

    // 賞品の数に応じて「を合計」または「のセットを合計」に変更
    if (prizeCount === 1) {
        // 賞品が1つの場合: 「を合計[合計人数]名様にプレゼント」
        // 「のセットを合計」がある場合は「を合計」に変更
        processed = processed.replace(/のセットを合計\[合計人数\]名様にプレゼント/g, 'を合計[合計人数]名様にプレゼント');
        // IG_Xの場合の「（当選者数は X・Instagram の合計）のセットを合計」も処理
        processed = processed.replace(/（当選者数は X・Instagram の合計）のセットを合計\[合計人数\]名様にプレゼント/g, '（当選者数は X・Instagram の合計）を合計[合計人数]名様にプレゼント');
    } else if (prizeCount > 1) {
        // 賞品が複数の場合: 「のセットを合計[合計人数]名様にプレゼント」
        // 通常の「を合計」を「のセットを合計」に変更（既に「のセット」がある場合はスキップ）
        if (!processed.includes('のセットを合計[合計人数]名様にプレゼント')) {
            processed = processed.replace(/を合計\[合計人数\]名様にプレゼント/g, 'のセットを合計[合計人数]名様にプレゼント');
        }
        // IG_Xの場合の「（当選者数は X・Instagram の合計）を合計」も処理
        processed = processed.replace(/（当選者数は X・Instagram の合計）を合計\[合計人数\]名様にプレゼント/g, '（当選者数は X・Instagram の合計）のセットを合計[合計人数]名様にプレゼント');
    }

    return processed;
};

// 応募規約生成
export const generateGuidelines = (templateContent: string, data: CampaignData, templateKey?: TemplateKey, contactMethod: 'DM' | 'email' = 'DM'): string => {
    let processed = templateContent;
    
    // 賞品リスト表示の処理（日本語プレースホルダー変換前に実行）
    processed = processPrizeListDisplay(processed, data, templateKey);
    
    // ステップ行の処理（日本語プレースホルダー変換前に実行）
    processed = processStepLines(processed, data);
    
    // 当選率アップ文言の処理（空の場合は行を削除）
    if (data.win_rate_up_text && data.win_rate_up_text.trim()) {
        processed = processed.replace(/\[当選率アップ文言\]/g, data.win_rate_up_text.trim());
    } else {
        processed = processed.replace(/.*\[当選率アップ文言\].*\n?/g, '');
    }
    
    // 問い合わせ期間の処理（空の場合は該当箇所を削除）
    // この処理は後でreplacePlaceholdersで実行されるため、ここでは削除のみ
    if (!data.contact_period_end_date) {
        // 問い合わせ期間終了が空の場合は「開設期間：[問い合わせ期間終了]まで」の行を削除
        processed = processed.replace(/開設期間：\[問い合わせ期間終了\]まで\s*\n?/g, '');
    }
    if (!data.contact_period_start_date || !data.contact_period_end_date) {
        // 問い合わせ期間開始または終了が空の場合は花王テンプレートの行を削除
        processed = processed.replace(/\[問い合わせ期間開始\]～\[問い合わせ期間終了\]（土・日・祝日を除く）\s*\n?/g, '');
    }
    
    // 「X / 即時」テンプレートの場合、DM送付時期の記載を削除
    if (templateKey === 'X/即時') {
        // DM送付時期を含む行全体を、賞品発送時期のみの記載に置換
        processed = processed.replace(
            /※当選をお知らせするXからのダイレクトメッセージの送付は\[DM送付日\]以降、賞品の発送は\[賞品発送日\]以降を予定しておりますが、諸事情により遅れる場合がございます。/g,
            '※賞品の発送は[賞品発送日]以降を予定しておりますが、諸事情により遅れる場合がございます。'
        );
    }
    
    // お問い合わせ方法の処理（DM/メール）
    if (contactMethod === 'email') {
        // DM用の記載をメール用に置換
        const platform = templateKey ? getPlatformFromTemplate(templateKey) : null;
        const isDaiichiSankyoTemplate = templateKey === 'X/第一三共' || templateKey === 'IG/第一三共';
        const isKaoTemplate = templateKey === 'X/花王' || templateKey === 'IG/花王';
        
        if (platform) {
            // 第一三共テンプレート用の変換（[Xアカウント名]「[XアカウントID]」形式）
            if (isDaiichiSankyoTemplate) {
                if (platform === 'X') {
                    processed = processed.replace(
                        /\[Xアカウント名\]「\[XアカウントID\]」へダイレクトメッセージでお問い合わせください。/g,
                        '[お問い合わせメールアドレス]へメールでお問い合わせください。'
                    );
                } else if (platform === 'IG') {
                    processed = processed.replace(
                        /\[IGアカウント名\]「\[IGアカウントID\]」へダイレクトメッセージでお問い合わせください。/g,
                        '[お問い合わせメールアドレス]へメールでお問い合わせください。'
                    );
                }
            }
            
            // 花王テンプレート用の変換（[Xアカウント名]「[XアカウントID]」形式）
            if (isKaoTemplate) {
                if (platform === 'X') {
                    processed = processed.replace(
                        /\[Xアカウント名\]「\[XアカウントID\]」へダイレクトメッセージでお問い合わせください。/g,
                        '[お問い合わせメールアドレス]へメールでお問い合わせください。'
                    );
                } else if (platform === 'IG') {
                    processed = processed.replace(
                        /\[IGアカウント名\]「\[IGアカウントID\]」へダイレクトメッセージでお問い合わせください。/g,
                        '[お問い合わせメールアドレス]へメールでお問い合わせください。'
                    );
                }
            }
            
            // 各プラットフォームのDM用記載をメール用に置換（通常テンプレート用）
            if (platform === 'X' || platform === 'IG_X') {
                processed = processed.replace(
                    /\[キャンペーン名\]公式Xアカウント「\[XアカウントID\]」へダイレクトメッセージでお問い合わせください。/g,
                    '[お問い合わせメールアドレス]へメールでお問い合わせください。'
                );
            }
            if (platform === 'IG' || platform === 'IG_X') {
                processed = processed.replace(
                    /\[キャンペーン名\]公式Instagramアカウント「\[IGアカウントID\]」へダイレクトメッセージでお問い合わせください。/g,
                    '[お問い合わせメールアドレス]へメールでお問い合わせください。'
                );
            }
            if (platform === 'TikTok') {
                processed = processed.replace(
                    /\[キャンペーン名\]公式TikTokアカウント「\[TikTokアカウントID\]」へダイレクトメッセージでお問い合わせください。/g,
                    '[お問い合わせメールアドレス]へメールでお問い合わせください。'
                );
            }
            // IG_Xの場合の複数アカウント記載も処理
            processed = processed.replace(
                /本キャンペーンに関するお問い合わせは、各公式アカウントへダイレクトメッセージにてお問い合わせください。\s*\n\s*\*\*\[キャンペーン名\]キャンペーン事務局\*\*\s*\n\s*-\s*\[キャンペーン名\]公式X（\[XアカウントID\]）\s*\n\s*-\s*\[キャンペーン名\]公式Instagram（\[IGアカウントID\]）/g,
                '[キャンペーン名]キャンペーン事務局\n\n[お問い合わせメールアドレス]へメールでお問い合わせください。'
            );
            // IG_Xの場合の別パターン（改行が異なる場合）
            processed = processed.replace(
                /本キャンペーンに関するお問い合わせは、各公式アカウントへダイレクトメッセージにてお問い合わせください。[\s\S]*?\*\*\[キャンペーン名\]キャンペーン事務局\*\*[\s\S]*?-\s*\[キャンペーン名\]公式X（\[XアカウントID\]）[\s\S]*?-\s*\[キャンペーン名\]公式Instagram（\[IGアカウントID\]）/g,
                '[キャンペーン名]キャンペーン事務局\n\n[お問い合わせメールアドレス]へメールでお問い合わせください。'
            );
        }
    }
    
    // 日本語プレースホルダーを英語IDに変換
    processed = convertJapanesePlaceholders(processed);
    
    // プレースホルダー置換
    processed = replacePlaceholders(processed, data);
    
    // Markdown記号を削除してWordに貼り付け可能な形式に変換
    processed = removeMarkdown(processed);
    
    // 第一三共テンプレート（X/第一三共、IG/第一三共）の場合、特定の見出しの次の空行を削除
    const isDaiichiSankyoTemplate = templateKey === 'X/第一三共' || templateKey === 'IG/第一三共';
    if (isDaiichiSankyoTemplate) {
        // 指定された見出しの次の行の空行を削除
        const headingsToClean = [
            '応募規約',
            '１．本キャンペーンの概要',
            '応募期間',
            '賞品',
            '当選人数',
            '対象アカウント',
            '応募資格',
            '応募方法',
            '当選発表',
            '応募に関する注意事項',
            '禁止事項',
            '当選に関する注意事項',
            '免責事項',
            '準拠法',
            '3．個人情報の取り扱いについて',
            'お問い合わせ'
        ];
        
        headingsToClean.forEach(heading => {
            // Markdown削除後、見出しの後に続く空行を削除
            // 「見出し\n\n内容」を「見出し\n内容」に変換
            const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            processed = processed.replace(new RegExp(`(${escapedHeading})\\n\\n`, 'g'), '$1\n');
        });
        
        // 「当選人数」の前の行を1行空行に統一
        // 行単位で処理して、より確実に空行を調整
        const lines = processed.split('\n');
        let tosenNinzuIndex = lines.findIndex(line => line.trim() === '当選人数');
        if (tosenNinzuIndex > 0) {
            // 「当選人数」の行が見つかった場合
            let blankLineCount = 0;
            // 前の行から空行をカウント
            for (let i = tosenNinzuIndex - 1; i >= 0; i--) {
                if (lines[i].trim() === '') {
                    blankLineCount++;
                } else {
                    break;
                }
            }
            
            // 空行が1行でない場合、調整
            if (blankLineCount !== 1) {
                // 既存の空行をすべて削除
                const startIndex = tosenNinzuIndex - blankLineCount;
                for (let i = 0; i < blankLineCount; i++) {
                    lines.splice(startIndex, 1);
                }
                // 1行の空行を追加
                tosenNinzuIndex = startIndex;
                lines.splice(tosenNinzuIndex, 0, '');
                processed = lines.join('\n');
            }
        }
    }
    
    // 花王テンプレート（X/花王、IG/花王）の場合、特定の見出しの次の空行を削除
    if (templateKey === 'X/花王' || templateKey === 'IG/花王') {
        // 指定された見出しの次の行の空行を削除
        const headingsToClean = [
            '応募規約',
            '１．本キャンペーンの概要',
            '応募期間',
            'プレゼントの内容',
            '応募方法',
            '当選発表',
            '応募に関する注意事項',
            '禁止事項',
            '当選に関する注意事項',
            '本キャンペーン及び本応募規約の変更等',
            '当社の責任',
            'その他',
            '３．個人情報の取り扱いについて',
            '４．本キャンペーンについてのお問合わせ'
        ];
        
        headingsToClean.forEach(heading => {
            // Markdown削除後、見出しの後に続く空行を削除
            // 「見出し\n\n内容」を「見出し\n内容」に変換
            const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            processed = processed.replace(new RegExp(`(${escapedHeading})\\n\\n`, 'g'), '$1\n');
        });
        
        // 「応募方法」の前の行を1行空行に統一
        const lines = processed.split('\n');
        let oboHouhouIndex = lines.findIndex(line => line.trim() === '応募方法');
        if (oboHouhouIndex > 0) {
            // 「応募方法」の行が見つかった場合
            let blankLineCount = 0;
            // 前の行から空行をカウント
            for (let i = oboHouhouIndex - 1; i >= 0; i--) {
                if (lines[i].trim() === '') {
                    blankLineCount++;
                } else {
                    break;
                }
            }
            
            // 空行が1行でない場合、調整
            if (blankLineCount !== 1) {
                // 既存の空行をすべて削除
                const startIndex = oboHouhouIndex - blankLineCount;
                for (let i = 0; i < blankLineCount; i++) {
                    lines.splice(startIndex, 1);
                }
                // 1行の空行を追加
                oboHouhouIndex = startIndex;
                lines.splice(oboHouhouIndex, 0, '');
                processed = lines.join('\n');
            }
        }
    }

    return processed.trim();
};

// 当選DM生成
export const generateDM = (templateContent: string, data: CampaignData, platform?: Platform): string => {
    let processed = templateContent;

    // 賞品行の処理（数量を含む、日本語プレースホルダー変換前に実行）
    processed = processPrizeLines(processed, data, true);
    
    // Instagram以外の媒体の場合、「※URLが表示されていない場合は、上部に表示されているプレビューをタップしてください。」の文言を削除
    if (platform && platform !== 'IG') {
        processed = processed.replace(
            /※URLが表示されていない場合は、上部に表示されているプレビューをタップしてください。\s*\n?/g,
            ''
        );
    }
    
    // 日本語プレースホルダーを英語IDに変換
    processed = convertJapanesePlaceholders(processed);
    
    // プレースホルダー置換
    processed = replacePlaceholders(processed, data);
    
    // Markdown記号を削除してWordに貼り付け可能な形式に変換
    processed = removeMarkdown(processed);
    
    return processed.trim();
};

// 当選者用フォーム生成
export const generateForm = (templateContent: string, data: CampaignData, platform: Platform): string => {
    let processed = templateContent;
    
    // プラットフォーム名のマッピング
    const platformNames: Record<Platform, string> = {
        'X': 'X',
        'IG': 'Instagram',
        'TikTok': 'TikTok',
        'IG_X': 'X' // IG_Xの場合はXを使用
    };
    const platformName = platformNames[platform] || 'X';
    
    // フォーム注意書きの処理（日本語プレースホルダー変換前に実行）
    if (data.form_note && data.form_note.trim()) {
        processed = processed.replace(/\[フォーム注意書き\]/g, data.form_note.trim());
    } else {
        // フォーム注意書きが空の場合は行全体を削除
        processed = processed.replace(/\[フォーム注意書き\]\s*\n?/g, '');
    }
    
    // 賞品行の処理（数量付き、日本語プレースホルダー変換前に実行）
    const prizeLines = [
        { tag: '\\[賞品名1\\]\\[賞品名1数量\\]', prize: data.prize_1, quantity: data.prize_1_quantity || '' },
        { tag: '\\[賞品名2\\]\\[賞品名2数量\\]', prize: data.prize_2, quantity: data.prize_2_quantity || '' },
        { tag: '\\[賞品名3\\]\\[賞品名3数量\\]', prize: data.prize_3, quantity: data.prize_3_quantity || '' },
        { tag: '\\[賞品名4\\]\\[賞品名4数量\\]', prize: data.prize_4, quantity: data.prize_4_quantity || '' },
        { tag: '\\[賞品名5\\]\\[賞品名5数量\\]', prize: data.prize_5, quantity: data.prize_5_quantity || '' },
    ];

    prizeLines.forEach(line => {
        const prizeVal = line.prize ? line.prize.trim() : '';
        if (prizeVal && prizeVal !== '（不要なら空白）' && prizeVal !== '(不要なら空白)') {
            const quantity = line.quantity ? line.quantity.trim() : '';
            // 「・賞品名　数量」の形式
            const replacement = quantity ? `${prizeVal}　${quantity}` : prizeVal;
            processed = processed.replace(new RegExp(line.tag, 'g'), replacement);
        } else {
            // タグを含む行全体を削除
            const lineToRemove = new RegExp(`.*${line.tag}.*\\n?`, 'g');
            processed = processed.replace(lineToRemove, '');
        }
    });
    
    // 日本語プレースホルダーを英語IDに変換
    processed = convertJapanesePlaceholders(processed);
    
    // プレースホルダー置換
    processed = replacePlaceholders(processed, data);
    
    // Markdown記号を削除してWordに貼り付け可能な形式に変換
    processed = removeMarkdown(processed);
    
    return processed.trim();
};

// 同梱レター生成
export const generateEnclosedLetter = (templateContent: string, data: CampaignData, platform: Platform): string => {
    let processed = templateContent;
    
    // 賞品行の処理（数量を含む、日本語プレースホルダー変換前に実行）
    processed = processPrizeLines(processed, data, true);
    
    // 日本語プレースホルダーを英語IDに変換
    processed = convertJapanesePlaceholders(processed);
    
    // プレースホルダー置換
    processed = replacePlaceholders(processed, data);
    
    // Markdown記号を削除してWordに貼り付け可能な形式に変換
    processed = removeMarkdown(processed);

    return processed.trim();
};
