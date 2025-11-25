import {
  arrayUnion,
  increment,
  collection,
  doc,
  DocumentReference,
  FieldValue,
  setDoc,
} from 'firebase/firestore'
import { useCollection, useDocument } from 'vuefire';
import { db } from './firebase_conf';
import { computed } from 'vue';

interface movieForm {
  title: string,
  description?: string,
  genres: string[],
  rating: number,
  comment?: string,
}

interface movieDoc {
  title: string,
  description?: string,
  genres?: Record<string, number>,
  num_ratings: number | FieldValue,
  sum_ratings: number | FieldValue,
}

// interface userMovieDoc {
//   movieDocRef: DocumentReference<movieDoc>,
//   rating: number,
//   comment: string
// }

export const movieCollectionRef = collection(db, 'movies');
export const movieCollection = useCollection(movieCollectionRef); // { idField: 'id' }

export const devInfoRef = useDocument(doc(movieCollectionRef, 'dev-info'));
export const genres = computed(() => Object.keys(devInfoRef.value?.genres))

export const userReviews = (userID: string) => useCollection(collection(db, 'users', userID))

// Add a user review to the system, 2 steps
//  1. Add / update movie info in collection 'movies'
//  2. Add / update review in colleciton 'user' for the logged in user
export async function addReview(movieInfo: movieForm, userID: string) {

  // TODO add logic for editing reviews
  // TODO add genre overlap logic
  const movieDoc = <DocumentReference<movieDoc>> doc(movieCollectionRef, movieInfo.title);
  await setDoc(movieDoc, {
      title: movieInfo.title,
      description: movieInfo.description,
      genres: arrayUnion(...movieInfo.genres),
      num_ratings: increment(1),
      sum_ratings: increment(movieInfo.rating)
    },
    { merge: true}
  )

  // TODO update dev-info movie TOO
  // TODO add genres
  const userMovieDoc = <DocumentReference> doc(db, 'users', userID, 'reviews', movieInfo.title)
  await setDoc(userMovieDoc, {
      movieDocRef: movieDoc,
      rating: movieInfo.rating,
      comment: movieInfo.comment
    },
    { merge: true }
  )
  // genre: Object.keys(movieInfo.genre).sort(),
}


