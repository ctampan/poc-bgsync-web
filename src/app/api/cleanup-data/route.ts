import { firestore, FirestoreTimestamp } from "@/configs/firebase";
import { Data, DataBody } from "@/types/DataType";
import { NextResponse } from "next/server";
import { sleep } from "radash";

export async function GET(request: Request) {
  try {
    const snapshot = await firestore.collection("data").get();

    const batchSize = snapshot.size;

    if (batchSize === 0) {
      return NextResponse.json(
        { message: "Data deleted successfully" },
        { status: 201 }
      );
    }

    const batch = firestore.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return NextResponse.json(
      { message: "Data deleted successfully" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Error Adding Data" }, { status: 500 });
  }
}
