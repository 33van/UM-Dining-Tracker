import "dotenv/config";
import express from "express";

import { Spectrum } from "spectrum-ts";
import { imessage } from "@spectrum-ts/imessage";

const projectId =
  process.env.PROJECT_ID;

const projectSecret =
  process.env.PROJECT_SECRET;

if (!projectId || !projectSecret) {
  throw new Error(
    "PROJECT_ID and PROJECT_SECRET are required in spectrum/.env"
  );
}

const spectrum = await Spectrum({
  projectId,
  projectSecret,

  providers: [
    imessage.config(),
  ],
});

const im = imessage(spectrum);

console.log(
  "Spectrum connected to iMessage"
);

/*
 * Local HTTP server.
 *
 * The Maize backend will call this service
 * whenever it needs to send an iMessage.
 */
const server = express();

server.use(
  express.json()
);
server.post(
  "/send",
  async (req, res) => {
    try {
      const {
        phone,
        message,
      } = req.body;

      if (
        typeof phone !== "string" ||
        !phone.trim()
      ) {
        return res
          .status(400)
          .json({
            error:
              "Phone number is required.",
          });
      }

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

      console.log(
        "Sending iMessage to:",
        phone
      );

      const chatGuid =
  `any;-;${phone}`;

const space =
  await im.space.get(
    chatGuid
  );

await space.send(
  message
);
      console.log(
        "iMessage sent successfully"
      );

      return res.json({
        success: true,
      });
    } catch (error) {
      console.error(
        "IMESSAGE SEND ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            error instanceof Error
              ? error.message
              : "Could not send iMessage.",
        });
    }
  }
);
/*
 * ==========================================
 * INCOMING IMESSAGE -> GEMINI
 * ==========================================
 */

async function listenForMessages() {
  console.log(
    "Listening for incoming iMessages..."
  );

  for await (
    const [
      space,
      message,
    ] of spectrum.messages
  ) {
    try {
      /*
       * Temporary debug.
       *
       * We need this to confirm which
       * messages are inbound vs outbound.
       */
      console.log(
        "RAW MESSAGE:",
        message
      );

      /*
       * Only handle text messages.
       */
      if (
        message.content.type !==
        "text"
      ) {
        continue;
      }

      const text =
        message.content.text;

      if (
        typeof text !== "string" ||
        !text.trim()
      ) {
        continue;
      }

      console.log(
        "USER IMESSAGE:",
        text
      );

      /*
       * Ask the Maize backend.
       *
       * The backend:
       * 1. Loads UserProfile
       * 2. Sends profile + message to Gemini
       * 3. Returns Gemini's response
       */
      const response =
        await fetch(
          "http://localhost:3000/api/messages/incoming",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                message:
                  text.trim(),
              }),
          }
        );

      if (!response.ok) {
        const details =
          await response.text();

        console.error(
          "MAIZE BACKEND ERROR:",
          details
        );

        continue;
      }

      const data =
        await response.json() as {
          success?: boolean;
          reply?: string;
        };

      if (
        typeof data.reply !==
          "string" ||
        !data.reply.trim()
      ) {
        console.error(
          "Backend returned no Gemini reply."
        );

        continue;
      }

      console.log(
        "MAIZE:",
        data.reply
      );

      /*
       * Reply to the SAME iMessage
       * conversation the user messaged.
       */
      await space.send(
        data.reply
      );

      console.log(
        "Maize iMessage reply sent."
      );

    } catch (error) {
      console.error(
        "IMESSAGE CHAT ERROR:",
        error
      );
    }
  }
}
server.listen(
  4000,
  () => {
    console.log(
      "Spectrum HTTP service running at http://localhost:4000"
    );
  }
);
void listenForMessages();