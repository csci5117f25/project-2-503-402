import { getAllUserMovieReviewsObject, type UserMovieReview } from './movies'

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

  I PRETTY MUCH DIDN'T FOLLOW THE ABOVE
  WHAT I DID DO
    compare 2 user ratings
      scale and compare ratings using a similarity matrix by genre
      sort difference in ratings into lists of:
        maximum diff
        minimum diff
        diff closest to zero
*/

const NUM_GENRES = 19;

// List of genres from TMDB api
export const genreMap: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
}

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
  37: 18,
}

const genreSimilarityMatrix: number[][] = [
  // Action
  [1.0, 0.9, 0.2, 0.3, 0.6, -0.5, 0.4, 0.3, 0.7, 0.5, 0.6, 0.2, 0.5, 0.3, 0.8, 0.2, 0.9, 0.7, 0.8],
  // Adventure
  [0.9, 1.0, 0.4, 0.3, 0.4, -0.4, 0.5, 0.6, 0.9, 0.5, 0.5, 0.3, 0.4, 0.4, 0.8, 0.3, 0.6, 0.6, 0.7],
  // Animation
  [
    0.2, 0.4, 1.0, 0.7, -0.2, -0.6, 0.5, 0.8, 0.6, -0.3, 0.1, 0.5, 0.2, 0.6, 0.3, 0.4, 0.2, -0.4,
    0.1,
  ],
  // Comedy
  [
    0.3, 0.3, 0.7, 1.0, 0.2, -0.5, 0.6, 0.7, 0.4, -0.2, 0.1, 0.6, 0.2, 0.7, 0.2, 0.5, 0.3, -0.3,
    0.2,
  ],
  // Crime
  [
    0.6, 0.4, -0.2, 0.2, 1.0, -0.7, 0.7, -0.2, 0.1, 0.3, 0.5, -0.3, 0.8, 0.2, 0.3, 0.1, 0.9, 0.4,
    0.2,
  ],
  // Documentary
  [
    -0.5, -0.4, -0.6, -0.5, -0.7, 1.0, 0.3, 0.2, -0.6, 0.8, -0.6, 0.4, -0.5, 0.1, -0.7, -0.3, -0.6,
    0.5, -0.6,
  ],
  // Drama
  [0.4, 0.5, 0.5, 0.6, 0.7, 0.3, 1.0, 0.6, 0.5, 0.7, 0.4, 0.5, 0.6, 0.8, 0.4, 0.5, 0.6, 0.7, 0.5],
  // Family
  [
    0.3, 0.6, 0.8, 0.7, -0.2, 0.2, 0.6, 1.0, 0.7, -0.3, 0.1, 0.6, 0.2, 0.7, 0.3, 0.5, 0.2, -0.4,
    0.2,
  ],
  // Fantasy
  [0.7, 0.9, 0.6, 0.4, 0.1, -0.6, 0.5, 0.7, 1.0, 0.3, 0.5, 0.3, 0.4, 0.5, 0.9, 0.3, 0.6, 0.4, 0.6],
  // History
  [
    0.5, 0.5, -0.3, -0.2, 0.3, 0.8, 0.7, -0.3, 0.3, 1.0, -0.2, 0.2, 0.3, 0.4, 0.2, 0.1, 0.3, 0.9,0.4,
  ],
  // Horror
  [
    0.6, 0.5, 0.1, 0.1, 0.5, -0.6, 0.4, 0.1, 0.5, -0.2, 1.0, -0.2, 0.6, 0.1, 0.5, 0.2, 0.8, 0.2,
    0.3,
  ],
  // Music
  [
    0.2, 0.3, 0.5, 0.6, -0.3, 0.4, 0.5, 0.6, 0.3, 0.2, -0.2, 1.0, 0.2, 0.6, 0.2, 0.4, 0.2, -0.2,
    0.3,
  ],
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
  [
    0.7, 0.6, -0.4, -0.3, 0.4, 0.5, 0.7, -0.4, 0.4, 0.9, 0.2, -0.2, 0.3, 0.4, 0.3, 0.2, 0.4, 1.0,
    0.5,
  ],
  // Western
  [0.8, 0.7, 0.1, 0.2, 0.2, -0.6, 0.5, 0.2, 0.6, 0.4, 0.3, 0.3, 0.3, 0.3, 0.6, 0.2, 0.4, 0.5, 1.0],
];

