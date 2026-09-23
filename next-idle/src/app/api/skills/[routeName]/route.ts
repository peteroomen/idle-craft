import client from "@/app/lib/db";
import { Skill } from "@/app/models/skill";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ routeName: string }> }
  ) {
        const { routeName } = await params;
        const db = client.db("nextidle");
        const skill = await db
            .collection<Skill>("skills")
            .findOne({ "routeName": routeName });
        return Response.json(skill);
  }