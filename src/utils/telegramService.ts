import { Order, ContactMessage, ProductItem, SiteSettings } from '../types';
import { formatPrice } from './currencies';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface TelegramDigestData {
  orders?: Order[];
  messages?: ContactMessage[];
  products?: ProductItem[];
  subscribersCount?: number;
  newSubscribersToday?: number;
  siteSettings?: SiteSettings;
  isInstantManual?: boolean;
}

export const escapeTelegramHtml = (text: string = ''): string => {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

export const getStoredTelegramCredentials = async (
  settings?: SiteSettings
): Promise<{ botToken: string; chatId: string }> => {
  let botToken = settings?.telegramBotToken?.trim() || '';
  let chatId = settings?.telegramChatId?.trim() || '';

  if (!botToken || !chatId) {
    try {
      const cachedToken = localStorage.getItem('cached_telegram_bot_token');
      const cachedChat = localStorage.getItem('cached_telegram_chat_id');
      if (cachedToken && !botToken) botToken = cachedToken.trim();
      if (cachedChat && !chatId) chatId = cachedChat.trim();
    } catch {}
  }

  if (!botToken || !chatId) {
    try {
      const secSnap = await getDoc(doc(db, 'systemConfig', 'ownerSecurityChannels'));
      if (secSnap.exists()) {
        const secData = secSnap.data();
        if (secData.telegramBotToken && !botToken) botToken = secData.telegramBotToken.trim();
        if (secData.telegramChatId && !chatId) chatId = secData.telegramChatId.trim();
      }
    } catch {}
  }

  if (!botToken || !chatId) {
    try {
      const sSnap = await getDoc(doc(db, 'siteSettings', 'global'));
      if (sSnap.exists()) {
        const sData = sSnap.data();
        if (sData.telegramBotToken && !botToken) botToken = sData.telegramBotToken.trim();
        if (sData.telegramChatId && !chatId) chatId = sData.telegramChatId.trim();
      }
    } catch {}
  }

  return { botToken, chatId };
};

export const sendTelegramMessage = async (
  botToken: string,
  chatId: string,
  text: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  if (!botToken || !chatId) {
    return {
      success: false,
      message: 'رمز البوت (Bot Token) ومعرّف المحادثة (Chat ID) مطلوبان للربط مع تيليجرام.'
    };
  }

  try {
    const cleanToken = botToken.trim();
    const cleanChatId = chatId.trim();
    const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const result = await response.json();

    if (result.ok) {
      return {
        success: true,
        message: 'تم إرسال التنبيه بنجاح إلى حساب التيليجرام الخاص بك!'
      };
    } else {
      return {
        success: false,
        message: result.description || 'فشل إرسال الرسالة عبر تيليجرام.'
      };
    }
  } catch (error: any) {
    console.error('Telegram send error:', error);
    return {
      success: false,
      message: error?.message || 'تعذر الاتصال بخوادم تيليجرام.'
    };
  }
};

export const dataUrlToBlob = (dataUrl: string): Blob | null => {
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const binary = atob(parts[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: mime });
  } catch (err) {
    console.error('Error converting dataUrl to Blob:', err);
    return null;
  }
};

export const sendTelegramPhoto = async (
  botToken: string,
  chatId: string,
  photoSource: string,
  caption?: string,
  fileName: string = 'receipt.jpg'
): Promise<{ success: boolean; message: string; data?: any }> => {
  if (!botToken || !chatId || !photoSource) {
    return {
      success: false,
      message: 'بيانات غير كافية لإرسال الصورة عبر تيليجرام.'
    };
  }

  try {
    const cleanToken = botToken.trim();
    const cleanChatId = chatId.trim();
    const url = `https://api.telegram.org/bot${cleanToken}/sendPhoto`;

    const formData = new FormData();
    formData.append('chat_id', cleanChatId);

    if (caption) {
      const trimmedCaption = caption.length > 1024 ? caption.slice(0, 1020) + '...' : caption;
      formData.append('caption', trimmedCaption);
      formData.append('parse_mode', 'HTML');
    }

    if (photoSource.startsWith('data:')) {
      const blob = dataUrlToBlob(photoSource);
      if (!blob) {
        throw new Error('فشل معالجة بيانات صورة الإيصال.');
      }
      const ext = blob.type.includes('png') ? 'png' : 'jpg';
      const cleanFileName = fileName.endsWith(ext) ? fileName : `${fileName}.${ext}`;
      formData.append('photo', blob, cleanFileName);
    } else {
      formData.append('photo', photoSource.trim());
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.ok) {
      return {
        success: true,
        message: 'تم إرسال صورة الإيصال بنجاح عبر تيليجرام.',
        data: result
      };
    } else {
      return {
        success: false,
        message: result.description || 'فشل إرسال الصورة عبر تيليجرام.'
      };
    }
  } catch (error: any) {
    console.error('Telegram sendPhoto error:', error);
    return {
      success: false,
      message: error?.message || 'تعذر إرسال الصورة إلى تيليجرام.'
    };
  }
};

