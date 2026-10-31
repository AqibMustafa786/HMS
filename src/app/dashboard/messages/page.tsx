"use client";

import { Camera, CheckCheck, FileText, Image as ImageIcon, MessageCircle, MoreHorizontal, Plus, Search, Send, Smile } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

type Contact = { uid: string; displayName: string; role: string; email: string; online: boolean; lastSeenAt: string | null };
type Conversation = { conversationId: string; participantUids: string[]; title: string; lastMessage?: { body: string; senderUid: string; sentAt: string | null } | null };
type ThreadMessage = { messageId: string; senderUid: string; body: string; sentAt: string | null; deliveredAt: string | null; seenAt: string | null; reactions: Record<string, string[]>; deletedForEveryone: boolean };

export default function MessagesPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState("");
  const [currentUid, setCurrentUid] = useState("");
  const [openMenu, setOpenMenu] = useState("");
  const [reactionPicker, setReactionPicker] = useState("");
  const [reactionQuery, setReactionQuery] = useState("");
  const [composerEmoji, setComposerEmoji] = useState(false);
  const [attachmentMenu, setAttachmentMenu] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const threadRef = useRef<HTMLDivElement>(null);

  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
  const emojiOptions = ["😀","😁","😂","🤣","😊","😍","😘","😋","😎","🙂","😐","😮","🥰","😇","🤔","😴","😢","😭","😡","👍","👎","👏","🙌","🙏","❤️","🔥","✨","🎉"];

  async function load() {
    const response = await fetch("/api/messages");
    if (!response.ok) return;
    const data = await response.json();
    setContacts(data.contacts ?? []);
    setConversations(data.conversations ?? []);
    setCurrentUid(data.currentUid ?? "");
  }

  async function loadUnreadCounts() {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    const counts: Record<string, number> = {};
    for (const item of data.notifications ?? []) {
      if (item.senderUid) counts[item.senderUid] = (counts[item.senderUid] ?? 0) + 1;
    }
    setUnreadCounts(counts);
  }

  async function openConversation(contactUid: string) {
    setSelected(contactUid);
    setUnreadCounts((current) => ({ ...current, [contactUid]: 0 }));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderUid: contactUid }),
    }).catch(() => undefined);
  }

  useEffect(() => {
    void fetch("/api/messages")
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => {
        setContacts(data?.contacts ?? []);
        setConversations(data?.conversations ?? []);
        setCurrentUid(data?.currentUid ?? "");
      });
    window.setTimeout(() => void loadUnreadCounts(), 0);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => void loadUnreadCounts(), 1500);
    return () => window.clearInterval(interval);
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

  useEffect(() => {
    const heartbeat = () => void fetch("/api/presence", { method: "POST" });
    heartbeat();
    const interval = window.setInterval(heartbeat, 60_000);
    const goOffline = () => void fetch("/api/presence", { method: "DELETE", keepalive: true });
    window.addEventListener("beforeunload", goOffline);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("beforeunload", goOffline);
      goOffline();
    };
  }, []);

  useEffect(() => {
    if (!selected) return;
    const interval = window.setInterval(() => {
      void fetch(`/api/messages?contactUid=${encodeURIComponent(selected)}`)
        .then(async (response) => response.ok ? response.json() : null)
        .then((data) => setThread(data?.thread ?? []));
    }, 800);
    return () => window.clearInterval(interval);
  }, [selected]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [thread]);

  async function updateMessage(messageId: string, action: "react", emoji = "👍") {
    await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactUid: selected, messageId, action, emoji }),
    });
    setOpenMenu("");
    setReactionPicker("");
  }

  async function deleteMessage(messageId: string, scope: "me" | "everyone") {
    await fetch("/api/messages", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactUid: selected, messageId, scope }),
    });
    setOpenMenu("");
    await load();
  }

  function attachFile(accept: string, multiple = false) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = multiple;
    input.onchange = () => {
      const files = Array.from(input.files ?? []);
      if (!files.length) return;
      const attachments = files.map((file) => `📎 ${file.name}`).join("\n");
      setMessage((value) => [value.trim(), attachments].filter(Boolean).join("\n"));
      setAttachmentMenu(false);
    };
    input.click();
  }

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
      const sentBody = message.trim();
      setMessage("");
      const optimistic: ThreadMessage = {
        messageId: `pending-${Date.now()}`,
        senderUid: currentUid,
        body: sentBody,
        sentAt: new Date().toISOString(),
        deliveredAt: null,
        seenAt: null,
        reactions: {},
        deletedForEveryone: false,
      };
      setThread((items) => [...items, optimistic]);
      await Promise.all([
        load(),
        fetch(`/api/messages?contactUid=${encodeURIComponent(selected)}`)
          .then(async (result) => result.ok ? result.json() : null)
          .then((data) => data && setThread(data.thread ?? [])),
      ]);
    }
    setSending(false);
  }

  const filteredContacts = contacts.filter((contact) => `${contact.displayName} ${contact.email}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <section className="chat-layout panel">
        <aside className="chat-list">
          <div className="chat-list-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search staff" /></div>
          <div className="chat-contacts">
            {filteredContacts.map((contact) => (
              <button type="button" className={`chat-contact ${selected === contact.uid ? "selected" : ""}`} key={contact.uid} onClick={() => void openConversation(contact.uid)}>
                <span className="avatar avatar-doctor">{contact.displayName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")}<i className={`status-dot ${contact.online ? "online" : ""}`} /></span>
                <span className="chat-contact-copy">
                  <span className="chat-contact-top"><strong>{contact.displayName}</strong><time>{contact.online ? "online" : ""}</time></span>
                  <span className="chat-contact-preview">
                    <small>{conversations.find((conversation) => conversation.participantUids.includes(contact.uid))?.lastMessage?.body ?? (contact.role === "superadmin" ? "Super administrator" : contact.role)}</small>
                    {(unreadCounts[contact.uid] ?? 0) > 0 && <b className="chat-unread-count">{unreadCounts[contact.uid]}</b>}
                  </span>
                </span>
              </button>
            ))}
            {filteredContacts.length === 0 && <div className="empty-state compact"><MessageCircle size={20} /><strong>No staff contacts</strong><small>Authorized staff accounts will appear here.</small></div>}
          </div>
        </aside>
        <div className="chat-main">
          {selected ? (
            <div className="message-composer">
              <div className="message-recipient">
                <span className="avatar avatar-doctor compact-avatar">{contacts.find((contact) => contact.uid === selected)?.displayName.split(/\s+/).slice(0,2).map((part) => part[0]?.toUpperCase()).join("")}</span>
                <span><strong>{contacts.find((contact) => contact.uid === selected)?.displayName}</strong><small>{contacts.find((contact) => contact.uid === selected)?.online ? "online" : "offline"}</small></span>
              </div>
              <div className="message-thread" ref={threadRef}>
                {thread.map((item) => {
                  const outgoing = item.senderUid === currentUid;
                  return (
                    <div className={`message-row ${outgoing ? "outgoing-row" : "incoming-row"}`} key={item.messageId}>
                      <div className={`message-bubble ${outgoing ? "outgoing" : "incoming"}`}>
                        {item.deletedForEveryone ? <em>This message was deleted</em> : <p>{item.body}</p>}
                        {!item.deletedForEveryone && Object.keys(item.reactions).length > 0 && (
                          <div className="message-reactions">{Object.entries(item.reactions).map(([emoji, uids]) => uids.length > 0 && <button key={emoji} onClick={() => void updateMessage(item.messageId, "react", emoji)}>{emoji} {uids.length}</button>)}</div>
                        )}
                        <span className="message-meta">
                          {item.sentAt ? new Date(item.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                          {outgoing && !item.deletedForEveryone && <CheckCheck size={12} className={item.seenAt ? "seen" : item.deliveredAt ? "delivered" : ""} />}
                        </span>
                      </div>
                      {!item.deletedForEveryone && (
                        <div className="message-actions">
                          <button type="button" aria-label="React" onClick={() => { setReactionPicker(reactionPicker === item.messageId ? "" : item.messageId); setReactionQuery(""); }}><Smile size={14} /></button>
                          <button type="button" aria-label="Message options" onClick={() => setOpenMenu(openMenu === item.messageId ? "" : item.messageId)}><MoreHorizontal size={14} /></button>
                          {reactionPicker === item.messageId && (
                            <div className="reaction-popover">
                              <div className="reaction-quick">{quickReactions.map((emoji) => <button key={emoji} type="button" onClick={() => void updateMessage(item.messageId, "react", emoji)}>{emoji}</button>)}</div>
                              <div className="reaction-picker-search"><Search size={13} /><input value={reactionQuery} onChange={(event) => setReactionQuery(event.target.value)} placeholder="Search reaction" /></div>
                              <div className="reaction-grid">{emojiOptions.filter((emoji) => reactionQuery ? emoji.includes(reactionQuery) : true).map((emoji) => (
                                <button key={emoji} type="button" onClick={() => void updateMessage(item.messageId, "react", emoji)}>{emoji}</button>
                              ))}</div>
                            </div>
                          )}
                          {openMenu === item.messageId && <div className="message-menu">
                            <button onClick={() => void deleteMessage(item.messageId, "me")}>Delete for me</button>
                            {outgoing && <button onClick={() => void deleteMessage(item.messageId, "everyone")}>Delete for everyone</button>}
                          </div>}
                        </div>
                      )}
                    </div>
                  );
                })}
                {thread.length === 0 && <p className="message-empty">No messages yet. Start the conversation.</p>}
              </div>
              <form className="chat-composer" onSubmit={send}>
                <div className="composer-tools">
                  <button className="chat-tool-btn" type="button" aria-label="Add attachment" onClick={() => { setAttachmentMenu((open) => !open); setComposerEmoji(false); }}><Plus size={19} /></button>
                  <button className="chat-tool-btn" type="button" aria-label="Add emoji" onClick={() => { setComposerEmoji((open) => !open); setAttachmentMenu(false); }}><Smile size={18} /></button>
                  {attachmentMenu && (
                    <div className="composer-popover attachment-popover">
                      <button type="button" onClick={() => attachFile(".pdf,.doc,.docx,.txt,application/msword,application/pdf")}><FileText size={18} /><span>Document</span></button>
                      <button type="button" onClick={() => attachFile("image/*,video/*", true)}><ImageIcon size={18} /><span>Photos & videos</span></button>
                      <button type="button" onClick={() => attachFile("image/*")}><Camera size={18} /><span>Camera</span></button>
                    </div>
                  )}
                  {composerEmoji && (
                    <div className="composer-popover emoji-composer-popover">
                      <div className="reaction-picker-search"><Search size={13} /><input value={reactionQuery} onChange={(event) => setReactionQuery(event.target.value)} placeholder="Search emoji" /></div>
                      <div className="reaction-grid">{emojiOptions.filter((emoji) => reactionQuery ? emoji.includes(reactionQuery) : true).map((emoji) => (
                        <button key={emoji} type="button" onClick={() => { setMessage((value) => `${value}${emoji}`); setComposerEmoji(false); }}>{emoji}</button>
                      ))}</div>
                    </div>
                  )}
                </div>
                <input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }} maxLength={4000} placeholder="Write a message" aria-label="Message" />
                <button className="chat-send-btn" type="submit" disabled={sending || !message.trim()} aria-label="Send message"><Send size={16} />{sending && <span>Sending</span>}</button>
              </form>
            </div>
          ) : <div className="empty-state"><MessageCircle size={24} /><strong>Select a staff contact</strong><small>Doctors and administrators can exchange authorized internal messages.</small></div>}
        </div>
      </section>
    </>
  );
}
