import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mail, 
  Search, 
  Download, 
  Copy, 
  Check, 
  Trash2, 
  UserPlus, 
  RefreshCw, 
  Calendar, 
  Globe, 
  CheckCircle2, 
  AlertTriangle,
  X,
  Send,
  Users
} from 'lucide-react';
import { db } from '../../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { deleteDocumentRecursively } from '../../utils/recursiveDelete';
import { useLanguage } from '../../context/LanguageContext';
import { NewsletterSubscriber } from '../../types';

export const AdminSubscribers: React.FC = () => {
  const { language } = useLanguage();
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unsubscribed'>('all');
  const [copied, setCopied] = useState(false);
  
  // Add modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newLang, setNewLang] = useState<'ar' | 'en'>('ar');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // In-app delete confirmation state (no window.confirm)
  const [subscriberToDelete, setSubscriberToDelete] = useState<NewsletterSubscriber | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'subscribers'));
      const list: NewsletterSubscriber[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          email: data.email || d.id,
          language: data.language || 'ar',
          subscribedAt: data.subscribedAt || new Date().toISOString(),
          status: data.status === 'unsubscribed' ? 'unsubscribed' : 'active',
          source: data.source || 'footer_newsletter'
        });
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime());
      setSubscribers(list);
    } catch (err) {
      console.error('Failed to fetch subscribers:', err);
      showToast(language === 'ar' ? 'فشل تحميل قائمة المشتركين' : 'Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      setAddError(language === 'ar' ? 'يرجى إدخال بريد إلكتروني صالح.' : 'Valid email required.');
      return;
    }

    setAddLoading(true);
    setAddError('');
    try {
      const docId = clean.replace(/[^a-zA-Z0-9._-]/g, '_');
      const payload: NewsletterSubscriber = {
        id: docId,
        email: clean,
        language: newLang,
        subscribedAt: new Date().toISOString(),
        status: 'active',
        source: 'admin_manual'
      };

      await setDoc(doc(db, 'subscribers', docId), payload);
      setSubscribers((prev) => [payload, ...prev.filter(s => s.id !== docId)]);
      setAddModalOpen(false);
      setNewEmail('');
      showToast(language === 'ar' ? 'تمت إضافة المشترك بنجاح' : 'Subscriber added successfully');
    } catch (err) {
      console.error('Failed to add subscriber:', err);
      setAddError(language === 'ar' ? 'حدث خطأ أثناء الحفظ في قاعدة البيانات.' : 'Error adding subscriber.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleStatus = async (sub: NewsletterSubscriber) => {
    const newStatus = sub.status === 'active' ? 'unsubscribed' : 'active';
    try {
      await updateDoc(doc(db, 'subscribers', sub.id), { status: newStatus });
      setSubscribers((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, status: newStatus } : s))
      );
      showToast(
        language === 'ar'
          ? `تم تغيير حالة المشترك إلى: ${newStatus === 'active' ? 'نشط' : 'ملغي'}`
          : `Status updated to ${newStatus}`
      );
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const confirmDelete = async () => {
    if (!subscriberToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteDocumentRecursively('subscribers', subscriberToDelete.id, {
        subcollections: ['logs', 'campaigns']
      });
      setSubscribers((prev) => prev.filter((s) => s.id !== subscriberToDelete.id));
      showToast(language === 'ar' ? 'تم حذف المشترك وسجلاته نهائياً' : 'Subscriber deleted');
      setSubscriberToDelete(null);
    } catch (err) {
      console.error('Failed to delete subscriber recursively:', err);
      showToast(language === 'ar' ? 'فشل حذف المشترك' : 'Failed to delete');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCopyEmails = () => {
    const activeEmails = filteredSubscribers
      .filter((s) => s.status === 'active')
      .map((s) => s.email)
      .join(', ');

    if (!activeEmails) {
      showToast(language === 'ar' ? 'لا يوجد بريد إلكتروني لنسخه' : 'No emails to copy');
      return;
    }

    navigator.clipboard.writeText(activeEmails);
    setCopied(true);
    showToast(language === 'ar' ? 'تم نسخ جميع البريدات الإلكترونية' : 'All emails copied');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      showToast(language === 'ar' ? 'لا توجد بيانات للتصدير' : 'No data to export');
      return;
    }

    const headers = ['Email', 'Language', 'Subscribed At', 'Status', 'Source'];
    const rows = subscribers.map((s) => [
      s.email,
      s.language || 'ar',
      s.subscribedAt,
      s.status,
      s.source || 'newsletter'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(language === 'ar' ? 'تم تنزيل ملف CSV بنجاح' : 'CSV exported successfully');
  };

  // Filtered subscribers
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((sub) => {
      const matchesSearch = sub.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [subscribers, searchQuery, statusFilter]);

  const activeCount = useMemo(() => subscribers.filter((s) => s.status === 'active').length, [subscribers]);
  const thisMonthCount = useMemo(() => {
    const now = new Date();
    return subscribers.filter((s) => {
      const d = new Date(s.subscribedAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [subscribers]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 start-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Mail className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>{language === 'ar' ? 'مشتركو النشرة البريدية' : 'Newsletter Subscribers'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar' 
              ? 'إدارة قاعدة بيانات القراء والمتابعين المسجلين في النشرة الفكرية مع أدوات النسخ والتصدير.' 
              : 'Manage subscribers database, copy mailing lists, and export contacts.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchSubscribers}
            className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer"
            title={language === 'ar' ? 'تحديث البيانات' : 'Refresh'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleCopyEmails}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{language === 'ar' ? 'نسخ كافة البريدات' : 'Copy All Emails'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>{language === 'ar' ? 'تصدير CSV' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{language === 'ar' ? 'إضافة مشترك جديد' : 'Add Subscriber'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              {language === 'ar' ? 'إجمالي المشتركين' : 'Total Subscribers'}
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {subscribers.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              {language === 'ar' ? 'المشتركون النشطون' : 'Active Subscribers'}
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {activeCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              {language === 'ar' ? 'اشتراكات هذا الشهر' : 'Subscribed This Month'}
            </span>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
              {thisMonthCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute inset-y-0 start-3 my-auto text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'البحث عن طريق البريد الإلكتروني...' : 'Search by email...'}
            className="w-full ps-9 pe-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'active', 'unsubscribed'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white dark:bg-emerald-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {st === 'all' 
                ? (language === 'ar' ? 'الكل' : 'All')
                : st === 'active'
                ? (language === 'ar' ? 'النشط' : 'Active')
                : (language === 'ar' ? 'الملغي' : 'Unsubscribed')}
            </button>
          ))}
        </div>
      </div>

      {/* Subscribers Table / List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
            <span className="text-xs">{language === 'ar' ? 'جاري تحميل المشتركين...' : 'Loading subscribers...'}</span>
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Mail className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {language === 'ar' ? 'لا يوجد مشتركون مطابقون' : 'No subscribers found'}
            </p>
            <p className="text-xs text-slate-400">
              {language === 'ar' ? 'ستظهر هنا عناوين البريد المسجلة من الفوتر أو المضافة يدوياً.' : 'Subscribers from footer will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 text-start">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                  </th>
                  <th className="py-3.5 px-4 text-start">
                    {language === 'ar' ? 'اللغة' : 'Language'}
                  </th>
                  <th className="py-3.5 px-4 text-start">
                    {language === 'ar' ? 'تاريخ الاشتراك' : 'Subscribed Date'}
                  </th>
                  <th className="py-3.5 px-4 text-start">
                    {language === 'ar' ? 'الحالة' : 'Status'}
                  </th>
                  <th className="py-3.5 px-4 text-end">
                    {language === 'ar' ? 'إجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSubscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                          {sub.email.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate max-w-xs">{sub.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <Globe className="w-3 h-3 text-slate-400" />
                        <span>{sub.language === 'ar' ? 'العربية' : 'English'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {new Date(sub.subscribedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(sub)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                          sub.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-600'
                        }`}
                        title={language === 'ar' ? 'انقر لتبديل الحالة' : 'Click to toggle status'}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${sub.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{sub.status === 'active' ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'ملغي' : 'Unsubscribed')}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <button
                        type="button"
                        onClick={() => setSubscriberToDelete(sub)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title={language === 'ar' ? 'حذف المشترك' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* In-App Delete Confirmation Modal */}
      {subscriberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'ar' ? 'تأكيد حذف المشترك' : 'Confirm Delete Subscriber'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'ar' ? 'هذا الإجراء سيحذف العنوان نهائياً من قاعدة البيانات.' : 'This will remove the email permanently.'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white truncate">
              {subscriberToDelete.email}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSubscriberToDelete(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {deleteLoading ? (language === 'ar' ? 'جاري الحذف...' : 'Deleting...') : (language === 'ar' ? 'نعم، احذف' : 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-500" />
                <span>{language === 'ar' ? 'إضافة مشترك يدوياً' : 'Add Subscriber Manually'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubscriber} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'ar' ? 'لغة المراسلة المفضلة' : 'Preferred Language'}
                </label>
                <select
                  value={newLang}
                  onChange={(e) => setNewLang(e.target.value as 'ar' | 'en')}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="ar">العربية (Arabic)</option>
                  <option value="en">الإنجليزية (English)</option>
                </select>
              </div>

              {addError && (
                <div className="text-xs text-rose-500 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
                  {addError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {addLoading ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'إضافة المشترك' : 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
