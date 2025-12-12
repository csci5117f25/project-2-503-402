<template>
  <div class="home-page">
    <div class="home-inner">
      <section class="cards-column">
        <h2 class="section-title">Your Reviews</h2>
        <p class="section-subtitle">Scroll through the movies you&apos;ve logged.</p>

        <div v-if="!userId" class="empty-state">Please sign in to see your reviews.</div>
        <div v-else-if="loading" class="empty-state">Loading your reviews…</div>
        <div v-else-if="loadError" class="empty-state">
          {{ loadError }}
        </div>
        <div v-else-if="reviews.length === 0" class="empty-state">
          No reviews yet — add one in the Form.
        </div>

        <div v-else class="year-card">
          <div class="year-card-top">
            <div class="year-title">This year in movies</div>
            <div class="year-subtitle">{{ currentYear }} so far</div>
          </div>

          <div class="year-metrics">
            <div class="metric">
              <div class="metric-label">Movies logged</div>
              <div class="metric-value">{{ yearStats.count }}</div>
            </div>

            <div class="metric">
              <div class="metric-label">Avg your rating</div>
              <div class="metric-value">{{ yearStats.avgUserRating }}</div>
            </div>

            <div class="metric">
              <div class="metric-label">Top genre</div>
              <div class="metric-value metric-ellipsis" :title="yearStats.topGenre">
                {{ yearStats.topGenre }}
              </div>
            </div>

            <div class="metric">
              <div class="metric-label">Rewatch</div>
              <div class="metric-value">{{ yearStats.rewatchCount }}</div>
            </div>
          </div>
        </div>

        <div class="cards-list">
          <article
            v-for="(review, index) in reviews"
            :key="review.movieId"
            :ref="(el) => (cardRefs[index] = el as HTMLElement)"
            class="review-card"
          >
            <div class="card-grid">
              <div class="poster-sq">
                <img
                  v-if="review.posterUrl"
                  :src="review.posterUrl"
                  :alt="`${review.title} poster`"
                  class="poster-img"
                  loading="lazy"
                />
                <div v-else class="poster-fallback">No poster</div>
              </div>

              <div class="card-main">
                <header class="top-row">
                  <div class="title-block">
                    <h3 class="movie-title">{{ review.title }}</h3>
                    <p v-if="review.tagline" class="movie-tagline">{{ review.tagline }}</p>
                  </div>

                  <div class="global-rating">
                    <div class="global-stars">
                      <span class="star">★</span>
                      <span class="global-score">{{ formatOneDecimal(review.rating_avg) }}</span>
                      <span class="global-outof">/10</span>
                    </div>
                    <div class="global-count">{{ formatCount(review.rating_count) }} ratings</div>
                  </div>
                </header>

                <div class="user-row">
                  <div class="user-rating">
                    <span class="label">You rated</span>

                    <div class="rating-line">
                      <span class="chip"> ⭐ {{ formatOneDecimal(review.user_rating) }}/10 </span>

                      <span
                        v-if="review.user_rating !== null && review.user_rating !== undefined"
                        class="delta-pill"
                        :class="deltaClass(review)"
                        :title="deltaTitle(review)"
                      >
                        {{ deltaText(review) }}
                      </span>
                    </div>

                    <button
                      type="button"
                      class="rewatch-toggle"
                      :class="{ on: !!review.rewatch }"
                      @click="toggleRewatch(review)"
                      :disabled="reviewSavingId === review.movieId"
                      :title="review.rewatch ? 'Marked as rewatchable' : 'Mark as rewatchable'"
                    >
                      <span class="rewatch-dot" />
                      <span class="rewatch-text">
                        {{ review.rewatch ? 'Rewatch' : 'One-time' }}
                      </span>
                    </button>

                    <div v-if="review.draft" class="draft-pill">Draft</div>
                  </div>

                  <div class="user-thoughts">
                    <span class="label">Your thoughts</span>
                    <p class="thoughts-text">
                      {{ review.user_thoughts || '—' }}
                    </p>
                  </div>
                </div>

                <footer class="bottom-row">
                  <div class="facts">
                    <span class="fact-pill">{{ formatDate(review.release_date) }}</span>
                    <span v-if="review.runtime" class="fact-pill">{{ review.runtime }} min</span>

                    <span class="fact-pill">
                      Budget:
                      <span class="fact-strong">
                        {{ review.budget && review.budget > 0 ? formatMoney(review.budget) : 'NA' }}
                      </span>
                    </span>

                    <span
                      v-if="review.genresText"
                      class="fact-pill genres-pill"
                      :title="review.genresText"
                    >
                      {{ review.genresText }}
                    </span>
                  </div>
                </footer>
              </div>
            </div>
          </article>
        </div>
      </section>

      <aside class="sidebar">
        <h3 class="sidebar-title">Your films</h3>
        <p class="sidebar-subtitle">Tap to jump to a review</p>

        <div class="sidebar-list">
          <button
            v-for="(review, index) in reviews"
            :key="review.movieId"
            :ref="(el) => (sidebarItemRefs[index] = el as HTMLElement)"
            class="sidebar-item"
            :class="{ active: review.movieId === activeReviewId }"
            @click="scrollToReview(review.movieId)"
          >
            <span class="sidebar-movie-title">{{ review.title }}</span>
            <span class="sidebar-rating">{{ formatOneDecimal(review.user_rating) }}/10</span>
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useCurrentUser } from 'vuefire'
import {
  getAllUserReviews,
  getUserMovieReviews,
  tmdbImageURL,
  addUserReview,
  type UserReview,
} from '@/movies'

