import fs from "node:fs/promises";
import path from "node:path";

import type {
  UserProfile,
} from "../types/UserProfile.js";


/* ==========================================
   FILE LOCATIONS
========================================== */

const DATA_DIRECTORY =
  path.resolve(
    process.cwd(),
    "data"
  );

const PROFILE_FILE =
  path.join(
    DATA_DIRECTORY,
    "user-profile.json"
  );

const STATE_FILE =
  path.join(
    DATA_DIRECTORY,
    "state.json"
  );


/* ==========================================
   STATE TYPE
========================================== */

export type MaizeState = {
  welcomeSent: boolean;
};


/* ==========================================
   SAVE USER PROFILE
========================================== */

export async function saveUserProfile(
  profile: UserProfile
): Promise<void> {

  await fs.mkdir(
    DATA_DIRECTORY,
    {
      recursive: true,
    }
  );

  await fs.writeFile(
    PROFILE_FILE,

    JSON.stringify(
      profile,
      null,
      2
    ),

    "utf8"
  );

  console.log(
    "User profile saved:",
    PROFILE_FILE
  );
}


/* ==========================================
   LOAD USER PROFILE
========================================== */

export async function loadUserProfile():
  Promise<UserProfile | null> {

  try {

    const contents =
      await fs.readFile(
        PROFILE_FILE,
        "utf8"
      );


    const profile =
      JSON.parse(
        contents
      ) as UserProfile;


    return profile;

  } catch (error: any) {

    /*
     * This is normal if the user hasn't
     * completed onboarding yet.
     */

    if (
      error?.code === "ENOENT"
    ) {
      return null;
    }


    throw error;
  }
}


/* ==========================================
   LOAD MAIZE STATE
========================================== */

export async function loadState():
  Promise<MaizeState> {

  try {

    const contents =
      await fs.readFile(
        STATE_FILE,
        "utf8"
      );


    return JSON.parse(
      contents
    ) as MaizeState;

  } catch (error: any) {

    /*
     * First run:
     * state.json does not exist yet.
     */

    if (
      error?.code === "ENOENT"
    ) {

      return {
        welcomeSent: false,
      };

    }


    throw error;
  }
}


/* ==========================================
   SAVE MAIZE STATE
========================================== */

export async function saveState(
  state: MaizeState
): Promise<void> {

  await fs.mkdir(
    DATA_DIRECTORY,
    {
      recursive: true,
    }
  );


  await fs.writeFile(
    STATE_FILE,

    JSON.stringify(
      state,
      null,
      2
    ),

    "utf8"
  );
}