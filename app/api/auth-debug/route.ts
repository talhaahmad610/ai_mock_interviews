import { cookies } from "next/headers";
import { auth, db } from "@/firebase/admin";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) {
    return Response.json({ step: "NO_COOKIE", message: "No session cookie found in request" });
  }

  let decodedClaims: any;
  try {
    decodedClaims = await auth.verifySessionCookie(sessionCookie, false);
  } catch (err: any) {
    return Response.json({ step: "VERIFY_FAILED", message: err.message, code: err.code });
  }

  let userRecord: any;
  try {
    userRecord = await db.collection("users").doc(decodedClaims.uid).get();
  } catch (err: any) {
    return Response.json({ step: "FIRESTORE_ERROR", uid: decodedClaims.uid, message: err.message });
  }

  if (!userRecord.exists) {
    return Response.json({ step: "NO_FIRESTORE_DOC", uid: decodedClaims.uid, email: decodedClaims.email, message: "User authenticated but Firestore document not found" });
  }

  return Response.json({ step: "OK", uid: decodedClaims.uid, email: decodedClaims.email });
}
