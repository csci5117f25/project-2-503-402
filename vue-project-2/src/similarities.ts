


// WANT TO MAKE SIMILARITIES REPORT
// HEREs what I have

import { getAllUserMovieReviewsObject } from "./movies";

/*
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
    RETURN extremas from

  AT LA

*/

const genres: Record<number, string> = {
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

// Order of genres (index mapping):
// 0: Action
// 1: Adventure
// 2: Animation
// 3: Comedy
// 4: Crime
// 5: Documentary
// 6: Drama
// 7: Family
// 8: Fantasy
// 9: History
// 10: Horror
// 11: Music
// 12: Mystery
// 13: Romance
// 14: Science Fiction
// 15: TV Movie
// 16: Thriller
// 17: War
// 18: Western

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
  const compareKeys = Object.keys(copmareReviews)

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
}
