const B64_CHARS =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const LOOKUP = new Uint8Array(256);
for (let i = 0; i < B64_CHARS.length; i++) {
	LOOKUP[B64_CHARS.charCodeAt(i)] = i;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
	const len = bytes.length;
	const parts: string[] = [];
	const chunkSize = 16384;

	for (let chunkStart = 0; chunkStart < len; chunkStart += chunkSize) {
		const chunkEnd = Math.min(chunkStart + chunkSize, len);
		let chunkStr = "";
		for (let i = chunkStart; i < chunkEnd; i += 3) {
			const b0 = bytes[i];
			const b1 = i + 1 < len ? bytes[i + 1] : 0;
			const b2 = i + 2 < len ? bytes[i + 2] : 0;

			chunkStr += B64_CHARS[(b0 >> 2) & 63];
			chunkStr += B64_CHARS[((b0 & 3) << 4) | ((b1 >> 4) & 15)];
			chunkStr +=
				i + 1 < len ? B64_CHARS[((b1 & 15) << 2) | ((b2 >> 6) & 3)] : "=";
			chunkStr += i + 2 < len ? B64_CHARS[b2 & 63] : "=";
		}
		parts.push(chunkStr);
	}
	return parts.join("");
}

export function base64ToUint8Array(base64: string): Uint8Array {
	const sanitized = base64.replace(/[^A-Za-z0-9+/=]/g, "");
	let padLength = 0;
	if (sanitized.endsWith("==")) padLength = 2;
	else if (sanitized.endsWith("=")) padLength = 1;

	const byteLen = Math.floor((sanitized.length * 3) / 4) - padLength;
	const bytes = new Uint8Array(byteLen);
	let byteIdx = 0;

	for (let i = 0; i < sanitized.length; i += 4) {
		const c0 = LOOKUP[sanitized.charCodeAt(i)];
		const c1 = LOOKUP[sanitized.charCodeAt(i + 1)];
		const c2 = LOOKUP[sanitized.charCodeAt(i + 2)];
		const c3 = LOOKUP[sanitized.charCodeAt(i + 3)];

		if (byteIdx < byteLen) bytes[byteIdx++] = (c0 << 2) | (c1 >> 4);
		if (byteIdx < byteLen) bytes[byteIdx++] = ((c1 & 15) << 4) | (c2 >> 2);
		if (byteIdx < byteLen) bytes[byteIdx++] = ((c2 & 3) << 6) | c3;
	}

	return bytes;
}
