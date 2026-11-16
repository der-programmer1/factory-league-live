# Bestehenden Account und Fabrik übernehmen

Der Cloudflare-Startknopf legt eine neue Datenbank an. Der bisherige Account und Spielstand werden dabei nicht automatisch kopiert. Die alte Website bleibt erreichbar; vor der Übernahme noch keine neue Registrierung auf der neuen Website durchführen.

Der Betreiber erhält separat und privat:

- `Factory-League-Cloudflare-Schluessel.txt`: geheimer Schlüssel für `PASSWORD_PEPPER`.
- `Factory-League-Spielstand-privat.sql`: geprüfte SQL-Anweisungen für den bisherigen Account und seine Fabrik.

Die Dateien enthalten Geheimnisse und gehören **nicht in das öffentliche GitHub-Repository**. Der Schlüssel muss bei der Cloudflare-Einrichtung exakt übernommen werden, damit bisherige Passwörter weiter funktionieren.

## Am Handy nach dem ersten erfolgreichen Deploy

1. Im Cloudflare-Dashboard den neuen Worker öffnen und unter **Bindings / Bindungen** die Datenbank **DB** auswählen. Alternativ die neue Datenbank unter **Storage & databases → D1** öffnen.
2. Unter **Console / Konsole** zunächst ausführen:

   ```sql
   SELECT (SELECT COUNT(*) FROM accounts) AS accounts,
          (SELECT COUNT(*) FROM players) AS factories;
   ```

   Beide Werte müssen `0` sein. Falls bereits neue Accounts angelegt sind, die Übernahme stoppen; die Dateien sind für eine leere neue Instanz vorbereitet.
3. Die private Datei `Factory-League-Spielstand-privat.sql` öffnen und ihre zwei `INSERT`-Anweisungen in der D1-Konsole ausführen. Falls die Oberfläche nur eine Anweisung zulässt: erst die Zeile für `accounts`, danach die für `players`. Keine öffentliche Repository-Datei bearbeiten.
4. Die Abfrage aus Schritt 2 wiederholen: Sie muss einen Account und eine Fabrik zeigen. Anschließend unter der neuen `workers.dev`-Adresse mit dem bisherigen Spielernamen und Passwort anmelden und Fabrikausbau, Credits und Rang prüfen.
5. Erst nach erfolgreicher Prüfung die Links in AppShelf und patrice-lab auf die neue Adresse ändern. Die alte Instanz und Datenbank bis dahin erhalten.

Die private Übernahmedatei ist eine Momentaufnahme vom 16. November 2026. Nach ihrer Erstellung bis zur Übernahme auf der alten Website keine weiteren Käufe oder Passwortänderungen vornehmen. Falls dort weitergespielt wurde, vor dem endgültigen Umzug eine frische Übernahmedatei erstellen lassen.

Alte Sitzungen und technische Kauf-Wiederholungsprotokolle werden in die neue Herkunftsadresse nicht übernommen. Der Account, Passwort- und Rettungscode-Prüfsummen, der gesamte gespeicherte Produktionswert, Credits, Fabrikausbau und Produktionszeitstempel bleiben erhalten. Alle Spieler melden sich auf der neuen Adresse neu an. Die SQL-Datei enthält keine Lösch- oder Überschreibbefehle und scheitert bei bereits vorhandenen gleichnamigen Einträgen.
