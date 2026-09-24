import { initializeApp,cert } from "firebase-admin/app";
import serviceAccount from "../serviceAccountkey.json" with {type:"json"}

export const app=initializeApp(
  {
    credential:cert(serviceAccount),
  }
)
