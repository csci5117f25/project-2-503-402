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
              <div class="metric-label">Hot take of the year</div>
              <div class="metric-value metric-ellipsis" :title="yearStats.hotTakeTitle">
                {{ yearStats.hotTakeTitle }}
              </div>

              <div class="metric-sub" v-if="yearStats.hotTakeDelta !== null">
                You {{ yearStats.hotTakeYou }} · TMDB {{ yearStats.hotTakeTmdb }} ·
                <span class="metric-delta pos">{{ yearStats.hotTakeDelta }}</span>
              </div>
              <div class="metric-sub" v-else>—</div>
            </div>

            <div class="metric">
              <div class="metric-label">Personal favorite</div>
              <div class="metric-value metric-ellipsis" :title="yearStats.favoriteTitle">
                {{ yearStats.favoriteTitle }}
              </div>

              <div class="metric-sub" v-if="yearStats.favoriteRating !== null">
                Your rating: {{ yearStats.favoriteRating }}/10
              </div>
              <div class="metric-sub" v-else>—</div>
            </div>

            <div class="metric">
              <div class="metric-label">Recently watched</div>
              <div class="metric-value metric-ellipsis" :title="yearStats.recentTitle">
                {{ yearStats.recentTitle }}
              </div>
              <div class="metric-sub">
                {{ yearStats.recentWhen }}
              </div>
            </div>

            <div class="metric">
              <div class="metric-label">Rewatch</div>
              <div class="metric-value">{{ yearStats.rewatchCount }}</div>
              <div class="metric-sub">{{ yearStats.rewatchRate }}</div>
            </div>
          </div>
        </div>

        <div class="cards-list">
          <ReviewCard
            v-for="(review, index) in reviews"
            :key="review.movieId"
            :review="review"
            :busy="reviewSavingId === review.movieId"
            :ref="(cmp) => setCardRef(cmp, index)"
            @save="handleCardSave"
            @delete="confirmDelete"
            @toggle-rewatch="toggleRewatch"
          />
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
import ReviewCard from '@/components/ReviewCard.vue'

import {
  getAllUserReviews,
  getUserMovieReviews,
  tmdbImageURL,
  addUserReview,
  removeUserReview,
  type UserReview,
} from '@/movies'

type ReviewCardData = {
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
  loggedAt?: any | null
  posterUrl?: string | null
}

const currentUser = useCurrentUser()
const userId = computed(() => currentUser.value?.uid ?? null)

const reviews = ref<ReviewCardData[]>([])
const loading = ref(false)
const loadError = ref<string | null>(null)

const cardRefs = ref<HTMLElement[]>([])
const sidebarItemRefs = ref<HTMLElement[]>([])
const activeReviewId = ref<number | null>(null)

const navOffset = ref(90)
const isJumping = ref(false)

const reviewSavingId = ref<number | null>(null)
const currentYear = new Date().getFullYear()

function setCardRef(cmp: any, index: number) {
  const el = cmp?.$el as HTMLElement | undefined
  if (el) cardRefs.value[index] = el
}

function formatOneDecimal(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return n.toFixed(1)
}

function deltaValue(r: ReviewCardData) {
  if (r.user_rating === null || r.user_rating === undefined) return null
  if (r.rating_avg === null || r.rating_avg === undefined) return null
  return r.user_rating - r.rating_avg
}

