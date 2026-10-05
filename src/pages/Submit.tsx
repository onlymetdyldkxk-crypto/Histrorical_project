import React, { useEffect, useRef, useState } from "react";
import { useStore } from "../lib/store";
import type { DocType, SourceDoc } from "../lib/types";
import { docTypeLabel, fmtBytes, fmtDate, fmtDateTime } from "../lib/utils";
import { Button, Card, Checkbox, ConfirmDialog, Field, Icon, Input, KV, Stepper, Textarea } from "../components/ui";
import { cn } from "../utils/cn";

/* ---------------- file helpers ---------------- */

interface LocalFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
}

const OK_EXT = ["pdf", "doc", "docx", "ppt", "pptx", "txt", "rtf", "odt", "jpg", "jpeg", "png", "tif", "tiff", "webp", "heic", "bmp"];
const IMG_EXT = ["jpg", "jpeg", "png", "tif", "tiff", "webp", "heic", "bmp"];

const extOf = (n: string) => (n.split(".").pop() || "").toLowerCase();

function toDocType(name: string, isImageSet: boolean): DocType {
  const e = extOf(name);
  if (e === "pdf") return "pdf";
  if (["ppt", "pptx"].includes(e)) return "slides";
  if (["doc", "docx", "txt", "rtf", "odt"].includes(e)) return "doc";
  if (IMG_EXT.includes(e)) return isImageSet ? "images" : "image";
  return "other";
}

let fileUid = 0;

/* ---------------- Bilingual Rules & Terms Data ---------------- */

const rulesData = [
  {
    num: 1,
    titleEn: "Right & Permission",
    titleMr: "हक्क व परवानगी",
    descEn: "User confirms they have the legal right or permission to submit the document for conversion.",
    descMr: "वापरकर्त्याने पुष्टी केली पाहिजे की त्यांच्याकडे हे दस्तऐवज सबमिट करण्याचे कायदेशीर हक्क आहेत.",
  },
  {
    num: 2,
    titleEn: "Document Quality & Clarity",
    titleMr: "दस्तऐवजाची गुणवत्ता व स्पष्टता",
    descEn: "Original image clarity and legibility directly affect processing speed and transcription accuracy.",
    descMr: "मूळ दस्तऐवजाची स्पष्टता थेट प्रक्रियेचा वेग आणि अचूकतेवर परिणाम करते.",
  },
  {
    num: 3,
    titleEn: "Manual Admin Review",
    titleMr: "प्रशासकीय पुनरावलोकन",
    descEn: "Every submitted request is manually inspected by the admin team before formal acceptance.",
    descMr: "प्रत्येक विनंती स्वीकारण्यापूर्वी आमच्या प्रशासक टीमद्वारे तिची व्यक्तिशः तपासणी केली जाते.",
  },
  {
    num: 4,
    titleEn: "No Guaranteed Acceptance",
    titleMr: "स्वीकृतीची कोणतीही हमी नाही",
    descEn: "Submission does not guarantee acceptance if the document is unreadable or violates policies.",
    descMr: "दस्तऐवज अस्पष्ट असल्यास किंवा नियमांचे उल्लंघन करत असल्यास ते नाकारले जाऊ शकते.",
  },
  {
    num: 5,
    titleEn: "Quotation & Timeline",
    titleMr: "दरपत्रक व वेळ",
    descEn: "Processing charges and estimated completion date are decided and issued after admin review.",
    descMr: "प्रक्रियेचे शुल्क आणि अंदाजे वेळ पुनरावलोकनानंतरच निश्चित करून कळवले जाते.",
  },
  {
    num: 6,
    titleEn: "Approval & Payment Required",
    titleMr: "मंजुरी व पेमेंट आवश्यक",
    descEn: "Actual processing begins only after quotation approval and successful payment confirmation.",
    descMr: "दरपत्रकाची मंजुरी आणि पेमेंट यशस्वी झाल्यानंतरच प्रत्यक्ष कामाला सुरुवात होते.",
  },
  {
    num: 7,
    titleEn: "Accurate Information",
    titleMr: "अचूक माहिती",
    descEn: "User must provide accurate contact information and truthful document details.",
    descMr: "वापरकर्त्याने स्वतःची आणि दस्तऐवजाची सर्व माहिती खरी व अचूक देणे आवश्यक आहे.",
  },
  {
    num: 8,
    titleEn: "Google Drive Access",
    titleMr: "गूगल ड्राईव्ह प्रवेश",
    descEn: "Google Drive links must be set to 'Anyone with the link can view' for manual review.",
    descMr: "गूगल ड्राईव्ह लिंक वापरल्यास ती सर्वांसाठी पाहण्यायोग्य (Public/View access) असावी.",
  },
  {
    num: 9,
    titleEn: "Completion Notifications",
    titleMr: "पूर्णतेची सूचना",
    descEn: "Users will be notified via email and in-app alerts when the converted document is ready.",
    descMr: "दस्तऐवज तयार झाल्यावर ईमेल आणि इन-ॲप नोटिफिकेशनद्वारे कळवले जाईल.",
  },
  {
    num: 10,
    titleEn: "Rejection Rights",
    titleMr: "नाकारण्याचा अधिकार",
    descEn: "Admin reserves the right to decline requests that cannot reasonably be processed.",
    descMr: "प्रक्रिया करणे शक्य नसल्यास विनंती नाकारण्याचा पूर्ण अधिकार प्रशासकाकडे राहील.",
  },
];

