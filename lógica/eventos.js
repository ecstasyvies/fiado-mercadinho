"use strict";

const ouvintes = new Map();

export function ouvir(evento, manipulador) {
  if (!ouvintes.has(evento)) ouvintes.set(evento, new Set());
  ouvintes.get(evento).add(manipulador);
}

export function remover(evento, manipulador) {
  if (!ouvintes.has(evento)) return;
  ouvintes.get(evento).delete(manipulador);
}

export function emitir(evento, detalhe = undefined) {
  const subs = ouvintes.get(evento);
  if (!subs || subs.size === 0) return;
  setTimeout(() => {
    for (const cb of Array.from(subs)) {
      try {
        cb(detalhe);
      } catch (err) {
        console.error(`Erro em ouvinte do evento '${evento}':`, err);
      }
    }
  }, 0);
}

export default { ouvir, remover, emitir };