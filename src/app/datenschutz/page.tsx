// src/app/datenschutz/page.tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Datenschutzerklärung | SCND UNIT',
  description: 'Datenschutzerklärung für SCND UNIT',
};

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-12">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-[#FF4400] hover:underline mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück zur Startseite
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">
          DATENSCHUTZ_ERKLÄRUNG
        </h1>
        
        <div className="space-y-8 text-[var(--text-secondary)]">
          
          {/* 1. Verantwortlicher */}
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">1. Verantwortlicher</h2>
            <p className="leading-relaxed">
              SCND UNIT<br />
              (Ihr vollständiger Name)<br />
              (Ihre Straße und Hausnummer)<br />
              (PLZ und Ort)<br />
              Deutschland<br />
              E-Mail: (Ihre E-Mail-Adresse)
            </p>
          </div>

          {/* 2. Hosting */}
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">2. Hosting</h2>
            <p className="leading-relaxed">
              Diese Website wird gehostet bei Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA. 
              Vercel verarbeitet in unserem Auftrag personenbezogene Daten (z. B. IP-Adressen) zum Betrieb der Website. 
              Die Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am effizienten Betrieb der Website).
            </p>
          </div>

          {/* 3. Erfassung von Daten beim Besuch */}
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">3. Erfassung von Daten beim Besuch</h2>
            <p className="leading-relaxed">
              Bei jedem Zugriff auf unsere Website werden folgende Daten automatisch erfasst:
            </p>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
              <li>IP-Adresse (anonymisiert)</li>
              <li>Datum und Uhrzeit des Zugriffs</li>
              <li>Browsertyp und -version</li>
              <li>Betriebssystem</li>
              <li>Referrer-URL (zuvor besuchte Seite)</li>
            </ul>
            <p className="leading-relaxed mt-2">
              Diese Daten sind technisch erforderlich, um die Website korrekt darzustellen. 
              Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.
            </p>
          </div>

          {/* 4. Cookies & Local Storage */}
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">4. Cookies & Local Storage</h2>
            <p className="leading-relaxed">
              Wir verwenden Local Storage zur Speicherung deiner Einstellungen:
            </p>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
              <li><strong>theme</strong> - Speichert deine Dark/Light Mode Präferenz</li>
              <li><strong>scnd_drop_personal_best</strong> - Speichert deinen persönlichen Highscore im Spiel "SCND DROP"</li>
              <li><strong>privacy_accepted</strong> - Speichert deine Zustimmung zur Datenschutzerklärung</li>
            </ul>
            <p className="leading-relaxed mt-2">
              Diese Daten verlassen nie deinen Browser. Es werden keine Tracking-Cookies von Drittanbietern verwendet.
            </p>
          </div>

          {/* 5. Externe Links */}
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">5. Externe Links</h2>
            <p className="leading-relaxed">
              Unsere Website enthält Links zu externen Seiten (Vinted, Instagram). 
              Für die Datenschutzpraktiken dieser Dienste sind die jeweiligen Anbieter verantwortlich.
            </p>
          </div>

          {/* 6. Deine Rechte */}
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">6. Deine Rechte</h2>
            <p className="leading-relaxed">
              Du hast das Recht auf:
            </p>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
              <li>Auskunft über deine gespeicherten Daten (Art. 15 DSGVO)</li>
              <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
              <li>Löschung deiner Daten (Art. 17 DSGVO)</li>
              <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
            </ul>
            <p className="leading-relaxed mt-2">
              Zur Ausübung deiner Rechte kontaktiere uns bitte unter der oben genannten E-Mail-Adresse.
            </p>
          </div>

          {/* 7. Beschwerderecht */}
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">7. Beschwerderecht</h2>
            <p className="leading-relaxed">
              Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, 
              wenn du der Meinung bist, dass die Verarbeitung deiner personenbezogenen Daten gegen die DSGVO verstößt.
            </p>
          </div>

          {/* Stand */}
          <div className="pt-6 text-xs text-[var(--text-secondary)]/60">
            <p>Stand: April 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
}
