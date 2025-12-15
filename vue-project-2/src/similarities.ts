import {
  getAllUserMovieReviewsObject,
  type MovieData,
  type UserMovieReview
} from "./movies";

// WANT TO MAKE SIMILARITY REPORT
// HERE IS WHAT I HAVE...

/*
VARIABLES
release date
runtime
budget
genres
rating avg
rating count
popularity?
credits?  Top actors? Director?

IDEAS FOR COMPARISON
	AGE
		based on release date
	BUDGET
		Low budget lover
		Big budget lover
	GENRE
		Top genre
		Least favorite genre
	FROM AVERAGE
		Hipster
		conformist

COMPARISON
	Compatability grade A, B, C ...


METHODOLOGY
  Do Jaccard similarity, find set overlap
    RETURN % same movies reviewed

  In overlap set
    RETURN Rating Overall rating err
    RETURN rating err by genre (extremas, top err and least err)
    RETURN Most similar movie + least similar movie (based on ratings)

  In non-overlap set    (ALLOW FAVORITES?)
    RETURN extremas from weighted similarity
*/

const NUM_GENRES = 19;

// List of genres from TMDB api
export const genreMap: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western"
};

// Genre indexes for later simlarity matrix
const genreIndexMap: Record<number, number> = {
  28: 0,
  12: 1,
  16: 2,
  35: 3,
  80: 4,
  99: 5,
  18: 6,
  10751: 7,
  14: 8,
  36: 9,
  27: 10,
  10402: 11,
  9648: 12,
  10749: 13,
  878: 14,
  10770: 15,
  53: 16,
  10752: 17,
  37: 18
};


const genreSimilarityMatrix: number[][] = [
  // Action
  [1.0, 0.9, 0.2, 0.3, 0.6, -0.5, 0.4, 0.3, 0.7, 0.5, 0.6, 0.2, 0.5, 0.3, 0.8, 0.2, 0.9, 0.7, 0.8],
  // Adventure
  [0.9, 1.0, 0.4, 0.3, 0.4, -0.4, 0.5, 0.6, 0.9, 0.5, 0.5, 0.3, 0.4, 0.4, 0.8, 0.3, 0.6, 0.6, 0.7],
  // Animation
  [0.2, 0.4, 1.0, 0.7, -0.2, -0.6, 0.5, 0.8, 0.6, -0.3, 0.1, 0.5, 0.2, 0.6, 0.3, 0.4, 0.2, -0.4, 0.1],
  // Comedy
  [0.3, 0.3, 0.7, 1.0, 0.2, -0.5, 0.6, 0.7, 0.4, -0.2, 0.1, 0.6, 0.2, 0.7, 0.2, 0.5, 0.3, -0.3, 0.2],
  // Crime
  [0.6, 0.4, -0.2, 0.2, 1.0, -0.7, 0.7, -0.2, 0.1, 0.3, 0.5, -0.3, 0.8, 0.2, 0.3, 0.1, 0.9, 0.4, 0.2],
  // Documentary
  [-0.5, -0.4, -0.6, -0.5, -0.7, 1.0, 0.3, 0.2, -0.6, 0.8, -0.6, 0.4, -0.5, 0.1, -0.7, -0.3, -0.6, 0.5, -0.6],
  // Drama
  [0.4, 0.5, 0.5, 0.6, 0.7, 0.3, 1.0, 0.6, 0.5, 0.7, 0.4, 0.5, 0.6, 0.8, 0.4, 0.5, 0.6, 0.7, 0.5],
  // Family
  [0.3, 0.6, 0.8, 0.7, -0.2, 0.2, 0.6, 1.0, 0.7, -0.3, 0.1, 0.6, 0.2, 0.7, 0.3, 0.5, 0.2, -0.4, 0.2],
  // Fantasy
  [0.7, 0.9, 0.6, 0.4, 0.1, -0.6, 0.5, 0.7, 1.0, 0.3, 0.5, 0.3, 0.4, 0.5, 0.9, 0.3, 0.6, 0.4, 0.6],
  // History
  [0.5, 0.5, -0.3, -0.2, 0.3, 0.8, 0.7, -0.3, 0.3, 1.0, -0.2, 0.2, 0.3, 0.4, 0.2, 0.1, 0.3, 0.9, 0.4],
  // Horror
  [0.6, 0.5, 0.1, 0.1, 0.5, -0.6, 0.4, 0.1, 0.5, -0.2, 1.0, -0.2, 0.6, 0.1, 0.5, 0.2, 0.8, 0.2, 0.3],
  // Music
  [0.2, 0.3, 0.5, 0.6, -0.3, 0.4, 0.5, 0.6, 0.3, 0.2, -0.2, 1.0, 0.2, 0.6, 0.2, 0.4, 0.2, -0.2, 0.3],
  // Mystery
  [0.5, 0.4, 0.2, 0.2, 0.8, -0.5, 0.6, 0.2, 0.4, 0.3, 0.6, 0.2, 1.0, 0.3, 0.4, 0.2, 0.9, 0.3, 0.3],
  // Romance
  [0.3, 0.4, 0.6, 0.7, 0.2, 0.1, 0.8, 0.7, 0.5, 0.4, 0.1, 0.6, 0.3, 1.0, 0.3, 0.5, 0.3, 0.4, 0.3],
  // Science Fiction
  [0.8, 0.8, 0.3, 0.2, 0.3, -0.7, 0.4, 0.3, 0.9, 0.2, 0.5, 0.2, 0.4, 0.3, 1.0, 0.3, 0.6, 0.3, 0.6],
  // TV Movie
  [0.2, 0.3, 0.4, 0.5, 0.1, -0.3, 0.5, 0.5, 0.3, 0.1, 0.2, 0.4, 0.2, 0.5, 0.3, 1.0, 0.3, 0.2, 0.2],
  // Thriller
  [0.9, 0.6, 0.2, 0.3, 0.9, -0.6, 0.6, 0.2, 0.6, 0.3, 0.8, 0.2, 0.9, 0.3, 0.6, 0.3, 1.0, 0.4, 0.4],
  // War
  [0.7, 0.6, -0.4, -0.3, 0.4, 0.5, 0.7, -0.4, 0.4, 0.9, 0.2, -0.2, 0.3, 0.4, 0.3, 0.2, 0.4, 1.0, 0.5],
  // Western
  [0.8, 0.7, 0.1, 0.2, 0.2, -0.6, 0.5, 0.2, 0.6, 0.4, 0.3, 0.3, 0.3, 0.3, 0.6, 0.2, 0.4, 0.5, 1.0]
]


