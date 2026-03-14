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
      // Auto-fill nom with parent's nom if empty
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
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field] ? "border-red-400 bg-red-50" : "border-slate-300"
    }`;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-blue-600 text-white px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-white hover:text-blue-200 text-sm font-medium">
          ← Accueil
        </Link>
        <div>
          <h1 className="text-xl font-bold">SchoolBridge</h1>
          <p className="text-xs text-blue-200">Créer un profil</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Créez votre profil</h2>
        <p className="text-slate-500 mb-8 text-sm">
          Ces informations permettent à SchoolBridge de personnaliser ses réponses.
        </p>

        {errors._global && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {errors._global}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">

          {/* ── Section Parent ── */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="font-semibold text-slate-800 text-lg border-b border-slate-100 pb-3">
              Votre profil
            </h3>

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
                <option value="">— Sélectionnez —</option>
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
          </section>

          {/* ── Section Enfants ── */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-6">
            <h3 className="font-semibold text-slate-800 text-lg border-b border-slate-100 pb-3">
              Votre/vos enfant(s)
            </h3>

            {form.enfants.map((enfant, i) => (
              <div key={i} className="flex flex-col gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-700 text-sm">
                    Enfant {form.enfants.length > 1 ? i + 1 : ""}
                  </p>
                  {form.enfants.length > 1 && (
                    <button type="button" onClick={() => removeEnfant(i)}
                      className="text-xs text-red-500 hover:text-red-700">
                      Supprimer
                    </button>
                  )}
                </div>

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
                className="self-start text-sm text-blue-600 hover:text-blue-800 font-medium">
                + Ajouter un autre enfant
              </button>
            )}
          </section>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Inscription en cours..." : "Créer mon profil et démarrer →"}
          </button>
        </form>
      </div>
    </main>
  );
}

// ─── Helper component ─────────────────────────────────────────────────────────

function Field({ label, error, children }: {
  label: string;
  error: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
