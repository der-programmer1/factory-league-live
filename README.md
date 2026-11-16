# Factory League

Baue deine Fabrik und kämpfe auf der gemeinsamen Rangliste um Platz eins. Anmeldung mit Spielername und Passwort, persönlicher Rettungscode und bis zu 24 Stunden Offline-Produktion. Fabriken und Ranglisten liegen dauerhaft in einer Cloudflare-D1-Datenbank.

## Am Handy veröffentlichen

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/der-programmer1/factory-league)

1. Den Knopf öffnen und bei Cloudflare anmelden. Beim kostenlosen Workers-Tarif bleiben.
2. GitHub verbinden und die angezeigten Vorgaben übernehmen. Falls Cloudflare eine neue Repository-Kopie anlegen möchte und `factory-league` schon belegt ist: **`factory-league-live`** als Namen verwenden.
3. Bei **`PASSWORD_PEPPER`** den separat bereitgestellten geheimen Schlüssel einfügen. Er gehört ausschließlich in dieses Secret-Feld, niemals in Repository-Dateien. Bei künftigen Updates denselben Schlüssel beibehalten.
4. **Deploy** wählen. Datenbank, Migrationen und Worker werden durch die Vorlage vorbereitet. Danach die von Cloudflare angezeigte **`https://…workers.dev`**-Adresse öffnen.

Es werden weder API-Token noch Konto-ID von Hand benötigt. Die Vorgaben für Build und Deployment sind `npm run build` und `npm run deploy`. Falls Cloudflare eine Node-Version abfragt: **24**. Die bestehende Website bleibt während der Einrichtung erreichbar. Dies ist eine eigenständige Cloudflare-Veröffentlichung; der laufende Dienst benötigt kein ChatGPT.

Nur D1 und Workers werden verwendet, keine kostenpflichtigen Zusatzdienste. Es gelten die Limits des kostenlosen Cloudflare-Tarifs. Eine eigene `.de`-/`.com`-Domain ist optional und normalerweise kostenpflichtig.

## Was bereits vorbereitet ist

- Responsive Oberfläche mit isometrischen Fabriken und drei Produktionsketten.
- Serverzeit, genaue BigInt-Berechnung und atomare Kaufbuchungen mit Wiederholungsschutz.
- Passwortschutz mit individuellem Zufallssalz, PBKDF2-SHA-256 und einem zusätzlichen geheimen Serverschlüssel. Die Berechnung hält die beobachtete Hosting-Grenze von 100.000 Durchläufen ein.
- HttpOnly-/Secure-Sitzungscookies, Passwortrettung, Anmeldebegrenzung und öffentliche Profile ohne Accountgeheimnisse.
- Eine automatische GitHub-Prüfung für Spiel, Datenbank, Produktionspaket sowie Desktop- und Handy-Oberfläche.

Es gibt inzwischen einen bestehenden Account mit Fabrik. Der Deploy-Knopf erstellt eine neue Datenbank; vorhandene Accounts und Spielstände werden dabei nicht automatisch übertragen. Für den Betreiber ist eine private Übernahmedatei vorbereitet. Die Anleitung steht in [UMZUG.md](UMZUG.md). Die bisherige Hosting-Instanz bleibt erreichbar, bis der Umzug geprüft ist.

## Entwicklung

Node.js 24:

```sh
npm ci
npm run check
npm run build
npm test
npm run verify:artifact
```

Für Oberflächentests: `npx playwright install chromium` und `npm run test:e2e`.

Die Produktionsdatei `dist/server/index.js` enthält die Frontend-Dateien. `.openai/hosting.json` und eine Sites-Projektkennung werden weder benötigt noch mitgeliefert. Die Konfiguration liegt ausschließlich in `wrangler.json`. D1-Migrationen unter `drizzle/` werden beim Deploy zuerst eingespielt. Cloudflare ersetzt beim geführten Start die vorgegebene Datenbankkennung durch die tatsächliche neue Kennung.

## Betreiberangaben

Vor dem öffentlichen Betrieb müssen die tatsächlich erforderlichen Betreiber- und Datenschutzangaben fertiggestellt werden. Ein unveröffentlichter Entwurf steht in `IMPRINT-DRAFT.md`. Es sind keine erfundenen Betreiberangaben als echtes Impressum eingebaut.

## Weitere Dokumentation

[Betrieb und Sicherungen](BETRIEB.md)

[Offizielle Cloudflare-Anleitung für Deploy-Knöpfe und automatische Ressourcen](https://developers.cloudflare.com/workers/platform/deploy-buttons/)
