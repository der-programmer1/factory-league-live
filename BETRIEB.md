# Factory League – eigenes Cloudflare-Konto

Die Startanleitung mit dem Veröffentlichungs-Knopf steht in README.md. Die Anwendung läuft nach der Einrichtung unabhängig von ChatGPT unter einer Cloudflare-Workers-Adresse. GitHub enthält Quellcode und Prüfungen; Cloudflare führt Worker und dauerhafte Datenbank aus.

## Konfiguration

`wrangler.json` beschreibt Worker, D1-Bindung `DB`, Migrationsordner und den erforderlichen geheimen Schlüssel `PASSWORD_PEPPER`. Der Deploy-Knopf provisioniert die Datenbank und trägt deren tatsächliche Kennung in die Repository-Kopie ein. Die lokale Null-Kennung ist ausschließlich ein Platzhalter für diesen Ablauf. Bei manuellem Deployment eine echte Datenbankkennung eintragen.

Cloudflare erkennt die Package-Skripte `build` und `deploy`. Der Deploy führt zuerst `wrangler d1 migrations apply DB --remote` aus und veröffentlicht dann den Worker. Bei erneuten Deployments bleiben Daten und bereits angewendete Migrationen erhalten. Angewendete Migrationsdateien nicht ändern; neue Schemaänderungen mit `npm run db:generate` hinzufügen.

Den bestehenden `PASSWORD_PEPPER` bei Updates und Wiederherstellungen beibehalten. Er wird in Cloudflare als Secret gespeichert und gehört nicht ins Repository. Die geprüfte Passwortberechnung verwendet HMAC-SHA-256 mit diesem Schlüssel, danach PBKDF2-SHA-256 mit individuellem Salz und 100.000 Durchläufen. Ein Verlust des Schlüssels verhindert die Passwortprüfung; persönliche Rettungscodes erlauben weiterhin, ein neues Passwort zu setzen.

## Funktion prüfen

Nach dem Deploy die tatsächlich angezeigte öffentliche Adresse öffnen. `/health` muss `status: ok`, `database: ok`, `authentication: local` und `storage: D1` melden. Eine Registrierung durchführen, Rettungscode speichern, abmelden und erneut anmelden. Ein bestätigter Kauf muss nach erneutem Öffnen erhalten bleiben. Die Rangliste enthält echte Accounts und keine erfundenen Spieler.

Die GitHub-Prüfungen benötigen keinen Cloudflare-Zugriff und veröffentlichen nichts. Die Veröffentlichung in deinem Cloudflare-Konto wird erst durch deine Anmeldung und Freigabe im Deploy-Dialog möglich. Ein GitHub-Push allein ersetzt diese erstmalige Einrichtung nicht.

## Kostenloser Tarif

Die Vorlage fordert nur Workers und D1 an und aktiviert keinen kostenpflichtigen Tarif. Kapazität und Verfügbarkeit unterliegen dem gewählten Cloudflare-Tarif. Bei Limits keine kostenpflichtigen Zusatzdienste ohne bewusste Entscheidung aktivieren.

## Backups

Optional kann im Cloudflare-Dashboard ein weiteres Secret `BACKUP_TOKEN` gesetzt werden. Der geschützte HTTPS-Endpunkt `/api/admin/backup` exportiert Accounts, Fabriken und Kaufkennungen als konsistente JSON-Sicherung; alte Sitzungen werden nicht exportiert.

`scripts/remote-backup.mjs` benötigt `FACTORY_LEAGUE_URL` und `FACTORY_LEAGUE_BACKUP_TOKEN` in seiner Umgebung und verschlüsselt die Sicherung mit dem öffentlichen Schlüssel `backup-public.pem`. Der zugehörige private Schlüssel bleibt ausschließlich beim Betreiber. Ein täglicher Sicherungsjob ist in diesem neuen Repository nicht aktiviert.

```sh
node scripts/decrypt-backup.mjs backup.flbackup PRIVATE-KEY.pem backup.json
node scripts/backup-to-sql.mjs backup.json restored-factory.sql
```

Die Wiederherstellungsdatei ist für eine neue, leere Datenbank gedacht und überschreibt keine laufende Datenbank. Auch `PASSWORD_PEPPER` muss für eine Wiederherstellung erhalten bleiben. Vor dem Umschalten Bestände prüfen und die vorherige Datenbank erhalten.
