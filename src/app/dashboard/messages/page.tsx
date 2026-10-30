"use client";

import { MessageCircle, Search, Send } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type Contact = { uid: string; displayName: string; role: string; email: string };
type Conversation = { conversationId: string; participantUids: string[]; title: string; lastMessage?: { body: string; senderUid: string; sentAt: string | null } | null };
type ThreadMessage = { messageId: string; senderUid: string; body: string; sentAt: string | null };

export default function MessagesPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState("");

  async function load() {
    const response = await fetch("/api/messages");
    if (!response.ok) return;
    const data = await response.json();
    setContacts(data.contacts ?? []);
    setConversations(data.conversations ?? []);
  }

  useEffect(() => {
    void fetch("/api/messages")
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => {
        setContacts(data?.contacts ?? []);
        setConversations(data?.conversations ?? []);
      });
  }, []);
  useEffect(() => {
    if (!selected) {
      return;
    }
    fetch(`/api/messages?contactUid=${encodeURIComponent(selected)}`)
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => setThread(data?.thread ?? []))
      .catch(() => undefined);
  }, [selected, conversations.length]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !message.trim()) return;
    setSending(true);
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactUid: selected, body: message.trim() }),
    });
    if (response.ok) {
      setMessage("");
      await load();
    }
    setSending(false);
  }

  const filteredContacts = contacts.filter((contact) => `${contact.displayName} ${contact.email}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Care conversations</p><h1>Messages</h1><p className="subtle">Private consultations with your assigned patients.</p></div></div>
      <section className="chat-layout panel">
        <aside className="chat-list">
          <div className="chat-list-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search staff" /></div>
          <div className="chat-contacts">
            {filteredContacts.map((contact) => (
              <button type="button" className={`chat-contact ${selected === contact.uid ? "selected" : ""}`} key={contact.uid} onClick={() => setSelected(contact.uid)}>
                <span className="avatar avatar-doctor">{contact.displayName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")}<i className="status-dot" /></span>
                <span><strong>{contact.displayName}</strong><small>{contact.role === "superadmin" ? "Super administrator" : contact.role}</small></span>
              </button>
            ))}
            {filteredContacts.length === 0 && <div className="empty-state compact"><MessageCircle size={20} /><strong>No staff contacts</strong><small>Authorized staff accounts will appear here.</small></div>}
          </div>
        </aside>
        <div className="chat-main">
          {selected ? (
            <form className="message-composer" onSubmit={send}>
              <div className="message-recipient"><strong>{contacts.find((contact) => contact.uid === selected)?.displayName}</strong><small>Internal authorized conversation</small></div>
              <div className="message-thread">
                {thread.map((item) => <div className="message-bubble" key={item.messageId}>{item.body}</div>)}
                {thread.length === 0 && <p className="message-empty">No messages yet. Start the conversation.</p>}
              </div>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={4000} rows={3} placeholder="Write a secure message..." />
              <button className="btn btn-primary" type="submit" disabled={sending}><Send size={14} />{sending ? "Sending..." : "Send"}</button>
            </form>
          ) : <div className="empty-state"><MessageCircle size={24} /><strong>Select a staff contact</strong><small>Doctors and administrators can exchange authorized internal messages.</small></div>}
        </div>
      </section>
    </>
  );
}
