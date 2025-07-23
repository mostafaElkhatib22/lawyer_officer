// ملف: app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import connectMongoDB from "@/lib/db_connect";

export async function POST(req: Request) {
  try {
    await connectMongoDB();
    const { email, password } = await req.json();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const passwordOk = await bcrypt.compare(password, user.password as string);
    if (!passwordOk) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.AUTH_SECRET!, // لازم تضيف ده في env
      { expiresIn: "1d" }
    );

    return NextResponse.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
