"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────

const LANGUES = [
  "Turc", "Arabe", "Ukrainien", "Russe", "Polonais", "Roumain",
  "Anglais", "Français", "Espagnol", "Italien", "Portugais",
  "Farsi", "Dari", "Tigrinya", "Japonais", "Autre",
];

const DUREES = [
  "Moins de 6 mois", "6 mois à 2 ans", "2 à 5 ans", "Plus de 5 ans",
];

const NIVEAUX_ALLEMAND = ["Aucun", "Basique", "Intermédiaire", "Courant"];

const TYPES_ECOLE = [
  "Grundschule", "Gymnasium", "Realschule",
  "Werkrealschule", "Gemeinschaftsschule", "Je ne sais pas",
];

const CLASSES = Array.from({ length: 13 }, (_, i) => `Klasse ${i + 1}`);

const RESULTATS = ["Très bons", "Bons", "Moyens", "En difficulté", "Je ne sais pas"];

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

    if (!form.prenom.trim()) newErrors.prenom = "Le prénom est obligatoire.";
    if (!form.nom.trim()) newErrors.nom = "Le nom est obligatoire.";
    if (!form.langue_maternelle) newErrors.langue_maternelle = "Choisissez une langue.";
    if (!form.pays_origine.trim()) newErrors.pays_origine = "Le pays d'origine est obligatoire.";
    if (!form.ville.trim()) newErrors.ville = "La ville est obligatoire.";
    if (!form.en_allemagne_depuis) newErrors.en_allemagne_depuis = "Choisissez une durée.";
    if (!form.niveau_allemand) newErrors.niveau_allemand = "Choisissez un niveau.";
    if (!form.premier_enfant_en_allemagne) newErrors.premier_enfant_en_allemagne = "Ce champ est obligatoire.";

    form.enfants.forEach((e, i) => {
      if (!e.prenom.trim()) newErrors[`enfant_${i}_prenom`] = "Prénom obligatoire.";
      if (!e.nom.trim()) newErrors[`enfant_${i}_nom`] = "Nom obligatoire.";
      const age = parseInt(e.age);
      if (!e.age || isNaN(age) || age < 5 || age > 20)
        newErrors[`enfant_${i}_age`] = "Âge entre 5 et 20 ans.";
      if (!e.type_ecole) newErrors[`enfant_${i}_type_ecole`] = "Type d'école obligatoire.";
      if (!e.classe) newErrors[`enfant_${i}_classe`] = "Classe obligatoire.";
      if (!e.resultats_scolaires) newErrors[`enfant_${i}_resultats_scolaires`] = "Résultats obligatoires.";
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
        premier_enfant_en_allemagne: form.premier_enfant_en_allemagne === "Oui",
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
        setErrors({ _global: data.error ?? "Erreur lors de l'inscription." });
        return;
      }

      router.push(`/chat?parentId=${data.parentId}`);
    } catch {
      setErrors({ _global: "Erreur réseau. Veuillez réessayer." });
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
            Voir la démo
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10 pb-20">

        {/* Page title */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-foreground mb-2">
            Créez votre profil
          </h1>
          <p className="text-muted">
            SchoolBridge personnalise chaque réponse selon votre situation familiale et votre langue.
          </p>
        </div>

        {errors._global && (
          <div className="mb-6 bg-danger/8 border border-danger/30 text-danger rounded-xl px-4 py-3 text-sm font-medium">
            ⚠️ {errors._global}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">

          {/* ── Section Parent ── */}
          <Card icon="👤" title="Votre profil">

            <div className="grid grid-cols-2 gap-4">
              <Field label="Prénom *" error={errors.prenom}>
                <input className={inputClass("prenom")} value={form.prenom}
                  onChange={(e) => setParent("prenom", e.target.value)} placeholder="Ex : Amina" />
              </Field>
              <Field label="Nom *" error={errors.nom}>
                <input className={inputClass("nom")} value={form.nom}
                  onChange={(e) => setParent("nom", e.target.value)} placeholder="Ex : Yilmaz" />
              </Field>
            </div>

            <Field label="Langue maternelle *" error={errors.langue_maternelle}>
              <select className={inputClass("langue_maternelle")} value={form.langue_maternelle}
                onChange={(e) => setParent("langue_maternelle", e.target.value)}>
                <option value="">— Sélectionnez votre langue —</option>
                {LANGUES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Pays d'origine *" error={errors.pays_origine}>
                <input className={inputClass("pays_origine")} value={form.pays_origine}
                  onChange={(e) => setParent("pays_origine", e.target.value)} placeholder="Ex : Turquie" />
              </Field>
              <Field label="Ville de résidence *" error={errors.ville}>
                <input className={inputClass("ville")} value={form.ville}
                  onChange={(e) => setParent("ville", e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="En Allemagne depuis *" error={errors.en_allemagne_depuis}>
                <select className={inputClass("en_allemagne_depuis")} value={form.en_allemagne_depuis}
                  onChange={(e) => setParent("en_allemagne_depuis", e.target.value)}>
                  <option value="">— Sélectionnez —</option>
                  {DUREES.map((d) => <option key={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Niveau d'allemand *" error={errors.niveau_allemand}>
                <select className={inputClass("niveau_allemand")} value={form.niveau_allemand}
                  onChange={(e) => setParent("niveau_allemand", e.target.value)}>
                  <option value="">— Sélectionnez —</option>
                  {NIVEAUX_ALLEMAND.map((n) => <option key={n}>{n}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Premier enfant scolarisé en Allemagne ? *" error={errors.premier_enfant_en_allemagne}>
              <select className={inputClass("premier_enfant_en_allemagne")} value={form.premier_enfant_en_allemagne}
                onChange={(e) => setParent("premier_enfant_en_allemagne", e.target.value)}>
                <option value="">— Sélectionnez —</option>
                <option>Oui</option>
                <option>Non</option>
              </select>
            </Field>
          </Card>

          {/* ── Section Enfants ── */}
          <Card icon="🎒" title="Votre/vos enfant(s)">

            {form.enfants.map((enfant, i) => (
              <div key={i} className={`flex flex-col gap-4 ${i > 0 ? "pt-5 border-t border-line" : ""}`}>
                {form.enfants.length > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Enfant {i + 1}</span>
                    <button type="button" onClick={() => removeEnfant(i)}
                      className="text-xs text-danger/70 hover:text-danger font-medium transition-colors">
                      Supprimer
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Prénom *" error={errors[`enfant_${i}_prenom`]}>
                    <input className={inputClass(`enfant_${i}_prenom`)} value={enfant.prenom}
                      onChange={(e) => setEnfant(i, "prenom", e.target.value)} placeholder="Prénom" />
                  </Field>
                  <Field label="Nom *" error={errors[`enfant_${i}_nom`]}>
                    <input className={inputClass(`enfant_${i}_nom`)} value={enfant.nom}
                      onChange={(e) => setEnfant(i, "nom", e.target.value)} placeholder="Nom" />
                  </Field>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Field label="Âge *" error={errors[`enfant_${i}_age`]}>
                    <input type="number" min={5} max={20} className={inputClass(`enfant_${i}_age`)}
                      value={enfant.age} onChange={(e) => setEnfant(i, "age", e.target.value)} placeholder="12" />
                  </Field>
                  <Field label="Type d'école *" error={errors[`enfant_${i}_type_ecole`]}>
                    <select className={inputClass(`enfant_${i}_type_ecole`)} value={enfant.type_ecole}
                      onChange={(e) => setEnfant(i, "type_ecole", e.target.value)}>
                      <option value="">— Sélectionnez —</option>
                      {TYPES_ECOLE.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Classe *" error={errors[`enfant_${i}_classe`]}>
                    <select className={inputClass(`enfant_${i}_classe`)} value={enfant.classe}
                      onChange={(e) => setEnfant(i, "classe", e.target.value)}>
                      <option value="">— Sél. —</option>
                      {CLASSES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="Nom de l'école (optionnel)" error={undefined}>
                  <input className={inputClass(`enfant_${i}_nom_ecole`)} value={enfant.nom_ecole}
                    onChange={(e) => setEnfant(i, "nom_ecole", e.target.value)}
                    placeholder="Ex : Friedrich-Schiller-Gymnasium" />
                </Field>

                <Field label="Résultats scolaires *" error={errors[`enfant_${i}_resultats_scolaires`]}>
                  <select className={inputClass(`enfant_${i}_resultats_scolaires`)} value={enfant.resultats_scolaires}
                    onChange={(e) => setEnfant(i, "resultats_scolaires", e.target.value)}>
                    <option value="">— Sélectionnez —</option>
                    {RESULTATS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </Field>
              </div>
            ))}

            {form.enfants.length < 4 && (
              <button type="button" onClick={addEnfant}
                className="self-start text-sm font-medium text-primary hover:text-primary-light transition-colors flex items-center gap-1.5 mt-1">
                <span className="text-base leading-none">+</span>
                Ajouter un autre enfant
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
                Création du profil...
              </span>
            ) : (
              "Créer mon profil et démarrer →"
            )}
          </button>

          <p className="text-center text-xs text-muted">
            Déjà un profil ?{" "}
            <Link href="/chat?parentId=PAR-001" className="text-primary hover:underline">
              Voir la démo
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
