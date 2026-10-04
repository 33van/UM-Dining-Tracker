import fs from "node:fs/promises";
import path from "node:path";

import type {
  UserProfile,
} from "../types/UserProfile.js";


const DATA_DIRECTORY =
  path.resolve("data");

const PROFILE_PATH =
  path.join(
    DATA_DIRECTORY,
    "user-profile.json"
  );

const STATE_PATH =
  path.join(
    DATA_DIRECTORY,
    "state.json"
  );


export interface AppState {
  welcomeSent: boolean;
}


/*
 * Make sure backend/data exists.
 */
async function ensureDataDirectory() {
  await fs.mkdir(
    DATA_DIRECTORY,
    {
      recursive: true,
    }
  );
}


/*
 * Save user profile.
 */
export async function saveUserProfile(
  profile: UserProfile
): Promise<void> {
  await ensureDataDirectory();

  await fs.writeFile(
    PROFILE_PATH,
    JSON.stringify(
      profile,
      null,
      2
    ),
    "utf8"
  );
}


/*
 * Load user profile.
 */
export async function loadUserProfile():
  Promise<UserProfile | null> {
  try {
    const raw =
      await fs.readFile(
        PROFILE_PATH,
        "utf8"
      );

    return JSON.parse(
      raw
    ) as UserProfile;
  } catch (error) {
    const nodeError =
      error as NodeJS.ErrnoException;

    if (
      nodeError.code ===
      "ENOENT"
    ) {
      return null;
    }

    throw error;
  }
}


/*
 * Save backend state.
 */
export async function saveState(
  state: AppState
): Promise<void> {
  await ensureDataDirectory();

  await fs.writeFile(
    STATE_PATH,
    JSON.stringify(
      state,
      null,
      2
    ),
    "utf8"
  );
}


/*
 * Load backend state.
 */
export async function loadState():
  Promise<AppState> {
  try {
    const raw =
      await fs.readFile(
        STATE_PATH,
        "utf8"
      );

    const parsed =
      JSON.parse(raw) as
        Partial<AppState>;

    return {
      welcomeSent:
        parsed.welcomeSent ??
        false,
    };
  } catch (error) {
    const nodeError =
      error as NodeJS.ErrnoException;

    if (
      nodeError.code ===
      "ENOENT"
    ) {
      return {
        welcomeSent: false,
      };
    }

    throw error;
  }
}