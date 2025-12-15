import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  DocumentReference,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase_conf';


export interface UserQrCodeDoc {
  value: string
  active: boolean
  createdAt: Timestamp
}

export async function GetUserQrCode(userId: string) {
  const UserqrCodeDoc = doc(db, 'qrcodes', userId)
  const qrCodeRef =  await getDoc(UserqrCodeDoc)
  if (!(qrCodeRef).exists()) {
    // user doesn't have a qr code have them create it
  }
}
