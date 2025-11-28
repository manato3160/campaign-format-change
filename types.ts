
export interface CampaignData {
    [key: string]: string;
}

export type TemplateKey = 'IG/事後抽選' | 'X/事後抽選' | 'X/即時' | 'TikTok/事後抽選';

export interface TemplateConfig {
    name: string;
    content: string;
}

export interface FormFieldConfig {
    id: string;
    label: string;
    type?: 'text' | 'date' | 'url';
    placeholder?: string;
    defaultValue?: string;
    group: 'basic' | 'schedule' | 'prizes' | 'steps' | 'social';
}

export type OutputType = 'guidelines' | 'dm' | 'form' | 'enclosedLetter';

export type Platform = 'X' | 'IG' | 'TikTok' | 'IG_X';