// Make genre ratings more aggressive
genreSimilarityMatrix.map(row =>
  row.map(val => {
    if (val === 1.0) return 1.0; // keep perfect self-similarity
    return Math.max(-1, Math.min(1, val * 1.5));
  })
);



// Get similarity factor between movies
// Scaled between -1 and 1  (see above matrix)
export function getMovieSimilarityMatrix(
  currentReviews: UserMovieReview[],
  compareReviews: UserMovieReview[],
) {
  // Genre vector, [1/#genres] in pos of movie genres
  const genreVector = (genres: number[]) => {
    const vec = Array(NUM_GENRES).fill(0)
    if (genres.length === 0) return vec
    const w = 1 / genres.length // L-1 normalized
    for (const genre of genres) {
      if (genreIndexMap[genre]) vec[genreIndexMap[genre]] = w
    }
    return vec
  }

  // Multiply genre vectors by sim matrix
  // vCurrent * simMatrix * vCompare.T
  const getSim = (vin: number[], vout: number[]) => {
    let sim = 0
    for (let i = 0; i < NUM_GENRES; i++) {
      if (vin[i] === 0) continue
      let dot = 0
      for (let j = 0; j < NUM_GENRES; j++) {
        dot += genreSimilarityMatrix[i]![j]! * vout[j]!
      }
      sim += dot * vin[i]!
    }
    return (Math.max(-1, Math.min(1, sim)) + 1) / 2
  }

  // Build review matricies
  const currentMat: number[][] = []
  for (const review of currentReviews) {
    currentMat.push(genreVector(Object.keys(review.genres).map(Number)))
  }
  const compareMat: number[][] = []
  for (const review of compareReviews) {
    compareMat.push(genreVector(Object.keys(review.genres).map(Number)))
  }

  // Create the difference matrix
  const simMat: number[][] = []
  for (let i = 0; i < currentReviews.length; i++) {
    const simRow = []
    for (let j = 0; j < compareReviews.length; j++) {
      simRow.push(getSim(currentMat[i]!, compareMat[j]!))
    }
    simMat.push(simRow)
  }
  return simMat
}

