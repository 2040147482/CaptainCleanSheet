import {getRequestConfig} from 'next-intl/server';
import {getDictionary, type Locale} from './app/i18n';

export default getRequestConfig(async ({locale}) => {
  const supported: Locale[] = ['zh', 'en'];
  const current = supported.includes(locale as Locale) ? (locale as Locale) : 'zh';
  const messages = await getDictionary(current);

  return {
    locale: current,
    messages
  };
});