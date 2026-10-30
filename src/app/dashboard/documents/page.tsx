import { Download, FileText, Filter, FolderOpen, Image as ImageIcon, Plus, Upload } from "lucide-react";

const documents = [["ECG report.pdf","Sara Khan","PDF","2.4 MB","Today, 10:42"],["Blood test report.pdf","Sara Khan","PDF","1.1 MB","Oct 24, 2026"],["Clinical certificate.pdf","Dr. Ayesha Malik","PDF","860 KB","Oct 20, 2026"],["Chest X-ray.jpg","Hamza Tariq","Image","4.8 MB","Oct 18, 2026"]];

export default function DocumentsPage() {
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Clinical library</p><h1>Documents</h1><p className="subtle">Patient reports and staff credentials.</p></div><div className="heading-actions"><button className="btn btn-secondary"><FolderOpen size={15} /> New folder</button><button className="btn btn-primary"><Upload size={15} /> Upload files</button></div></div>
      <div className="document-cards"><button><span className="folder-icon blue"><FileText size={18} /></span><strong>Patient reports</strong><small>128 files</small></button><button><span className="folder-icon violet"><FileText size={18} /></span><strong>Lab results</strong><small>64 files</small></button>      <button><span className="folder-icon amber"><ImageIcon size={18} /></span><strong>Imaging</strong><small>43 files</small></button><button><span className="folder-icon green"><Plus size={18} /></span><strong>Staff credentials</strong><small>18 files</small></button></div>
      <div className="table-toolbar"><h2>Recent files</h2><button className="btn btn-secondary"><Filter size={15} /> Filter</button></div>
      <div className="panel data-table document-table"><div className="table-row table-header"><span>Name</span><span>Owner</span><span>Type</span><span>Size</span><span>Uploaded</span><span /></div>{documents.map(([name,owner,type,size,date]) => <div className="table-row" key={name}><span className="patient-cell"><span className="file-icon"><FileText size={17} /></span><strong>{name}</strong></span><span>{owner}</span><span>{type}</span><span>{size}</span><span>{date}</span><button aria-label={`Download ${name}`}><Download size={15} /></button></div>)}</div>
    </>
  );
}
