import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase_conf'

export interface UserQrCodeDoc {
  value: string
}

export async function GetUserQrCode(userId: string) {
  const UserqrCodeDoc = doc(db, 'qrcodes', userId)
  const qrCodeRef = await getDoc(UserqrCodeDoc)
  if (!qrCodeRef.exists()) {
    // so create one using the userId as the QR code value and return it
    const newQrCode: UserQrCodeDoc = {
      value: userId,
    }

    await setDoc(UserqrCodeDoc, newQrCode)
    return newQrCode
  }

  return qrCodeRef.data() as UserQrCodeDoc
}
