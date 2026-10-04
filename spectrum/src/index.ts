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

server.listen(
  4000,
  () => {
    console.log(
      "Spectrum HTTP service running at http://localhost:4000"
    );
  }
);