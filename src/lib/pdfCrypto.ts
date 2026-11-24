import { PDFDocument } from 'pdf-lib';

// Standard PDF Security Handler 32-byte padding string (PDF 1.4 Spec Table 3.19)
const PDF_PADDING = new Uint8Array([
  0x28, 0xbf, 0x4e, 0x5e, 0x4e, 0x75, 0x8a, 0x41,
  0x64, 0x00, 0x4e, 0x56, 0xff, 0xfa, 0x01, 0x08,
  0x2e, 0x2e, 0x00, 0xb6, 0xd0, 0x68, 0x3e, 0x80,
  0x2f, 0x0c, 0xa9, 0xfe, 0x64, 0x53, 0x69, 0x7a,
]);

function md5(input: Uint8Array): Uint8Array {
  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];
  const K = new Uint32Array(64);
  for (let i = 0; i < 64; i++) {
    K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0;
  }

  const origLenBits = input.length * 8;
  const padLen = ((56 - ((input.length + 1) % 64)) + 64) % 64;
  const msg = new Uint8Array(input.length + 1 + padLen + 8);
  msg.set(input);
  msg[input.length] = 0x80;
  const view = new DataView(msg.buffer);
  view.setUint32(msg.length - 8, origLenBits >>> 0, true);
  view.setUint32(msg.length - 4, Math.floor(origLenBits / 0x100000000) >>> 0, true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let offset = 0; offset < msg.length; offset += 64) {
    const M = new Uint32Array(16);
    for (let j = 0; j < 16; j++) {
      M[j] = view.getUint32(offset + j * 4, true);
    }

    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;

    for (let i = 0; i < 64; i++) {
      let F = 0;
      let g = 0;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }

      const dTemp = D;
      D = C;
      C = B;
      const sum = (A + F + K[i] + M[g]) >>> 0;
      const rot = ((sum << s[i]) | (sum >>> (32 - s[i]))) >>> 0;
      B = (B + rot) >>> 0;
      A = dTemp;
    }

    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  const out = new Uint8Array(16);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, a0, true);
  outView.setUint32(4, b0, true);
  outView.setUint32(8, c0, true);
  outView.setUint32(12, d0, true);
  return out;
}

function rc4(key: Uint8Array, data: Uint8Array): Uint8Array {
  const S = new Uint8Array(256);
  for (let i = 0; i < 256; i++) S[i] = i;

  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + S[i] + key[i % key.length]) & 0xff;
    const tmp = S[i];
    S[i] = S[j];
    S[j] = tmp;
  }

  const out = new Uint8Array(data.length);
  let a = 0;
  let b = 0;
  for (let idx = 0; idx < data.length; idx++) {
    a = (a + 1) & 0xff;
    b = (b + S[a]) & 0xff;
    const tmp = S[a];
    S[a] = S[b];
    S[b] = tmp;
    out[idx] = data[idx] ^ S[(S[a] + S[b]) & 0xff];
  }
  return out;
}

function padPassword(password: string): Uint8Array {
  const bytes = new TextEncoder().encode(password);
  const out = new Uint8Array(32);
  const copyLen = Math.min(32, bytes.length);
  out.set(bytes.subarray(0, copyLen), 0);
  if (copyLen < 32) {
    out.set(PDF_PADDING.subarray(0, 32 - copyLen), copyLen);
  }
  return out;
}

