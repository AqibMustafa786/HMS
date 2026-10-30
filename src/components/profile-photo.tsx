"use client";

import { Camera } from "lucide-react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { ChangeEvent, useState } from "react";
import { getFirebaseClient } from "@/lib/firebase/client";

export function ProfilePhoto({ patientId, initials }: { patientId: string; initials: string }) {
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return;
    setPending(true);
    try {
      const { storage, db } = getFirebaseClient();
      const path = ref(storage, `patientAvatars/${patientId}/profile-${Date.now()}`);
      await uploadBytes(path, file, { contentType: file.type });
      const photoUrl = await getDownloadURL(path);
      await updateDoc(doc(db, "patients", patientId), { photoUrl, updatedAt: new Date() });
      setUrl(photoUrl);
    } finally {
      setPending(false);
    }
  }

  return (
    <label className="profile-photo" title={pending ? "Uploading..." : "Change profile photo"}>
      {url ? <span className="profile-photo-image" style={{ backgroundImage: `url("${url}")` }} /> : <span>{initials}</span>}
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} disabled={pending} />
      <i><Camera size={13} /></i>
    </label>
  );
}
