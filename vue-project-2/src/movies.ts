import {
  doc,
  setDoc,
  getDoc,
  type FirestoreDataConverter,
  getDocs,
  collection,
  deleteDoc,
} from 'firebase/firestore'
import { db } from './firebase_conf'
import { TMDB } from '@lorenzopant/tmdb'

//
////  Data types
//

// look at this while figuring out main page data retrieval
export interface MovieData {
  title: string
  release_date: string
  tagline: string | null
  overview: string | null
  runtime: number | null
  budget: number
  genres: Record<number, string>
  poster_path: string | null
  rating_avg: number
  rating_count: number
  cached_at: Date
}

export interface UserReview {
  rating: number
  comment: string
  draft?: boolean
  rewatch?: boolean
  loggedAt?: any
}

export type UserMovieReview = MovieData & {
  rating: number
  comment: string
  draft?: boolean
  rewatch?: boolean
  loggedAt?: any
}

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
    region: 'US',
  },
)

// tmdb variables
// Movie image
// TMDB image helper (safe: no top-level await)
// You can change w342 to w500 / original if you want larger posters.
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342'

export const tmdbImageURL = (path: string | null | undefined) => {
  if (!path) return null
  return `${TMDB_IMAGE_BASE}${path}`
}

//
////  Movie interactions
//

// Convert firebase timestamps to js Date objects
const MovieConverter: FirestoreDataConverter<MovieData> = {
  toFirestore(movie: MovieData) {
    return movie
  },
  fromFirestore(snapshot, options): MovieData {
    const data = snapshot.data(options)
    return {
      ...data,
      cached_at:
        typeof data.cached_at?.toDate === 'function'
          ? data.cached_at.toDate()
          : new Date(data.cached_at),
    } as MovieData
  },
}

// TODO export this to firebase functions?  Cannot allow all users to edit the cache
// Get the movieData of a movie with id
//  1. Return any valid cahced data from firebase
//  2. Call tmdb api and update cahce
export async function getMovie(id: number): Promise<MovieData | null> {
  // See if movieDoc cached, use that
  const cacheDoc = await getDoc(doc(db, `movies/${id}`).withConverter(MovieConverter))
  if (cacheDoc.exists()) {
    const data = cacheDoc.data()
    const today = new Date()

    // Check if cache date is less than 90 days ago
    if (Math.abs(today.getTime() - data.cached_at.getTime()) < 90 * (1000 * 60 * 60 * 24)) {
      return data
    }
  }

  // No cache, call TMDB api to get data.  Set only a few fields
  // If the call fails, return null
  try {
    const result = await tmdb.movies.details({ movie_id: id })
    const genres: Record<number, string> = {}
    for (const item of result.genres) {
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
      cached_at: new Date(),
    }

    // Cache it to our server
    await setDoc(doc(db, `movies/${id}`).withConverter(MovieConverter), data)

    return data
  } catch {
    return null
  }
}

// Get a list of movies
export async function getMovies(movieIds: number[]): Promise<Array<MovieData | null>> {
  const promises = movieIds.map((id) => {
    return getMovie(id)
  })
  return await Promise.all(promises)
}

// // Get a list of cached movies specified by Id
// export async function getCachedMovies(movieIds: string[]): Promise<MovieData[]> {
//   const q = query(
//     collection(db, 'movies'),
//     where(documentId(), 'in', movieIds)
//   );
//   const movies = []
//   const movieDocs = await getDocs(q.withConverter(MovieConverter))
//   for(const movieDoc of movieDocs.docs)
//     movies.push(movieDoc.data())
//   return movies
// }

//
//// User interactions
//

// Add / remove user review for a movie id
export async function addUserReview(userId: string, movieId: number, review: UserReview) {
  await setDoc(doc(db, `users/${userId}/reviews/${movieId}`), review)
}
export async function removeUserReview(userId: string, movieId: number) {
  await deleteDoc(doc(db, `users/${userId}/reviews/${movieId}`))
}

// Get ONLY user reviews
export async function getUserReview(userId: string, movieId: number): Promise<UserReview | null> {
  const reviewDoc = await getDoc(doc(db, `users/${userId}/reviews/${movieId}`))
  if (reviewDoc.exists()) return reviewDoc.data() as UserReview
  return null
}
export async function getUserReviews(
  userId: string,
  movieIds: number[],
): Promise<Array<UserReview | null>> {
  const promises = movieIds.map((id) => getUserReview(userId, id))
  return await Promise.all(promises)
}

// Return ALL user reviews
export async function getAllUserReviews(userId: string) {
  const allDocs = await getDocs(collection(db, `users/${userId}/reviews`))
  const userReviews: Record<string, UserReview> = {}
  allDocs.forEach((userReview) => {
    if (userReview.exists()) userReviews[userReview.id] = userReview.data() as UserReview
  })
  return userReviews
}

// Get user review + movie data
// Return null fields if userReview doesn't exist, return null if movie doesn't exist
export async function getUserMovieReview(
  userId: string,
  movieId: number,
): Promise<UserMovieReview | null> {
  const [userReview, movieData] = await Promise.all([
    getDoc(doc(db, `users/${userId}/reviews/${movieId}`)),
    getMovie(movieId),
  ])

  if (movieData && userReview.exists()) {
    return {
      ...(userReview.data() as UserReview),
      ...movieData,
    }
  }
  return null
}
export async function getUserMovieReviews(
  userId: string,
  movieIds: number[],
): Promise<Array<UserMovieReview | null>> {
  const promises = movieIds.map((id) => getUserMovieReview(userId, id))
  return await Promise.all(promises)
}

// Get ALL user reviews + movie data
export async function getAllUserMovieReviews(userId: string) {
  const userReviews = await getAllUserReviews(userId)
  const movieIds: number[] = []
  for (const id of Object.keys(userReviews)) {
    movieIds.push(parseInt(id))
  }
  const res = await getUserMovieReviews(userId, movieIds)
  return res.filter((review) => review != null)
}

// Get ALL user reviews + movie data as an OBJECT keyed by ID
export async function getAllUserMovieReviewsObject(userId: string) {
  const userReviews = await getAllUserReviews(userId)
  const movieIds: number[] = []
  for (const id of Object.keys(userReviews)) {
    movieIds.push(parseInt(id))
  }
  const userMovieReviews: Record<string, UserMovieReview> = {}
  const reviews = await getUserMovieReviews(userId, movieIds)
  for (let i = 0; i < movieIds.length; i++) {
    const id = movieIds[i] + ''
    const review = reviews[i]
    if (review) userMovieReviews[id] = review
  }
  return userMovieReviews
}
