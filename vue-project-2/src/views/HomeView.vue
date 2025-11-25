<script setup lang="ts">
import { movieCollection } from '@/movies';

</script>

<template>
  <div class="home-page">
    <div class="home-inner">
      <section class="cards-column">
        <h2 class="section-title">Your Reviews</h2>
        <p class="section-subtitle">Scroll through the movies you&apos;ve logged.</p>

        <div class="cards-list">
          <article
            v-for="(review, index) in reviews"
            :key="review.id"
            :ref="(el) => (cardRefs[index] = el)"
            class="review-card"
          >
            <div class="card-inner">
              <div class="poster-wrapper">
                <img :src="review.posterUrl" :alt="`${review.title} poster`" class="poster-img" />
              </div>

              <div class="card-content">
                <header class="review-header">
                  <div>
                    <h3 class="movie-title">{{ review.title }}</h3>
                    <div class="meta-row">
                      <span class="rating-chip">⭐ {{ review.rating.toFixed(1) }}/10</span>
                      <span class="meta-item">{{ review.date }}</span>
                      <span class="meta-item">Where: {{ review.watchedWhere }}</span>
                    </div>
                  </div>
                </header>

                <p class="review-body">{{ review.commentary }}</p>

                <footer class="tag-row">
                  <span v-for="tag in review.tags" :key="tag" class="tag-pill">{{ tag }}</span>
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
            :key="review.id"
            :ref="(el) => (sidebarItemRefs[index] = el)"
            class="sidebar-item"
            :class="{ active: review.id === activeReviewId }"
            @click="scrollToReview(review.id)"
          >
            <span class="sidebar-movie-title">{{ review.title }}</span>
            <span class="sidebar-rating">{{ review.rating.toFixed(1) }}/10</span>
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const reviews = ref([
  {
    id: 'dune2',
    title: 'Dune: Part Two',
    rating: 9.1,
    date: 'Nov 12, 2025',
    watchedWhere: 'Theater',
    commentary:
      'Huge, dense, and surprisingly emotional. Sound design + visuals are insane. Paul’s arc feels way darker than in Part One.',
    tags: ['Sci-Fi', 'Epic', 'Rewatch-worthy'],
    posterUrl: 'https://i.ebayimg.com/images/g/epwAAOSwmutlsW7j/s-l1200.jpg',
  },
  {
    id: 'spiderverse2',
    title: 'Spider-Man: Across the Spider-Verse',
    rating: 9.5,
    date: 'Oct 03, 2025',
    watchedWhere: 'Home',
    commentary:
      'Every frame looks like a poster. Loved how the animation style changes with each universe. Ending cliffhanger still hurts.',
    tags: ['Animation', 'Superhero', 'Visual Feast'],
    posterUrl: 'https://m.media-amazon.com/images/I/71q1TyEFjpL.jpg',
  },
  {
    id: 'oppenheimer',
    title: 'Oppenheimer',
    rating: 8.8,
    date: 'Sep 15, 2025',
    watchedWhere: 'IMAX',
    commentary:
      'Very talky but never boring. Soundtrack is relentless and the final hour feels like a courtroom thriller more than a biopic.',
    tags: ['Drama', 'History', 'Long but worth it'],
    posterUrl: 'https://m.media-amazon.com/images/I/71qu4p5bnDL._AC_UF894,1000_QL80_.jpg',
  },
  {
    id: 'pastlives',
    title: 'Past Lives',
    rating: 9.0,
    date: 'Aug 28, 2025',
    watchedWhere: 'Home',
    commentary:
      'Quiet, slow, and devastating. Feels like remembering a dream you almost forgot. Minimal plot, maximum feelings.',
    tags: ['Romance', 'Indie', 'Slow Burn'],
    posterUrl: 'https://m.media-amazon.com/images/I/512c8UEHX6L._AC_UF1000,1000_QL80_.jpg',
  },
  {
    id: 'barbie',
    title: 'Barbie',
    rating: 8.2,
    date: 'Jul 10, 2025',
    watchedWhere: 'Theater',
    commentary:
      'Way funnier and stranger than I expected. Production design is ridiculous. Ken absolutely steals the third act.',
    tags: ['Comedy', 'Meta', 'Vibes'],
    posterUrl: 'https://i.ebayimg.com/images/g/2NUAAOSw0LVkligx/s-l1200.jpg',
  },
])

const cardRefs = ref([])
const sidebarItemRefs = ref([])
const activeReviewId = ref(reviews.value[0]?.id ?? null)
const navOffset = ref(90)
const isJumping = ref(false)

const measureNavHeight = () => {
  const nav =
    document.querySelector('nav') ||
    document.querySelector('header') ||
    document.querySelector('.navbar')

  if (nav) {
    navOffset.value = nav.getBoundingClientRect().height
  }
}

const scrollToReview = (id) => {
  const index = reviews.value.findIndex((r) => r.id === id)
  if (index === -1) return

  const el = cardRefs.value[index]
  if (!el || !el.scrollIntoView) return

  activeReviewId.value = id
  isJumping.value = true

  el.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })

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
    const cardTopRelative = rect.top - offset
    const dist = Math.abs(cardTopRelative)

    if (dist < minDist) {
      minDist = dist
      closestIndex = index
      closestId = reviews.value[index].id
    }
  })

  if (closestIndex !== -1) {
    activeReviewId.value = closestId
    const sideEl = sidebarItemRefs.value[closestIndex]
    if (sideEl && sideEl.scrollIntoView) {
      sideEl.scrollIntoView({ block: 'nearest' })
    }
  }
}

onMounted(() => {
  measureNavHeight()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
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
  gap: 1.25rem;
}

.review-card {
  background: #ffffff;
  border-radius: 1.2rem;
  padding: 0.9rem 1.1rem;
  box-shadow: 0 14px 35px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.25);
  max-width: 880px;
  margin-right: auto;
  min-height: 190px;
  overflow: hidden;
  scroll-margin-top: 200px;
}

.card-inner {
  display: flex;
  gap: 1rem;
}

.poster-wrapper {
  flex: 0 0 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.poster-img {
  width: 150px;
  height: 210px;
  border-radius: 0.9rem;
  object-fit: cover;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.4);
}

.card-content {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
}

.review-header {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.4rem;
}

.movie-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: #6b7280;
}

.rating-chip {
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #f97316, #facc15);
  color: #111827;
  font-weight: 600;
}

.meta-item {
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.15);
}

.review-body {
  margin: 0.35rem 0 0.7rem;
  font-size: 0.96rem;
  line-height: 1.5;
  color: #374151;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: auto;
}

.tag-pill {
  font-size: 0.75rem;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.07);
  color: #2563eb;
}

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

.sidebar-list::-webkit-scrollbar {
  width: 6px;
}
.sidebar-list::-webkit-scrollbar-track {
  background: transparent;
}
.sidebar-list::-webkit-scrollbar-thumb {
  background: rgba(15, 23, 42, 0.2);
  border-radius: 999px;
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

.sidebar-item.active .sidebar-rating {
  color: #fde68a;
}

.sidebar-movie-title {
  font-weight: 500;
  text-align: left;
}

.sidebar-rating {
  font-weight: 600;
  font-size: 0.75rem;
  color: #7e22ce;
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

  .poster-wrapper {
    flex: 0 0 120px;
  }

  .poster-img {
    width: 120px;
    height: 180px;
  }
}
</style>
