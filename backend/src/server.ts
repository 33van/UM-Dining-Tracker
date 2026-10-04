import express from "express";
import cors from "cors";
import crypto from "crypto";

import { normalizeUSPhone } from "./utils/phone";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

/*
 * TEMPORARY development storage.
 *
 * Later we'll replace this with a database.
 */
type VerificationRecord = {
  codeHash: string;
  expiresAt: number;
  attempts: number;
};

const verificationCodes = new Map<string, VerificationRecord>();


// ------------------------------------------------------
// Helpers
// ------------------------------------------------------

const CODE_CHARACTERS = "0123456789";

function generateVerificationCode(length = 8): string {
  let result = "";

  for (let i = 0; i < length; i++) {
    const index = crypto.randomInt(0, CODE_CHARACTERS.length);
    result += CODE_CHARACTERS[index];
  }

  return result;
}

function hashCode(code: string): string {
  return crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");
}


// ------------------------------------------------------
// Test endpoint
// ------------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    message: "Maize backend is running!",
  });
});


// ------------------------------------------------------
// SEND VERIFICATION CODE
// ------------------------------------------------------

app.post("/auth/phone/send-code", async (req, res) => {
  const { phone } = req.body;

  if (typeof phone !== "string") {
    return res.status(400).json({
      error: "Phone number is required.",
    });
  }

  const normalizedPhone = normalizeUSPhone(phone);

  if (!normalizedPhone) {
    return res.status(400).json({
      error: "Invalid phone number.",
    });
  }

  const code = generateVerificationCode();

  const codeHash = hashCode(code);

  // Code expires in 10 minutes.
  const expiresAt = Date.now() + 10 * 60 * 1000;

  verificationCodes.set(normalizedPhone, {
    codeHash,
    expiresAt,
    attempts: 0,
  });

  /*
   * DEVELOPMENT ONLY
   *
   * Instead of texting the code, we'll print it.
   *
   * Later:
   *
   * await photon.sendMessage(...)
   */
  console.log("--------------------------------");
  console.log("PHONE VERIFICATION");
  console.log("Phone:", normalizedPhone);
  console.log("Code:", code);
  console.log("Expires:", new Date(expiresAt).toLocaleTimeString());
  console.log("--------------------------------");

  return res.json({
    success: true,
    message: "Verification code sent.",
  });
});


// ------------------------------------------------------
// VERIFY CODE
// ------------------------------------------------------

app.post("/auth/phone/verify-code", (req, res) => {
  const { phone, code } = req.body;

  if (typeof phone !== "string" || typeof code !== "string") {
    return res.status(400).json({
      error: "Phone and verification code are required.",
    });
  }

  const normalizedPhone = normalizeUSPhone(phone);

  if (!normalizedPhone) {
    return res.status(400).json({
      error: "Invalid phone number.",
    });
  }

  const record = verificationCodes.get(normalizedPhone);

  if (!record) {
    return res.status(400).json({
      error: "No verification code was requested for this number.",
    });
  }

  // Check expiration.
  if (Date.now() > record.expiresAt) {
    verificationCodes.delete(normalizedPhone);

    return res.status(400).json({
      error: "Verification code has expired.",
    });
  }

  // Prevent unlimited guessing.
  if (record.attempts >= 5) {
    verificationCodes.delete(normalizedPhone);

    return res.status(429).json({
      error: "Too many incorrect attempts. Request a new code.",
    });
  }

  const submittedHash = hashCode(code);

  if (submittedHash !== record.codeHash) {
    record.attempts += 1;

    return res.status(400).json({
      error: "Incorrect verification code.",
    });
  }

  // Code was correct. It cannot be reused.
  verificationCodes.delete(normalizedPhone);

  console.log("Phone verified:", normalizedPhone);

  return res.json({
    success: true,
    verified: true,
  });
});


// ------------------------------------------------------
// Start server
// ------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Maize backend running on port ${PORT}`);
});