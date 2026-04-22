// src/app/impressum/page.tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Impressum | SCND UNIT',
  description: 'Impressum und rechtliche Angaben',
};

export default function ImpressumPage() {
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
          IMPRESSUM
        </h1>
        
        <div className="space-y-8 text-[var(--text-secondary)]">
          {/* Angaben gemäß § 5 TMG */}
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">Angaben gemäß § 5 TMG</h2>
            <p className="leading-relaxed">
              <strong className="text-[var(--text-primary)]">SCND UNIT</strong><br />
              <span className="text-sm">(Ihr vollständiger Name oder Firmenname)</span><br />
              <span className="text-sm">(Ihre Straße und Hausnummer)</span><br />
              <span className="text-sm">(PLZ und Ort)</span><br />
              <span className="text-sm">Deutschland</span>
            </p>
          </div>

          {/* Kontakt */}
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">Kontakt</h2>
            <p className="leading-relaxed">
              Telefon: <span className="text-sm">(optional)</span><br />
              E-Mail: <span className="text-sm">(Ihre E-Mail-Adresse)</span><br />
              Vinted: <a href="https://www.vinted.de/member/3138250645-scndunit" target="_blank" className="text-[#FF4400] hover:underline">@scndunit</a><br />
              Instagram: <a href="https://www.instagram.com/scnd.unit" target="_blank" className="text-[#FF4400] hover:underline">@scnd.unit</a>
            </p>
          </div>

          {/* Umsatzsteuer-ID (optional) */}
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">Umsatzsteuer-ID</h2>
            <p className="leading-relaxed">
              Umsatzsteuer-Identifikationsnummer gemäß §27a Umsatzsteuergesetz:<br />
              <span className="text-sm">(Ihre USt-ID, falls vorhanden, sonst entfällt dieser Punkt)</span>
            </p>
          </div>

          {/* Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV */}
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <p className="leading-relaxed">
              <strong className="text-[var(--text-primary)]">(Ihr vollständiger Name)</strong><br />
              <span className="text-sm">(Ihre Adresse)</span>
            </p>
          </div>

          {/* Haftungsausschluss etc. (bleibt wie gehabt) */}
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">Streitschlichtung</h2>
            <p className="leading-relaxed text-sm">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" className="text-[#FF4400] hover:underline ml-1">https://ec.europa.eu/consumers/odr</a>.<br />
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">Haftung für Inhalte</h2>
            <p className="leading-relaxed text-sm">
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. 
              Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen 
              oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
            <p className="leading-relaxed text-sm mt-3">
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. 
              Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. 
              Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">Haftung für Links</h2>
            <p className="leading-relaxed text-sm">
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. 
              Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">Urheberrecht</h2>
            <p className="leading-relaxed text-sm">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. 
              Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </div>

          <div className="pt-6 text-xs text-[var(--text-secondary)]/60">
            <p>Quelle: <a href="https://www.e-recht24.de" target="_blank" className="hover:underline">eRecht24</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