// Get similarity factor between movies
// Scaled between -1 and 1  (see above matrix)
export function getMovieSimilarity(currentReview: MovieData, compareReview: MovieData) {

  // Genre vector, [1/#genres] in pos of movie genres
  const genreVector = (genres: number[]) => {
    const vec = Array(NUM_GENRES).fill(0);
    if(genres.length === 0)
      return vec;
    const w = 1 / genres.length;    // L-1 normalized
    for(const genre of genres) {
      if(genreIndexMap[genre])
        vec[genreIndexMap[genre]] = w;
    }
    return vec;
  }

  // Multiply genre vectors by sim matrix
  // vCurrent * simMatrix * vCompare.T
  const getSim = (vin: number[], vout: number[]) => {
    let sim = 0;
    for(let i = 0; i < NUM_GENRES; i++) {
      if(vin[i] === 0)
        continue;
      let dot = 0;
      for(let j = 0; j < NUM_GENRES; j++) {
        dot += genreSimilarityMatrix[i]![j]! * vout[j]!;
      }
      sim += dot * vin[i]!;
    }
    return Math.max(-1, Math.min(1, sim));  // clamp to [-1,1]
  }

  const currentGenres = Object.keys(currentReview.genres).map(Number);
  const compareGenres = Object.keys(compareReview.genres).map(Number);
  return getSim(genreVector(currentGenres), genreVector(compareGenres))
}


// Get difference between two user movie reviews (scaled by genre similarity)
export function getUserReviewDiff(currentReview: UserMovieReview, compareReview: UserMovieReview) {
  const sim = getMovieSimilarity(currentReview, compareReview);
  const diff = currentReview.rating - compareReview.rating;
  return diff * ((1 + sim) / 2);
}


// export async function testUserDiff() {
//   const userReviews = await getAllUserMovieReviewsObject('LZbZsaWfRfO2q69nOSXFL6pW9PH2')
//   const user2Reviews = await getAllUserMovieReviewsObject('8MKabnDEswMX2nqapeiQsqRSCRm1')
//   console.log(userReviews)
//   console.log(getUserReviewDiff(userReviews[3782], user2Reviews[3782]))
// }


// Lucas testing
// 1st account LZbZsaWfRfO2q69nOSXFL6pW9PH2
// 2nd account 8MKabnDEswMX2nqapeiQsqRSCRm1


export async function getUserSimilarities(currentUserId: string, compareUserId: string) {

  // Get both users' reviews
  const promises = [
    getAllUserMovieReviewsObject(currentUserId),
    getAllUserMovieReviewsObject(compareUserId)
  ]
  const reviews = await Promise.all(promises);
  const currentReviews = reviews[0];
  const copmareReviews = reviews[1];
  if(!currentReviews || !copmareReviews)
    return null;

  const currentKeys = Object.keys(currentReviews);
  const compareKeys = Object.keys(copmareReviews);

  // Find overlapping IDs
  const sameIds = currentKeys.filter((key) => compareKeys.includes(key))
  const overlapPct = sameIds.length / (currentKeys.length + compareKeys.length - sameIds.length)
  console.log(overlapPct)

  // TODO any other stats?
  // Calculate stats in overlap
  let maxDiff = -10;
  let maxDiffId = null;
  let minDiff = 10;
  let minDiffId = null;
  for(const id of sameIds) {
    const currentReview = currentReviews[id];
    const compareReview = copmareReviews[id];
    if (!currentReview || !compareReview)
      continue;

    const diff = currentReview.rating - compareReview.rating
    if(diff > maxDiff) {
      maxDiff = diff;
      maxDiffId = id;
    }
    if(diff < minDiff) {
      minDiff = diff;
      minDiffId = id;
    }
  }
  console.log(`MAXDIFF ${maxDiff} (${maxDiffId})`)
  console.log(`MINDIFF ${minDiff} (${minDiffId})`)

  // Calculate stats in non-overlap
  // TODO rate by [genre factor * rating]

  // TODO average difference Give users a grade based on that
  // Find highest diff, find lowest diff
}
