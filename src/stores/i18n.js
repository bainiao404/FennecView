import { defineStore } from 'pinia'
import zh from './i18n/zh'
import en from './i18n/en'
import ja from './i18n/ja'

export const useI18nStore = defineStore('i18n', {
    state: () => ({
        locale: localStorage.getItem('locale') || 'zh',
        messages: {
            zh,
            en,
            ja,
        },
    }),
    actions: {
        t(key) {
            return this.messages[this.locale][key] || key
        },
        setLocale(lang) {
            if (this.messages[lang]) {
                this.locale = lang
                localStorage.setItem('locale', lang)
            }
        },
    },
})
