"use client";

import { useState } from "react";

interface ContactModalProps {
  personneId: string;
  nom: string;
  role: string;
  disponibilite?: string;
  description?: string;
  parentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ContactModal({
  personneId,
  nom,
  role,
  disponibilite,
  description,
  parentId,
  onClose,
  onSuccess,
}: ContactModalProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    setError(null);

    try {
      // Create/get the contact
      const contactRes = await fetch(`/api/contacts/${parentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personneRessourceId: personneId,
          nom,
          role,
          contexte: "Prise de contact via l'assistant",
        }),
      });
      const contactData = (await contactRes.json()) as {
        contact?: { id: string };
        success?: boolean;
      };
      const contact = contactData.contact;

      if (contact) {
        // Send the message
        await fetch(`/api/contacts/${parentId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contactId: contact.id, message: message.trim() }),
        });
        setSent(true);
        setTimeout(() => onSuccess(), 1800);
      }
    } catch {
      setError("Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">{nom}</h3>
            <p className="text-sm text-slate-500">{role}</p>
            {disponibilite && (
              <p className="text-xs text-slate-400 mt-1">{disponibilite}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {description && (
          <p className="text-sm text-slate-600 mb-4">{description}</p>
        )}

        {sent ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm">
            ✅ Message envoyé avec succès !
          </div>
        ) : (
          <>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Écrivez votre message à ${nom}...`}
              rows={4}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
            <div className="flex gap-2 mt-3">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-600 text-sm hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !message.trim()}
                className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? "Envoi..." : "Envoyer"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
