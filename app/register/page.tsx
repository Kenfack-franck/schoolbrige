"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────

const LANGUES = [
  "Turkish", "Arabic", "Ukrainian", "Russian", "Polish", "Romanian",
  "English", "French", "Spanish", "Italian", "Portuguese",
  "Farsi", "Dari", "Tigrinya", "Japanese", "Other",
];

const DUREES = [
  "Less than 6 months", "6 months to 2 years", "2 to 5 years", "More than 5 years",
];

const NIVEAUX_ALLEMAND = ["None", "Basic", "Intermediate", "Fluent"];

const TYPES_ECOLE = [
  "Grundschule", "Gymnasium", "Realschule",
  "Werkrealschule", "Gemeinschaftsschule", "I don't know",
];

const CLASSES = Array.from({ length: 13 }, (_, i) => `Klasse ${i + 1}`);

const RESULTATS = ["Excellent", "Good", "Average", "Struggling", "I don't know"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnfantData {
  prenom: string;
  nom: string;
  age: string;
  type_ecole: string;
  nom_ecole: string;
  classe: string;
  resultats_scolaires: string;
}

interface FormData {
  prenom: string;
  nom: string;
  langue_maternelle: string;
  pays_origine: string;
  ville: string;
  en_allemagne_depuis: string;
  niveau_allemand: string;
  premier_enfant_en_allemagne: string;
  enfants: EnfantData[];
}

type Errors = Partial<Record<string, string>>;

const DEFAULT_ENFANT: EnfantData = {
  prenom: "",
  nom: "",
  age: "",
  type_ecole: "",
  nom_ecole: "",
  classe: "",
  resultats_scolaires: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const [form, setForm] = useState<FormData>({
    prenom: "",
    nom: "",
    langue_maternelle: "",
    pays_origine: "",
    ville: "Heilbronn",
    en_allemagne_depuis: "",
    niveau_allemand: "",
    premier_enfant_en_allemagne: "",
    enfants: [{ ...DEFAULT_ENFANT }],
  });

  function setParent(field: keyof Omit<FormData, "enfants">, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function setEnfant(index: number, field: keyof EnfantData, value: string) {
    setForm((prev) => {
      const enfants = [...prev.enfants];
      enfants[index] = { ...enfants[index], [field]: value };
      if (field === "prenom" && !enfants[index].nom) {
        enfants[index].nom = prev.nom;
      }
      return { ...prev, enfants };
    });
    setErrors((prev) => ({ ...prev, [`enfant_${index}_${field}`]: undefined }));
  }

  function addEnfant() {
    if (form.enfants.length >= 4) return;
    setForm((prev) => ({
      ...prev,
      enfants: [...prev.enfants, { ...DEFAULT_ENFANT, nom: prev.nom }],
    }));
  }

  function removeEnfant(index: number) {
    if (form.enfants.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      enfants: prev.enfants.filter((_, i) => i !== index),
    }));
  }

  function validate(): boolean {
    const newErrors: Errors = {};

    if (!form.prenom.trim()) newErrors.prenom = "First name is required.";
    if (!form.nom.trim()) newErrors.nom = "Last name is required.";
    if (!form.langue_maternelle) newErrors.langue_maternelle = "Please select a language.";
    if (!form.pays_origine.trim()) newErrors.pays_origine = "Country of origin is required.";
    if (!form.ville.trim()) newErrors.ville = "City is required.";
    if (!form.en_allemagne_depuis) newErrors.en_allemagne_depuis = "Please select a duration.";
    if (!form.niveau_allemand) newErrors.niveau_allemand = "Please select a level.";
    if (!form.premier_enfant_en_allemagne) newErrors.premier_enfant_en_allemagne = "This field is required.";

    form.enfants.forEach((e, i) => {
      if (!e.prenom.trim()) newErrors[`enfant_${i}_prenom`] = "First name is required.";
      if (!e.nom.trim()) newErrors[`enfant_${i}_nom`] = "Last name is required.";
      const age = parseInt(e.age);
      if (!e.age || isNaN(age) || age < 5 || age > 20)
        newErrors[`enfant_${i}_age`] = "Age must be between 5 and 20.";
      if (!e.type_ecole) newErrors[`enfant_${i}_type_ecole`] = "School type is required.";
      if (!e.classe) newErrors[`enfant_${i}_classe`] = "Class is required.";
      if (!e.resultats_scolaires) newErrors[`enfant_${i}_resultats_scolaires`] = "Academic results are required.";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        prenom: form.prenom,
        nom: form.nom,
        langue_maternelle: form.langue_maternelle,
        pays_origine: form.pays_origine,
        ville: form.ville,
        en_allemagne_depuis: form.en_allemagne_depuis,
        niveau_allemand: form.niveau_allemand,
        premier_enfant_en_allemagne: form.premier_enfant_en_allemagne === "Yes",
        enfants: form.enfants.map((e) => ({
          prenom: e.prenom,
          nom: e.nom,
          age: parseInt(e.age),
          type_ecole: e.type_ecole,
          nom_ecole: e.nom_ecole,
          classe: e.classe,
          resultats_scolaires: e.resultats_scolaires,
        })),
      };

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrors({ _global: data.error ?? "Registration error." });
        return;
      }

      router.push(`/chat?parentId=${data.parentId}`);
    } catch {
      setErrors({ _global: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (field: string) =>
    `w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white transition-colors ${
      errors[field]
        ? "border-danger/60 bg-danger/5 focus:ring-danger/20"
        : "border-line hover:border-primary/40"
    }`;

  return (
    <div className="min-h-screen bg-canvas-soft">

      {/* ── Header ── */}
      <header className="h-16 flex items-center px-6 border-b border-line bg-white/90 backdrop-blur-sm sticky top-0 z-40"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display font-bold text-primary text-xl">🎓 SchoolBridge</span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/chat?parentId=PAR-001"
            className="text-sm text-muted hover:text-foreground transition-colors hidden sm:block"
          >
            View demo
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10 pb-20">

        {/* Page title */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-foreground mb-2">
            Create your profile
          </h1>
          <p className="text-muted">
            SchoolBridge personalises every response according to your family situation and language.
          </p>
        </div>

        {errors._global && (
          <div className="mb-6 bg-danger/8 border border-danger/30 text-danger rounded-xl px-4 py-3 text-sm font-medium">
            ⚠️ {errors._global}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">

          {/* ── Section Parent ── */}
          <Card icon="👤" title="Your profile">

            <div className="grid grid-cols-2 gap-4">
              <Field label="First name *" error={errors.prenom}>
                <input className={inputClass("prenom")} value={form.prenom}
                  onChange={(e) => setParent("prenom", e.target.value)} placeholder="e.g. Amina" />
              </Field>
              <Field label="Last name *" error={errors.nom}>
                <input className={inputClass("nom")} value={form.nom}
                  onChange={(e) => setParent("nom", e.target.value)} placeholder="e.g. Yilmaz" />
              </Field>
            </div>

            <Field label="Native language *" error={errors.langue_maternelle}>
              <select className={inputClass("langue_maternelle")} value={form.langue_maternelle}
                onChange={(e) => setParent("langue_maternelle", e.target.value)}>
                <option value="">— Select your language —</option>
                {LANGUES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Country of origin *" error={errors.pays_origine}>
                <input className={inputClass("pays_origine")} value={form.pays_origine}
                  onChange={(e) => setParent("pays_origine", e.target.value)} placeholder="e.g. Turkey" />
              </Field>
              <Field label="City of residence *" error={errors.ville}>
                <input className={inputClass("ville")} value={form.ville}
                  onChange={(e) => setParent("ville", e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="In Germany since *" error={errors.en_allemagne_depuis}>
                <select className={inputClass("en_allemagne_depuis")} value={form.en_allemagne_depuis}
                  onChange={(e) => setParent("en_allemagne_depuis", e.target.value)}>
                  <option value="">— Select —</option>
                  {DUREES.map((d) => <option key={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="German level *" error={errors.niveau_allemand}>
                <select className={inputClass("niveau_allemand")} value={form.niveau_allemand}
                  onChange={(e) => setParent("niveau_allemand", e.target.value)}>
                  <option value="">— Select —</option>
                  {NIVEAUX_ALLEMAND.map((n) => <option key={n}>{n}</option>)}
                </select>
              </Field>
            </div>

            <Field label="First child enrolled in school in Germany? *" error={errors.premier_enfant_en_allemagne}>
              <select className={inputClass("premier_enfant_en_allemagne")} value={form.premier_enfant_en_allemagne}
                onChange={(e) => setParent("premier_enfant_en_allemagne", e.target.value)}>
                <option value="">— Select —</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </Field>
          </Card>

          {/* ── Section Enfants ── */}
          <Card icon="🎒" title="Your child(ren)">

            {form.enfants.map((enfant, i) => (
              <div key={i} className={`flex flex-col gap-4 ${i > 0 ? "pt-5 border-t border-line" : ""}`}>
                {form.enfants.length > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Child {i + 1}</span>
                    <button type="button" onClick={() => removeEnfant(i)}
                      className="text-xs text-danger/70 hover:text-danger font-medium transition-colors">
                      Remove
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Field label="First name *" error={errors[`enfant_${i}_prenom`]}>
                    <input className={inputClass(`enfant_${i}_prenom`)} value={enfant.prenom}
                      onChange={(e) => setEnfant(i, "prenom", e.target.value)} placeholder="First name" />
                  </Field>
                  <Field label="Last name *" error={errors[`enfant_${i}_nom`]}>
                    <input className={inputClass(`enfant_${i}_nom`)} value={enfant.nom}
                      onChange={(e) => setEnfant(i, "nom", e.target.value)} placeholder="Last name" />
                  </Field>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Field label="Age *" error={errors[`enfant_${i}_age`]}>
                    <input type="number" min={5} max={20} className={inputClass(`enfant_${i}_age`)}
                      value={enfant.age} onChange={(e) => setEnfant(i, "age", e.target.value)} placeholder="12" />
                  </Field>
                  <Field label="School type *" error={errors[`enfant_${i}_type_ecole`]}>
                    <select className={inputClass(`enfant_${i}_type_ecole`)} value={enfant.type_ecole}
                      onChange={(e) => setEnfant(i, "type_ecole", e.target.value)}>
                      <option value="">— Select —</option>
                      {TYPES_ECOLE.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Class *" error={errors[`enfant_${i}_classe`]}>
                    <select className={inputClass(`enfant_${i}_classe`)} value={enfant.classe}
                      onChange={(e) => setEnfant(i, "classe", e.target.value)}>
                      <option value="">— Sel. —</option>
                      {CLASSES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="School name (optional)" error={undefined}>
                  <input className={inputClass(`enfant_${i}_nom_ecole`)} value={enfant.nom_ecole}
                    onChange={(e) => setEnfant(i, "nom_ecole", e.target.value)}
                    placeholder="e.g. Friedrich-Schiller-Gymnasium" />
                </Field>

                <Field label="Academic results *" error={errors[`enfant_${i}_resultats_scolaires`]}>
                  <select className={inputClass(`enfant_${i}_resultats_scolaires`)} value={enfant.resultats_scolaires}
                    onChange={(e) => setEnfant(i, "resultats_scolaires", e.target.value)}>
                    <option value="">— Select —</option>
                    {RESULTATS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </Field>
              </div>
            ))}

            {form.enfants.length < 4 && (
              <button type="button" onClick={addEnfant}
                className="self-start text-sm font-medium text-primary hover:text-primary-light transition-colors flex items-center gap-1.5 mt-1">
                <span className="text-base leading-none">+</span>
                Add another child
              </button>
            )}
          </Card>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 text-white font-display font-semibold text-base rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
            style={{
              background: submitting
                ? "var(--color-primary)"
                : "linear-gradient(135deg, #1B4B6B 0%, #2A6F97 100%)",
              boxShadow: "0 4px 16px rgba(27,75,107,0.3)",
            }}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Creating profile...
              </span>
            ) : (
              "Create my profile and get started →"
            )}
          </button>

          <p className="text-center text-xs text-muted">
            Already have a profile?{" "}
            <Link href="/chat?parentId=PAR-001" className="text-primary hover:underline">
              View demo
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

// ─── Helper components ─────────────────────────────────────────────────────────

function Card({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-line rounded-2xl p-6 flex flex-col gap-5"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center gap-3 pb-4 border-b border-line">
        <span className="text-2xl">{icon}</span>
        <h2 className="font-display font-bold text-lg text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, error, children }: {
  label: string;
  error: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-muted uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="text-xs text-danger font-medium">{error}</p>}
    </div>
  );
}
