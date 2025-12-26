'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ContactMessage } from '@/types/database';

type ReadFilter = 'all' | 'unread' | 'read';

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    let query = supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (readFilter === 'unread') {
      query = query.eq('is_read', false);
    } else if (readFilter === 'read') {
      query = query.eq('is_read', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching contact messages:', error);
    } else {
      setMessages(data || []);
    }
    setIsLoading(false);
  }, [supabase, readFilter]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const toggleReadStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('contact_messages')
      .update({ is_read: !currentStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating message status:', error);
      alert('Failed to update message status');
    } else {
      setMessages(
        messages.map((m) =>
          m.id === id ? { ...m, is_read: !currentStatus } : m
        )
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    } else {
      setMessages(messages.filter((m) => m.id !== id));
      if (expandedId === id) {
        setExpandedId(null);
      }
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = messages.filter((m) => !m.is_read).map((m) => m.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('contact_messages')
      .update({ is_read: true })
      .in('id', unreadIds);

    if (error) {
      console.error('Error marking all as read:', error);
      alert('Failed to mark all as read');
    } else {
      setMessages(messages.map((m) => ({ ...m, is_read: true })));
    }
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[var(--text)]">
            Contact Messages
          </h1>
          {unreadCount > 0 && (
            <span className="px-2 py-1 text-xs font-medium bg-[var(--blue)]/10 text-[var(--blue)] rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface)] text-[var(--text)] text-sm font-medium rounded-lg hover:bg-[var(--surface)]/80 transition-colors"
          >
            <CheckAllIcon />
            Mark all as read
          </button>
        )}
      </div>

      {/* Read Filter */}
      <div className="flex gap-2 mb-6">
        {(['all', 'unread', 'read'] as ReadFilter[]).map((filter) => (
          <button
            key={filter}
            onClick={() => setReadFilter(filter)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              readFilter === filter
                ? 'bg-[var(--blue)] text-white'
                : 'bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {/* Messages List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 bg-[var(--surface)] rounded-lg border border-[var(--surface)]">
          <InboxIcon className="w-12 h-12 mx-auto text-[var(--muted)] mb-4" />
          <p className="text-[var(--muted)]">
            {readFilter === 'unread'
              ? 'No unread messages'
              : readFilter === 'read'
              ? 'No read messages'
              : 'No contact messages yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`bg-[var(--surface)] rounded-lg border transition-colors ${
                message.is_read
                  ? 'border-[var(--surface)]'
                  : 'border-[var(--blue)]/30'
              }`}
            >
              {/* Message Header */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer"
                onClick={() =>
                  setExpandedId(expandedId === message.id ? null : message.id)
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  {!message.is_read && (
                    <span className="w-2 h-2 bg-[var(--blue)] rounded-full flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--text)] truncate">
                        {message.name}
                      </span>
                      <span className="text-[var(--muted)] text-sm truncate">
                        &lt;{message.email}&gt;
                      </span>
                    </div>
                    <p className="text-sm text-[var(--muted)] truncate mt-0.5">
                      {message.message.slice(0, 100)}
                      {message.message.length > 100 ? '...' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="text-xs text-[var(--muted)]">
                    {formatDate(message.created_at)}
                  </span>
                  <ChevronIcon
                    className={`w-5 h-5 text-[var(--muted)] transition-transform ${
                      expandedId === message.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === message.id && (
                <div className="px-4 pb-4 border-t border-[var(--bg)]">
                  <div className="pt-4">
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-[var(--muted)]">From:</span>
                        <span className="ml-2 text-[var(--text)]">
                          {message.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--muted)]">Email:</span>
                        <a
                          href={`mailto:${message.email}`}
                          className="ml-2 text-[var(--blue)] hover:underline"
                        >
                          {message.email}
                        </a>
                      </div>
                      <div>
                        <span className="text-[var(--muted)]">Received:</span>
                        <span className="ml-2 text-[var(--text)]">
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--muted)]">Status:</span>
                        <span
                          className={`ml-2 ${
                            message.is_read
                              ? 'text-[var(--muted)]'
                              : 'text-[var(--blue)]'
                          }`}
                        >
                          {message.is_read ? 'Read' : 'Unread'}
                        </span>
                      </div>
                    </div>
                    <div className="bg-[var(--bg)] rounded-lg p-4 mb-4">
                      <p className="text-[var(--text)] whitespace-pre-wrap">
                        {message.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleReadStatus(message.id, message.is_read);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[var(--bg)] text-[var(--text)] rounded-lg hover:bg-[var(--bg)]/80 transition-colors"
                      >
                        {message.is_read ? (
                          <>
                            <EnvelopeIcon />
                            Mark as unread
                          </>
                        ) : (
                          <>
                            <EnvelopeOpenIcon />
                            Mark as read
                          </>
                        )}
                      </button>
                      <a
                        href={`mailto:${message.email}?subject=Re: Contact Form Submission`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[var(--blue)] text-white rounded-lg hover:bg-[var(--blue)]/90 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ReplyIcon />
                        Reply
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(message.id);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-400/10 rounded-lg transition-colors ml-auto"
                      >
                        <TrashIcon />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

// Icons
function CheckAllIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z"
      />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  );
}

function EnvelopeOpenIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.98l7.5-4.04a2.25 2.25 0 012.134 0l7.5 4.04a2.25 2.25 0 011.183 1.98V18z"
      />
    </svg>
  );
}

function ReplyIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}
