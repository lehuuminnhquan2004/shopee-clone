export function formatVnd(value: string): string {
    return `${BigInt(value).toLocaleString("vi-VN")}₫`;
}