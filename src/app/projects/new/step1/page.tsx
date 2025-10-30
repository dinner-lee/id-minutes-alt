"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJSON } from "@/lib/api";
import Link from "next/link";
import { Home } from "lucide-react";

export default function Step1Page() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [members, setMembers] = useState<string>(""); // comma-separated
  const [submitting, setSubmitting] = useState(false);

  async function createProject() {
    const memberList = members
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const data = await postJSON<{ ok: true; project: { id: string } }>(
      "/api/projects",
      { title, purpose, startDate, endDate, members: memberList }
    );

    return data.project.id;
  }

  async function handleImmediateSetup(e: React.MouseEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      const projectId = await createProject();
      router.push(`/projects/${projectId}`);
    } catch (err: any) {
      alert(err.message || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDetailedSetup(e: React.MouseEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      const projectId = await createProject();
      router.push(`/projects/new/step2?projectId=${projectId}`);
    } catch (err: any) {
      alert(err.message || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Prevent form submission on Enter key
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Step 1 — Basics</h1>
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <input className="w-full border rounded p-2" placeholder="Project title"
               value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea className="w-full border rounded p-2" placeholder="Purpose"
               value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
        <div className="grid grid-cols-2 gap-3">
          <input type="date" className="border rounded p-2" value={startDate}
                 onChange={(e) => setStartDate(e.target.value)} required />
          <input type="date" className="border rounded p-2" value={endDate}
                 onChange={(e) => setEndDate(e.target.value)} required />
        </div>
        <input className="w-full border rounded p-2"
               placeholder="Member emails (comma-separated)"
               value={members} onChange={(e) => setMembers(e.target.value)} />
        
        <div className="pt-4 space-y-3">
          <p className="text-sm text-muted-foreground">Choose how to proceed:</p>
          
          <button 
            type="button"
            onClick={handleImmediateSetup}
            disabled={submitting}
            className="w-full rounded border-2 border-black bg-black text-white px-4 py-3 text-sm font-medium hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Creating…" : "Quick setup — Start working immediately"}
          </button>
          
          <button 
            type="button"
            onClick={handleDetailedSetup}
            disabled={submitting}
            className="w-full rounded border-2 border-gray-300 bg-white text-gray-900 px-4 py-3 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Creating…" : "Detailed setup — Configure model & stages"}
          </button>
        </div>
      </form>
    </div>
  );
}
