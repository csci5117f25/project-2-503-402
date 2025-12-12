<template>
  <div class="home-page">
    <div class="home-inner">
      <section class="cards-column">
        <h2 class="section-title">Your Reviews</h2>
        <p class="section-subtitle">Scroll through the movies you&apos;ve logged.</p>

        <div class="cards-list">
          <article
            v-for="(review, index) in reviews"
            :key="review.movieId"
            :ref="(el) => (cardRefs[index] = el)"
            class="review-card"
          >
            <div class="card-grid">
              <!-- Poster (squarish) -->
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

              <!-- Main content -->
              <div class="card-main">
                <header class="top-row">
                  <div class="title-block">
                    <h3 class="movie-title">{{ review.title }}</h3>
                    <p class="movie-meta">
                      <span class="meta-pill">{{ formatDate(review.release_date) }}</span>
                      <span v-if="review.runtime" class="meta-pill">{{ review.runtime }} min</span>
                    </p>
                  </div>

                  <!-- Global rating badge -->
                  <div class="global-rating">
                    <div class="global-stars">
                      <span class="star">★</span>
                      <span class="global-score">{{ formatOneDecimal(review.rating_avg) }}</span>
                      <span class="global-outof">/10</span>
                    </div>
                    <div class="global-count">
                      {{ formatCount(review.rating_count) }} ratings
                    </div>
                  </div>
                </header>

                <!-- User rating + thoughts -->
                <div class="user-row">
                  <div class="user-rating">
                    <span class="label">You rated</span>
                    <span class="chip">
                      ⭐ {{ formatOneDecimal(review.user_rating) }}/10
                    </span>
                  </div>

                  <div class="user-thoughts">
                    <span class="label">Your thoughts</span>
                    <p class="thoughts-text">
                      {{ review.user_thoughts || '—' }}
                    </p>
                  </div>
                </div>

                <footer class="bottom-row">
                  <div class="kpi">
                    <span class="kpi-label">TMDB</span>
                    <span class="kpi-value">
                      {{ formatOneDecimal(review.rating_avg) }} avg · {{ formatCount(review.rating_count) }} votes
                    </span>
                  </div>

                  <!-- Optional: keep your tags if you want (safe to remove) -->
                  <div v-if="review.tags?.length" class="tag-row">
                    <span v-for="tag in review.tags" :key="tag" class="tag-pill">{{ tag }}</span>
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
            :ref="(el) => (sidebarItemRefs[index] = el)"
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
import { ref, onMounted, onBeforeUnmount } from 'vue'

type ReviewCard = {
  // Identifier (use TMDB id here — this will match your Firestore doc id later)
  movieId: number

  // From API (cached MovieData)
  title: string
  release_date: string
  runtime: number | null
  poster_path: string | null
  rating_avg: number
  rating_count: number

  // From form / user review
  user_rating: number | null
  user_thoughts: string | null

  // optional for now
  tags?: string[]
  // convenience for mock UI (later we’ll derive from poster_path + tmdbImageURL)
  posterUrl?: string | null
}

const reviews = ref<ReviewCard[]>([
  {
    movieId: 693134, // example TMDB id (Dune: Part Two)
    title: 'Dune: Part Two',
    release_date: '2024-02-27',
    runtime: 166,
    poster_path: '/somepath.jpg',
    rating_avg: 8.6,
    rating_count: 7200,
    user_rating: 9.1,
    user_thoughts:
      'Huge, dense, and surprisingly emotional. Sound design + visuals are insane.',
    tags: ['Sci-Fi', 'Epic'],
    posterUrl: 'https://i.ebayimg.com/images/g/epwAAOSwmutlsW7j/s-l1200.jpg',
  },
  {
    movieId: 569094,
    title: 'Spider-Man: Across the Spider-Verse',
    release_date: '2023-05-31',
    runtime: 140,
    poster_path: '/somepath.jpg',
    rating_avg: 8.7,
    rating_count: 9800,
    user_rating: 9.5,
    user_thoughts:
      'Every frame looks like a poster. Loved how the animation style changes with each universe.',
    tags: ['Animation', 'Superhero'],
    posterUrl: 'https://m.media-amazon.com/images/I/71q1TyEFjpL.jpg',
  },
])

const cardRefs = ref<HTMLElement[]>([])
const sidebarItemRefs = ref<HTMLElement[]>([])
const activeReviewId = ref<number | null>(reviews.value[0]?.movieId ?? null)
const navOffset = ref(90)
const isJumping = ref(false)

