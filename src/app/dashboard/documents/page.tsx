import { FileText, Filter, FolderOpen, Image as ImageIcon, Plus, Upload } from "lucide-react";

export default function DocumentsPage() {
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Clinical library</p><h1>Documents</h1><p className="subtle">Patient reports and staff credentials.</p></div><div className="heading-actions"><button className="btn btn-secondary"><FolderOpen size={15} /> New folder</button><button className="btn btn-primary"><Upload size={15} /> Upload files</button></div></div>
      <div className="document-cards"><button><span className="folder-icon blue"><FileText size={18} /></span><strong>Patient reports</strong><small>128 files</small></button><button><span className="folder-icon violet"><FileText size={18} /></span><strong>Lab results</strong><small>64 files</small></button>      <button><span className="folder-icon amber"><ImageIcon size={18} /></span><strong>Imaging</strong><small>43 files</small></button><button><span className="folder-icon green"><Plus size={18} /></span><strong>Staff credentials</strong><small>18 files</small></button></div>
      <div className="table-toolbar"><h2>Recent files</h2><button className="btn btn-secondary"><Filter size={15} /> Filter</button></div>
      <div className="panel empty-state"><FolderOpen size={22} /><strong>No documents uploaded</strong><small>Patient reports and staff credentials will appear here.</small></div>
    </>
  );
}
