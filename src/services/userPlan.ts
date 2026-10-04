import { API_URL } from "./api";
import type { UserProfile } from "../types/UserProfile";

export async function createUserPlan(
  profile: UserProfile
) {
  const response = await fetch(
    `${API_URL}/api/users/plan`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ?? "Could not create your plan."
    );
  }

  return data;
}