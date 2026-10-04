import "dotenv/config";
import type { UserProfile } from "./types/UserProfile.js";
import {
  sendIMessage,
} from "./services/photon.js";

import {
  loadState,
  saveState,
  saveUserProfile,
} from "./services/profileStore.js";


import cors from "cors";
import crypto from "crypto";

import { normalizeUSPhone } from "./utils/phone.js";
import express from "express";

import diningRouter from "./routes/dining.js";
import recommendationsRouter from "./routes/recommendations.js";

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

    try {
    await sendIMessage(
      normalizedPhone,
      `Your Maize verification code is ${code}. This code expires in 10 minutes.`
    );

    console.log(
      "Verification code sent through Photon:",
      normalizedPhone
    );

    return res.json({
      success: true,
      message:
        "Verification code sent.",
    });
  } catch (error) {
    verificationCodes.delete(
      normalizedPhone
    );

    console.error(
      "VERIFICATION PHOTON ERROR:",
      error
    );

    return res
      .status(502)
      .json({
        error:
          "Could not send verification code.",
      });
  }
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
// API Routes
// ------------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

app.use("/api/dining", diningRouter);

app.use("/api/recommendations", recommendationsRouter);

// ------------------------------------------------------
// CREATE USER PLAN
// ------------------------------------------------------

app.post(
  "/api/users/plan",
  async (req, res) => {
    try {
      console.log(
        "1. PLAN REQUEST RECEIVED"
      );

      const profile =
        req.body as UserProfile;

      console.log(
        "2. PROFILE PHONE:",
        profile.phone
      );

      /*
       * Save the one local user's profile.
       */
      await saveUserProfile(
        profile
      );

      console.log(
        "3. PROFILE SAVED"
      );

      /*
       * Use the same phone number that
       * the user entered during onboarding.
       */
      const normalizedPhone =
        normalizeUSPhone(
          profile.phone
        );

      console.log(
        "4. NORMALIZED PHONE:",
        normalizedPhone
      );

      if (!normalizedPhone) {
        return res
          .status(400)
          .json({
            error:
              "The user does not have a valid phone number.",
          });
      }

      /*
       * Check whether we've already sent
       * the welcome message.
       */
      const state =
  await loadState();

      console.log(
        "5. STATE LOADED:",
        state
      );

      if (!state.welcomeSent) {
        console.log(
          "6. SENDING WELCOME THROUGH PHOTON"
        );

        await sendIMessage(
          normalizedPhone,
          "Hi, I am Maize and I will be your dining hall expert!"
        );

        console.log(
          "7. PHOTON WELCOME SENT"
        );

        /*
         * Only mark it sent after Photon
         * successfully sends the iMessage.
         */
        await saveState({
          ...state,
          welcomeSent: true,
        });

        console.log(
          "8. WELCOME STATE SAVED"
        );
      }

      return res.json({
        success: true,
        message:
          "Maize plan created.",
      });
    } catch (error) {
      console.error(
        "CREATE PLAN ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Could not create Maize plan.",
        });
    }
  }
);


// ------------------------------------------------------
// Start server
// ------------------------------------------------------

app.listen(
  PORT,
  () => {
    console.log(
      `Maize backend running on port ${PORT}`
    );
  }
);