<?php
/**
 * MAMEI Elektronik – Formularhandler
 * Nimmt Termin- und Baumontage-Anfragen entgegen und sendet sie per E-Mail an den Laden.
 * Keine Speicherung in einer Datenbank, kein externer Dienst.
 *
 * Einstellungen:
 */
$EMPFAENGER   = 'info@mamei.de';                 // Postfach, das die Anfragen bekommt
$ABSENDER     = 'website@mamei.de';              // Absenderadresse (muss zur Domain gehören, damit Mails nicht im Spam landen)
$ABSENDERNAME = 'Website mamei.de';
$DANKE_SEITE  = 'danke.html';
$MIN_SEKUNDEN = 4;                               // Formulare, die schneller abgeschickt werden, gelten als Bot
$LOG_DATEI    = __DIR__ . '/kontakt.log';        // nur Zeitstempel + Status, keine Inhalte (Fehlersuche). Leer lassen = kein Log.

// ---------------------------------------------------------------------------
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

function zurueck_mit_fehler(string $grund): void {
    // Bei Fehlern zurück zum Formular; der Nutzer sieht eine allgemeine Meldung.
    $ref = $_SERVER['HTTP_REFERER'] ?? 'index.html';
    $ref = preg_replace('/[#?].*$/', '', $ref);
    $ziel = (strpos($ref, 'baumontage') !== false) ? 'baumontage.html?fehler=1#anfrage' : 'index.html?fehler=1#termin';
    protokoll('fehler: ' . $grund);
    header('Location: ' . $ziel, true, 303);
    exit;
}

function protokoll(string $text): void {
    global $LOG_DATEI;
    if ($LOG_DATEI === '') return;
    @file_put_contents($LOG_DATEI, date('c') . ' ' . $text . PHP_EOL, FILE_APPEND | LOCK_EX);
}

function feld(string $name, int $max = 500): string {
    $wert = $_POST[$name] ?? '';
    if (is_array($wert)) $wert = '';
    $wert = trim(str_replace(["\r", "\0"], '', (string) $wert));
    // Header-Injection verhindern
    $wert = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', $wert);
    return mb_substr($wert, 0, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Location: index.html', true, 303);
    exit;
}

// 1) Honeypot: Bots füllen das versteckte Feld aus
if (feld('firma') !== '') {
    protokoll('honeypot');
    header('Location: ' . $DANKE_SEITE, true, 303); // Bot glaubt, es hat geklappt
    exit;
}

// 2) Zeitstempel: zu schnell abgeschickt = Bot (ts wird per JS gesetzt; ohne JS wird die Prüfung übersprungen)
$ts = (int) feld('ts', 20);
if ($ts > 0 && (microtime(true) * 1000 - $ts) < $MIN_SEKUNDEN * 1000) {
    protokoll('zu schnell');
    header('Location: ' . $DANKE_SEITE, true, 303);
    exit;
}

// 3) Pflichtfelder
$art       = feld('art', 20) === 'baumontage' ? 'baumontage' : 'termin';
$name      = feld('name', 120);
$kontakt   = feld('kontakt', 160);
$thema     = feld('thema', 120);
$zusatz    = feld('wunschtermin', 200);
$nachricht = feld('nachricht', 3000);
$consent   = feld('consent', 5);

if ($name === '' || mb_strlen($kontakt) < 5 || $consent !== '1') {
    zurueck_mit_fehler('pflichtfelder');
}
// Links in der Nachricht sind bei echten Kunden selten, bei Spam fast immer vorhanden.
if (preg_match_all('~https?://~i', $nachricht) > 2) {
    protokoll('zu viele links');
    header('Location: ' . $DANKE_SEITE, true, 303);
    exit;
}

// 4) Mail zusammenbauen
$istBau   = $art === 'baumontage';
$betreff  = $istBau ? 'Baumontage-Anfrage über mamei.de' : 'Terminanfrage über mamei.de';
$betreff .= ' – ' . $name;

$zeilen = [
    ($istBau ? 'Neue Baumontage-Anfrage' : 'Neue Terminanfrage') . ' über die Website',
    str_repeat('-', 48),
    'Name:          ' . $name,
    'Kontakt:       ' . $kontakt,
    ($istBau ? 'Montageart:    ' : 'Thema:         ') . $thema,
    ($istBau ? 'Objekt/Ort:    ' : 'Wunschtermin:  ') . ($zusatz !== '' ? $zusatz : '–'),
    '',
    'Nachricht:',
    $nachricht !== '' ? $nachricht : '–',
    '',
    str_repeat('-', 48),
    'Gesendet am:   ' . date('d.m.Y H:i') . ' Uhr',
    'Einwilligung:  erteilt (Datenschutzhinweis bestätigt)',
    'Hinweis: Antwort bitte direkt an die oben genannte Kontaktangabe.',
];
$text = implode("\n", $zeilen);

// Falls der Kunde eine E-Mail-Adresse angegeben hat, als Reply-To setzen
$replyTo = '';
if (filter_var($kontakt, FILTER_VALIDATE_EMAIL)) {
    $replyTo = $kontakt;
}

$header  = 'From: =?UTF-8?B?' . base64_encode($ABSENDERNAME) . "?= <{$ABSENDER}>\r\n";
if ($replyTo !== '') $header .= "Reply-To: {$replyTo}\r\n";
$header .= "MIME-Version: 1.0\r\n";
$header .= "Content-Type: text/plain; charset=UTF-8\r\n";
$header .= "Content-Transfer-Encoding: 8bit\r\n";
$header .= "X-Mailer: mamei.de Formular\r\n";

$betreffCodiert = '=?UTF-8?B?' . base64_encode($betreff) . '?=';

$ok = @mail($EMPFAENGER, $betreffCodiert, $text, $header, '-f ' . $ABSENDER);

if (!$ok) {
    zurueck_mit_fehler('mail() fehlgeschlagen');
}

protokoll('ok: ' . $art);
header('Location: ' . $DANKE_SEITE, true, 303);
exit;