// Get similar (or unsimilar) reviews
// Based on similarity matrix + user rating
// See end of function for return format
export async function getUserSimilarities(
  currentUserId: string,
  compareUserId: string,
  maxComparisons = 5,
  simMin = 0.75
) {
  // Get both users' reviews
  const promises = [
    getAllUserMovieReviewsObject(currentUserId),
    getAllUserMovieReviewsObject(compareUserId),
  ]
  const reviews = await Promise.all(promises)
  if(!reviews[0] || !reviews[1])
    throw new Error('[getUserSimilarities] - Unable to get user movie reviews')
  const currentKeys = Object.keys(reviews[0])
  const compareKeys = Object.keys(reviews[1])
  const currentReviews = Object.values(reviews[0])
  const compareReviews = Object.values(reviews[1])

  // Helpers for storing / sorting review data
  interface ReviewDiff {
    diff: number,
    sim: number,
    current: UserMovieReview
    compare: UserMovieReview,
    sameId?: boolean
  }
  // Sorted insert of a ReviewDiff variable into the given reviews list
  const diffInsert = (
    reviews: ReviewDiff[],
    review: ReviewDiff,
    compare: (a: ReviewDiff, b: ReviewDiff) => boolean,
    maxLength = maxComparisons,
  ) => {
    let i = reviews.length - 1
    for (; i >= 0; i--) {
      if (compare(review, reviews[i]!)) {
        if (i === maxComparisons - 1) {
          return reviews  // Don't append to full list
        }
        reviews.splice(i + 1, 0, review)
        break
      }
    }
    if (i === -1) {     // Insert if empty / first index
      reviews.splice(0, 0, review)
    }
    if (reviews.length > maxLength) {   // Pop if over capacity
      reviews.pop()
    }
    return reviews
  }

  // Find overlapping IDs
  const sameIds = currentKeys.filter((key) => compareKeys.includes(key))
  const overlapPct = sameIds.length / (currentKeys.length + compareKeys.length - sameIds.length)
  const sameTotal = sameIds.length;

  // Get similarity matrix
  const simMat = getMovieSimilarityMatrix(
    currentReviews,
    compareReviews
  )

  // Loop over all review combinations, calc stats
  let sameSum = 0
  let diffSum = 0
  let totalSum = 0
  let absSum = 0
  const simMaxLength = Math.max(maxComparisons, sameTotal)

  // INDICES
  // 0 - diff min, 1 - diff max, 2 - diff zero
  // 3 - same min, 4 - same max
  const reviewStats: ReviewDiff[][] = [
    [],
    [],
    [],
    [],
    [],
  ]
  for (let i = 0; i < simMat.length; i++) {
    const reviewDiffs: Array<ReviewDiff | undefined> = [undefined, undefined, undefined]
    for (let j = 0; j < simMat[0]!.length; j++) {
      const simFactor = simMat[i]![j]!
      if(simFactor < simMin)
        continue;

      const diff = (currentReviews[i]!.rating - compareReviews[j]!.rating) * simFactor
      const review: ReviewDiff = {
        diff: diff,
        sim: simFactor,
        current: currentReviews[i]!,
        compare: compareReviews[j]!,
        sameId:  false
      }

      totalSum += diff;
      absSum += Math.abs(diff);
      if(currentKeys[i] === compareKeys[j]) {
        review.sameId = true;
        sameSum += diff;
      }
      else {
        diffSum += diff;
      }

      if(!reviewDiffs[0] || diff > reviewDiffs[0].diff) {    // Max diff
        reviewDiffs[0] = review
      }
      if(!reviewDiffs[1] || diff < reviewDiffs[1].diff) {    // Min diff
        reviewDiffs[1] = review
      }
      if(!reviewDiffs[2] || Math.abs(diff) > reviewDiffs[2].diff) {  // Zero diff
        reviewDiffs[2] = {
          ...review,
          diff:   Math.abs(diff)
        }
      }
    }

    // Add to respective lists
    const diffCompare = [
      (a: ReviewDiff, b: ReviewDiff) => b.diff > a.diff,
      (a: ReviewDiff, b: ReviewDiff) => b.diff < a.diff,
      (a: ReviewDiff, b: ReviewDiff) => Math.abs(b.diff) < Math.abs(a.diff)
    ]
    for(let i = 0; i < 3; i++) {
      if(reviewDiffs[i]) {
        if(reviewDiffs[i]?.sameId) {
          diffInsert(reviewStats[i+3]!, reviewDiffs[i]!, diffCompare[i]!, simMaxLength)
        }
        else {
          diffInsert(reviewStats[i]!, reviewDiffs[i]!, diffCompare[i]!, simMaxLength)
        }
      }
    }
  }

  // Assign similarity grade
  const absDiff = absSum / currentKeys.length / compareKeys.length
  let similarityGrade = 'F'
  const gradeThresholds: [number, string][] = [
    [0.8, 'A'],
    [1.0, 'A-'],
    [1.2, 'B+'],
    [1.8, 'B'],
    [2.0, 'B-'],
    [2.2, 'C+'],
    [2.8, 'C'],
    [3.0, 'C-'],
    [3.2, 'D+'],
    [3.8, 'D'],
    [4.0, 'D-'],
    [4.5, 'F'],
  ]
  for (const [limit, grade] of gradeThresholds) {
    if (absDiff <= limit) {
      similarityGrade = grade
      break
    }
  }

  console.log(reviewStats)

  // Bundle and return
  return {
    overlapPct: overlapPct,
    avg: totalSum / currentKeys.length / compareKeys.length,
    absAvg: absDiff,
    grade: similarityGrade,
    overlap: {
      avg: sameSum / sameTotal,
      min: reviewStats[3] as ReviewDiff[],
      max: reviewStats[4] as ReviewDiff[],
    },
    diff: {
      avg: diffSum / (currentKeys.length * compareKeys.length - sameTotal),
      min: reviewStats[0] as ReviewDiff[],
      max: reviewStats[1] as ReviewDiff[],
      zero: reviewStats[2] as ReviewDiff[],
    },
  }
}
