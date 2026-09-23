import client from "@/app/lib/db";

export async function GET(request: Request) {
    const db = client.db("nextidle");
    const skills = await db
        .collection("skills")
        .find({})
        .toArray();
    return Response.json(skills);
}