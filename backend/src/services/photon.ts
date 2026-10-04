export async function sendIMessage(
  phone: string,
  message: string
): Promise<void> {
  const response = await fetch(
    "http://localhost:4000/send",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        phone,
        message,
      }),
    }
  );

  if (!response.ok) {
    const details =
      await response.text();

    throw new Error(
      `Photon failed: ${details}`
    );
  }
}