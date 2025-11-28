
import React, { useState, useMemo } from 'react';
import { ClipboardCopy, Sparkles, CheckCircle2, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { TEMPLATES, FORM_FIELDS, DM_TEMPLATES, FORM_TEMPLATE, ENCLOSED_LETTER_TEMPLATES, getPlatformFromTemplate } from './constants';
import { generateGuidelines, generateDM, generateForm, generateEnclosedLetter } from './utils/generator';
import { TemplateKey, CampaignData } from './types';

const App: React.FC = () => {
    // Initialize state with default values from FORM_FIELDS
    const initialData = useMemo(() => {
        const defaults: CampaignData = {};
        FORM_FIELDS.forEach(field => {
            // defaultValueが存在する場合はそれを使用、存在しない場合は空文字列
            defaults[field.id] = field.defaultValue ?? '';
        });
        return defaults;
    }, []);

    const [formData, setFormData] = useState<CampaignData>(initialData);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>('X/事後抽選');
    const [tosOutput, setTosOutput] = useState('');
    const [dmOutput, setDmOutput] = useState('');
    const [formOutput, setFormOutput] = useState('');
    const [enclosedLetterOutput, setEnclosedLetterOutput] = useState('');
    const [copiedTos, setCopiedTos] = useState(false);
    const [copiedDm, setCopiedDm] = useState(false);
    const [copiedForm, setCopiedForm] = useState(false);
    const [copiedEnclosedLetter, setCopiedEnclosedLetter] = useState(false);

    const handleInputChange = (id: string, value: string) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleGenerate = () => {
        // プラットフォームを取得
        const platform = getPlatformFromTemplate(selectedTemplate);
        
        // 4形式を生成
        const tos = generateGuidelines(TEMPLATES[selectedTemplate].content, formData);
        const dm = generateDM(DM_TEMPLATES[platform === 'IG_X' ? 'X' : platform], formData);
        const form = generateForm(FORM_TEMPLATE, formData, platform);
        const enclosedLetter = generateEnclosedLetter(
            ENCLOSED_LETTER_TEMPLATES[platform === 'IG_X' ? 'X' : platform] || ENCLOSED_LETTER_TEMPLATES['X'],
            formData,
            platform
        );
        
        setTosOutput(tos);
        setDmOutput(dm);
        setFormOutput(form);
        setEnclosedLetterOutput(enclosedLetter);
    };

    const handleCopy = (text: string, type: 'tos' | 'dm' | 'form' | 'enclosedLetter') => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        switch (type) {
            case 'tos':
            setCopiedTos(true);
            setTimeout(() => setCopiedTos(false), 2000);
                break;
            case 'dm':
            setCopiedDm(true);
            setTimeout(() => setCopiedDm(false), 2000);
                break;
            case 'form':
                setCopiedForm(true);
                setTimeout(() => setCopiedForm(false), 2000);
                break;
            case 'enclosedLetter':
                setCopiedEnclosedLetter(true);
                setTimeout(() => setCopiedEnclosedLetter(false), 2000);
                break;
        }
    };

    const resetForm = () => {
        if (confirm('入力内容を初期値に戻しますか？')) {
            setFormData(initialData);
            setTosOutput('');
            setDmOutput('');
            setFormOutput('');
            setEnclosedLetterOutput('');
        }
    };

    const clearForm = () => {
        if (confirm('入力内容を全てクリアしますか？')) {
            // 全てのフィールドを空にする
            const emptyData: CampaignData = {};
            FORM_FIELDS.forEach(field => {
                emptyData[field.id] = '';
            });
            setFormData(emptyData);
            setTosOutput('');
            setDmOutput('');
            setFormOutput('');
            setEnclosedLetterOutput('');
        }
    };

    // Group fields for better UI organization
    const groupedFields = useMemo(() => {
        const groups = {
            basic: FORM_FIELDS.filter(f => f.group === 'basic'),
            schedule: FORM_FIELDS.filter(f => f.group === 'schedule'),
            prizes: FORM_FIELDS.filter(f => f.group === 'prizes'),
            steps: FORM_FIELDS.filter(f => f.group === 'steps'),
            social: FORM_FIELDS.filter(f => f.group === 'social'),
        };
        return groups;
    }, []);

    // 日付と時間を結合して表示形式に変換
    const formatDateTime = (date: string, hour: string = '', minute: string = ''): string => {
        if (!date) return '';
        const dateObj = new Date(date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        
        if (hour !== '' && minute !== '') {
            return `${year}/${month}/${day} ${hour}:${minute.padStart(2, '0')}`;
        }
        return `${year}/${month}/${day}`;
    };

    const renderFieldGroup = (title: string, fields: typeof FORM_FIELDS) => {
        // 日付と時間のフィールドをグループ化
        const dateTimeFields: { [key: string]: { date: string; hour: string; minute: string; label: string } } = {};
        const prizeFields: { [key: string]: { name: string; quantity: string; label: string } } = {};
        const regularFields: typeof FORM_FIELDS = [];

        fields.forEach(field => {
            if (field.id === 'start_date' || field.id === 'end_date' || field.id === 'form_deadline_date') {
                let baseId: string;
                if (field.id === 'form_deadline_date') {
                    // form_deadline_dateの場合は_dateを削除するだけ（form_deadline_hour/form_deadline_minute）
                    baseId = field.id.replace('_date', '');
                } else {
                    // start_dateとend_dateの場合は_dateを_timeに置換（start_time_hour/end_time_hour）
                    baseId = field.id.replace('_date', '_time');
                }
                dateTimeFields[baseId] = {
                    date: field.id,
                    hour: `${baseId}_hour`,
                    minute: `${baseId}_minute`,
                    label: field.label.replace('日', '')
                };
            } else if (field.id.startsWith('prize_') && !field.id.includes('_quantity')) {
                // 賞品名フィールド（数量フィールドは除外）
                const prizeNum = field.id.replace('prize_', '');
                prizeFields[prizeNum] = {
                    name: field.id,
                    quantity: `prize_${prizeNum}_quantity`,
                    label: field.label
                };
            } else if (!field.id.includes('_hour') && !field.id.includes('_minute') && 
                       !field.id.includes('_quantity') &&
                       field.id !== 'dm_send_year' && field.id !== 'dm_send_month' && field.id !== 'dm_send_period' &&
                       field.id !== 'shipping_year' && field.id !== 'shipping_month' && field.id !== 'shipping_period') {
                regularFields.push(field);
            }
        });

        return (
        <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 border-b border-gray-200 pb-1">
                {title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 日付と時間のフィールド */}
                    {Object.entries(dateTimeFields).map(([key, config]) => (
                        <div key={key} className="col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                {config.label}
                            </label>
                            <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <input
                                        type="date"
                                        id={config.date}
                                        value={formData[config.date] || ''}
                                        onChange={(e) => handleInputChange(config.date, e.target.value)}
                                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                    />
                                </div>
                                <div className="w-20">
                                    <select
                                        id={config.hour}
                                        value={formData[config.hour] || FORM_FIELDS.find(f => f.id === config.hour)?.defaultValue || '00'}
                                        onChange={(e) => handleInputChange(config.hour, e.target.value)}
                                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                    >
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <option key={i} value={String(i).padStart(2, '0')}>
                                                {String(i).padStart(2, '0')}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <span className="text-sm text-gray-600 pb-2">:</span>
                                <div className="w-20">
                                    <select
                                        id={config.minute}
                                        value={formData[config.minute] || FORM_FIELDS.find(f => f.id === config.minute)?.defaultValue || '00'}
                                        onChange={(e) => handleInputChange(config.minute, e.target.value)}
                                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                    >
                                        {Array.from({ length: 60 }, (_, i) => (
                                            <option key={i} value={String(i).padStart(2, '0')}>
                                                {String(i).padStart(2, '0')}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {/* 当選DM送付予定日（年月旬形式） */}
                    {fields.filter(f => f.id === 'dm_send_year').length > 0 && (
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                当選DM送付予定日
                            </label>
                            <div className="flex gap-2 items-center">
                                <span className="text-sm text-gray-600">20</span>
                                <div className="w-16">
                                    <select
                                        id="dm_send_year"
                                        value={formData.dm_send_year || FORM_FIELDS.find(f => f.id === 'dm_send_year')?.defaultValue || '24'}
                                        onChange={(e) => handleInputChange('dm_send_year', e.target.value)}
                                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                    >
                                        {Array.from({ length: 30 }, (_, i) => {
                                            const year = String(i).padStart(2, '0');
                                            return (
                                                <option key={year} value={year}>
                                                    {year}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <span className="text-sm text-gray-600">年</span>
                                <div className="w-20">
                                    <select
                                        id="dm_send_month"
                                        value={formData.dm_send_month || FORM_FIELDS.find(f => f.id === 'dm_send_month')?.defaultValue || '11'}
                                        onChange={(e) => handleInputChange('dm_send_month', e.target.value)}
                                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => {
                                            const month = String(i + 1);
                                            return (
                                                <option key={month} value={month}>
                                                    {month}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <span className="text-sm text-gray-600">月</span>
                                <div className="w-24">
                                    <select
                                        id="dm_send_period"
                                        value={formData.dm_send_period || FORM_FIELDS.find(f => f.id === 'dm_send_period')?.defaultValue || '上旬'}
                                        onChange={(e) => handleInputChange('dm_send_period', e.target.value)}
                                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                    >
                                        <option value="上旬">上旬</option>
                                        <option value="中旬">中旬</option>
                                        <option value="下旬">下旬</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* 賞品発送予定日（年月旬形式） */}
                    {fields.filter(f => f.id === 'shipping_year').length > 0 && (
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                賞品発送予定日
                            </label>
                            <div className="flex gap-2 items-center">
                                <span className="text-sm text-gray-600">20</span>
                                <div className="w-16">
                                    <select
                                        id="shipping_year"
                                        value={formData.shipping_year || FORM_FIELDS.find(f => f.id === 'shipping_year')?.defaultValue || '24'}
                                        onChange={(e) => handleInputChange('shipping_year', e.target.value)}
                                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                    >
                                        {Array.from({ length: 30 }, (_, i) => {
                                            const year = String(i).padStart(2, '0');
                                            return (
                                                <option key={year} value={year}>
                                                    {year}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <span className="text-sm text-gray-600">年</span>
                                <div className="w-20">
                                    <select
                                        id="shipping_month"
                                        value={formData.shipping_month || FORM_FIELDS.find(f => f.id === 'shipping_month')?.defaultValue || '12'}
                                        onChange={(e) => handleInputChange('shipping_month', e.target.value)}
                                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => {
                                            const month = i + 1;
                                            return (
                                                <option key={month} value={String(month)}>
                                                    {month}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <span className="text-sm text-gray-600">月</span>
                                <div className="w-24">
                                    <select
                                        id="shipping_period"
                                        value={formData.shipping_period || FORM_FIELDS.find(f => f.id === 'shipping_period')?.defaultValue || '上旬'}
                                        onChange={(e) => handleInputChange('shipping_period', e.target.value)}
                                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                    >
                                        <option value="上旬">上旬</option>
                                        <option value="中旬">中旬</option>
                                        <option value="下旬">下旬</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* 賞品フィールド（賞品名と数量を横並び） */}
                    {Object.entries(prizeFields).map(([prizeNum, config]) => (
                        <div key={prizeNum} className="col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                {config.label}
                            </label>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        id={config.name}
                                        value={formData[config.name] || ''}
                                        onChange={(e) => handleInputChange(config.name, e.target.value)}
                                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                        placeholder={FORM_FIELDS.find(f => f.id === config.name)?.placeholder}
                                    />
                                </div>
                                <div className="w-24">
                                    <input
                                        type="text"
                                        id={config.quantity}
                                        value={formData[config.quantity] || ''}
                                        onChange={(e) => handleInputChange(config.quantity, e.target.value)}
                                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                        placeholder={FORM_FIELDS.find(f => f.id === config.quantity)?.placeholder || '数量'}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {/* 通常のテキストフィールド */}
                    {regularFields.map((field) => (
                    <div key={field.id} className={field.group === 'prizes' || field.group === 'steps' ? 'col-span-1' : ''}>
                        <label htmlFor={field.id} className="block text-xs font-bold text-gray-700 mb-1">
                            {field.label}
                        </label>
                        <input
                            type="text"
                            id={field.id}
                            value={formData[field.id] || ''}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                            placeholder={field.placeholder}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                            <Sparkles size={20} />
                        </div>
                        <h1 className="text-lg font-bold text-gray-900">4形式一括生成ツール</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={clearForm} icon={<Trash2 size={14} />}>
                            クリア
                        </Button>
                        <Button variant="outline" size="sm" onClick={resetForm} icon={<RotateCcw size={14} />}>
                            リセット
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8">
                    {/* 1. キャンペーン情報の入力 */}
                        <Card title="1. キャンペーン情報の入力">
                            <div className="space-y-6">
                                {renderFieldGroup('基本情報', groupedFields.basic)}
                                {renderFieldGroup('日程', groupedFields.schedule)}
                                {renderFieldGroup('賞品', groupedFields.prizes)}
                                {renderFieldGroup('応募方法', groupedFields.steps)}
                                {renderFieldGroup('SNSアカウント', groupedFields.social)}
                            </div>
                        </Card>

                    {/* 2. 生成設定 */}
                            <Card title="2. 生成設定">
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="template" className="block text-sm font-bold text-gray-700 mb-1">
                                            生成テンプレート
                                        </label>
                                        <select
                                            id="template"
                                            className="block w-full p-2.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            value={selectedTemplate}
                                            onChange={(e) => setSelectedTemplate(e.target.value as TemplateKey)}
                                        >
                                            {Object.entries(TEMPLATES).map(([key, config]) => (
                                                <option key={key} value={key}>{config.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <Button 
                                        variant="primary" 
                                        className="w-full justify-center py-3 text-base font-bold shadow-lg shadow-blue-600/20" 
                                        onClick={handleGenerate}
                                        icon={<Sparkles size={18} />}
                                    >
                                4形式を一括生成
                                    </Button>
                                </div>
                            </Card>

                    {/* 3. 生成結果 */}
                    <div>
                        <div className="mb-4">
                            <h2 className="text-lg font-bold text-gray-900">3. 生成結果 (Wordに貼り付け)</h2>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* ToS Output */}
                            <Card title="" className="h-full flex flex-col">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-gray-700">応募規約</label>
                                        <Button 
                                            variant={copiedTos ? "primary" : "outline"} 
                                            size="sm"
                                            onClick={() => handleCopy(tosOutput, 'tos')}
                                            disabled={!tosOutput}
                                            className={`bg-white ${copiedTos ? "!bg-green-600 !text-white hover:!bg-green-700 border-transparent" : ""}`}
                                        >
                                            {copiedTos ? (
                                                <>
                                                    <CheckCircle2 size={14} className="mr-1.5" />
                                                    コピー完了
                                                </>
                                            ) : (
                                                <>
                                                    <ClipboardCopy size={14} className="mr-1.5" />
                                                    コピー
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    <textarea
                                    className="w-full flex-1 min-h-[300px] p-4 bg-white border border-gray-300 rounded-md text-sm font-mono text-gray-800 focus:outline-none focus:border-blue-500 resize-none"
                                        readOnly
                                        value={tosOutput}
                                        placeholder="左側のボタンを押すとここに生成されます"
                                        onClick={(e) => e.currentTarget.select()}
                                    />
                            </Card>

                                {/* DM Output */}
                            <Card title="" className="h-full flex flex-col">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-gray-700">当選DM</label>
                                        <Button 
                                            variant={copiedDm ? "primary" : "outline"} 
                                            size="sm"
                                            onClick={() => handleCopy(dmOutput, 'dm')}
                                            disabled={!dmOutput}
                                            className={`bg-white ${copiedDm ? "!bg-green-600 !text-white hover:!bg-green-700 border-transparent" : ""}`}
                                        >
                                            {copiedDm ? (
                                                <>
                                                    <CheckCircle2 size={14} className="mr-1.5" />
                                                    コピー完了
                                                </>
                                            ) : (
                                                <>
                                                    <ClipboardCopy size={14} className="mr-1.5" />
                                                    コピー
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    <textarea
                                    className="w-full flex-1 min-h-[300px] p-4 bg-white border border-gray-300 rounded-md text-sm font-mono text-gray-800 focus:outline-none focus:border-blue-500 resize-none"
                                        readOnly
                                        value={dmOutput}
                                        placeholder="左側のボタンを押すとここに生成されます"
                                        onClick={(e) => e.currentTarget.select()}
                                    />
                            </Card>

                            {/* Form Output */}
                            <Card title="" className="h-full flex flex-col">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-gray-700">当選者用フォーム</label>
                                    <Button 
                                        variant={copiedForm ? "primary" : "outline"} 
                                        size="sm"
                                        onClick={() => handleCopy(formOutput, 'form')}
                                        disabled={!formOutput}
                                        className={`bg-white ${copiedForm ? "!bg-green-600 !text-white hover:!bg-green-700 border-transparent" : ""}`}
                                    >
                                        {copiedForm ? (
                                            <>
                                                <CheckCircle2 size={14} className="mr-1.5" />
                                                コピー完了
                                            </>
                                        ) : (
                                            <>
                                                <ClipboardCopy size={14} className="mr-1.5" />
                                                コピー
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <textarea
                                    className="w-full flex-1 min-h-[300px] p-4 bg-white border border-gray-300 rounded-md text-sm font-mono text-gray-800 focus:outline-none focus:border-blue-500 resize-none"
                                    readOnly
                                    value={formOutput}
                                    placeholder="左側のボタンを押すとここに生成されます"
                                    onClick={(e) => e.currentTarget.select()}
                                />
                            </Card>

                            {/* Enclosed Letter Output */}
                            <Card title="" className="h-full flex flex-col">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-gray-700">同梱レター</label>
                                    <Button 
                                        variant={copiedEnclosedLetter ? "primary" : "outline"} 
                                        size="sm"
                                        onClick={() => handleCopy(enclosedLetterOutput, 'enclosedLetter')}
                                        disabled={!enclosedLetterOutput}
                                        className={`bg-white ${copiedEnclosedLetter ? "!bg-green-600 !text-white hover:!bg-green-700 border-transparent" : ""}`}
                                    >
                                        {copiedEnclosedLetter ? (
                                            <>
                                                <CheckCircle2 size={14} className="mr-1.5" />
                                                コピー完了
                                            </>
                                        ) : (
                                            <>
                                                <ClipboardCopy size={14} className="mr-1.5" />
                                                コピー
                                            </>
                                        )}
                                    </Button>
                            </div>
                                <textarea
                                    className="w-full flex-1 min-h-[300px] p-4 bg-white border border-gray-300 rounded-md text-sm font-mono text-gray-800 focus:outline-none focus:border-blue-500 resize-none"
                                    readOnly
                                    value={enclosedLetterOutput}
                                    placeholder="左側のボタンを押すとここに生成されます"
                                    onClick={(e) => e.currentTarget.select()}
                                />
                        </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
