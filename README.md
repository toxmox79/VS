# B-Ware Datensatz-Generator

Die Webapp kann direkt &uuml;ber [index.html](./index.html) im Browser ge&ouml;ffnet werden.

## Funktionen

- CSV mit `ItemID` und `ItemTextName` einlesen
- Mehrere ArtikelIDs mit `A-Wertig`- und `VS-Wertig`-Mengen erfassen
- Ergebnistabelle mit `ArtikelID`, `Hersteller`, `Modell`, `A-Wertig`, `VS-Wertig`
- Download der erzeugten Daten als UTF-8-CSV
- DIN-A4-Druckvorschau als Tabelle mit Browser-Druckdialog

## Nutzung

1. `index.html` im Browser &ouml;ffnen.
2. Entweder `Testgewichte.csv` hochladen oder `Mit vorhandener CSV laden` verwenden.
3. ArtikelIDs und Mengen eintragen.
4. Neue Eingabezeilen bei Bedarf unter der Tabelle mit `Zeile hinzufügen` ergänzen.
5. `Datensatz erstellen` klicken.
6. Ergebnis &uuml;ber `Ergebnis herunterladen` exportieren.
7. Optional &uuml;ber `Druckvorschau DIN A4` direkt drucken oder als PDF speichern.

## Hinweis zur Hersteller-/Modellerkennung

Hersteller und Modell werden aus `ItemTextName` automatisch abgeleitet. Dabei wird der erste relevante Begriff als Hersteller verwendet, der Rest als Modell.
