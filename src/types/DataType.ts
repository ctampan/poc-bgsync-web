import { Timestamp } from "@firebase/firestore-types";

type DataBody = {
  sender: string;
  message: string;
  timestampClient: Date;
  sleepMs: number;
};

type Data = DataBody & {
  id: string;
  timestampClient: Timestamp;
  timestampServer: Timestamp;
};

export type { Data, DataBody };
