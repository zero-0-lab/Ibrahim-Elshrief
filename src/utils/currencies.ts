export interface CurrencyDefinition {
  code: string;
  symbolEn: string;
  symbolAr: string;
  nameEn: string;
  nameAr: string;
  countryEn: string;
  countryAr: string;
}

export const ARAB_AND_USD_CURRENCIES: CurrencyDefinition[] = [
  {
    code: 'USD',
    symbolEn: '$',
    symbolAr: '$',
    nameEn: 'US Dollar',
    nameAr: 'دولار أمريكي',
    countryEn: 'United States / Global',
    countryAr: 'عالمي / الولايات المتحدة'
  },
  {
    code: 'EGP',
    symbolEn: 'EGP',
    symbolAr: 'ج.م',
    nameEn: 'Egyptian Pound',
    nameAr: 'جنيه مصري',
    countryEn: 'Egypt',
    countryAr: 'مصر'
  },
  {
    code: 'SAR',
    symbolEn: 'SAR',
    symbolAr: 'ر.س',
    nameEn: 'Saudi Riyal',
    nameAr: 'ريال سعودي',
    countryEn: 'Saudi Arabia',
    countryAr: 'المملكة العربية السعودية'
  },
  {
    code: 'AED',
    symbolEn: 'AED',
    symbolAr: 'د.إ',
    nameEn: 'UAE Dirham',
    nameAr: 'درهم إماراتي',
    countryEn: 'United Arab Emirates',
    countryAr: 'الإمارات العربية المتحدة'
  },
  {
    code: 'KWD',
    symbolEn: 'KWD',
    symbolAr: 'د.ك',
    nameEn: 'Kuwaiti Dinar',
    nameAr: 'دينار كويتي',
    countryEn: 'Kuwait',
    countryAr: 'الكويت'
  },
  {
    code: 'QAR',
    symbolEn: 'QAR',
    symbolAr: 'ر.ق',
    nameEn: 'Qatari Riyal',
    nameAr: 'ريال قطري',
    countryEn: 'Qatar',
    countryAr: 'قطر'
  },
  {
    code: 'BHD',
    symbolEn: 'BHD',
    symbolAr: 'د.ب',
    nameEn: 'Bahraini Dinar',
    nameAr: 'دينار بحريني',
    countryEn: 'Bahrain',
    countryAr: 'البحرين'
  },
  {
    code: 'OMR',
    symbolEn: 'OMR',
    symbolAr: 'ر.ع',
    nameEn: 'Omani Rial',
    nameAr: 'ريال عماني',
    countryEn: 'Oman',
    countryAr: 'سلطنة عمان'
  },
  {
    code: 'JOD',
    symbolEn: 'JOD',
    symbolAr: 'د.أ',
    nameEn: 'Jordanian Dinar',
    nameAr: 'دينار أردني',
    countryEn: 'Jordan',
    countryAr: 'الأردن'
  },
  {
    code: 'IQD',
    symbolEn: 'IQD',
    symbolAr: 'د.ع',
    nameEn: 'Iraqi Dinar',
    nameAr: 'دينار عراقي',
    countryEn: 'Iraq',
    countryAr: 'العراق'
  },
  {
    code: 'MAD',
    symbolEn: 'MAD',
    symbolAr: 'د.م',
    nameEn: 'Moroccan Dirham',
    nameAr: 'درهم مغربي',
    countryEn: 'Morocco',
    countryAr: 'المغرب'
  },
  {
    code: 'DZD',
    symbolEn: 'DZD',
    symbolAr: 'د.ج',
    nameEn: 'Algerian Dinar',
    nameAr: 'دينار جزائري',
    countryEn: 'Algeria',
    countryAr: 'الجزائر'
  },
  {
    code: 'TND',
    symbolEn: 'TND',
    symbolAr: 'د.ت',
    nameEn: 'Tunisian Dinar',
    nameAr: 'دينار تونسي',
    countryEn: 'Tunisia',
    countryAr: 'تونس'
  },
  {
    code: 'LYD',
    symbolEn: 'LYD',
    symbolAr: 'د.ل',
    nameEn: 'Libyan Dinar',
    nameAr: 'دينار ليبي',
    countryEn: 'Libya',
    countryAr: 'ليبيا'
  },
  {
    code: 'LBP',
    symbolEn: 'LBP',
    symbolAr: 'ل.ل',
    nameEn: 'Lebanese Pound',
    nameAr: 'ليرة لبنانية',
    countryEn: 'Lebanon',
    countryAr: 'لبنان'
  },
  {
    code: 'SDG',
    symbolEn: 'SDG',
    symbolAr: 'ج.س',
    nameEn: 'Sudanese Pound',
    nameAr: 'جنيه سوداني',
    countryEn: 'Sudan',
    countryAr: 'السودان'
  },
  {
    code: 'YER',
    symbolEn: 'YER',
    symbolAr: 'ر.ي',
    nameEn: 'Yemeni Rial',
    nameAr: 'ريال يمني',
    countryEn: 'Yemen',
    countryAr: 'اليمن'
  },
  {
    code: 'SYP',
    symbolEn: 'SYP',
    symbolAr: 'ل.س',
    nameEn: 'Syrian Pound',
    nameAr: 'ليرة سورية',
    countryEn: 'Syria',
    countryAr: 'سوريا'
  },
  {
    code: 'MRU',
    symbolEn: 'MRU',
    symbolAr: 'أ.م',
    nameEn: 'Mauritanian Ouguiya',
    nameAr: 'أوقية موريتانية',
    countryEn: 'Mauritania',
    countryAr: 'موريتانيا'
  },
  {
    code: 'SOS',
    symbolEn: 'SOS',
    symbolAr: 'ش.ص',
    nameEn: 'Somali Shilling',
    nameAr: 'شلن صومالي',
    countryEn: 'Somalia',
    countryAr: 'الصومال'
  },
  {
    code: 'DJF',
    symbolEn: 'DJF',
    symbolAr: 'ف.ج',
    nameEn: 'Djiboutian Franc',
    nameAr: 'فرنك جيبوتي',
    countryEn: 'Djibouti',
    countryAr: 'جيبوتي'
  },
  {
    code: 'KMF',
    symbolEn: 'KMF',
    symbolAr: 'ف.ق',
    nameEn: 'Comorian Franc',
    nameAr: 'فرنك قمري',
    countryEn: 'Comoros',
    countryAr: 'جزر القمر'
  }
];

