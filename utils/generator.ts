
import { CampaignData, Platform } from '../types';

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
    '[応募方法_STEP2]': '[step_2]',
    '[応募方法_STEP3]': '[step_3]',
    '[応募方法_STEP4]': '[step_4]',
    '[応募方法_STEP5]': '[step_5]',
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
const formatDateTime = (date: string, hour: string = '', minute: string = ''): string => {
    if (!date) return '';
    const dateObj = parseDate(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const weekday = getWeekday(dateObj);
    
    // hourとminuteが存在し、空文字列でない場合に時間を表示
    if (hour !== undefined && hour !== null && hour !== '' && 
        minute !== undefined && minute !== null && minute !== '') {
        const formattedHour = hour.padStart(2, '0');
        const formattedMinute = minute.padStart(2, '0');
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
    if (data.start_date) {
        const formatted = formatDateTime(
            data.start_date,
            data.start_time_hour,
            data.start_time_minute
        );
        processed = processed.replace(/\[start_date\]/g, formatted);
    }

    // end_date + end_time_hour + end_time_minute → end_date
    if (data.end_date) {
        const formatted = formatDateTime(
            data.end_date,
            data.end_time_hour,
            data.end_time_minute
        );
        processed = processed.replace(/\[end_date\]/g, formatted);
    }

    // form_deadline_date + form_deadline_hour + form_deadline_minute → form_deadline
    if (data.form_deadline_date) {
        const formatted = formatDateTime(
            data.form_deadline_date,
            data.form_deadline_hour,
            data.form_deadline_minute
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

    // 一般置換（すべての[key]フィールド、ただし上記で処理済みのものは除く）
    Object.keys(data).forEach(key => {
        // 日付・時間関連のフィールドはスキップ
        if (key.includes('_hour') || key.includes('_minute') || 
            key === 'start_date' || key === 'end_date' || 
            key === 'form_deadline_date' || 
            key === 'dm_send_year' || key === 'dm_send_month' || key === 'dm_send_period' ||
            key === 'shipping_year' || key === 'shipping_month' || key === 'shipping_period') {
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
            processed = processed.replace(new RegExp(step.tag, 'g'), `STEP${step.num}：${step.content}`);
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

// 賞品リスト表示の処理（規約用）
const processPrizeListDisplay = (template: string, data: CampaignData): string => {
    const prizeList = preparePrizeList(data);
    // 日本語プレースホルダーのまま置換
    return template.replace(/\[賞品名1\] \[賞品名2\] \[賞品名3\] \[賞品名4\] \[賞品名5\]/g, prizeList);
};

// 応募規約生成
export const generateGuidelines = (templateContent: string, data: CampaignData): string => {
    let processed = templateContent;
    
    // 賞品リスト表示の処理（日本語プレースホルダー変換前に実行）
    processed = processPrizeListDisplay(processed, data);
    
    // ステップ行の処理（日本語プレースホルダー変換前に実行）
    processed = processStepLines(processed, data);
    
    // 日本語プレースホルダーを英語IDに変換
    processed = convertJapanesePlaceholders(processed);
    
    // プレースホルダー置換
    processed = replacePlaceholders(processed, data);
    
    // Markdown記号を削除してWordに貼り付け可能な形式に変換
    processed = removeMarkdown(processed);

    return processed.trim();
};

// 当選DM生成
export const generateDM = (templateContent: string, data: CampaignData): string => {
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
    
    // プラットフォーム名を置換（Instagramのアカウント名 → Xのアカウント名 など）
    processed = processed.replace(/Instagramのアカウント名/g, `${platformName}のアカウント名`);
    
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
