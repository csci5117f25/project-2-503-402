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

<style scoped>
.home-page {
  min-height: 100vh;
  padding: 7.5rem 1.75rem 3rem;
  background: radial-gradient(circle at top left, #f6f7ff 0, #eef1f7 40%, #e5e9f0 100%);
  box-sizing: border-box;
  scroll-padding-top: 140px;
}

.home-inner {
  max-width: 1320px;
  margin: 0 auto;
  display: flex;
  gap: 2.5rem;
  align-items: flex-start;
}

.cards-column {
  flex: 1 1 auto;
}

.section-title {
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  color: #111827;
}

.section-subtitle {
  font-size: 0.95rem;
  color: #6b7280;
  margin-bottom: 1.1rem;
}

.year-card {
  max-width: 920px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 1.1rem;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
  padding: 0.95rem 1rem;
  margin-bottom: 1.1rem;
}

.year-card-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
}

.year-title {
  font-size: 1rem;
  font-weight: 850;
  color: #111827;
}

.year-subtitle {
  font-size: 0.85rem;
  font-weight: 650;
  color: #6b7280;
}

.year-metrics {
  margin-top: 0.8rem;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.metric {
  background: rgba(148, 163, 184, 0.12);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 0.9rem;
  padding: 0.65rem 0.75rem;
  min-width: 0;
}

.metric-label {
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6b7280;
  font-weight: 800;
}

.metric-value {
  margin-top: 0.25rem;
  font-size: 1.05rem;
  font-weight: 900;
  color: #111827;
}

.metric-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.review-card {
  background: #ffffff;
  border-radius: 1.1rem;
  padding: 0.9rem;
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 14px 35px rgba(15, 23, 42, 0.08);
  max-width: 920px;
  margin-right: auto;
  overflow: hidden;
  scroll-margin-top: 140px;

  height: 220px;
  max-height: 220px;
}

.card-grid {
  display: grid;
  grid-template-columns: 132px 1fr;
  gap: 0.95rem;
  align-items: start;
  height: 100%;
}

.poster-sq {
  width: 132px;
  height: 132px;
  border-radius: 1rem;
  overflow: hidden;
  display: grid;
  place-items: center;

  background: rgba(148, 163, 184, 0.12);
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.18);
}

.poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poster-fallback {
  font-size: 0.8rem;
  color: #4b5563;
  padding: 0.75rem;
  text-align: center;
}

.card-main {
  min-width: 0;
  height: 100%;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 0.55rem;
  background: #ffffff;
}

.top-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: nowrap;
  align-items: center;
  background: #ffffff !important;
  padding: 0 !important;
}

.title-block {
  min-width: 0;
  background: #ffffff !important;
}

.movie-title {
  font-size: 1.15rem;
  font-weight: 850;
  color: #111827;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.movie-tagline {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  color: #6b7280;
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.global-rating {
  flex: 0 0 auto;
  text-align: right;
  padding: 0.45rem 0.6rem;
  border-radius: 0.9rem;
  background: rgba(17, 24, 39, 0.03);
  border: 1px solid rgba(148, 163, 184, 0.22);
}

.global-stars {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 0.2rem;
}

.star {
  font-size: 0.95rem;
}

.global-score {
  font-size: 1.05rem;
  font-weight: 850;
  color: #111827;
}

.global-outof {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 700;
}

.global-count {
  margin-top: 0.15rem;
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 650;
}

.user-row {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 0.85rem;
  align-items: start;
  overflow: hidden;
}

.label {
  display: block;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6b7280;
  margin-bottom: 0.25rem;
  font-weight: 850;
}

.rating-line {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: nowrap;
  min-width: 0;
}

.user-rating .chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.22rem 0.6rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #f97316, #facc15);
  color: #111827;
  font-weight: 900;
  font-size: 0.9rem;
  white-space: nowrap;
}

