"use client";

import { FileText, FolderOpen, Image as ImageIcon, Plus, Upload } from "lucide-react";
import { useRef, useState } from "react";

export default function DocumentsPage() {
  const uploadRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<string[]>([]);
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Clinical library</p><h1>Documents</h1><p className="subtle">Patient reports and staff credentials.</p></div><div className="heading-actions"><button className="btn btn-secondary" onClick={() => setFiles((current) => [...current, `New folder ${current.length + 1}`])}><FolderOpen size={15} /> New folder</button><input ref={uploadRef} hidden type="file" multiple onChange={(event) => setFiles((current) => [...current, ...Array.from(event.target.files ?? []).map((file) => file.name)])} /><button className="btn btn-primary" onClick={() => uploadRef.current?.click()}><Upload size={15} /> Upload files</button></div></div>
      <div className="document-cards"><button><span className="folder-icon blue"><FileText size={18} /></span><strong>Patient reports</strong><small>128 files</small></button><button><span className="folder-icon violet"><FileText size={18} /></span><strong>Lab results</strong><small>64 files</small></button>      <button><span className="folder-icon amber"><ImageIcon size={18} /></span><strong>Imaging</strong><small>43 files</small></button><button><span className="folder-icon green"><Plus size={18} /></span><strong>Staff credentials</strong><small>18 files</small></button></div>
      <div className="table-toolbar"><h2>Recent files</h2><select aria-label="Filter documents" defaultValue="all"><option value="all">All documents</option><option value="reports">Patient reports</option><option value="lab">Lab results</option><option value="imaging">Imaging</option></select></div>
      {files.length === 0 ? <div className="panel empty-state"><FolderOpen size={22} /><strong>No documents uploaded</strong><small>Patient reports and staff credentials will appear here.</small></div> : <div className="panel">{files.map((file) => <div className="document-row" key={`${file}-${files.indexOf(file)}`}><FileText size={16} /><strong>{file}</strong></div>)}</div>}
    </>
  );
}
