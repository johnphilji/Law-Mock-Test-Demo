import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-server";
import { extractRawTextFromFile, parseDocumentContent } from "@/lib/importer/documentParser";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string | null) || undefined;

    if (!file) {
      return NextResponse.json({ error: "Please upload a .docx or .pdf file" }, { status: 400 });
    }

    const fileName = file.name;
    const validExtensions = [".docx", ".pdf"];
    const isSupported = validExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));

    if (!isSupported) {
      return NextResponse.json(
        { error: "Unsupported file format. Please upload a .docx or .pdf document." },
        { status: 400 }
      );
    }

    // Size limit check: 20MB max
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File exceeds the 20MB maximum size limit." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rawText = await extractRawTextFromFile(buffer, fileName);

    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json(
        { error: "The document appears empty or could not be read. For scanned PDFs, text-based OCR is required." },
        { status: 400 }
      );
    }

    const parsedResult = parseDocumentContent(rawText, title);

    return NextResponse.json({
      success: true,
      fileName,
      fileSize: file.size,
      data: parsedResult,
    });
  } catch (error: any) {
    console.error("Document parse error:", error);
    if (error?.name === "AuthError") {
      return handleAuthError(error);
    }
    return NextResponse.json(
      { error: error?.message || "Failed to process document" },
      { status: 500 }
    );
  }
}
