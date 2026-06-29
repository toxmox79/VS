const state = {
  articles: new Map(),
  results: [],
};

const csvFileInput = document.querySelector("#csvFile");
const loadSampleButton = document.querySelector("#loadSampleButton");
const addRowButton = document.querySelector("#addRowButton");
const generateButton = document.querySelector("#generateButton");
const downloadButton = document.querySelector("#downloadButton");
const printButton = document.querySelector("#printButton");
const entryTableBody = document.querySelector("#entryTableBody");
const resultTableBody = document.querySelector("#resultTableBody");
const printPreviewElement = document.querySelector("#printPreview");
const printTableBody = document.querySelector("#printTableBody");
const printMetaElement = document.querySelector("#printMeta");
const entryRowTemplate = document.querySelector("#entryRowTemplate");
const articleCountElement = document.querySelector("#articleCount");
const fileNameElement = document.querySelector("#fileName");
const importMessageElement = document.querySelector("#importMessage");
const resultMessageElement = document.querySelector("#resultMessage");

csvFileInput.addEventListener("change", handleFileSelection);
loadSampleButton.addEventListener("click", loadBundledCsv);
addRowButton.addEventListener("click", () => addEntryRow());
generateButton.addEventListener("click", generateDataset);
downloadButton.addEventListener("click", downloadResults);
printButton.addEventListener("click", openPrintPreview);
entryTableBody.addEventListener("click", handleEntryTableClick);

addEntryRow();
addEntryRow();

async function handleFileSelection(event) {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  const buffer = await file.arrayBuffer();
  importCsvBuffer(buffer, file.name);
}

async function loadBundledCsv() {
  try {
    const response = await fetch("./Testgewichte.csv");

    if (!response.ok) {
      throw new Error("Die vorhandene CSV konnte nicht geladen werden.");
    }

    const buffer = await response.arrayBuffer();
    importCsvBuffer(buffer, "Testgewichte.csv");
  } catch (error) {
    setMessage(
      importMessageElement,
      `${error.message} Wenn die Seite direkt als Datei ge\u00f6ffnet ist, lade die CSV bitte \u00fcber das Dateifeld hoch.`,
      "error",
    );
  }
}

function importCsvBuffer(buffer, fileName) {
  try {
    const text = decodeCsvBuffer(buffer);
    const rows = parseDelimitedText(text, ";");

    if (rows.length < 2) {
      throw new Error("Die CSV enth\u00e4lt keine verwertbaren Datenzeilen.");
    }

    const header = rows[0].map((value) => value.trim());
    const itemIdIndex = header.indexOf("ItemID");
    const itemTextNameIndex = header.indexOf("ItemTextName");

    if (itemIdIndex === -1 || itemTextNameIndex === -1) {
      throw new Error("Ben\u00f6tigte Spalten fehlen. Erwartet: ItemID und ItemTextName.");
    }

    const nextArticles = new Map();

    rows.slice(1).forEach((row) => {
      const articleId = (row[itemIdIndex] || "").trim();
      const itemTextName = (row[itemTextNameIndex] || "").trim();

      if (!articleId || !itemTextName) {
        return;
      }

      nextArticles.set(articleId, {
        articleId,
        itemTextName,
        ...extractManufacturerAndModel(itemTextName),
      });
    });

    state.articles = nextArticles;
    articleCountElement.textContent = String(nextArticles.size);
    fileNameElement.textContent = fileName;
    setMessage(
      importMessageElement,
      `${nextArticles.size} Artikel erfolgreich geladen.`,
      "success",
    );
  } catch (error) {
    state.articles = new Map();
    articleCountElement.textContent = "0";
    fileNameElement.textContent = "Keine Datei geladen";
    setMessage(importMessageElement, error.message, "error");
  }
}

function decodeCsvBuffer(buffer) {
  const encodings = ["windows-1252", "utf-8"];

  for (const encoding of encodings) {
    try {
      const decoder = new TextDecoder(encoding, { fatal: true });
      return decoder.decode(buffer);
    } catch (_error) {
      continue;
    }
  }

  throw new Error("Die CSV konnte nicht dekodiert werden.");
}

