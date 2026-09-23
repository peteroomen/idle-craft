import bcrypt from "bcryptjs";

export async function saltAndHashPassword(password: string) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("B4c0/\/", salt);
    return hash;
}