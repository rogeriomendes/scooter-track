const B64_CHARS =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function uint8ArrayToBase64(bytes: Uint8Array): string {
	let result = "";
	const len = bytes.length;
	for (let i = 0; i < len; i += 3) {
		const b0 = bytes[i];
		const b1 = i + 1 < len ? bytes[i + 1] : 0;
		const b2 = i + 2 < len ? bytes[i + 2] : 0;

		result += B64_CHARS[(b0 >> 2) & 63];
		result += B64_CHARS[((b0 & 3) << 4) | ((b1 >> 4) & 15)];
		result += i + 1 < len ? B64_CHARS[((b1 & 15) << 2) | ((b2 >> 6) & 3)] : "=";
		result += i + 2 < len ? B64_CHARS[b2 & 63] : "=";
	}
	return result;
}

export function base64ToUint8Array(base64: string): Uint8Array {
	const sanitized = base64.replace(/[^A-Za-z0-9+/=]/g, "");
	let padLength = 0;
	if (sanitized.endsWith("==")) padLength = 2;
	else if (sanitized.endsWith("=")) padLength = 1;

	const byteLen = Math.floor((sanitized.length * 3) / 4) - padLength;
	const bytes = new Uint8Array(byteLen);
	let byteIdx = 0;

	const lookup = new Uint8Array(256);
	for (let i = 0; i < B64_CHARS.length; i++) {
		lookup[B64_CHARS.charCodeAt(i)] = i;
	}

	for (let i = 0; i < sanitized.length; i += 4) {
		const c0 = lookup[sanitized.charCodeAt(i)];
		const c1 = lookup[sanitized.charCodeAt(i + 1)];
		const c2 = lookup[sanitized.charCodeAt(i + 2)];
		const c3 = lookup[sanitized.charCodeAt(i + 3)];

		if (byteIdx < byteLen) bytes[byteIdx++] = (c0 << 2) | (c1 >> 4);
		if (byteIdx < byteLen) bytes[byteIdx++] = ((c1 & 15) << 4) | (c2 >> 2);
		if (byteIdx < byteLen) bytes[byteIdx++] = ((c2 & 3) << 6) | c3;
	}

	return bytes;
}
