import "dotenv/config";
import type { UserProfile } from "./types/UserProfile.js";
import {
  askGemini,
} from "./services/gemini.js";

import cors from "cors";
import crypto from "crypto";

import { normalizeUSPhone } from "./utils/phone.js";
import express from "express";

import diningRouter from "./routes/dining.js";
import recommendationsRouter from "./routes/recommendations.js";

import {
  loadState,
  loadUserProfile,
  saveState,
  saveUserProfile,
} from "./services/profileStore.js";

type VerificationEntry = {
  code: string;
  expiresAt: number;
};

const verificationCodes =
  new Map<string, VerificationEntry>();

const userProfiles =
  new Map<string, UserProfile>();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());


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

app.post(
  "/auth/phone/send-code",
  async (req, res) => {
    try {
      const { phone } = req.body;

      if (
        typeof phone !== "string" ||
        !phone.trim()
      ) {
        return res.status(400).json({
          error:
            "Phone number is required.",
        });
      }

      /*
       * Expect E.164 format from frontend:
       *
       * +17345550123
       */
      if (
        !/^\+1\d{10}$/.test(phone)
      ) {
        return res.status(400).json({
          error:
            "Invalid US phone number.",
        });
      }

      /*
       * Generate eight-digit code.
       */
      const code =
        Math.floor(
          10000000 +
          Math.random() * 90000000
        ).toString();
      /*
       * Code expires after 10 minutes.
       */
      const expiresAt =
        Date.now() +
        10 * 60 * 1000;

      verificationCodes.set(
        phone,
        {
          code,
          expiresAt,
        }
      );

      console.log(
        "Verification requested for:",
        phone
      );

      /*
       * Send through Spectrum.
       */
      const spectrumResponse =
        await fetch(
          "http://localhost:4000/send",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              phone,

              message:
                `Your Maize verification code is ${code}. This code expires in 10 minutes.`,
            }),
          }
        );

      if (!spectrumResponse.ok) {
        /*
         * Don't leave a usable code behind
         * if delivery failed.
         */
        verificationCodes.delete(
          phone
        );

        const details =
          await spectrumResponse.text();

        console.error(
          "Spectrum verification send failed:",
          details
        );

        return res.status(502).json({
          error:
            "Could not send verification code.",
        });
      }

      console.log(
        "Verification iMessage sent to:",
        phone
      );

      return res.json({
        success: true,
        message:
          "Verification code sent.",
      });

    } catch (error) {
      console.error(
        "SEND CODE ERROR:",
        error
      );

      return res.status(500).json({
        error:
          "Could not send verification code.",
      });
    }
  }
);
// ------------------------------------------------------
// VERIFY CODE
// ------------------------------------------------------
app.post(
  "/auth/phone/verify-code",
  (req, res) => {
    const {
      phone,
      code,
    } = req.body;

    if (
      typeof phone !== "string" ||
      typeof code !== "string"
    ) {
      return res.status(400).json({
        error:
          "Phone and verification code are required.",
      });
    }

    const entry =
      verificationCodes.get(
        phone
      );

    if (!entry) {
      return res.status(400).json({
        error:
          "No verification code was requested for this number.",
      });
    }

    /*
     * Check expiration.
     */
    if (
      Date.now() >
      entry.expiresAt
    ) {
      verificationCodes.delete(
        phone
      );

      return res.status(400).json({
        error:
          "Verification code expired. Request a new one.",
      });
    }

    /*
     * Check code.
     */
    if (
      entry.code !==
      code.trim()
    ) {
      return res.status(400).json({
        error:
          "Incorrect verification code.",
      });
    }

    /*
     * Code can only be successfully
     * used once.
     */
    verificationCodes.delete(
      phone
    );

    console.log(
      "Phone verified:",
      phone
    );

    return res.json({
      success: true,
      verified: true,
    });
  }
);
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
// Start server
// ------------------------------------------------------
app.post(
  "/api/users/plan",
  async (req, res) => {
    try {
      const profile =
        req.body as UserProfile;

      if (!profile.phone) {
        return res.status(400).json({
          error: "Phone number is required.",
        });
      }

      if (!profile.calorieGoal) {
        return res.status(400).json({
          error: "Calorie goal is required.",
        });
      }


      /* ======================================
         SAVE USER PROFILE
      ====================================== */

      await saveUserProfile(profile);

      console.log(
        "User profile saved successfully"
      );


      /* ======================================
         LOAD MAIZE STATE
      ====================================== */

      const state =
        await loadState();


      /* ======================================
         FIRST-TIME WELCOME
      ====================================== */

      if (!state.welcomeSent) {


        const spectrumResponse =
          await fetch(
            "http://localhost:4000/send",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                phone: profile.phone,

                message:
                  "Hi, I am Maize and I will be your dining hall expert!",
              }),
            }
          );


        if (spectrumResponse.ok) {
          console.log(
            "Welcome iMessage sent!"
          );

          /*
           * Only mark it as sent AFTER
           * Spectrum successfully sends it.
           */
          await saveState({
            ...state,
            welcomeSent: false,
          });

        } else {
          const errorText =
            await spectrumResponse.text();

          console.error(
            "Spectrum welcome failed:",
            errorText
          );
        }
      } else {
        console.log(
          "Welcome already sent — skipping."
        );
      }


      /* ======================================
         SUCCESS
      ====================================== */

      return res.status(201).json({
        success: true,
        message: "Maize plan created.",
      });

    } catch (error) {
      console.error(
        "CREATE PLAN ERROR:",
        error
      );

      return res.status(500).json({
        error: "Could not create plan.",
      });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Maize backend running on port ${PORT}`);
});

app.post(
  "/api/messages/incoming",
  async (req, res) => {
    try {

      const {
        message,
      } = req.body;


      if (
        typeof message !== "string" ||
        !message.trim()
      ) {

        return res
          .status(400)
          .json({
            error:
              "Message is required.",
          });

      }


      /*
       * We only have one local user,
       * so simply load that profile.
       */

      const profile =
        await loadUserProfile();


      if (!profile) {

        return res
          .status(400)
          .json({
            error:
              "No Maize user profile exists.",
          });

      }


      console.log(
        "\nUSER:",
        message
      );


      const reply =
        await askGemini(
          message,
          profile
        );


      console.log(
        "MAIZE:",
        reply,
        "\n"
      );


      return res.json({
        success: true,
        reply,
      });

    } catch (error) {

      console.error(
        "INCOMING MESSAGE ERROR:",
        error
      );


      return res
        .status(500)
        .json({
          error:
            "Could not process message.",
        });

    }
  }
);

app.post(
  "/api/users/welcome",
  async (req, res) => {
    try {
      const {
        phone,
        profile,
      } = req.body;

      if (!phone) {
        return res
          .status(400)
          .json({
            error:
              "Phone number is required.",
          });
      }

      console.log(
        "WELCOME REQUEST FOR:",
        phone
      );

      console.log(
        "PROFILE SENT TO PHOTON FLOW:",
        JSON.stringify(
          profile,
          null,
          2
        )
      );

      /*
       * IMPORTANT:
       *
       * Check your database here.
       *
       * const user =
       *   await findUserByPhone(phone);
       *
       * if (user.welcomeSent) {
       *   return res.json({
       *     success: true,
       *     alreadySent: true,
       *   });
       * }
       */


      const message =
        "Hi, I am Maize and I will be your dining hall expert!";


      /*
       * Call your existing Photon
       * integration here.
       *
       * await sendPhotonMessage({
       *   phone,
       *   message,
       *   profile,
       * });
       */


      console.log(
        "PHOTON WELCOME MESSAGE:"
      );

      console.log(message);


      /*
       * ONLY after Photon succeeds:
       *
       * await markWelcomeSent(phone);
       */


      return res.json({
        success: true,
        alreadySent: false,
      });

    } catch (error) {
      console.error(
        "WELCOME ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Could not send welcome message.",
        });
    }
  }
);