/* ✅ Delta pill */
.delta-pill {
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 900;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(148, 163, 184, 0.12);
  color: #111827;
  white-space: nowrap;
}
.delta-pill.pos {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.28);
  color: #166534;
}
.delta-pill.neg {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.28);
  color: #991b1b;
}
.delta-pill.neutral {
  background: rgba(148, 163, 184, 0.12);
  border-color: rgba(148, 163, 184, 0.25);
  color: #374151;
}

/* ✅ Rewatch toggle */
.rewatch-toggle {
  margin-top: 0.45rem;
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(148, 163, 184, 0.1);
  color: #374151;
  font-weight: 850;
  font-size: 0.78rem;
  cursor: pointer;
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease,
    background 0.12s ease;
}
.rewatch-toggle:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.1);
  background: rgba(148, 163, 184, 0.14);
}
.rewatch-toggle:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.rewatch-toggle .rewatch-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.55);
}
.rewatch-toggle.on {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.3);
  color: #166534;
}
.rewatch-toggle.on .rewatch-dot {
  background: rgba(34, 197, 94, 0.9);
}

.draft-pill {
  margin-top: 0.4rem;
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 850;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.thoughts-text {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.45;
  color: #374151;

  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;

  overflow-wrap: anywhere;
  word-break: break-word;
}

.bottom-row {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  align-items: center;
  flex-wrap: nowrap;
  overflow: hidden;

  padding-top: 0.25rem;
  border-top: 1px dashed rgba(148, 163, 184, 0.35);
}

.facts {
  display: flex;
  gap: 0.45rem;
  flex-wrap: nowrap;
  overflow: hidden;
}

.fact-pill {
  flex: 0 0 auto;
  font-size: 0.78rem;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.15);
  color: #374151;
  white-space: nowrap;
  font-weight: 650;
}

.fact-strong {
  font-weight: 900;
  color: #111827;
}

.genres-pill {
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 380px;
}

/* sidebar */
.sidebar {
  width: 270px;
  max-width: 30%;
  background: rgba(255, 255, 255, 0.75);
  border-radius: 1.1rem;
  padding: 1.1rem 1rem;
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.1);
  position: sticky;
  top: 110px;
  max-height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
  margin-left: auto;
}

.sidebar-title {
  font-size: 1rem;
  font-weight: 750;
  color: #111827;
}

.sidebar-subtitle {
  font-size: 0.8rem;
  color: #4b5563;
  margin-top: 0.1rem;
}

.sidebar-list {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  overflow-y: auto;
  padding-right: 0.35rem;
}

.sidebar-item {
  border: none;
  border-radius: 0.8rem;
  padding: 0.4rem 0.55rem;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  font-size: 0.82rem;
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease,
    background 0.12s ease,
    color 0.12s ease;
}

.sidebar-item:hover {
  background: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
  transform: translateY(-1px);
}

.sidebar-item.active {
  background: #111827;
  color: #f9fafb;
  box-shadow: 0 10px 24px rgba(17, 24, 39, 0.35);
}

.sidebar-movie-title {
  font-weight: 650;
  text-align: left;
}

.sidebar-rating {
  font-weight: 900;
  font-size: 0.78rem;
  color: #111827;
}

.sidebar-item.active .sidebar-rating {
  color: #fde68a;
}

.empty-state {
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 1rem;
  padding: 1rem;
  color: #374151;
  max-width: 920px;
}

@media (max-width: 900px) {
  .home-inner {
    flex-direction: column;
  }

  .review-card,
  .year-card {
    max-width: 100%;
  }

  .sidebar {
    position: static;
    width: 100%;
    max-width: 100%;
    max-height: none;
    margin-top: 1rem;
  }

  .year-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .review-card {
    height: 270px;
    max-height: 270px;
  }

  .card-grid {
    grid-template-columns: 112px 1fr;
  }

  .poster-sq {
    width: 112px;
    height: 112px;
  }

  .user-row {
    grid-template-columns: 1fr;
  }
}
</style>
