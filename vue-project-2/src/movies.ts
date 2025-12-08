import {
  doc,
  setDoc,
  getDoc,
  type FirestoreDataConverter,
  Timestamp,
  query,
  where,
  documentId,
  collection,
  getDocs,
} from 'firebase/firestore'
import { db } from './firebase_conf';
import { TMDB } from '@lorenzopant/tmdb';


//
//// TMDB setup, using a wrapper:
//// https://github.com/lorenzopant/tmdb?tab=readme-ov-file
//


// To any ill-willed people, do not steal this key!
// its a free API - you wont cost us if you spam it.  Get your own key!
export const tmdb = new TMDB(
  'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkZDE3MzZlMzgyZmMxNjA1YzYyYmY2M2JkYWRjN2I2NiIsIm5iZiI6MTc2NTE0NTg2My4zLCJzdWIiOiI2OTM1ZmQwNzA3ODk4MGVhMjVkMWZmYjgiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.d3IXTp7U4zYFDr_FvdKZ3YNXh9BlW68LrVuHtwmoMOE',
  {
    language: 'en',
    region: 'US'
  }
)

export const tmdbConfig = await tmdb.config.get()
export const tmdbURL = tmdbConfig.images.base_url;


//
//// Firebase interactions
//

export interface MovieData {
  title: string,
  release_date: string,
  tagline: string | null,
  overview: string | null,
  runtime: number | null,
  budget: number,
  genres: Record<number, string>,
  poster_path: string | null,
  rating_avg: number,
  rating_count: number,
  cached_at: Date
}

export interface UserReview {
  rating: number,
  comment: string,
}

// Convert firebase timestamps to js Date objects
const fbMovieConverter: FirestoreDataConverter<MovieData> = {
  toFirestore(movie: MovieData) {
    return movie;
  },
  fromFirestore(snapshot, options): MovieData {
    const data = snapshot.data(options);
    if(data.cached_at instanceof Timestamp)
      data.cached_at.toDate();
    return data as MovieData;
  }
}


// Get the movieData of a movie with id
//  1. Return any valid cahced data from firebase
//  2. Call tmdb api and update cahce
export async function getMovie(id: number): Promise<MovieData> {

  // See if movieDoc cached, use that
  const cacheDoc = await getDoc(doc(db, `movies/${id}`).withConverter(fbMovieConverter))
  if(cacheDoc.exists()) {
    const data = cacheDoc.data();
    const today = new Date()

    // Check if cache date is less than 90 days ago
    if(Math.abs(today.getTime() - data.cached_at.getTime()) < 90 * (1000 * 60 * 60 * 24))
      return data;
  }

  // No cache, call TMDB api to get data.  Set only a few fields
  const result = await tmdb.movies.details({ movie_id: id})
  const genres: Record<number, string> = {}
  for(const item of result.genres) {
    genres[item.id] = item.name
  }
  const data: MovieData = {
    title: result.title,
    tagline: result.tagline,
    overview: result.overview,
    release_date: result.release_date,
    runtime: result.runtime,
    budget: result.budget,
    genres: genres,
    poster_path: result.poster_path,
    rating_avg: result.vote_average,
    rating_count: result.vote_count,
    cached_at: new Date()
  }

  // Cache it to our server
  await setDoc(doc(db, `movies/${id}`), data)
  return data;
}

// Get a list of documents specified by Id
export async function getMovies(movieIds: number[]): Promise<MovieData[]> {
  const q = query(
    collection(db, 'movies'), 
    where(documentId(), 'in', movieIds)
  );

  const movies = []
  const movieDocs = await getDocs(q.withConverter(fbMovieConverter))
  for(const movieDoc of movieDocs.docs)
    movies.push(movieDoc.data())
  return movies
}


//
//// User documents
//


// export async function getUserReviews(userId: string): Promise<UserReview[]> {

// }


// export async function getUserMovies(userId: string): Promise<MovieData[]> {
//   const userReviews = await getDocs(collection(db, `users/${userId}`))
//   for(const docKey.id of userReviews)
  
// }







// interface movieForm {
//   title: string,
//   director: string,
//   description?: string,
//   genres: string[],
//   rating: number,
//   comment?: string,
// }

// interface movieDoc {
//   title: string,
//   director: string,
//   description?: string,
//   genres?: Record<string, number>,
//   num_ratings: number | FieldValue,
//   sum_ratings: number | FieldValue,
// }

// // interface userMovieDoc {
// //   movieDocRef: DocumentReference<movieDoc>,
// //   rating: number,
// //   comment: string
// // }

// export const movieCollectionRef = collection(db, 'movies');
// export const movieCollection = useCollection(movieCollectionRef); // { idField: 'id' }

// export const devInfoRef = useDocument(doc(movieCollectionRef, 'dev-info'));
// export const genres = computed(() => Object.keys(devInfoRef.value?.genres))

// export const userReviews = (userID: string) => useCollection(collection(db, 'users', userID))

// // Add a user review to the system, 2 steps
// //  1. Add / update movie info in collection 'movies'
// //  2. Add / update review in colleciton 'user' for the logged in user
// export async function addReview(movieInfo: movieForm, userID: string) {

//   // TODO add logic for editing reviews
//   // TODO add genre overlap logic
//   const movieDoc = <DocumentReference<movieDoc>> doc(movieCollectionRef, movieInfo.title);
//   await setDoc(movieDoc, {
//       title: movieInfo.title,
//       director: movieInfo.director,
//       description: movieInfo.description,
//       genres: arrayUnion(...movieInfo.genres),
//       num_ratings: increment(1),
//       sum_ratings: increment(movieInfo.rating)
//     },
//     { merge: true}
//   )

//   // TODO update dev-info movie TOO
//   // TODO add genres
//   const userMovieDoc = <DocumentReference> doc(db, 'users', userID, 'reviews', movieInfo.title)
//   await setDoc(userMovieDoc, {
//       movieDocRef: movieDoc,
//       rating: movieInfo.rating,
//       comment: movieInfo.comment
//     },
//     { merge: true }
//   )
//   // genre: Object.keys(movieInfo.genre).sort(),
// }