function concatBytes(...chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array {
  const clean = hex.replace(/\s+/g, '');
  const padded = clean.length % 2 === 1 ? `${clean}0` : clean;
  const out = new Uint8Array(padded.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(padded.slice(i * 2, i * 2 + 2), 16) || 0;
  }
  return out;
}

function computeOValue(userPassword: string, ownerPassword: string): Uint8Array {
  const ownerPad = padPassword(ownerPassword || userPassword);
  let key = md5(ownerPad);
  for (let i = 0; i < 50; i++) {
    key = md5(key);
  }

  let enc = padPassword(userPassword);
  const iterKey = new Uint8Array(16);
  for (let i = 0; i < 20; i++) {
    for (let k = 0; k < 16; k++) iterKey[k] = key[k] ^ i;
    enc = rc4(iterKey, enc);
  }
  return enc;
}

function computeFileKey(
  userPassword: string,
  oVal: Uint8Array,
  permissions: number,
  fileId: Uint8Array
): Uint8Array {
  const userPad = padPassword(userPassword);
  const permBuf = new Uint8Array(4);
  new DataView(permBuf.buffer).setInt32(0, permissions, true);
  let hash = md5(concatBytes(userPad, oVal, permBuf, fileId));
  for (let i = 0; i < 50; i++) {
    hash = md5(hash.subarray(0, 16));
  }
  return hash.subarray(0, 16);
}

function computeUValue(fileKey: Uint8Array, fileId: Uint8Array): Uint8Array {
  let enc = md5(concatBytes(PDF_PADDING, fileId));
  const iterKey = new Uint8Array(16);
  for (let i = 0; i < 20; i++) {
    for (let k = 0; k < 16; k++) iterKey[k] = fileKey[k] ^ i;
    enc = rc4(iterKey, enc);
  }
  return concatBytes(enc, new Uint8Array(16));
}

function computeObjectKey(fileKey: Uint8Array, objNum: number, genNum: number): Uint8Array {
  const suffix = new Uint8Array([
    objNum & 0xff,
    (objNum >> 8) & 0xff,
    (objNum >> 16) & 0xff,
    genNum & 0xff,
    (genNum >> 8) & 0xff,
  ]);
  return md5(concatBytes(fileKey, suffix));
}

function unescapePdfLiteral(bytes: Uint8Array, start: number, end: number): Uint8Array {
  const out: number[] = [];
  for (let i = start; i < end; i++) {
    const ch = bytes[i];
    if (ch !== 0x5c /* \ */) {
      out.push(ch);
      continue;
    }
    if (i + 1 >= end) break;
    const next = bytes[++i];
    if (next === 0x6e /* n */) out.push(0x0a);
    else if (next === 0x72 /* r */) out.push(0x0d);
    else if (next === 0x74 /* t */) out.push(0x09);
    else if (next === 0x62 /* b */) out.push(0x08);
    else if (next === 0x66 /* f */) out.push(0x0c);
    else if (next === 0x0a /* \n */) continue;
    else if (next === 0x0d /* \r */) {
      if (i + 1 < end && bytes[i + 1] === 0x0a) i++;
      continue;
    } else if (next >= 0x30 && next <= 0x37 /* octal */) {
      let oct = String.fromCharCode(next);
      for (let d = 0; d < 2 && i + 1 < end; d++) {
        const nx = bytes[i + 1];
        if (nx >= 0x30 && nx <= 0x37) {
          oct += String.fromCharCode(nx);
          i++;
        } else break;
      }
      out.push(parseInt(oct, 8) & 0xff);
    } else {
      out.push(next);
    }
  }
  return new Uint8Array(out);
}

/**
 * Encrypts literal strings (...) and hex strings <...> in a PDF object's non-stream section
 * as RC4-encrypted <hex> tokens while preserving delimiters, dicts << >>, and comments.
 */
function encryptNonStreamBytes(slice: Uint8Array, objKey: Uint8Array): Uint8Array {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  let cursor = 0;
  let i = 0;

  while (i < slice.length) {
    const b = slice[i];

    // Skip PDF comments
    if (b === 0x25 /* % */) {
      while (i < slice.length && slice[i] !== 0x0a && slice[i] !== 0x0d) i++;
      continue;
    }

    // Literal string (...)
    if (b === 0x28 /* ( */) {
      if (i > cursor) parts.push(slice.subarray(cursor, i));
      let depth = 1;
      const litStart = i + 1;
      i++;
      while (i < slice.length && depth > 0) {
        if (slice[i] === 0x5c /* \ */) {
          i += 2;
          continue;
        }
        if (slice[i] === 0x28) depth++;
        else if (slice[i] === 0x29) depth--;
        i++;
      }
      const litEnd = Math.max(litStart, i - 1);
      const rawBytes = unescapePdfLiteral(slice, litStart, litEnd);
      const encrypted = rc4(objKey, rawBytes);
      parts.push(enc.encode(`<${toHex(encrypted)}>`));
      cursor = i;
      continue;
    }

    // Check << ... >> vs hex string <...>
    if (b === 0x3c /* < */) {
      if (i + 1 < slice.length && slice[i + 1] === 0x3c) {
        i += 2;
        continue;
      }
      if (i > cursor) parts.push(slice.subarray(cursor, i));
      const hexStart = i + 1;
      i++;
      while (i < slice.length && slice[i] !== 0x3e /* > */) i++;
      const hexStr = new TextDecoder('latin1').decode(slice.subarray(hexStart, i));
      if (i < slice.length && slice[i] === 0x3e) i++;
      const rawBytes = fromHex(hexStr);
      const encrypted = rc4(objKey, rawBytes);
      parts.push(enc.encode(`<${toHex(encrypted)}>`));
      cursor = i;
      continue;
    }

    i++;
  }

  if (cursor < slice.length) parts.push(slice.subarray(cursor));
  return concatBytes(...parts);
}

/**
 * Encrypts a PDF document client-side with standard PDF 1.4 RC4 128-bit password security (/V 2 /R 3).
 */
export async function protectPdfWithPassword(
  pdfBlob: Blob,
  options: {
    userPassword: string;
    ownerPassword?: string;
    allowPrinting?: boolean;
    allowCopying?: boolean;
  }
): Promise<Uint8Array> {
  const userPassword = options.userPassword || '';
  if (!userPassword.trim()) {
    throw new Error('Please enter a password to protect the PDF.');
  }

  const ownerPassword = (options.ownerPassword || '').trim() || `${userPassword}_owner`;
  const buffer = await pdfBlob.arrayBuffer();
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });

  // Serialize without /ObjStm compressed object streams so every indirect object is cleanly addressable
  const plainBytes = await doc.save({ useObjectStreams: false });
  const latin1 = new TextDecoder('latin1').decode(plainBytes);

  // Extract Root & optional Info references from plain trailer
  const trailerMatch = latin1.match(/trailer\s*<<([\s\S]*?)>>\s*startxref/);
  if (!trailerMatch) {
    throw new Error('Could not serialize PDF trailer for encryption.');
  }
  const trailerBody = trailerMatch[1];
  const rootMatch = trailerBody.match(/\/Root\s+(\d+\s+\d+\s+R)/);
  if (!rootMatch) {
    throw new Error('PDF document is missing a Root catalog reference.');
  }
  const rootRef = rootMatch[1];
  const infoMatch = trailerBody.match(/\/Info\s+(\d+\s+\d+\s+R)/);
  const infoRef = infoMatch ? infoMatch[1] : null;

  // PDF 1.4 permissions bitmask (bits 1-2 = 0, bit 3 = print, bit 5 = copy, high bits 1)
  let permissions = -3904; // Standard baseline restrictive flags (bits 13..32 set to 1)
  if (options.allowPrinting !== false) permissions |= 1 << 2; // bit 3
  if (options.allowCopying === true) permissions |= 1 << 4; // bit 5

  const fileId = crypto.getRandomValues(new Uint8Array(16));
  const oVal = computeOValue(userPassword, ownerPassword);
  const fileKey = computeFileKey(userPassword, oVal, permissions, fileId);
  const uVal = computeUValue(fileKey, fileId);

  // Locate every `N G obj ... endobj` in the normalized PDF
  const objHeaderRe = /^(\d+)\s+(\d+)\s+obj\b/gm;
  const objPositions: Array<{ objNum: number; genNum: number; start: number; bodyStart: number }> = [];
  let match: RegExpExecArray | null;
  while ((match = objHeaderRe.exec(latin1)) !== null) {
    objPositions.push({
      objNum: Number(match[1]),
      genNum: Number(match[2]),
      start: match.index,
      bodyStart: match.index + match[0].length,
    });
  }

  let maxObjNum = 0;
  const encryptedObjects = new Map<number, { genNum: number; bytes: Uint8Array }>();
  const enc = new TextEncoder();

  for (const pos of objPositions) {
    if (pos.objNum > maxObjNum) maxObjNum = pos.objNum;
    const endObjIdx = latin1.indexOf('endobj', pos.bodyStart);
    if (endObjIdx === -1) continue;

    const rawBody = plainBytes.subarray(pos.bodyStart, endObjIdx);
    const bodyText = latin1.slice(pos.bodyStart, endObjIdx);
    const objKey = computeObjectKey(fileKey, pos.objNum, pos.genNum);

    const streamKwIdx = bodyText.indexOf('stream');
    let encryptedBody: Uint8Array;

    if (streamKwIdx !== -1) {
      // Find newline cleanly after `stream`
      let streamDataStart = streamKwIdx + 6;
      if (rawBody[streamDataStart] === 0x0d && rawBody[streamDataStart + 1] === 0x0a) {
        streamDataStart += 2;
      } else if (rawBody[streamDataStart] === 0x0a || rawBody[streamDataStart] === 0x0d) {
        streamDataStart += 1;
      }

      const endStreamIdx = bodyText.lastIndexOf('endstream');
      if (endStreamIdx > streamDataStart) {
        let streamDataEnd = endStreamIdx;
        if (rawBody[streamDataEnd - 1] === 0x0a) streamDataEnd--;
        if (rawBody[streamDataEnd - 1] === 0x0d) streamDataEnd--;

        const prefixEncrypted = encryptNonStreamBytes(
          rawBody.subarray(0, streamKwIdx),
          objKey
        );
        const betweenHeaderAndData = rawBody.subarray(streamKwIdx, streamDataStart);
        const encStream = rc4(objKey, rawBody.subarray(streamDataStart, streamDataEnd));
        const suffix = rawBody.subarray(streamDataEnd);

        encryptedBody = concatBytes(
          prefixEncrypted,
          betweenHeaderAndData,
          encStream,
          suffix
        );
      } else {
        encryptedBody = encryptNonStreamBytes(rawBody, objKey);
      }
    } else {
      encryptedBody = encryptNonStreamBytes(rawBody, objKey);
    }

    const fullObjBytes = concatBytes(
      enc.encode(`${pos.objNum} ${pos.genNum} obj`),
      encryptedBody,
      enc.encode('endobj\n')
    );
    encryptedObjects.set(pos.objNum, { genNum: pos.genNum, bytes: fullObjBytes });
  }

  // Create Encrypt dictionary object
  const encryptObjNum = maxObjNum + 1;
  const encryptDictStr =
    `${encryptObjNum} 0 obj\n` +
    `<< /Filter /Standard /V 2 /R 3 /Length 128 /P ${permissions} ` +
    `/O <${toHex(oVal)}> /U <${toHex(uVal)}> >>\n` +
    `endobj\n`;
  encryptedObjects.set(encryptObjNum, {
    genNum: 0,
    bytes: enc.encode(encryptDictStr),
  });

  // Reassemble encrypted PDF and build exact xref byte offsets
  const chunks: Uint8Array[] = [enc.encode('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n')];
  let cursorOffset = chunks[0].length;
  const offsets = new Map<number, { offset: number; gen: number }>();

  const totalSize = encryptObjNum + 1;
  for (let objNum = 1; objNum <= encryptObjNum; objNum++) {
    const entry = encryptedObjects.get(objNum);
    if (!entry) continue;
    offsets.set(objNum, { offset: cursorOffset, gen: entry.genNum });
    chunks.push(entry.bytes);
    cursorOffset += entry.bytes.length;
  }

  const xrefOffset = cursorOffset;
  let xrefStr = `xref\n0 ${totalSize}\n0000000000 65535 f \n`;
  for (let objNum = 1; objNum <= encryptObjNum; objNum++) {
    const info = offsets.get(objNum);
    if (!info) {
      xrefStr += '0000000000 65535 f \n';
    } else {
      xrefStr += `${String(info.offset).padStart(10, '0')} ${String(info.gen).padStart(5, '0')} n \n`;
    }
  }

  const idHex = toHex(fileId);
  const infoClause = infoRef ? ` /Info ${infoRef}` : '';
  const trailerStr =
    `trailer\n` +
    `<< /Size ${totalSize} /Root ${rootRef}${infoClause} ` +
    `/Encrypt ${encryptObjNum} 0 R /ID [<${idHex}> <${idHex}>] >>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`;

  chunks.push(enc.encode(xrefStr + trailerStr));
  return concatBytes(...chunks);
}
