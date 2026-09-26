import React, { useState } from 'react';
import {
  Send,
  MessageSquare,
  Users,
  AlertTriangle,
  Radio,
  Clock,
  CheckCircle,
  Inbox,
  Search,
  Filter,
  Megaphone,
} from 'lucide-react';
import { Barangay, MessageItem, UserAccount } from '../../types';
import { storageService } from '../../services/storageService';

interface MessagingCenterProps {
  barangays: Barangay[];
  currentUser: UserAccount | null;
  onRefreshBadge?: () => void;
}

export const MessagingCenter: React.FC<MessagingCenterProps> = ({
  barangays,
  currentUser,
  onRefreshBadge,
}) => {
  const [messages, setMessages] = useState<MessageItem[]>(() => storageService.getMessages());
  const [selectedRecipient, setSelectedRecipient] = useState<string>('all'); // 'all' or specific barangay
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<MessageItem['priority']>('routine');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(messages[0] || null);

  const isAdmin = currentUser?.role === 'admin';
  const focalBarangay = currentUser?.assignedBarangay;

  // Filter messages visible to current user
  const visibleMessages = messages.filter(m => {
    if (isAdmin) return true; // Admin sees all messages
    const targetBg = (m.recipientBarangay || m.targetBarangay || 'all').toLowerCase();
    if (focalBarangay) {
      return targetBg === 'all' || targetBg === (focalBarangay || '').toLowerCase();
    }
    return targetBg === 'all';
  });

  const filteredMessages = visibleMessages.filter(m => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const sub = (m.subject || m.title || '').toLowerCase();
    const bd = (m.body || m.content || '').toLowerCase();
    const bg = (m.recipientBarangay || m.targetBarangay || '').toLowerCase();
    const sender = (m.senderName || '').toLowerCase();
    return sub.includes(q) || bd.includes(q) || bg.includes(q) || sender.includes(q);
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      alert('Please fill out both subject and message content.');
      return;
    }

    const newMessage: MessageItem = {
      id: 'msg-' + Date.now(),
      senderId: currentUser?.id || 'usr-admin-1',
      senderName: currentUser?.name || 'Municipal Agriculture Office',
      senderRole: currentUser?.role || 'admin',
      targetBarangay: selectedRecipient,
      recipientBarangay: selectedRecipient,
      subject,
      title: subject,
      body,
      content: body,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isRead: false,
      priority,
    };

    storageService.sendMessage(newMessage);
    const updated = storageService.getMessages();
    setMessages(updated);
    setSelectedMessage(newMessage);
    setSubject('');
    setBody('');
    onRefreshBadge?.();
  };

  const handleSelectMessage = (msg: MessageItem) => {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      storageService.markMessageAsRead(msg.id);
      setMessages(storageService.getMessages());
      onRefreshBadge?.();
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900">Barangay Agriculture Dispatch & Messaging</h2>
            <p className="text-xs text-stone-500">
              Direct communication link between Municipal Agriculture Office and all 40 Hinunangan barangay focal persons.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 bg-stone-100 text-stone-700 rounded-lg border border-stone-200">
            {visibleMessages.filter(m => !m.isRead).length} Unread Dispatch(es)
          </span>
        </div>
      </div>

      {/* Main Grid: Send Box + Message List + Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Compose & Dispatch (Admin or Focal) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b pb-3 border-stone-100">
              <Send className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-stone-900 text-sm">
                {isAdmin ? 'Broadcast or Dispatch Direct Message' : 'Send Report to Municipal Admin'}
              </h3>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-3">
              {isAdmin ? (
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Send Dispatch To:</label>
                  <select
                    value={selectedRecipient}
                    onChange={e => setSelectedRecipient(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  >
                    <option value="all">📢 ALL 40 BARANGAYS (MUNICIPAL-WIDE BROADCAST)</option>
                    <optgroup label="Direct Message to Specific Barangay Focal">
                      {barangays.map(b => (
                        <option key={b.id} value={b.name}>
                          Brgy. {b.name} (Focal Officer)
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              ) : (
                <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                  <span className="text-stone-500 block">Recipient:</span>
                  <strong className="text-stone-800">
                    Municipal Agriculture Office (MAO Hinunangan Admin)
                  </strong>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-stone-700 mb-1">Subject / Header</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. ASF Biosecurity Advisory / Deworming Schedule"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Priority Level</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as MessageItem['priority'])}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white font-semibold"
                  >
                    <option value="routine">Routine Notification</option>
                    <option value="alert">⚠️ Inspection Advisory</option>
                    <option value="urgent">🚨 Urgent / ASF Warning</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Message Body</label>
                <textarea
                  rows={5}
                  required
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Enter directives, instructions, or field situation reports..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Dispatch</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Inboxes & Reader */}
        <div className="lg:col-span-7 space-y-4">
          {/* Message List */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Filter messages..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
              <span className="text-[11px] text-stone-500 font-semibold shrink-0">
                {filteredMessages.length} message(s)
              </span>
            </div>

            <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto">
              {filteredMessages.length === 0 ? (
                <div className="p-8 text-center text-stone-400 text-xs">No dispatches found.</div>
              ) : (
                filteredMessages.map(msg => (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`p-3.5 text-xs transition cursor-pointer flex items-start justify-between gap-3 ${
                      selectedMessage?.id === msg.id
                        ? 'bg-emerald-50/70 border-l-4 border-emerald-700'
                        : msg.isRead
                        ? 'hover:bg-stone-50'
                        : 'bg-amber-50/40 font-bold hover:bg-amber-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            msg.priority === 'urgent'
                              ? 'bg-red-100 text-red-800'
                              : msg.priority === 'alert'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {msg.priority.toUpperCase()}
                        </span>
                        <span className="text-stone-900 font-semibold text-xs">{msg.subject || msg.title || 'Official Advisory'}</span>
                      </div>

                      <div className="text-[11px] text-stone-500 line-clamp-1">{msg.body || msg.content || ''}</div>

                      <div className="flex items-center gap-2 text-[10px] text-stone-400">
                        <span>From: {msg.senderName}</span>
                        <span>•</span>
                        <span>To: Brgy. {(msg.recipientBarangay || msg.targetBarangay) === 'all' ? 'All Barangays' : (msg.recipientBarangay || msg.targetBarangay)}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-stone-400 block">
                        {new Date(msg.timestamp || msg.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                      {!msg.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block mt-1"></span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected Message Reader */}
          {selectedMessage && (
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4 text-xs">
              <div className="border-b border-stone-100 pb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      selectedMessage.priority === 'urgent'
                        ? 'bg-red-100 text-red-800'
                        : selectedMessage.priority === 'alert'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {selectedMessage.priority} Notice
                  </span>
                  <h3 className="text-base font-bold text-stone-900 mt-1.5">{selectedMessage.subject || selectedMessage.title || 'Official Advisory'}</h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Sender: <strong>{selectedMessage.senderName}</strong> • Target:{' '}
                    <strong>
                      {(selectedMessage.recipientBarangay || selectedMessage.targetBarangay) === 'all'
                        ? 'All 40 Barangays'
                        : `Brgy. ${selectedMessage.recipientBarangay || selectedMessage.targetBarangay}`}
                    </strong>
                  </p>
                </div>
                <span className="text-[11px] text-stone-400">
                  {new Date(selectedMessage.timestamp || selectedMessage.createdAt || Date.now()).toLocaleString()}
                </span>
              </div>

              <div className="text-stone-800 leading-relaxed whitespace-pre-wrap text-sm bg-stone-50 p-4 rounded-xl border border-stone-200">
                {selectedMessage.body || selectedMessage.content || ''}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