function toDateMaybe(v: any): Date | null {
  if (!v) return null
  if (typeof v?.toDate === 'function') return v.toDate()
  if (v instanceof Date) return v
  if (typeof v === 'number') return new Date(v)
  if (typeof v === 'string') {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function timeAgo(d: Date | null): string {
  if (!d) return '—'
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

const yearStats = computed(() => {
  const list = reviews.value.filter((r) => !r.draft)

  let hotTake: ReviewCardData | null = null
  let hotDelta = -Infinity
  for (const r of list) {
    const d = deltaValue(r)
    if (d === null) continue
    if (d > 0 && d > hotDelta) {
      hotDelta = d
      hotTake = r
    }
  }
  const hotTakeDelta = hotTake && hotDelta !== -Infinity ? `+${hotDelta.toFixed(1)}` : null

  let favorite: ReviewCardData | null = null
  let bestRating = -Infinity
  for (const r of list) {
    if (r.user_rating === null || r.user_rating === undefined) continue
    if (r.user_rating > bestRating) {
      bestRating = r.user_rating
      favorite = r
    }
  }

  let recent: ReviewCardData | null = null
  let recentDate: Date | null = null
  for (const r of list) {
    const d = toDateMaybe(r.loggedAt)
    if (!d) continue
    if (!recentDate || d.getTime() > recentDate.getTime()) {
      recentDate = d
      recent = r
    }
  }

  const rewatchCount = list.filter((r) => !!r.rewatch).length
  const rewatchRate =
    list.length > 0 ? `${Math.round((rewatchCount / list.length) * 100)}% rewatch` : '—'

  return {
    hotTakeTitle: hotTake?.title ?? '—',
    hotTakeDelta,
    hotTakeYou:
      hotTake?.user_rating !== null && hotTake?.user_rating !== undefined
        ? hotTake.user_rating.toFixed(1)
        : '—',
    hotTakeTmdb: hotTake ? formatOneDecimal(hotTake.rating_avg) : '—',

    favoriteTitle: favorite?.title ?? '—',
    favoriteRating:
      favorite?.user_rating !== null && favorite?.user_rating !== undefined
        ? favorite.user_rating.toFixed(1)
        : null,

    recentTitle: recent?.title ?? '—',
    recentWhen: recentDate ? timeAgo(recentDate) : 'Needs loggedAt',

    rewatchCount,
    rewatchRate,
  }
})

/** ✅ Save from inline card editor */
async function handleCardSave(payload: {
  movieId: number
  rating: number | null
  thoughts: string | null
}) {
  if (!userId.value) return

  const { movieId, rating, thoughts } = payload
  reviewSavingId.value = movieId

  try {
    const existing = reviews.value.find((r) => r.movieId === movieId)
    const rewatch = existing?.rewatch ?? false
    const loggedAt = existing?.loggedAt ?? null

    const docPayload: UserReview = {
      rating,
      comment: thoughts,
      draft: false,
      rewatch,
      loggedAt,
    }

    await addUserReview(userId.value, movieId, docPayload)

    reviews.value = reviews.value.map((r) =>
      r.movieId === movieId ? { ...r, user_rating: rating, user_thoughts: thoughts } : r,
    )
  } catch (e) {
    console.error(e)
  } finally {
    reviewSavingId.value = null
  }
}

async function toggleRewatch(r: ReviewCardData) {
  if (!userId.value) return

  const movieId = r.movieId
  const next = !r.rewatch

  reviews.value = reviews.value.map((x) => (x.movieId === movieId ? { ...x, rewatch: next } : x))

  reviewSavingId.value = movieId
  try {
    const updated = reviews.value.find((x) => x.movieId === movieId)

    const payload: UserReview = {
      rating: updated?.user_rating ?? null,
      comment: updated?.user_thoughts ?? null,
      draft: false,
      rewatch: next,
      loggedAt: updated?.loggedAt ?? null,
    }

    await addUserReview(userId.value, movieId, payload)
  } catch (e) {
    console.error(e)
    reviews.value = reviews.value.map((x) => (x.movieId === movieId ? { ...x, rewatch: !next } : x))
  } finally {
    reviewSavingId.value = null
  }
}

async function confirmDelete(r: ReviewCardData) {
  if (!userId.value) return
  const ok = window.confirm(`Delete your review for "${r.title}"?`)
  if (!ok) return

  reviewSavingId.value = r.movieId
  try {
    await removeUserReview(userId.value, r.movieId)
    reviews.value = reviews.value.filter((x) => x.movieId !== r.movieId)
    cardRefs.value = []
    sidebarItemRefs.value = []
    if (activeReviewId.value === r.movieId) {
      activeReviewId.value = reviews.value[0]?.movieId ?? null
    }
  } catch (e) {
    console.error(e)
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

    const cards: ReviewCardData[] = joined
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
          loggedAt:
            (item as any).loggedAt ?? (item as any).updatedAt ?? (item as any).createdAt ?? null,

          posterUrl,
        } satisfies ReviewCardData
      })
      .filter((x): x is ReviewCardData => !!x && !x.draft)

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
