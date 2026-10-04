import { API_URL } from "./api";
import type { UserProfile } from "../types/UserProfile";

export async function requestMaizeWelcome(
  profile: UserProfile
) {
  const response = await fetch(
    `${API_URL}/api/users/welcome`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        phone: profile.phone,
        profile,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ??
        "Could not send Maize welcome."
    );
  }

  return data;
}