export function getCurrencyInfo(code?: string): CurrencyDefinition {
  const cleanCode = (code || 'USD').toUpperCase().trim();
  const match = ARAB_AND_USD_CURRENCIES.find(c => c.code === cleanCode);
  if (match) return match;
  return {
    code: cleanCode,
    symbolEn: cleanCode,
    symbolAr: cleanCode,
    nameEn: cleanCode,
    nameAr: cleanCode,
    countryEn: 'Global',
    countryAr: 'دولي'
  };
}

export function formatPrice(
  amount: number,
  currencyCode: string = 'USD',
  language: 'ar' | 'en' = 'en'
): string {
  const info = getCurrencyInfo(currencyCode);
  const formattedAmount = Number(amount || 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  if (language === 'ar') {
    return `${formattedAmount} ${info.symbolAr}`;
  } else {
    if (info.symbolEn === '$') {
      return `$${formattedAmount}`;
    }
    return `${formattedAmount} ${info.symbolEn}`;
  }
}

export const APPROXIMATE_RATES_TO_USD: Record<string, number> = {
  USD: 1,
  EGP: 50.0,
  SAR: 3.75,
  AED: 3.67,
  KWD: 0.31,
  QAR: 3.64,
  BHD: 0.38,
  OMR: 0.385,
  JOD: 0.71,
  IQD: 1310,
  DZD: 134,
  MAD: 10.1,
  TND: 3.12,
  LYD: 4.88,
  LBP: 89500,
  SDG: 601,
  YER: 250,
  EUR: 0.92,
  GBP: 0.79
};

export function convertCurrency(amountUSD: number, targetCurrency: string, customEgpRate?: number): number {
  if (targetCurrency === 'EGP' && customEgpRate && customEgpRate > 0) {
    return amountUSD * customEgpRate;
  }
  const rate = APPROXIMATE_RATES_TO_USD[targetCurrency] || 1;
  return amountUSD * rate;
}