function parseDelimitedText(text, delimiter) {
  const rows = [];
  let currentField = "";
  let currentRow = [];
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        currentField += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (character === delimiter && !insideQuotes) {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !insideQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      currentRow.push(currentField);
      rows.push(currentRow);
      currentField = "";
      currentRow = [];
      continue;
    }

    currentField += character;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

function extractManufacturerAndModel(itemTextName) {
  const cleanedName = itemTextName
    .replace(/^\(VS\)\s*/i, "")
    .replace(/^\d+\s+/, "")
    .replace(/\s+/g, " ")
    .trim();

  const knownBrands = [
    "AEG",
    "Altus",
    "Amica",
    "Bauknecht",
    "Beko",
    "Bosch",
    "Candy",
    "Exquisit",
    "Gorenje",
    "Grundig",
    "Haier",
    "Hisense",
    "Hoover",
    "LG",
    "Liebherr",
    "Midea",
    "Neff",
    "PKM",
    "Samsung",
    "Sharp",
    "Siemens",
    "Telefunken",
  ];

  const brandPattern = new RegExp(`\\b(${knownBrands.join("|")})\\b`, "i");
  const brandMatch = cleanedName.match(brandPattern);

  if (brandMatch?.index !== undefined) {
    const manufacturer = brandMatch[0];
    const model = cleanedName
      .slice(brandMatch.index + manufacturer.length)
      .replace(/^\s+/, "")
      .trim();

    return {
      manufacturer,
      model,
    };
  }

  const tokens = cleanedName.split(" ");
  const manufacturer = tokens[0] || "";
  const model = tokens.slice(1).join(" ").trim();

  return {
    manufacturer,
    model,
  };
}

function addEntryRow(initialValues = {}) {
  const fragment = entryRowTemplate.content.cloneNode(true);
  const row = fragment.querySelector("tr");
  row.querySelector('[name="articleId"]').value = initialValues.articleId || "";
  row.querySelector('[name="aGrade"]').value = initialValues.aGrade ?? 0;
  row.querySelector('[name="vsGrade"]').value = initialValues.vsGrade ?? 0;
  entryTableBody.appendChild(fragment);
}

function handleEntryTableClick(event) {
  const removeButton = event.target.closest(".remove-row-button");

  if (!removeButton) {
    return;
  }

  const rows = Array.from(entryTableBody.querySelectorAll("tr"));

  if (rows.length === 1) {
    rows[0].querySelector('[name="articleId"]').value = "";
    rows[0].querySelector('[name="aGrade"]').value = 0;
    rows[0].querySelector('[name="vsGrade"]').value = 0;
    return;
  }

  removeButton.closest("tr").remove();
}

function generateDataset() {
  if (state.articles.size === 0) {
    setMessage(importMessageElement, "Bitte zuerst eine CSV laden.", "error");
    return;
  }

  const rows = Array.from(entryTableBody.querySelectorAll("tr"));
  const nextResults = [];
  const missingArticleIds = [];

  rows.forEach((row) => {
    const articleId = row.querySelector('[name="articleId"]').value.trim();
    const aGrade = sanitizeQuantity(row.querySelector('[name="aGrade"]').value);
    const vsGrade = sanitizeQuantity(row.querySelector('[name="vsGrade"]').value);

    if (!articleId && aGrade === 0 && vsGrade === 0) {
      return;
    }

    if (!articleId) {
      missingArticleIds.push("(leer)");
      return;
    }

    const article = state.articles.get(articleId);

    if (!article) {
      missingArticleIds.push(articleId);
      return;
    }

    nextResults.push({
      articleId: article.articleId,
      manufacturer: article.manufacturer,
      model: article.model,
      aGrade,
      vsGrade,
    });
  });

  state.results = nextResults;
  renderResults();

  if (missingArticleIds.length > 0) {
    setMessage(
      resultMessageElement,
      `Nicht gefunden: ${Array.from(new Set(missingArticleIds)).join(", ")}`,
      "error",
    );
    return;
  }

  if (nextResults.length === 0) {
    setMessage(resultMessageElement, "Es wurden keine Datens\u00e4tze erzeugt.", "error");
    return;
  }

  setMessage(
    resultMessageElement,
    `${nextResults.length} Datens\u00e4tze erfolgreich erzeugt.`,
    "success",
  );
}

function sanitizeQuantity(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function renderResults() {
  resultTableBody.innerHTML = "";
  printTableBody.innerHTML = "";

  if (state.results.length === 0) {
    resultTableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="5">Noch keine Datens\u00e4tze erzeugt.</td>
      </tr>
    `;
    printTableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="5">Noch keine Druckdaten verf\u00fcgbar.</td>
      </tr>
    `;
    downloadButton.disabled = true;
    printButton.disabled = true;
    printMetaElement.textContent = "Noch keine Datens\u00e4tze erzeugt";
    return;
  }

  const resultFragment = document.createDocumentFragment();
  const printFragment = document.createDocumentFragment();

  state.results.forEach((result) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(result.articleId)}</td>
      <td>${escapeHtml(result.manufacturer)}</td>
      <td>${escapeHtml(result.model)}</td>
      <td>${result.aGrade}</td>
      <td>${result.vsGrade}</td>
    `;
    resultFragment.appendChild(row);

    const printRow = row.cloneNode(true);
    printFragment.appendChild(printRow);
  });

  resultTableBody.appendChild(resultFragment);
  printTableBody.appendChild(printFragment);
  downloadButton.disabled = false;
  printButton.disabled = false;
  printMetaElement.textContent = buildPrintMetaText();
}

function downloadResults() {
  if (state.results.length === 0) {
    return;
  }

  const header = ["ArtikelID", "Hersteller", "Modell", "A-Wertig", "VS-Wertig"];
  const lines = [header];

  state.results.forEach((result) => {
    lines.push([
      result.articleId,
      result.manufacturer,
      result.model,
      String(result.aGrade),
      String(result.vsGrade),
    ]);
  });

  const csvContent = lines.map((line) => line.map(escapeCsvValue).join(";")).join("\r\n");
  const blob = new Blob(["\uFEFF", csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "b-ware-datensaetze.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function openPrintPreview() {
  if (state.results.length === 0) {
    return;
  }

  const printWindow = window.open("", "_blank", "noopener,noreferrer");

  if (!printWindow) {
    setMessage(
      resultMessageElement,
      "Das Druckfenster wurde blockiert. Bitte Pop-ups f\u00fcr diese Seite erlauben.",
      "error",
    );
    return;
  }

  printWindow.document.open();
  printWindow.document.write(buildPrintDocumentHtml());
  printWindow.document.close();
}

function buildPrintMetaText() {
  const now = new Date();
  const formattedDate = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(now);

  return `${state.results.length} Datens\u00e4tze | Erstellt am ${formattedDate}`;
}

function buildPrintDocumentHtml() {
  const previewMarkup = printPreviewElement.innerHTML;

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Druckvorschau B-Ware</title>
  <style>
    ${getPrintDocumentStyles()}
  </style>
</head>
<body>
  ${previewMarkup}
  <script>
    window.addEventListener("load", () => {
      window.focus();
      window.print();
    });

    window.addEventListener("afterprint", () => {
      window.close();
    });
  </script>
</body>
</html>`;
}

function getPrintDocumentStyles() {
  return `
    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: #e9e2d3;
      color: #111111;
      font-family: Bahnschrift, "Trebuchet MS", sans-serif;
    }

    body {
      padding: 24px;
    }

    .print-preview {
      overflow: auto;
    }

    .a4-page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 12mm;
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 24px 40px rgba(32, 28, 22, 0.16);
    }

    .print-meta {
      margin: 0 0 10px;
      color: #555555;
      font-size: 0.95rem;
    }

    .print-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid rgba(0, 0, 0, 0.22);
    }

    .print-table caption {
      margin-bottom: 8px;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 1.35rem;
      font-weight: 700;
      text-align: left;
    }

    .print-table th,
    .print-table td {
      padding: 9px 10px;
      font-size: 0.92rem;
      text-align: left;
      vertical-align: top;
      border: 1px solid rgba(0, 0, 0, 0.16);
    }

    .print-table th {
      background: rgba(22, 93, 77, 0.12);
      font-family: Georgia, "Times New Roman", serif;
    }

    .empty-row td {
      text-align: center;
      color: #625f56;
    }

    @page {
      size: A4 portrait;
      margin: 12mm;
    }

    @media print {
      html,
      body {
        background: #ffffff;
      }

      body {
        padding: 0;
      }

      .print-preview {
        overflow: visible;
      }

      .a4-page {
        width: auto;
        min-height: auto;
        padding: 0;
        border-radius: 0;
        box-shadow: none;
      }
    }
  `;
}

function escapeCsvValue(value) {
  const safeValue = String(value ?? "");

  if (/[;"\r\n]/.test(safeValue)) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }

  return safeValue;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setMessage(element, message, type) {
  element.textContent = message;
  element.classList.remove("is-error", "is-success");

  if (type === "error") {
    element.classList.add("is-error");
  }

  if (type === "success") {
    element.classList.add("is-success");
  }
}
