import bcrypt from "bcryptjs";

export async function saltAndHashPassword(password: string) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("B4c0/\/", salt);
    return hash;
}

export function capitalizeFirstLetter(val: string) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export const localStorageKeys = {
    DARK_MODE: "DARK_MODE"
}