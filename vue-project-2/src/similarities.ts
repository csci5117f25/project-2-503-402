import {
  getAllUserMovieReviewsObject,
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
export function getMovieSimilarityMatrix(currentReviews: UserMovieReview[], compareReviews: UserMovieReview[]) {

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

  // Build review matricies
  const currentMat: number[][] = []
  for(const review of currentReviews) {
    currentMat.push(genreVector(Object.keys(review.genres).map(Number)))
  }
  const compareMat: number[][] = [];
  for(const review of compareReviews) {
    compareMat.push(genreVector(Object.keys(review.genres).map(Number)))
  }

  // Create the difference matrix
  const simMat: number[][] = [];
  for(let i = 0; i < currentReviews.length; i++) {
    const simRow = [];
    for(let j = 0; j < compareReviews.length; j++) {
      simRow.push(getSim(currentMat[i]!, currentMat[j]!))
    }
    simMat.push(simRow)
  }
  return simMat;
}


// Get difference between two user movie reviews (scaled by genre similarity)
export async function getReviewDiffMatrix(currentReviews: UserMovieReview[], compareReview: UserMovieReview[]) {
  // Multiply similarity matrix by difference
  const simMat = getMovieSimilarityMatrix(currentReviews, compareReview)
  for(let i = 0; i < currentReviews.length; i++) {
    for(let j = 0; j < compareReview.length; j++) {
      const simFactor = (1 + simMat[i]![j]!) / 2
      simMat[i]![j] = (currentReviews[i]!.rating - compareReview[j]!.rating) * simFactor
    }
  }
  return simMat;
}

// Get similar (or unsimilar) reviews
// Based on similarity matrix + user rating
// See end of function for return format
export async function getUserSimilarities(currentUserId: string, compareUserId: string, maxComparisons=5) {

  // Get both users' reviews
  const promises = [
    getAllUserMovieReviewsObject(currentUserId),
    getAllUserMovieReviewsObject(compareUserId)
  ]
  const reviews = await Promise.all(promises);
  const currentReviews = reviews[0];
  const compareReviews = reviews[1];
  if(!currentReviews || !compareReviews)
    throw new Error('[getUserSimilarities] - Unable to get user movie reviews')

  const currentKeys = Object.keys(currentReviews);
  const compareKeys = Object.keys(compareReviews);

  // Helpers for storing / sorting review data
  interface ReviewDiff {
    diff:     number,
    current:  UserMovieReview,
    compare:  UserMovieReview
  }
  // Sorted insert of a ReviewDiff variable into the given reviews list
  const diffInsert = (
    reviews: ReviewDiff[],
    review: ReviewDiff,
    compare: (a: ReviewDiff, b: ReviewDiff) => boolean,
    maxLength=maxComparisons
  ) => {
    let i = reviews.length - 1;
    for(; i >= 0; i--) {
      if(compare(review, reviews[i]!)) {
        if(i === maxComparisons - 1) {
          return reviews;   // Don't append to full list
        }
        reviews.splice(i+1, 0, review)
        break;
      }
    }
    if(i === -1) {    // Insert if empty / first index
      reviews.splice(0, 0, review)
    }
    if(reviews.length > maxLength) {  // Pop if over capacity
      reviews.pop();
    }
    return reviews;
  }

  // Find overlapping IDs
  const sameIds = currentKeys.filter((key) => compareKeys.includes(key))
  const overlapPct = sameIds.length / (currentKeys.length + compareKeys.length - sameIds.length)
  const sameTotal = sameIds.length;

  // Loop over all review combinations, calc stats
  let sameSum = 0;
  let diffSum = 0;
  let totalSum = 0;
  let absSum = 0;
  const simMaxLength = Math.max(maxComparisons, sameTotal)
  const sameMax: ReviewDiff[] = [];
  const sameMin: ReviewDiff[] = [];
  const sameZero: ReviewDiff[] = [];
  const maxReviews: ReviewDiff[] = [];
  const minReviews: ReviewDiff[] = [];
  const zeroReviews: ReviewDiff[] = [];
  const diffMat = await getReviewDiffMatrix(Object.values(currentReviews), Object.values(compareReviews))
  for(let i = 0; i < diffMat.length; i++) {
    for(let j = 0; j < diffMat[0]!.length; j++) {

      const diff = diffMat[i]![j]!;
      const currentKey = currentKeys[i]!;
      const compareKey = compareKeys[j]!;
      const review: ReviewDiff = {
        diff:     diff,
        current:  currentReviews[currentKey]!,
        compare:  compareReviews[compareKey]!,
      }

      // Separate results by same movie or not
      if(currentKey === compareKey) {
        diffInsert(sameMax, review, (a, b) => b.diff > a.diff, simMaxLength)
        diffInsert(sameMin, review, (a, b) => b.diff < a.diff, simMaxLength)
        diffInsert(sameZero, review, (a, b) => Math.abs(b.diff) < Math.abs(a.diff), simMaxLength)
        sameSum += diff;
      }
      else {
        diffInsert(maxReviews, review, (a, b) => b.diff > a.diff)
        diffInsert(minReviews, review, (a, b) => b.diff < a.diff)
        diffInsert(zeroReviews, review, (a, b) => Math.abs(b.diff) < Math.abs(a.diff))
        diffSum += diff
      }
      totalSum += diff;
      absSum += Math.abs(diff);
    }
  }

  // Assign similarity grade
  const absDiff = absSum / currentKeys.length / compareKeys.length;
  let similarityGrade = 'F';
  const gradeThresholds: [number, string][] = [
    [0.8, "A"],
    [1.0, "A-"],
    [1.2, "B+"],
    [1.8, "B"],
    [2.0, "B-"],
    [2.2, "C+"],
    [2.8, "C"],
    [3.0, "C-"],
    [3.2, "D+"],
    [3.8, "D"],
    [4.0, "D-"],
    [4.5, "F"]
  ];
  for(const [limit, grade] of gradeThresholds) {
    if(absDiff <= limit) {
      similarityGrade = grade;
      break;
    }
  }

  // Bundle and return
  return {
    overlapPct:   overlapPct,
    avg:          totalSum / currentKeys.length / compareKeys.length,
    absAvg:       absDiff,
    grade:        similarityGrade,
    overlap:      {
      avg:    sameSum / sameTotal,
      max:    sameMax,
      min:    sameMin,
      zero:   sameZero,
    },
    diff: {
      avg:  diffSum / (currentKeys.length * compareKeys.length - sameTotal),
      max:  maxReviews,
      min:  minReviews,
      zero: zeroReviews
    }
  }
}