export const buildOrderTelegramMessage = (
  order: Order,
  settings?: SiteSettings
): string => {
  const brandName = settings?.brandNameAr || 'منصة المتجر والمنشورات';
  const currency = order.currency || settings?.currency || 'USD';
  const dateStr = new Date(order.createdAt || Date.now()).toLocaleString('ar-EG', {
    weekday: 'short',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const safeCustomerName = escapeTelegramHtml(order.customerName || 'عميل المتجر');
  const safeCustomerEmail = escapeTelegramHtml(order.customerEmail || '');
  const safeCustomerPhone = escapeTelegramHtml(order.customerPhone || 'غير مسجل');
  const safeOrderNumber = escapeTelegramHtml(order.orderNumber || '');
  const safeMethod = escapeTelegramHtml(order.paymentMethodTitle || order.paymentMethod || 'محافظ إلكترونية');

  let text = `🎉 <b>إشعار عملية شراء ودفع جديدة مؤكدة!</b>\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🏛️ <b>${escapeTelegramHtml(brandName)}</b>\n`;
  text += `⏱️ <b>التوقيت:</b> <i>${dateStr}</i>\n\n`;

  text += `📋 <b>رقم الطلب:</b> <code>#${safeOrderNumber}</code>\n`;
  text += `💰 <b>المبلغ الإجمالي:</b> <b>${formatPrice(order.total, currency, 'ar')}</b>`;
  if (order.convertedAmount) {
    text += ` <i>(${escapeTelegramHtml(order.convertedAmount)})</i>`;
  }
  text += `\n`;

  text += `💳 <b>طريقة السداد:</b> <b>${safeMethod}</b>\n`;
  text += `🟢 <b>حالة الدفع:</b> <b>تم الدفع والتحويل بنجاح (Paid) ✅</b>\n`;

  if (order.transferFrom) {
    text += `📱 <b>المحول منه / المحفظة:</b> <code>${escapeTelegramHtml(order.transferFrom)}</code>\n`;
  }
  if (order.transferDate) {
    text += `🕒 <b>تاريخ ووقت التحويل:</b> <code>${escapeTelegramHtml(order.transferDate)}</code>\n`;
  }

  text += `\n👤 <b>بيانات المشتري:</b>\n`;
  text += `• الاسم: <b>${safeCustomerName}</b>\n`;
  text += `• البريد: <code>${safeCustomerEmail}</code>\n`;
  text += `• الهاتف / واتساب: <code>${safeCustomerPhone}</code>\n`;

  if (order.shippingAddress) {
    text += `📍 <b>عنوان الشحن:</b> ${escapeTelegramHtml(order.shippingAddress)}\n`;
  }

  text += `\n📦 <b>قائمة المنتجات (${order.items?.length || 0}):</b>\n`;
  (order.items || []).forEach((item, idx) => {
    const itemName = escapeTelegramHtml(item.productNameAr || item.productNameEn || 'منتج');
    const itemType = item.type === 'digital' ? 'ملف رقمي 📥' : 'كتاب مطبوع / مادي 📚';
    const itemPrice = formatPrice(item.price * item.quantity, currency, 'ar');
    text += ` ${idx + 1}. <b>${itemName}</b> × ${item.quantity} [${itemPrice}] (${itemType})\n`;
  });

  if (order.notes) {
    text += `\n📝 <b>ملاحظات العميل:</b>\n<i>${escapeTelegramHtml(order.notes)}</i>\n`;
  }

  text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `⚙️ <i>تم تسجيل الطلب في لوحة التحكم آلياً.</i>`;

  return text;
};

export const sendOrderTelegramNotification = async (
  order: Order,
  settings?: SiteSettings
): Promise<{ success: boolean; message: string }> => {
  try {
    const { botToken, chatId } = await getStoredTelegramCredentials(settings);
    if (!botToken || !chatId) {
      return { success: false, message: 'لم يتم ربط بوت تيليجرام بعد في الإعدادات.' };
    }

    const text = buildOrderTelegramMessage(order, settings);

    if (order.receiptUrl && order.receiptUrl.trim()) {
      try {
        const canFitFullCaption = text.length <= 1020;
        if (canFitFullCaption) {
          const photoRes = await sendTelegramPhoto(
            botToken,
            chatId,
            order.receiptUrl,
            text,
            `receipt_order_${order.orderNumber}.jpg`
          );
          if (photoRes.success) return { success: true, message: 'تم إرسال إشعار الشراء بنجاح!' };
        } else {
          const photoCaption = `📎 <b>صورة إيصال التحويل للطلب #${escapeTelegramHtml(order.orderNumber)}</b>\n` +
            `💰 <b>الإجمالي:</b> <b>${formatPrice(order.total, order.currency || settings?.currency || 'USD', 'ar')}</b>\n` +
            `👤 <b>العميل:</b> <b>${escapeTelegramHtml(order.customerName)}</b>`;

          await sendTelegramPhoto(botToken, chatId, order.receiptUrl, photoCaption, `receipt_${order.orderNumber}.jpg`);
          return await sendTelegramMessage(botToken, chatId, text);
        }
      } catch (e) {}
    }

    return await sendTelegramMessage(botToken, chatId, text);
  } catch (err: any) {
    return { success: false, message: err?.message || 'خطأ في إرسال التنبيه' };
  }
};

export const sendContactMessageTelegramNotification = async (
  contactMsg: { name: string; email: string; subject: string; message: string; createdAt: string },
  settings?: SiteSettings
): Promise<{ success: boolean; message: string }> => {
  try {
    const { botToken, chatId } = await getStoredTelegramCredentials(settings);
    if (!botToken || !chatId) return { success: false, message: 'لم يتم ربط بوت تيليجرام' };

    let text = `📬 <b>رسالة تواصل واستفسار جديدة!</b>\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `👤 <b>المرسل:</b> ${escapeTelegramHtml(contactMsg.name)}\n`;
    text += `📧 <b>البريد:</b> ${escapeTelegramHtml(contactMsg.email)}\n`;
    text += `📌 <b>الموضوع:</b> ${escapeTelegramHtml(contactMsg.subject || 'استفسار عام')}\n`;
    text += `🕒 <b>التاريخ:</b> ${new Date(contactMsg.createdAt).toLocaleString('ar-EG')}\n\n`;
    text += `💬 <b>الرسالة:</b>\n<i>${escapeTelegramHtml(contactMsg.message)}</i>\n`;

    return await sendTelegramMessage(botToken, chatId, text);
  } catch (err: any) {
    return { success: false, message: err?.message || 'خطأ في الإرسال' };
  }
};

export const buildTelegramSummaryText = (data: TelegramDigestData): string => {
  const { orders = [], messages = [], products = [], siteSettings, isInstantManual = true } = data;
  const currency = siteSettings?.currency || 'USD';
  const brandName = siteSettings?.brandNameAr || 'منصة المؤلف والباحث';

  let message = isInstantManual
    ? '⚡ <b>ملخص فوري لأحداث المنصة حتى هذه اللحظة</b>\n'
    : '🌙 <b>التقرير اليومي الشامل للمنصة</b>\n';
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🏛️ <b>${brandName}</b>\n\n`;
  message += `🛒 <b>الطلبات الإجمالية:</b> ${orders.length} طلب\n`;
  message += `💬 <b>الرسائل:</b> ${messages.length} رسالة\n`;
  message += `📦 <b>المنتجات المعروضة:</b> ${products.length} منتج\n`;
  return message;
};

export const sendLowStockTelegramAlert = async (
  product: { id: string; nameAr?: string; nameEn?: string; stock: number; lowStockThreshold?: number },
  previousStock: number,
  orderNumber?: string,
  settings?: SiteSettings
): Promise<{ success: boolean; message: string }> => {
  try {
    const { botToken, chatId } = await getStoredTelegramCredentials(settings);
    if (!botToken || !chatId) return { success: false, message: 'Telegram credentials not configured' };

    const prodName = escapeTelegramHtml(product.nameAr || product.nameEn || 'منتج');
    let text = `⚠️ <b>تنبيه مخزون: انخفاض كمية المنتج</b>\n`;
    text += `📦 <b>المنتج:</b> ${prodName}\n`;
    text += `📊 <b>الرصيد المتبقي:</b> ${product.stock} نسخة\n`;

    return await sendTelegramMessage(botToken, chatId, text);
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to dispatch alert' };
  }
};

export const sendBulkLowStockTelegramReport = async (
  products: ProductItem[],
  settings?: SiteSettings
): Promise<{ success: boolean; message: string }> => {
  try {
    const { botToken, chatId } = await getStoredTelegramCredentials(settings);
    if (!botToken || !chatId) return { success: false, message: 'Telegram credentials not configured' };

    let text = `📋 <b>تقرير فحص المخزون السريع</b>\n`;
    return await sendTelegramMessage(botToken, chatId, text);
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed' };
  }
};
