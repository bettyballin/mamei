# mamei.de – neue Website

Statische Website für MAMEI Elektronik GmbH, Gersfeld. Kein CMS, keine Datenbank, keine externen Dienste.
Design auf Basis von Design 3 (hell) und Design 4 (dunkel), Schieferblau, Montserrat.

## Struktur

```
index.html          Startseite (Hero, Leistungen, Details, Ablauf, Über uns, Termin, FAQ, Kontakt)
baumontage.html     Unterseite Baumontage mit Anfrageformular
impressum.html      Impressum
datenschutz.html    Datenschutzerklärung
danke.html          Bestätigung nach Formularversand
404.html            Fehlerseite
kontakt.php         Formularhandler (sendet Anfragen per E-Mail)
.htaccess           HTTPS-Zwang, Weiterleitungen alter Shop-URLs, Sicherheits-Header, Caching
robots.txt, sitemap.xml
assets/css/style.css    Stylesheet mit Hell/Dunkel-Tokens
assets/js/main.js       Menü, Hell/Dunkel-Schalter, Öffnungsstatus, Formularprüfung
assets/fonts/           Montserrat (variable WOFF2, lokal, OFL-Lizenz)
assets/img/             Bilder, Favicons, OG-Bild
```

## Deployment auf All-Inkl

1. Im KAS unter „Domain“ für mamei.de den Pfad auf das Verzeichnis setzen, in das diese Dateien hochgeladen werden.
2. Alle Dateien per SFTP hochladen, **inklusive `.htaccess`** (versteckte Datei).
3. Let's-Encrypt-Zertifikat im KAS aktivieren. Danach in `.htaccess` die HSTS-Zeile einkommentieren.
4. Postfach anlegen oder prüfen: `kontakt.php` sendet von `website@mamei.de`. Entweder dieses Postfach anlegen
   (kann eine reine Weiterleitung sein) oder `$ABSENDER` in `kontakt.php` auf `info@mamei.de` ändern.
   Im KAS unter „E-Mail“ den SPF-Eintrag der Domain prüfen, damit Formular-Mails nicht im Spam landen.
5. Formular testen: Terminformular und Baumontage-Anfrage einmal absenden, Mail muss bei info@ ankommen.
6. Das Log `kontakt.log` (nur Zeitstempel und Status, keine Inhalte) wird per .htaccess vor Zugriff geschützt.
   Wer kein Log will: in `kontakt.php` `$LOG_DATEI = '';` setzen.

## Hell/Dunkel

Die Seite folgt der Systemeinstellung des Besuchers. Der Schalter im Header bzw. Footer speichert die Wahl
in `localStorage` (Eintrag `mamei-theme`). Das ist in der Datenschutzerklärung beschrieben. Kein Cookie-Banner nötig.

## Termin-Button

Alle „Termin vereinbaren“-Buttons führen auf den Abschnitt `#termin` mit Telefon, E-Mail und Terminformular.
Soll später ein Buchungstool verlinkt werden: in `build.py` `BOOKING_ANCHOR` ändern und neu bauen, oder
die Links `index.html#termin` in den HTML-Dateien ersetzen.

## Mit Vanessa abstimmen, bevor es live geht

- **Baumontage**: Leistungen, Zielgruppen und FAQ sind ein Vorschlag auf Basis typischer Montagearbeiten eines
  Telekom-Partners. Bitte mit dem tatsächlichen Angebot abgleichen.
- **FAQ auf der Startseite**: Antworten sind allgemein gehalten, aber bitte gegenlesen (z. B. Geschäftskunden, Reparaturumfang).
- **Leistungslisten**: insbesondere „Fernsehen über das Internet“, „Datensicherung“, „Geschäftskundenlösungen“ – nur stehen lassen, was angeboten wird.
- **Impressum**: Registergericht (Amtsgericht Fulda), HRB 7581 und USt-ID DE 165600415 stammen von der alten Website;
  auf Aktualität prüfen. Verantwortlich nach § 18 MStV ist derzeit Vanessa Meiß eingetragen.
- **Datenschutzerklärung**: Entwurf für genau diese Website (Hosting All-Inkl, Formulare per Mail, kein Tracking).
  Löschfristen (Logfiles 7 Tage, Anfragen 12 Monate) ggf. an die Praxis anpassen. AVV mit All-Inkl abschließen (im KAS abrufbar).
- **Fotos**: Teamfoto, Beraterin-Porträt und Router-Bild stammen aus dem bisherigen Projekt. Für den Livegang
  Nutzungsrechte prüfen bzw. durch eigene Fotos ersetzen. Telekom-Partner-Logo nur in der von der Telekom freigegebenen Form verwenden.
- **Öffnungszeiten**: stehen an drei Stellen – `index.html` (Kontaktkarte), `assets/js/main.js` (`HOURS`, für den
  Live-Status) und im JSON-LD im `<head>` von `index.html`. Bei Änderungen alle drei anpassen.

## Seiten neu bauen

Die HTML-Dateien werden aus `build.py` erzeugt (gemeinsamer Header/Footer). Änderungen am Layout dort vornehmen und
`python3 build.py` ausführen. Direkt in den HTML-Dateien zu editieren geht auch, ist aber bei Header/Footer fehleranfällig.
