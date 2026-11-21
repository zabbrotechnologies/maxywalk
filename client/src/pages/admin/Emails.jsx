import { useState, useEffect, useCallback } from 'react';
import AdminLayout from './Layout.jsx';
import { getEmailOverview, getEmailCampaigns, getEmailHistory, retryFailedEmail, processEmailQueueNow } from '../../lib/api.js';
import { formatDate } from '../../lib/utils.js';
import toast from 'react-hot-toast';

export default function AdminEmails() {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'campaigns'
  const [overview, setOverview] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingQueue, setProcessingQueue] = useState(false);
  const [retryingId, setRetryingId] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const fetchOverview = useCallback(async () => {
    try {
      const data = await getEmailOverview();
      setOverview(data);
    } catch (e) {
      console.warn('Overview fetch error:', e);
    }
  }, []);

  const fetchCampaigns = useCallback(async () => {
    try {
      const data = await getEmailCampaigns();
      setCampaigns(data || []);
    } catch (e) {
      console.warn('Campaigns fetch error:', e);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEmailHistory({
        status: statusFilter,
        event: eventFilter,
        search: searchTerm,
        page,
        limit: 25
      });
      setNotifications(res?.notifications || []);
      setTotalNotifications(res?.total || 0);
    } catch (e) {
      console.warn('History fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, eventFilter, searchTerm, page]);

  useEffect(() => {
    document.title = 'Email Notifications & Campaigns | Admin – MAXYWALK';
    fetchOverview();
    if (activeTab === 'queue') {
      fetchHistory();
    } else {
      fetchCampaigns();
    }
  }, [activeTab, fetchOverview, fetchHistory, fetchCampaigns]);

  const handleProcessQueueNow = async () => {
    setProcessingQueue(true);
    try {
      const res = await processEmailQueueNow(25);
      toast.success(`Processed ${res.processed || 0} emails from queue!`);
      fetchOverview();
      if (activeTab === 'queue') fetchHistory();
      else fetchCampaigns();
    } catch {
      toast.error('Failed to process queue. Please check logs.');
    } finally {
      setProcessingQueue(false);
    }
  };

  const handleRetry = async (id) => {
    setRetryingId(id);
    try {
      await retryFailedEmail(id);
      toast.success('Notification marked for immediate retry!');
      fetchOverview();
      fetchHistory();
    } catch {
      toast.error('Failed to retry notification.');
    } finally {
      setRetryingId(null);
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'sent':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'processing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'retrying':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'failed':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-neutral-50 text-neutral-600 border-neutral-200';
    }
  };

  return (
    <AdminLayout>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-primary font-bold">
            Email Notifications &amp; Campaigns
          </h1>
          <p className="text-on-surface-variant text-xs sm:text-sm mt-1">
            Automated customer transactional notifications and new product announcements
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { fetchOverview(); if (activeTab === 'queue') fetchHistory(); else fetchCampaigns(); }}
            className="btn-secondary text-xs h-10 px-4 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            <span>Refresh</span>
          </button>
          <button
            onClick={handleProcessQueueNow}
            disabled={processingQueue}
            className="btn-primary text-xs h-10 px-5 flex items-center gap-1.5 font-bold"
          >
            <span className="material-symbols-outlined text-base">outgoing_mail</span>
            <span>{processingQueue ? 'Sending...' : 'Process Queue Now'}</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white border border-outline-variant/40 p-4 sm:p-5 rounded-2xl shadow-sm">
          <span className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">
            Total In Queue
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-2xl sm:text-3xl font-bold text-primary">
              {overview?.totalQueued || 0}
            </span>
            <span className="material-symbols-outlined text-secondary text-xl">pending_actions</span>
          </div>
          <span className="text-[11px] text-on-surface-variant mt-1 block">
            {overview?.pending || 0} pending &bull; {overview?.retrying || 0} retrying
          </span>
        </div>

        <div className="bg-white border border-outline-variant/40 p-4 sm:p-5 rounded-2xl shadow-sm">
          <span className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">
            Successfully Delivered
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-2xl sm:text-3xl font-bold text-emerald-700">
              {overview?.totalSent || 0}
            </span>
            <span className="material-symbols-outlined text-emerald-600 text-xl">mark_email_read</span>
          </div>
          <span className="text-[11px] text-on-surface-variant mt-1 block">
            {overview?.lastSuccessfulSend ? `Last sent: ${formatDate(overview.lastSuccessfulSend)}` : 'Ready to send'}
          </span>
        </div>

        <div className="bg-white border border-outline-variant/40 p-4 sm:p-5 rounded-2xl shadow-sm">
          <span className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">
            Failed Attempts
          </span>
          <div className="flex items-baseline justify-between">
            <span className={`font-display text-2xl sm:text-3xl font-bold ${(overview?.failed || 0) > 0 ? 'text-rose-600' : 'text-primary'}`}>
              {overview?.failed || 0}
            </span>
            <span className="material-symbols-outlined text-rose-500 text-xl">error_outline</span>
          </div>
          <span className="text-[11px] text-on-surface-variant mt-1 block">
            Eligible for 1-click retry
          </span>
        </div>

        <div className="bg-white border border-outline-variant/40 p-4 sm:p-5 rounded-2xl shadow-sm">
          <span className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">
            Gmail SMTP Status
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-lg sm:text-xl font-bold text-primary truncate">
              Connected
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
          </div>
          <span className="text-[11px] text-on-surface-variant mt-1 block truncate">
            sales.maxywalk@gmail.com
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/30 mb-6 gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('queue')}
          className={`pb-3 transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'queue' ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-base">format_list_bulleted</span>
          <span>Notifications Queue &amp; History ({totalNotifications})</span>
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`pb-3 transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'campaigns' ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-base">campaign</span>
          <span>Product Announcement Campaigns ({campaigns.length})</span>
        </button>
      </div>

      {/* TAB 1: Notification Queue & History */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white border border-outline-variant/40 p-3.5 sm:p-4 rounded-2xl flex flex-wrap gap-3 items-center justify-between">
            <div className="flex-1 min-w-[220px]">
              <input
                type="text"
                placeholder="Search recipient, subject, order #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-hairline text-xs w-full"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-hairline text-xs bg-white py-1.5"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="retrying">Retrying</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="input-hairline text-xs bg-white py-1.5"
              >
                <option value="all">All Events</option>
                <option value="CUSTOMER_REGISTERED">Welcome Email</option>
                <option value="ORDER_PLACED">Order Placed</option>
                <option value="PAYMENT_SUCCESS">Payment Success</option>
                <option value="PAYMENT_FAILED">Payment Failed</option>
                <option value="ORDER_PROCESSING">Order Processing</option>
                <option value="ORDER_PACKED">Order Packed</option>
                <option value="ORDER_SHIPPED">Order Shipped</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="ORDER_DELIVERED">Delivered</option>
                <option value="ORDER_CANCELLED">Cancelled</option>
                <option value="NEW_PRODUCT_PUBLISHED">New Product Drop</option>
              </select>
            </div>
          </div>

          {/* Notifications Table */}
          <div className="bg-white border border-outline-variant/40 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Subject &amp; Reference</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Attempts</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-on-surface-variant">
                        Loading notifications...
                      </td>
                    </tr>
                  ) : notifications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-3xl mb-1 text-outline">inbox</span>
                        <p>No notifications matching this filter</p>
                      </td>
                    </tr>
                  ) : (
                    notifications.map((n) => (
                      <tr key={n.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] font-bold text-primary">
                          {n.event_type}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-primary block">{n.recipient_email}</span>
                          {n.order_id && (
                            <span className="text-[10px] text-secondary font-mono">Order: #{n.order_id}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate" title={n.subject}>
                          <span className="text-primary truncate block font-medium">{n.subject}</span>
                          {n.last_error && (
                            <span className="text-[10px] text-rose-600 truncate block mt-0.5" title={n.last_error}>
                              Error: {n.last_error}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border ${getStatusBadge(n.status)}`}>
                            {n.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant">
                          {n.attempts} / {n.max_attempts}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-on-surface-variant whitespace-nowrap">
                          {n.sent_at ? formatDate(n.sent_at) : formatDate(n.created_at)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {(n.status === 'failed' || n.status === 'retrying') && (
                            <button
                              onClick={() => handleRetry(n.id)}
                              disabled={retryingId === n.id}
                              className="btn-secondary py-1 px-3 text-[10px] h-7 inline-flex items-center gap-1 font-bold"
                            >
                              <span className="material-symbols-outlined text-xs">replay</span>
                              <span>{retryingId === n.id ? 'Retrying...' : 'Retry'}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalNotifications > 25 && (
              <div className="p-4 border-t border-outline-variant/30 flex items-center justify-between text-xs text-on-surface-variant">
                <span>Showing page {page}</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    className="btn-secondary py-1 px-3 text-xs h-8"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page * 25 >= totalNotifications}
                    onClick={() => setPage((p) => p + 1)}
                    className="btn-secondary py-1 px-3 text-xs h-8"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Product Announcement Campaigns */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="bg-white border border-outline-variant/40 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-primary">New Product Campaigns</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Automatically triggered whenever an administrator publishes a new product to the catalogue
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.length === 0 ? (
              <div className="col-span-2 bg-white border border-outline-variant/40 p-12 text-center rounded-2xl">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">campaign</span>
                <p className="text-sm font-bold text-primary">No Announcement Campaigns Created Yet</p>
                <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
                  When you add and publish a new product in the Products tab, an automated announcement campaign will appear here.
                </p>
              </div>
            ) : (
              campaigns.map((c) => {
                const total = c.total_recipients || 0;
                const sent = c.sent_count || 0;
                const percent = total > 0 ? Math.round((sent / total) * 100) : 100;

                return (
                  <div key={c.id} className="bg-white border border-outline-variant/40 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-secondary font-bold font-sans">
                            CAMPAIGN: #{c.id}
                          </span>
                          <h4 className="font-display text-base font-bold text-primary mt-0.5">
                            {c.product_name || c.catalog_product_name || 'New Leather Drop'}
                          </h4>
                          <span className="text-[11px] text-on-surface-variant font-mono">
                            Product ID: {c.product_id}
                          </span>
                        </div>
                        <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded border ${
                          c.campaign_status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {c.campaign_status}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5 my-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-on-surface-variant">Progress ({percent}%)</span>
                          <span className="font-bold text-primary">{sent} / {total} sent</span>
                        </div>
                        <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-secondary h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 mb-3">
                        <div>
                          <span className="text-on-surface-variant block">Total Recipients</span>
                          <span className="font-bold text-primary text-xs">{total}</span>
                        </div>
                        <div>
                          <span className="text-on-surface-variant block">Failed Delivery</span>
                          <span className={`font-bold text-xs ${c.failed_count > 0 ? 'text-rose-600' : 'text-primary'}`}>
                            {c.failed_count || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span>Created: {formatDate(c.created_at)}</span>
                      {c.completed_at && <span>Completed: {formatDate(c.completed_at)}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