type ReviewCard = {
  movieId: number
  title: string
  tagline: string | null
  release_date: string
  runtime: number | null
  poster_path: string | null
  rating_avg: number
  rating_count: number
  budget: number | null
  genresText: string

  user_rating: number | null
  user_thoughts: string | null
  draft?: boolean

  rewatch?: boolean | null

  posterUrl?: string | null
}

const currentUser = useCurrentUser()
const userId = computed(() => currentUser.value?.uid ?? null)

const reviews = ref<ReviewCard[]>([])
const loading = ref(false)
const loadError = ref<string | null>(null)

const cardRefs = ref<HTMLElement[]>([])
const sidebarItemRefs = ref<HTMLElement[]>([])
const activeReviewId = ref<number | null>(null)
const navOffset = ref(90)
const isJumping = ref(false)

const reviewSavingId = ref<number | null>(null)

const currentYear = new Date().getFullYear()

function formatOneDecimal(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return n.toFixed(1)
}

function formatCount(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) return '0'
  return Intl.NumberFormat('en-US').format(n)
}

function formatDate(iso: string) {
  if (!iso) return 'Unknown'
  const d = new Date(iso + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function deltaValue(r: ReviewCard) {
  if (r.user_rating === null || r.user_rating === undefined) return null
  if (r.rating_avg === null || r.rating_avg === undefined) return null
  return r.user_rating - r.rating_avg
}
function deltaText(r: ReviewCard) {
  const d = deltaValue(r)
  if (d === null) return ''
  const sign = d > 0 ? '+' : ''
  return `${sign}${d.toFixed(1)}`
}
function deltaTitle(r: ReviewCard) {
  const d = deltaValue(r)
  if (d === null) return ''
  return `You (${formatOneDecimal(r.user_rating)}) vs TMDB (${formatOneDecimal(r.rating_avg)})`
}
function deltaClass(r: ReviewCard) {
  const d = deltaValue(r)
  if (d === null) return 'neutral'
  if (d > 0.05) return 'pos'
  if (d < -0.05) return 'neg'
  return 'neutral'
}

const yearStats = computed(() => {
  const list = reviews.value.filter((r) => !r.draft)

  const count = list.length

  const rated = list
    .map((r) => r.user_rating)
    .filter((x): x is number => x !== null && x !== undefined && !Number.isNaN(x))

  const avgUserRating =
    rated.length > 0 ? (rated.reduce((a, b) => a + b, 0) / rated.length).toFixed(1) : '—'

  const genreCounts = new Map<string, number>()
  for (const r of list) {
    if (!r.genresText) continue
    const parts = r.genresText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    for (const g of parts) {
      genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1)
    }
  }
  let topGenre = '—'
  let best = 0
  for (const [g, c] of genreCounts.entries()) {
    if (c > best) {
      best = c
      topGenre = g
    }
  }

  const rewatchCount = list.filter((r) => !!r.rewatch).length

  return {
    count,
    avgUserRating,
    topGenre,
    rewatchCount,
  }
})

async function toggleRewatch(r: ReviewCard) {
  if (!userId.value) return
  reviewSavingId.value = r.movieId

  try {
    const next = !r.rewatch
    r.rewatch = next

    const payload: UserReview = {
      rating: r.user_rating ?? null,
      comment: r.user_thoughts ?? null,
      draft: r.draft ?? false,
      rewatch: next,
    }

    await addUserReview(userId.value, r.movieId, payload)
  } catch (e) {
    console.error(e)
    r.rewatch = !r.rewatch
  } finally {
    reviewSavingId.value = null
  }
}

async function loadHomeReviews(uid: string) {
  loading.value = true
  loadError.value = null

  try {
    const reviewMap = await getAllUserReviews(uid)
    const movieIds = Object.keys(reviewMap)
      .map((id) => parseInt(id))
      .filter((n) => !Number.isNaN(n))

    if (movieIds.length === 0) {
      reviews.value = []
      activeReviewId.value = null
      return
    }

    const joined = await getUserMovieReviews(uid, movieIds)

    const cards: ReviewCard[] = joined
      .map((item, idx) => {
        if (!item) return null

        const movieId = movieIds[idx]
        const posterUrl = item.poster_path ? tmdbImageURL(item.poster_path) : null
        const genresText = item.genres ? Object.values(item.genres).join(', ') : ''

        return {
          movieId,
          tagline: item.tagline ?? null,
          title: item.title,
          release_date: item.release_date,
          runtime: item.runtime ?? null,
          poster_path: item.poster_path ?? null,
          rating_avg: item.rating_avg,
          rating_count: item.rating_count,
          budget: item.budget && item.budget > 0 ? item.budget : null,
          genresText,

          user_rating: item.rating ?? null,
          user_thoughts: item.comment ?? null,
          draft: item.draft ?? false,

          rewatch: (item as any).rewatch ?? false,

          posterUrl,
        } satisfies ReviewCard
      })
      .filter((x): x is ReviewCard => !!x)

    reviews.value = cards

    cardRefs.value = []
    sidebarItemRefs.value = []
    activeReviewId.value = reviews.value[0]?.movieId ?? null
  } catch (err) {
    console.error(err)
    loadError.value = 'Failed to load your reviews (check Firestore rules + login).'
    reviews.value = []
    activeReviewId.value = null
  } finally {
    loading.value = false
  }
}

watch(
  userId,
  (uid) => {
    if (!uid) {
      reviews.value = []
      activeReviewId.value = null
      loadError.value = null
      loading.value = false
      return
    }
    loadHomeReviews(uid)
  },
  { immediate: true },
)

const measureNavHeight = () => {
  const nav =
    document.querySelector('header') ||
    document.querySelector('nav') ||
    document.querySelector('.navbar')
  if (nav) navOffset.value = nav.getBoundingClientRect().height
}

const scrollToReview = (movieId: number) => {
  const index = reviews.value.findIndex((r) => r.movieId === movieId)
  if (index === -1) return

  const el = cardRefs.value[index]
  if (!el?.scrollIntoView) return

  activeReviewId.value = movieId
  isJumping.value = true
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })

  setTimeout(() => (isJumping.value = false), 600)
}

const handleScroll = () => {
  if (isJumping.value) return
  const offset = navOffset.value + 16

  let closestId = activeReviewId.value
  let minDist = Infinity
  let closestIndex = -1

  cardRefs.value.forEach((el, index) => {
    if (!el) return
    const rect = el.getBoundingClientRect()
    const dist = Math.abs(rect.top - offset)
    if (dist < minDist) {
      minDist = dist
      closestIndex = index
      closestId = reviews.value[index].movieId
    }
  })

  if (closestIndex !== -1 && closestId !== null) {
    activeReviewId.value = closestId
    sidebarItemRefs.value[closestIndex]?.scrollIntoView?.({ block: 'nearest' })
  }
}

onMounted(() => {
  measureNavHeight()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', measureNavHeight, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', measureNavHeight)
})
</script>

<style scoped src="@/styles/homepage.css"></style>