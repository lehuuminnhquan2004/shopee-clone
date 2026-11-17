import sharp from "sharp";

const MAX_OUTPUT_SIZE = 2 * 1024 * 1024;
const MAX_INPUT_PIXELS = 20_000_000;

export async function compressAvatar(input: Buffer): Promise<Buffer> {
    const options = {
        limitInputPixels: MAX_INPUT_PIXELS,
        failOn: "error" as const,
    }

    const metadata = await sharp(input, options).metadata();

    if (
        !metadata.format ||
        !["jpeg", "png", "webp"].includes(metadata.format)
    ) {
        throw new Error("Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP");
    }
    if ((metadata.pages ?? 1) > 1) {
        throw new Error("Vui lòng chọn ảnh tĩnh");
    }

    //Nén ảnh
    for (const quality of [85, 75, 65, 55]) {
        const output = await sharp(input, options)
            .rotate()
            .resize({
                width: 1024,
                height: 1024,
                fit: "inside",
                withoutEnlargement: true,
            })
            .webp({ quality })
            .toBuffer();

        if (output.length <= MAX_OUTPUT_SIZE) {
            return output;
        }
    }
    throw new Error("Không thể giảm ảnh xuống dưới giới hạn 2 MB");
}