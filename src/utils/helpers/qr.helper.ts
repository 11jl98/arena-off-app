/**
 * QR Code da NFC-e (NT 2025.001 - QR Code 3.0 e leiaute 2.0):
 *
 * - v3 online : chave|3|tpAmb                     → sem valor
 * - v3 offline: chave|3|tpAmb|dia|vNF|...         → valor no 5º campo
 * - v2 online : chave|2|tpAmb|idCSC|hash          → 5º campo é hash (não é valor)
 * - v2 offline: chave|2|tpAmb|dia|vNF|digest|...  → valor no 5º campo
 *
 * O 5º campo só contém o valor quando ele casa com o padrão
 * dígitos + separador decimal + 2 casas (ex.: 1234.56 ou 1234,56).
 */
export const qrHasAmount = (receiptUrl: string): boolean => {
  try {
    const url = new URL(receiptUrl);
    const query = url.search.startsWith('?') ? url.search.slice(1) : url.search;
    const segment = query
      .split('&')
      .find((seg) => seg === 'p' || seg.startsWith('p='));
    if (!segment || segment === 'p') return false;

    const p = decodeURIComponent(segment.slice(2));
    const parts = p.split('|');

    if (!/^\d{44}$/.test(parts[0]?.trim() ?? '')) return false;
    const version = parts[1]?.trim();
    if (version !== '2' && version !== '3') return false;

    return /^\d{1,12}[.,]\d{2}$/.test(parts[4]?.trim() ?? '');
  } catch {
    return false;
  }
};
