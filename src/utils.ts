export function hexToBin(hex: string) {
  if (!hex) return "";
  const newLength = hex.length * 4;
  return parseInt(hex, 16).toString(2).padStart(newLength, "0");
}

export function binToHex(bin: string) {
  if (!bin) return "";
  const newLength = Math.ceil(bin.length / 4) * 4;
  const paddedBin = bin.padEnd(newLength, "0");
  return paddedBin
    .match(/.{1,4}/g)!
    .map((bits) => parseInt(bits, 2).toString(16))
    .join("");
}

export function getZeroPadding(binary: string) {
  return "0".repeat(Math.max(0, 32 - binary.length));
}

export function formatBinary(binary: string) {
  return binary.match(/.{1,4}/g)?.join(" ") ?? "";
}

export function formatBinaryEnd(binary: string) {
  const chunkCount = Math.floor(binary.length / 4);
  const partialChunkSize = binary.length % 4;
  const partialChunk = "0".repeat(partialChunkSize);
  return partialChunk + " 0000".repeat(chunkCount);
}
