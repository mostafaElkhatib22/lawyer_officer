import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/lib/db_connect";
import Case from "@/models/Case";
import { v2 as cloudinary } from "cloudinary";

// إعداد Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// استخراج public_id من رابط الصورة
function getPublicIdFromUrl(url: string): string {
  const parts = url.split("/");
  const fileName = parts[parts.length - 1];
  const publicId = fileName.split(".")[0];
  return `lawyer_office/${publicId}`;
}

// ✅ GET - جلب قضية واحدة
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<any> }
) {
  try {
    const id = (await params).id;
    await connectMongoDB();

    const singleCase = await Case.findOne({ _id: id }).populate("client");

    if (!singleCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    return NextResponse.json({ singleCase }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

// ✅ PUT - تعديل قضية مع حذف الصور من Cloudinary
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<any> }
) {
  try {
    const { id } = await params;
    const {
      newclient: client,
      newType: type,
      newsessiondate: sessiondate,
      newcaseTypeOF: caseTypeOF,
      newcaseDate: caseDate,
      newnots: nots,
      newcourt: court,
      newcaseNumber: caseNumber,
      newyear: year,
      newopponents: opponents,
      newAttorneyNumber: attorneyNumber,
      newdecision: decision,
      newFiles: files,
      deletedFiles = [],
    } = await req.json();

    await connectMongoDB();

    // حذف الصور من Cloudinary
    for (const imageUrl of deletedFiles) {
      const publicId = getPublicIdFromUrl(imageUrl);
      await cloudinary.uploader.destroy(publicId);
    }

    // تحديث القضية في قاعدة البيانات
    await Case.findByIdAndUpdate(id, {
      client,
      caseTypeOF,
      caseDate,
      type,
      sessiondate,
      nots,
      decision,
      opponents,
      court,
      caseNumber,
      year,
      files,
      attorneyNumber,
    });

    return NextResponse.json(
      { message: "Updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating case:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

// ✅ DELETE - حذف قضية
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<any> }
) {
  try {
    const { id } = await params;
    await connectMongoDB();

    const deletedCase = await Case.findByIdAndDelete(id);

    if (!deletedCase) {
      return NextResponse.json(
        { success: false, error: true, message: "Case not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: deletedCase,
        message: "Case deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting case:", error);
    return NextResponse.json(
      { success: false, error: true, message: "Failed to delete case" },
      { status: 500 }
    );
  }
}