function formatOneDecimal(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return n.toFixed(1)
}

function formatCount(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) return '0'
  return Intl.NumberFormat('en-US').format(n)
}

function formatDate(iso: string) {
  // expects YYYY-MM-DD (TMDB style)
  if (!iso) return 'Unknown'
  const d = new Date(iso + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const measureNavHeight = () => {
  // Prefer header first (your header includes logo + nav)
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
  if (!el || !el.scrollIntoView) return

  activeReviewId.value = movieId
  isJumping.value = true

  el.scrollIntoView({ behavior: 'smooth', block: 'start' })

  setTimeout(() => {
    isJumping.value = false
  }, 600)
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
    const sideEl = sidebarItemRefs.value[closestIndex]
    sideEl?.scrollIntoView?.({ block: 'nearest' })
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
  margin-bottom: 1.5rem;
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

/* --- redesigned card --- */
.review-card {
  background: #ffffff;
  border-radius: 1.1rem;
  padding: 0.9rem;
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 14px 35px rgba(15, 23, 42, 0.08);
  max-width: 920px;
  margin-right: auto;
  overflow: hidden;
  scroll-margin-top: 200px;
}

.card-grid {
  display: grid;
  grid-template-columns: 132px 1fr;
  gap: 0.95rem;
  align-items: start;
}

/* squarish poster */
.poster-sq {
  width: 132px;
  height: 132px;
  border-radius: 1rem;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.12), rgba(236, 72, 153, 0.10));
  border: 1px solid rgba(129, 140, 248, 0.35);
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.18);
  display: grid;
  place-items: center;
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
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.top-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-start;
}

.title-block {
  min-width: 0;
}

.movie-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}

.movie-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.35rem;
}

.meta-pill {
  font-size: 0.78rem;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.15);
  color: #374151;
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
  font-weight: 800;
  color: #111827;
}

.global-outof {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 600;
}

.global-count {
  margin-top: 0.15rem;
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.user-row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 0.85rem;
  align-items: start;
}

.label {
  display: block;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6b7280;
  margin-bottom: 0.25rem;
  font-weight: 700;
}

.user-rating .chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.22rem 0.6rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #f97316, #facc15);
  color: #111827;
  font-weight: 800;
  font-size: 0.9rem;
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
}

.bottom-row {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  align-items: flex-end;
  flex-wrap: wrap;
  padding-top: 0.25rem;
  border-top: 1px dashed rgba(148, 163, 184, 0.35);
}

.kpi {
  font-size: 0.82rem;
  color: #374151;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.kpi-label {
  font-weight: 800;
  padding: 0.12rem 0.45rem;
  border-radius: 999px;
  background: rgba(79, 70, 229, 0.10);
  color: #4338ca;
}

.kpi-value {
  font-weight: 600;
  color: #374151;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.tag-pill {
  font-size: 0.73rem;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.07);
  color: #2563eb;
  font-weight: 600;
}

/* sidebar (kept mostly the same) */
.sidebar {
  width: 270px;
  max-width: 30%;
  background: linear-gradient(180deg, rgba(79, 70, 229, 0.05), rgba(236, 72, 153, 0.06));
  border-radius: 1.1rem;
  padding: 1.1rem 1rem;
  border: 1px solid rgba(129, 140, 248, 0.4);
  box-shadow: 0 14px 30px rgba(129, 140, 248, 0.25);
  position: sticky;
  top: 110px;
  max-height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
  margin-left: auto;
}

.sidebar-title {
  font-size: 1rem;
  font-weight: 600;
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
  background: #4f46e5;
  color: #f9fafb;
  box-shadow: 0 10px 24px rgba(79, 70, 229, 0.5);
}

.sidebar-movie-title {
  font-weight: 600;
  text-align: left;
}

.sidebar-rating {
  font-weight: 800;
  font-size: 0.78rem;
  color: #7e22ce;
}

.sidebar-item.active .sidebar-rating {
  color: #fde68a;
}

@media (max-width: 900px) {
  .home-inner {
    flex-direction: column;
  }

  .review-card {
    max-width: 100%;
  }

  .sidebar {
    position: static;
    width: 100%;
    max-width: 100%;
    max-height: none;
    margin-top: 1rem;
  }
}

@media (max-width: 560px) {
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