/* ==================================================================== */

export default function Submit() {
  const { user, submitRequest, toast } = useStore();

  const [step, setStep] = useState(0);
  const [source, setSource] = useState<"file" | "drive">("file");
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [driveAdded, setDriveAdded] = useState("");
  const [driveError, setDriveError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [created, setCreated] = useState<{ id: string; at: string } | null>(null);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);

  // Mandatory Terms & Rules Checkboxes
  const [terms, setTerms] = useState({
    rightToSubmit: false,
    infoCorrect: false,
    manualReview: false,
    quoteAfterReview: false,
    rulesAgreed: false,
  });

  const allTermsChecked =
    terms.rightToSubmit &&
    terms.infoCorrect &&
    terms.manualReview &&
    terms.quoteAfterReview &&
    terms.rulesAgreed;

  const toggleAllTerms = (val: boolean) => {
    setTerms({
      rightToSubmit: val,
      infoCorrect: val,
      manualReview: val,
      quoteAfterReview: val,
      rulesAgreed: val,
    });
  };

  const [form, setForm] = useState({
    fullName: user?.name ?? "",
    age: "",
    gender: "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    address: "",
    purpose: "",
    processing: "",
    outputFormat: "PDF (clean transcription)",
    instructions: "",
    notes: "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  useEffect(() => () => timers.current.forEach(clearInterval), []);

  /* ---------------- file intake ---------------- */

  const addFiles = (list: FileList | File[]) => {
    setFileError("");
    const incoming = Array.from(list);
    if (!incoming.length) return;
    const good: LocalFile[] = [];
    for (const f of incoming) {
      const e = extOf(f.name);
      if (!OK_EXT.includes(e)) {
        setFileError("This file format is not currently supported. Please try a PDF, Word, PPT, text or image file.");
        continue;
      }
      const lf: LocalFile = { id: `f${fileUid++}`, name: f.name, size: f.size, progress: 0, status: "uploading" };
      good.push(lf);
    }
    if (!good.length) return;
    setFiles((prev) => [...prev, ...good]);
    for (const lf of good) {
      const t = window.setInterval(() => {
        setFiles((prev) =>
          prev.map((x) => {
            if (x.id !== lf.id || x.status === "done") return x;
            const next = Math.min(100, x.progress + 14 + Math.random() * 22);
            if (next >= 100 && lf.size > 80 * 1024 * 1024) return { ...x, progress: 100, status: "error", error: "Something went wrong while uploading this file. Please try again." };
            if (next >= 100) { clearInterval(t); return { ...x, progress: 100, status: "done" }; }
            return { ...x, progress: next };
          })
        );
      }, 180);
      timers.current.push(t);
    }
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));
  const replaceFile = (id: string) => {
    removeFile(id);
    window.setTimeout(() => inputRef.current?.click(), 0);
  };

  const imagesInSet = files.filter((f) => IMG_EXT.includes(extOf(f.name))).length;
  const allDone = files.length > 0 && files.every((f) => f.status === "done");
  const anyError = files.some((f) => f.status === "error");
  const fileSourceOk = source === "drive" ? driveAdded !== "" : allDone && !anyError;

  const addDrive = () => {
    setDriveError("");
    if (!driveUrl.trim()) return setDriveError("Please paste the Google Drive link first.");
    if (!/drive\.google\.com/i.test(driveUrl))
      return setDriveError("That doesn't look like a Google Drive link. Please use a link that starts with https://drive.google.com/…");
    setDriveAdded(driveUrl.trim());
    toast("Google Drive link added.", "success", "Our team will open it manually during review.");
  };

  /* ---------------- document object ---------------- */

  const buildDoc = (): SourceDoc | null => {
    if (source === "drive")
      return { kind: "drive", fileName: "Google Drive submission", fileType: "link", driveUrl: driveAdded };
    const names = files.filter((f) => f.status === "done");
    if (!names.length) return null;
    const total = names.reduce((a, b) => a + b.size, 0);
    const single = names.length === 1;
    return {
      kind: "file",
      fileName: single ? names[0].name : `${names[0].name} + ${names.length - 1} more`,
      fileType: toDocType(names[0].name, names.length > 1 || imagesInSet > 1),
      fileSize: total,
      fileCount: names.length,
    };
  };

  /* ---------------- validation ---------------- */

  const errs: Record<string, string> = {};
  if (form.fullName.trim().length < 2) errs.fullName = "Please enter your full name.";
  if (form.age && (!/^\d{1,3}$/.test(form.age) || +form.age < 1 || +form.age > 130)) errs.age = "Please enter a valid age.";
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Please enter a valid email address.";
  if (form.phone && form.phone.replace(/[^\d]/g, "").length < 7) errs.phone = "Please enter a valid phone number.";
  if (form.purpose.trim().length < 10) errs.purpose = "Please tell us a little about what you need.";
  if (form.processing.trim().length < 5) errs.processing = "Please describe the processing you want.";

  const tryStep = (next: number) => {
    setTouched(true);
    if (step === 0 && !fileSourceOk) {
      if (source === "drive" && !driveAdded) setDriveError("Please add your Google Drive link.");
      else setFileError("Please add at least one supported file and wait for it to finish.");
      return;
    }
    if (step === 1 && Object.keys(errs).length) return;
    setTouched(false);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const doSubmit = async () => {
    const doc = buildDoc();
    if (!doc) return;
    const req = await submitRequest({ document: doc, requirements: form });
    setCreated({ id: req.id, at: req.submittedAt });
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const steps = ["Upload", "Details", "Review & Terms", "Done"];

  /* ==================================================================== */

  return (
    <div className="mx-auto max-w-5xl px-5 pb-8 pt-10">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">New request</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink">Submit a Document</h1>
        <p className="mx-auto mt-3 max-w-md text-[13.5px] leading-relaxed text-ink-soft">
          Three short steps. Nothing is paid until our team reviews your document and sends a quote.
        </p>
      </div>

      <div className="mt-9">
        <Stepper steps={steps} current={step} onStep={(i) => i < step && step < 3 && setStep(i)} />
      </div>

      {/* ================= STEP 1 — UPLOAD ================= */}
      {step === 0 && (
        <div className="anim-pop mx-auto max-w-3xl mt-8 space-y-6">
          {/* source switch */}
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { k: "file", icon: "upload", t: "Upload File", d: "PDF, Word, PPT, images…" },
                { k: "drive", icon: "link", t: "Google Drive Link", d: "Share a Drive file or folder" },
              ] as const
            ).map((s) => (
              <button
                key={s.k}
                onClick={() => { setSource(s.k); setFileError(""); setDriveError(""); }}
                className={cn(
                  "corner-ticks border p-4 text-left transition-all duration-200",
                  source === s.k ? "border-accent bg-accent/6 shadow-soft" : "border-line bg-card hover:border-ink/30"
                )}
              >
                <span className={cn("flex items-center gap-2 text-[14px] font-semibold", source === s.k ? "text-accent" : "text-ink")}>
                  <Icon name={s.icon} size={17} /> {s.t}
                  {source === s.k && <Icon name="check" size={14} className="ml-auto" />}
                </span>
                <span className="mt-1 block text-[11.5px] text-ink-faint">{s.d}</span>
              </button>
            ))}
          </div>

          {source === "file" ? (
            <>
              {/* dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
                className={cn(
                  "corner-ticks relative border-2 border-dashed px-6 py-12 text-center transition-all duration-200",
                  dragging ? "border-accent bg-accent/6 scale-[1.005]" : "border-line bg-card"
                )}
              >
                <span className="mx-auto grid h-14 w-14 place-items-center border border-line bg-parchment/60 text-gold">
                  <Icon name="upload" size={24} />
                </span>
                <p className="mt-4 font-display text-xl font-semibold text-ink">Drag & drop your document here</p>
                <p className="mt-1.5 text-[12.5px] text-ink-faint">
                  PDF · Word · PPT/PPTX · TXT/RTF · JPG/PNG/TIFF (multiple images welcome)
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <Button variant="secondary" icon="folder" onClick={() => inputRef.current?.click()}>
                    Browse Files
                  </Button>
                  {files.length > 0 && (
                    <Button variant="ghost" icon="plus" onClick={() => inputRef.current?.click()}>
                      Add more
                    </Button>
                  )}
                </div>
                <input ref={inputRef} type="file" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
                <p className="mt-6 flex items-center justify-center gap-2 text-[11.5px] text-ink-faint">
                  <Icon name="hand" size={13} className="text-gold" />
                  Your document will be manually reviewed by our team before processing begins.
                </p>
              </div>

              {fileError && (
                <p className="anim-fade flex items-start gap-2 border border-accent/30 bg-accent/8 px-4 py-3 text-[12.5px] text-accent-deep">
                  <Icon name="alert" size={15} className="mt-0.5 shrink-0" /> {fileError}
                </p>
              )}

              {/* file list */}
              {files.length > 0 && (
                <div className="space-y-3">
                  {files.map((f) => (
                    <div key={f.id} className={cn("anim-pop border bg-card p-4", f.status === "error" ? "border-accent/40" : "border-line")}>
                      <div className="flex items-center gap-3.5">
                        <span className={cn("grid h-10 w-10 shrink-0 place-items-center border", f.status === "error" ? "border-accent/40 bg-accent/10 text-accent" : "border-line bg-parchment/50 text-accent")}>
                          <Icon name={IMG_EXT.includes(extOf(f.name)) ? "image" : "doc"} size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-[13.5px] font-semibold text-ink">{f.name}</p>
                            <div className="flex shrink-0 gap-1">
                              {f.status === "done" && (
                                <button onClick={() => replaceFile(f.id)} className="grid h-8 w-8 place-items-center border border-line text-ink-faint transition-colors hover:border-accent/50 hover:text-accent" title="Replace file">
                                  <Icon name="refresh" size={14} />
                                </button>
                              )}
                              <button onClick={() => removeFile(f.id)} className="grid h-8 w-8 place-items-center border border-line text-ink-faint transition-colors hover:border-accent/50 hover:text-accent" title="Remove file">
                                <Icon name="trash" size={14} />
                              </button>
                            </div>
                          </div>
                          <p className="mt-0.5 text-[11.5px] text-ink-faint">
                            {f.status === "error" ? (
                              <span className="text-accent-deep">{f.error}</span>
                            ) : (
                              <>
                                {docTypeLabel[toDocType(f.name, files.length > 1)]} · {fmtBytes(f.size)} ·{" "}
                                {f.status === "uploading" ? `Uploading ${Math.round(f.progress)}%` : "Upload complete"}
                              </>
                            )}
                          </p>
                          {f.status !== "error" && (
                            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-line-soft">
                              <div className={cn("h-full rounded-full transition-all duration-200", f.status === "done" ? "bg-moss" : "bg-gold")} style={{ width: `${f.progress}%` }} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Drive link */
            <Card ticks className="p-6">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                <Icon name="link" size={16} className="text-gold" /> Google Drive URL
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">
                Paste a link to the file or folder. Make sure it is shared with <span className="font-medium text-ink">“Anyone with the link can view”</span> so our
                team can open it.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Input placeholder="https://drive.google.com/file/d/…" value={driveUrl} onChange={(e) => { setDriveUrl(e.target.value); setDriveError(""); }} />
                <Button variant="secondary" icon="plus" onClick={addDrive} className="shrink-0">
                  Add Link
                </Button>
              </div>
              {driveError && (
                <p className="anim-fade mt-3 flex items-start gap-2 text-[12.5px] font-medium text-accent">
                  <Icon name="alert" size={15} className="mt-0.5 shrink-0" /> {driveError}
                </p>
              )}
              {driveAdded && (
                <div className="anim-pop mt-4 flex items-center gap-3 border border-moss/30 bg-moss/8 p-3.5">
                  <Icon name="check" size={16} className="shrink-0 text-moss" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-ink">Link added — our team will access it manually.</p>
                    <p className="truncate text-[11.5px] text-ink-faint">{driveAdded}</p>
                  </div>
                  <button onClick={() => { setDriveAdded(""); setDriveUrl(""); }} className="grid h-8 w-8 shrink-0 place-items-center border border-line text-ink-faint hover:border-accent/50 hover:text-accent" title="Remove link">
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              )}
            </Card>
          )}

          <div className="flex items-center justify-between border-t border-line-soft pt-6">
            <p className="text-[12px] text-ink-faint">Step 1 of 3 · Add the document</p>
            <Button size="lg" iconRight="arrowR" onClick={() => tryStep(1)} disabled={!fileSourceOk}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* ================= STEP 2 — DETAILS ================= */}
      {step === 1 && (
        <div className="anim-pop mx-auto max-w-3xl mt-8 space-y-7">
          <Card ticks className="p-6 sm:p-7">
            <h2 className="font-display text-2xl font-semibold text-ink">About you</h2>
            <p className="mt-1 text-[12.5px] text-ink-soft">
              These details help us address your request properly. Fields marked <span className="font-medium text-ink-faint">optional</span> are only used if relevant.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field label="Full Name" required error={touched ? errs.fullName : undefined}>
                <Input value={form.fullName} onChange={set("fullName")} placeholder="Your name" invalid={touched && !!errs.fullName} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Age" optional error={touched ? errs.age : undefined} hint="Helps us tailor the reading level of the output.">
                  <Input type="number" min={1} max={120} value={form.age} onChange={set("age")} placeholder="e.g. 34" invalid={touched && !!errs.age} />
                </Field>
                <Field label="Gender" optional>
                  <div className="relative">
                    <select value={form.gender} onChange={set("gender")} className="w-full appearance-none rounded-md border border-line bg-cream px-3.5 py-2.5 pr-9 text-sm text-ink focus:border-accent/60 focus:outline-none">
                      <option value="">Prefer not to say</option>
                      <option>Female</option>
                      <option>Male</option>
                      <option>Non-binary</option>
                    </select>
                    <Icon name="chevronD" size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                  </div>
                </Field>
              </div>
              <Field label="Email" required error={touched ? errs.email : undefined} hint="Where quote and completion updates are sent.">
                <Input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" invalid={touched && !!errs.email} />
              </Field>
              <Field label="Phone Number" optional error={touched ? errs.phone : undefined} hint="Only if we need to reach you quickly.">
                <Input type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 …" invalid={touched && !!errs.phone} />
              </Field>
              <Field label="Address" optional className="sm:col-span-2" hint="Optional — only useful for documents with local or legal context.">
                <Input value={form.address} onChange={set("address")} placeholder="Street, city, state" />
              </Field>
            </div>
          </Card>

          <Card ticks className="p-6 sm:p-7">
            <h2 className="font-display text-2xl font-semibold text-ink">About your document</h2>
            <div className="mt-6 space-y-5">
              <Field label="Purpose of Document Processing" required error={touched ? errs.purpose : undefined} hint="Why do you need this, and what should we focus on?">
                <Textarea value={form.purpose} onChange={set("purpose")} className="min-h-[130px]" placeholder="Tell us what you need from this document…" invalid={touched && !!errs.purpose} />
              </Field>
              <Field label="What do you want us to do with this document?" required error={touched ? errs.processing : undefined}>
                <Textarea value={form.processing} onChange={set("processing")} placeholder="e.g. Transcribe all pages into modern language, with a short summary of the key points…" />
              </Field>
              <Field label="Preferred Output Format" required>
                <div className="grid gap-2 sm:grid-cols-2">
                  {["PDF (clean transcription)", "Word document", "Print-ready images", "CSV / table + PDF", "Plain text notes"].map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setForm({ ...form, outputFormat: o })}
                      className={cn(
                        "flex items-center gap-2.5 border px-3.5 py-2.5 text-left text-[13px] font-medium transition-all",
                        form.outputFormat === o ? "border-accent bg-accent/8 text-accent" : "border-line bg-cream text-ink-soft hover:border-ink/30"
                      )}
                    >
                      <span className={cn("grid h-4 w-4 place-items-center rounded-full border", form.outputFormat === o ? "border-accent" : "border-ink/30")}>
                        {form.outputFormat === o && <span className="h-2 w-2 rounded-full bg-accent" />}
                      </span>
                      {o}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Additional Instructions" optional>
                <Textarea value={form.instructions} onChange={set("instructions")} placeholder="Anything specific — words to check carefully, names you already know, how to mark unreadable parts…" />
              </Field>
              <Field label="Optional Notes" optional>
                <Textarea value={form.notes} onChange={set("notes")} className="min-h-[80px]" placeholder="Anything else we should know — history of the document, damage, language…" />
              </Field>
            </div>
          </Card>

          <div className="flex items-center justify-between border-t border-line-soft pt-6">
            <Button variant="subtle" icon="arrowL" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button size="lg" iconRight="arrowR" onClick={() => tryStep(2)}>
              Review & Terms
            </Button>
          </div>
        </div>
      )}

      {/* ================= STEP 3 — REVIEW & TERMS (2-COLUMN DESKTOP LAYOUT) ================= */}
      {step === 2 && (
        <div className="anim-pop mt-8 space-y-6">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Final Step</p>
            <h2 className="font-display text-3xl font-semibold text-ink">Review & Terms / पुनरावलोकन व अटी</h2>
            <p className="mx-auto mt-1.5 max-w-md text-[13.5px] text-ink-soft">
              Please inspect your submission details on the left and accept our service terms on the right before submitting.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            {/* LEFT COLUMN — Submission Details */}
            <div className="space-y-4">
              <ReviewCard title="Document Details" icon={source === "drive" ? "link" : "doc"} onEdit={() => setStep(0)}>
                {source === "drive" ? (
                  <>
                    <KV k="Source" v="Google Drive Link" />
                    <KV k="URL" v={<span className="break-all font-mono text-[11.5px]">{driveAdded}</span>} mono />
                  </>
                ) : (
                  files
                    .filter((f) => f.status === "done")
                    .map((f) => (
                      <div key={f.id} className="flex items-center justify-between gap-4 border-b border-line-soft py-2.5 last:border-0">
                        <span className="truncate text-[13px] font-medium text-ink">{f.name}</span>
                        <span className="shrink-0 text-[12px] text-ink-faint">
                          {docTypeLabel[toDocType(f.name, files.length > 1)]} · {fmtBytes(f.size)}
                        </span>
                      </div>
                    ))
                )}
              </ReviewCard>

              <ReviewCard title="User Details" icon="user" onEdit={() => setStep(1)}>
                <KV k="Full Name" v={form.fullName} />
                <KV k="Age" v={form.age || "—"} />
                <KV k="Gender" v={form.gender || "—"} />
                <KV k="Email" v={form.email} />
                <KV k="Phone" v={form.phone || "—"} />
                <KV k="Address" v={form.address || "—"} />
              </ReviewCard>

              <ReviewCard title="Requirements & Instructions" icon="quill" onEdit={() => setStep(1)}>
                <KV k="Output Format" v={form.outputFormat} />
                <div className="py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Purpose of Processing</p>
                  <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-ink">{form.purpose}</p>
                </div>
                <div className="border-t border-line-soft py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Requested Processing</p>
                  <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-ink">{form.processing}</p>
                </div>
                {form.instructions && (
                  <div className="border-t border-line-soft py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Additional Instructions</p>
                    <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-ink">{form.instructions}</p>
                  </div>
                )}
                {form.notes && (
                  <div className="border-t border-line-soft py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Optional Notes</p>
                    <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-ink">{form.notes}</p>
                  </div>
                )}
              </ReviewCard>
            </div>

            {/* RIGHT COLUMN — Rules & Terms (Bilingual & Scrollable) */}
            <div className="space-y-4">
              <Card ticks className="p-5 sm:p-6">
                <div className="flex items-center justify-between border-b border-line-soft pb-3">
                  <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
                    <Icon name="shield" size={18} className="text-gold" /> Rules & Service Terms / नियम व अटी
                  </h3>
                  <span className="rounded bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold">10 Rules</span>
                </div>
                <p className="mt-2 text-[12px] text-ink-soft">
                  Please review the rules below in English & Marathi before accepting.
                </p>

                {/* Scrollable Numbered Rule Cards Container */}
                <div className="mt-4 max-h-[300px] overflow-y-auto space-y-3 pr-1">
                  {rulesData.map((rule) => (
                    <div key={rule.num} className="border border-line bg-parchment/30 p-3.5 transition-colors hover:border-gold/40">
                      <div className="flex items-start gap-3">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold/15 text-[11px] font-bold text-accent">
                          {rule.num}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-ink">
                            {rule.titleEn} <span className="text-ink-faint font-normal">| {rule.titleMr}</span>
                          </p>
                          <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
                            {rule.descEn}
                          </p>
                          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-faint font-sans">
                            {rule.descMr}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mandatory Grouped Checkboxes (Agreement / सहमती) */}
                <div className="mt-5 border-t border-line-soft pt-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11.5px] font-bold uppercase tracking-wider text-accent">
                      Agreement / सहमती
                    </p>
                    <span className="text-[11px] text-ink-faint">All required</span>
                  </div>

                  <Checkbox
                    checked={terms.rightToSubmit}
                    onChange={(v) => setTerms((t) => ({ ...t, rightToSubmit: v }))}
                    label={
                      <div>
                        <p className="text-[13px] font-semibold text-ink">I confirm that I have the right to submit this document.</p>
                        <p className="text-[11.5px] text-ink-faint">माझ्याकडे हे दस्तऐवज सबमिट करण्याचे अधिकार आहेत याची मी पुष्टी करतो/करते.</p>
                      </div>
                    }
                  />

                  <Checkbox
                    checked={terms.infoCorrect}
                    onChange={(v) => setTerms((t) => ({ ...t, infoCorrect: v }))}
                    label={
                      <div>
                        <p className="text-[13px] font-semibold text-ink">I confirm that the information provided is correct.</p>
                        <p className="text-[11.5px] text-ink-faint">दिलेली सर्व माहिती खरी आणि अचूक आहे.</p>
                      </div>
                    }
                  />

                  <Checkbox
                    checked={terms.manualReview}
                    onChange={(v) => setTerms((t) => ({ ...t, manualReview: v }))}
                    label={
                      <div>
                        <p className="text-[13px] font-semibold text-ink">I understand that my request will be reviewed before acceptance.</p>
                        <p className="text-[11.5px] text-ink-faint">माझी विनंती स्वीकारण्यापूर्वी तपासली जाईल याची मला माहिती आहे.</p>
                      </div>
                    }
                  />

                  <Checkbox
                    checked={terms.quoteAfterReview}
                    onChange={(v) => setTerms((t) => ({ ...t, quoteAfterReview: v }))}
                    label={
                      <div>
                        <p className="text-[13px] font-semibold text-ink">I understand that charges and completion time will be provided after review.</p>
                        <p className="text-[11.5px] text-ink-faint">शुल्क आणि वेळ पुनरावलोकनानंतर कळवली जाईल हे मला मान्य आहे.</p>
                      </div>
                    }
                  />

                  <Checkbox
                    checked={terms.rulesAgreed}
                    onChange={(v) => setTerms((t) => ({ ...t, rulesAgreed: v }))}
                    label={
                      <div>
                        <p className="text-[13px] font-semibold text-ink">I have read and agree to the Rules & Terms.</p>
                        <p className="text-[11.5px] text-ink-faint">मी सर्व नियम व अटी वाचल्या असून त्या मला मान्य आहेत.</p>
                      </div>
                    }
                  />

                  {/* Agree to All Checkbox */}
                  <div className="mt-4 border border-accent/20 bg-accent/6 p-3.5">
                    <Checkbox
                      checked={allTermsChecked}
                      onChange={(v) => toggleAllTerms(v)}
                      label={
                        <div>
                          <p className="text-[13.5px] font-bold text-accent">Agree to All / सर्व नियम व अटींना सहमती</p>
                          <p className="text-[11px] text-accent/80">Selects all required terms above</p>
                        </div>
                      }
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Helper notice message above action bar */}
          {!allTermsChecked && (
            <div className="border border-gold/40 bg-gold/8 p-3.5 text-center rounded">
              <p className="text-[12.5px] font-medium text-ink">
                Please read and accept all required Rules & Terms before submitting.
              </p>
              <p className="text-[11.5px] text-ink-faint mt-0.5">
                कृपया विनंती सादर करण्यापूर्वी सर्व आवश्यक नियम व अटी वाचा आणि स्वीकारा.
              </p>
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between border-t border-line-soft pt-6">
            <Button variant="subtle" icon="arrowL" onClick={() => setStep(1)}>
              Edit Details
            </Button>

            <Button
              size="lg"
              icon="send"
              disabled={!allTermsChecked}
              onClick={() => setConfirmOpen(true)}
            >
              Submit Request / विनंती सादर करा
            </Button>
          </div>
        </div>
      )}

      {/* ================= STEP 4 — CONFIRMATION ================= */}
      {step === 3 && created && (
        <div className="anim-pop mx-auto max-w-3xl mt-10 text-center">
          <div className="relative mx-auto w-fit">
            <span className="stamp-in corner-ticks grid h-28 w-28 place-items-center border-2 border-accent/70 text-accent">
              <span className="grid place-items-center">
                <Icon name="seal" size={46} strokeWidth={1.3} />
              </span>
            </span>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 border border-accent/70 bg-paper px-2 text-[9px] font-bold uppercase tracking-[0.3em] text-accent">
              Submitted
            </span>
          </div>
          <h2 className="mt-9 font-display text-4xl font-semibold text-ink">Your request has been submitted.</h2>
          <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-ink-soft">
            Our team will review your request and document. You will be notified once a decision has been made.
          </p>

          <Card ticks className="mx-auto mt-8 max-w-md p-2.5">
            <dl>
              <KV k="Request ID" v={<span className="font-mono font-semibold text-accent">{created.id}</span>} mono />
              <KV k="Submission date" v={fmtDate(created.at)} />
              <KV k="Current status" v={<span className="inline-flex items-center gap-1.5 rounded-full border border-[#8a6d1f]/30 bg-[#8a6d1f]/10 px-2.5 py-1 text-[11px] font-semibold text-[#7a5f18]"><span className="h-1.5 w-1.5 rounded-full bg-current" />Under Review</span>} />
            </dl>
          </Card>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" to={`/requests/${created.id}`} icon="eye">
              View Request
            </Button>
            <Button size="lg" variant="secondary" to="/dashboard" icon="folder">
              My Requests
            </Button>
          </div>
          <p className="mt-6 text-[12px] text-ink-faint">
            Submitted {fmtDateTime(created.at)} · We normally respond to reviews within 2–4 working days.
          </p>
        </div>
      )}

      {/* Refined Bilingual Confirmation Modal */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doSubmit}
        title="Confirm Your Submission / तुमची विनंती निश्चित करा"
        body={
          <div className="space-y-3">
            <div className="rounded border border-line bg-parchment/40 p-3 text-[12.5px] space-y-1">
              <p className="font-semibold text-ink">
                Document: <span className="font-normal text-ink-soft">{source === "drive" ? "Google Drive Link" : files.filter((f) => f.status === "done")[0]?.name || "Document"}</span>
              </p>
              <p className="font-semibold text-ink">
                Applicant: <span className="font-normal text-ink-soft">{form.fullName} ({form.email})</span>
              </p>
            </div>
            <p className="text-[13px] leading-relaxed text-ink">
              Your request will be sent to our team for manual review. Processing will begin only according to the existing approval and payment workflow.
            </p>
            <p className="text-[12px] leading-relaxed text-ink-faint">
              तुमची विनंती पुनरावलोकनासाठी पाठवली जाईल. प्रक्रियेस मंजुरी व पेमेंट नंतरच सुरुवात होईल.
            </p>
          </div>
        }
        confirmLabel="Confirm & Submit / निश्चित करा व सादर करा"
      />
    </div>
  );
}

function ReviewCard({ title, icon, onEdit, children }: { title: string; icon: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <Card ticks className="p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-line-soft pb-2.5">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <Icon name={icon} size={16} className="text-gold" /> {title}
        </h3>
        <button onClick={onEdit} className="flex items-center gap-1 text-[11.5px] font-semibold text-accent hover:underline">
          <Icon name="edit" size={12} /> Edit
        </button>
      </div>
      <div className="mt-2.5">{children}</div>
    </Card>
  );
}
