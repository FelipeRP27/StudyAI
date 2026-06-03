export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_TEXT_LENGTH = 50000;

function getExtension(filename) {
  const idx = filename.lastIndexOf('.');
  if (idx === -1) return '';
  return filename.slice(idx + 1).toLowerCase();
}

export function stripExtension(filename) {
  const idx = filename.lastIndexOf('.');
  if (idx === -1) return filename;
  return filename.slice(0, idx);
}

async function loadPdfjs() {
  const [pdfjsLib, workerModule] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  ]);
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
  return pdfjsLib;
}

async function extractFromPdf(file) {
  const pdfjsLib = await loadPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const doc = await loadingTask.promise;
  const partes = [];

  for (let pagina = 1; pagina <= doc.numPages; pagina += 1) {
    const page = await doc.getPage(pagina);
    const content = await page.getTextContent();
    const linha = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (linha) partes.push(linha);
  }

  return partes.join('\n\n').trim();
}

async function extractFromTxt(file) {
  const texto = await file.text();
  return texto.replace(/\r\n/g, '\n').trim();
}

export async function extractTextFromFile(file) {
  if (!file) {
    throw new Error('Nenhum arquivo selecionado.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(
      `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Máximo: 5 MB.`
    );
  }

  const ext = getExtension(file.name);
  let texto = '';

  if (ext === 'txt' || file.type === 'text/plain') {
    texto = await extractFromTxt(file);
  } else if (ext === 'pdf' || file.type === 'application/pdf') {
    texto = await extractFromPdf(file);
  } else {
    throw new Error('Formato não suportado. Use PDF ou TXT.');
  }

  if (!texto || texto.length < 10) {
    throw new Error(
      'Não foi possível extrair texto. Se for um PDF escaneado, cole o conteúdo manualmente.'
    );
  }

  let truncado = false;
  if (texto.length > MAX_TEXT_LENGTH) {
    texto = texto.slice(0, MAX_TEXT_LENGTH);
    truncado = true;
  }

  return { texto, truncado, caracteres: texto.length };
}
