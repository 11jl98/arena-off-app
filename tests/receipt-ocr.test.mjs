import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseAmountFromText } from '../src/utils/helpers/receipt-ocr.ts';

for (const [text, expected] of [
  ['Valor pago R$ 75.90', 75.9],
  ['VALOR TOTAL R$ 1234,56', 1234.56],
  ['Valor total R$ 1.234,56', 1234.56],
  ['Valor a pagar R$ 75, 90', 75.9],
  ['Subtotal 100,00\nValor total 75,90\nTroco 24,10', 75.9],
  ['Forma de pagamento    Valor pago\nPix    75,90', 75.9],
  ['Valor pago\nPix 50,00\nDinheiro 25,90', null],
  ['Troco 24,10', null],
  ['75,90\n24,10', null],
  ['R$ 75,90', 75.9],
  ['VALOR TOTAL 75,9', null],
  ['VALOR TOTAL 75,90 24,10', null],
]) {
  test(JSON.stringify(text), () => assert.equal(parseAmountFromText(text), expected));
}

for (const [text, expected] of [
  ['A PAGAR R$ 712,32', 712.32],
  ['QTD. TOTAL DE ITENS 58\nA PAGAR 712,32\nDESCONTO 70,81', 712.32],
  ['VALOR TOTAL R$ 783,13\nVALOR A PAGAR R$ 712,32', null],
]) {
  test(JSON.stringify(text), () => assert.equal(parseAmountFromText(text), expected));
}
