// src/components/DataPrivacy.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface DataPrivacyProps {
  isOpen: boolean;
  onClose: () => void;
}

// Accordion Item Komponente
function AccordionItem({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#FF4400]/20 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-3 text-left font-bold text-[var(--text-primary)] hover:text-[#FF4400] transition-colors"
      >
        <span>{title}</span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isOpen && (
        <div className="pb-4 text-sm text-[var(--text-secondary)] space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

export function DataPrivacy({ isOpen, onClose }: DataPrivacyProps) {
  const [accepted, setAccepted] = useState(false);

  if (!isOpen) return null;

  const handleAccept = () => {
    setAccepted(true);
    localStorage.setItem('privacy_accepted', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-xl bg-[var(--bg-primary)] border border-[#FF4400]/30 shadow-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-[#FF4400]/10 transition-colors z-10"
        >
          <X className="w-5 h-5 text-[var(--text-secondary)]" />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold tracking-tighter mb-2">
            <span className="text-[#FF4400]">DATENSCHUTZ</span>_ERKLÄRUNG
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mb-6">
            Stand: April 2025 · Klicke auf die Überschriften für mehr Details
          </p>

          <div className="space-y-0">
            <AccordionItem title="1. Verantwortlicher" defaultOpen={true}>
              <p>
                SCND UNIT<br />
                (Ihr vollständiger Name)<br />
                (Ihre Straße und Hausnummer)<br />
                (PLZ und Ort)<br />
                Deutschland<br />
                E-Mail: (Ihre E-Mail-Adresse)
              </p>
            </AccordionItem>

            <AccordionItem title="2. Hosting" defaultOpen={false}>
              <p>
                Diese Website wird gehostet bei Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA. 
                Vercel verarbeitet in unserem Auftrag personenbezogene Daten (z. B. IP-Adressen) zum Betrieb der Website. 
                Die Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am effizienten Betrieb der Website).
              </p>
            </AccordionItem>

            <AccordionItem title="3. Erfassung von Daten beim Besuch" defaultOpen={false}>
              <p>
                Bei jedem Zugriff auf unsere Website werden folgende Daten automatisch erfasst:
              </p>
              <ul className="list-disc list-inside mt-2 ml-2 space-y-1">
                <li>IP-Adresse (anonymisiert)</li>
                <li>Datum und Uhrzeit des Zugriffs</li>
                <li>Browsertyp und -version</li>
                <li>Betriebssystem</li>
                <li>Referrer-URL (zuvor besuchte Seite)</li>
              </ul>
              <p className="mt-2">
                Diese Daten sind technisch erforderlich, um die Website korrekt darzustellen. 
                Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.
              </p>
            </AccordionItem>

            <AccordionItem title="4. Cookies & Local Storage" defaultOpen={false}>
              <p>
                Wir verwenden Local Storage zur Speicherung deiner Einstellungen:
              </p>
              <ul className="list-disc list-inside mt-2 ml-2 space-y-1">
                <li><strong>theme</strong> - Speichert deine Dark/Light Mode Präferenz</li>
                <li><strong>scnd_drop_personal_best</strong> - Speichert deinen persönlichen Highscore im Spiel "SCND DROP"</li>
                <li><strong>privacy_accepted</strong> - Speichert deine Zustimmung zur Datenschutzerklärung</li>
              </ul>
              <p className="mt-2">
                Diese Daten verlassen nie deinen Browser. Es werden keine Tracking-Cookies von Drittanbietern verwendet.
              </p>
            </AccordionItem>

            <AccordionItem title="5. Externe Links" defaultOpen={false}>
              <p>
                Unsere Website enthält Links zu externen Seiten (Vinted, Instagram). 
                Für die Datenschutzpraktiken dieser Dienste sind die jeweiligen Anbieter verantwortlich.
              </p>
            </AccordionItem>

            <AccordionItem title="6. Deine Rechte" defaultOpen={false}>
              <p>
                Du hast das Recht auf:
              </p>
              <ul className="list-disc list-inside mt-2 ml-2 space-y-1">
                <li>Auskunft über deine gespeicherten Daten (Art. 15 DSGVO)</li>
                <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
                <li>Löschung deiner Daten (Art. 17 DSGVO)</li>
                <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
                <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
              </ul>
              <p className="mt-2">
                Zur Ausübung deiner Rechte kontaktiere uns bitte unter der oben genannten E-Mail-Adresse.
              </p>
            </AccordionItem>

            <AccordionItem title="7. Beschwerderecht" defaultOpen={false}>
              <p>
                Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, 
                wenn du der Meinung bist, dass die Verarbeitung deiner personenbezogenen Daten gegen die DSGVO verstößt.
              </p>
            </AccordionItem>
          </div>

          <div className="mt-6 flex gap-3 pt-2">
            <button
              onClick={handleAccept}
              className="flex-1 py-2.5 bg-[#FF4400] text-white font-bold uppercase tracking-widest text-sm rounded-sm hover:bg-[#FF4400]/80 transition-colors"
            >
              Akzeptieren
            </button>
            <Link
              href="/datenschutz"
              className="flex-1 py-2.5 border border-[#FF4400]/30 text-[var(--text-secondary)] font-bold uppercase tracking-widest text-sm rounded-sm text-center hover:border-[#FF4400] hover:text-[#FF4400] transition-colors"
              onClick={onClose}
            >
              Vollständige Erklärung
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook zum einfachen Verwenden des Privacy Modals
export function useDataPrivacy() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('privacy_accepted');
    if (!hasAccepted) {
      setTimeout(() => setIsOpen(true), 1000);
    }
  }, []);

  return { isOpen, setIsOpen };
}
