import { Q } from "@nozbe/watermelondb";

import { database } from "@/src/db";
import { LocalNote } from "@/src/db/models/LocalNote";

export async function createLocalNote(title: string, body: string) {
  return database.write(async () => {
    const collection = database.get<LocalNote>("local_notes");
    return collection.create((entry) => {
      entry.title = title;
      entry.body = body;
      entry.updatedAt = new Date();
    });
  });
}

export async function readLocalNoteByTitle(title: string) {
  const collection = database.get<LocalNote>("local_notes");
  const matches = await collection.query(Q.where("title", title)).fetch();
  return matches[0] ?? null;
}
