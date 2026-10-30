import { MessageCircle, Search } from "lucide-react";

export default function MessagesPage() {
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Care conversations</p><h1>Messages</h1><p className="subtle">Private consultations with your assigned patients.</p></div></div>
      <section className="chat-layout panel"><aside className="chat-list"><div className="chat-list-search"><Search size={15} /><input placeholder="Search conversations" /></div><div className="empty-state compact"><MessageCircle size={20} /><strong>No conversations</strong><small>Authorized doctor-patient chats will appear here.</small></div></aside><div className="chat-main empty-state"><MessageCircle size={24} /><strong>Select a conversation</strong><small>Clinical messaging is available only for assigned care relationships.</small></div></section>
    </>
  );
}
