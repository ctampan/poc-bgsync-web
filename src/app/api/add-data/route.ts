import { firestore, FirestoreTimestamp } from "@/configs/firebase";
import { Data, DataBody } from "@/types/DataType";
import { NextResponse } from "next/server";
import { sleep } from "radash";

export async function POST(request: Request) {
  try {
    const body: DataBody = await request.json();

    await sleep(body.sleepMs);

    await firestore.collection("data").add({
      ...body,
      timestampClient: FirestoreTimestamp.fromDate(
        new Date(body.timestampClient)
      ),
      timestampServer: FirestoreTimestamp.fromDate(new Date()),
    } as unknown as Data);

    return NextResponse.json(
      { message: "Data added successfully" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Error Adding Data" }, { status: 500 });
  }
}
