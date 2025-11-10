import { NextResponse, type NextRequest } from "next/server";
import { uploadFileToIPFS } from "@/lib/ipfs";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Use JPG, PNG, GIF, or WebP." },
        { status: 415 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 10MB limit." },
        { status: 413 }
      );
    }

    const { cid, ipfsUri, gatewayUrl } = await uploadFileToIPFS(file);

    return NextResponse.json(
      {
        cid,
        ipfsUri,
        gatewayUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Pinata upload failed:", error);
    return NextResponse.json(
      { error: "Failed to upload file to IPFS. Please try again." },
      { status: 500 }
    );
  }
}
