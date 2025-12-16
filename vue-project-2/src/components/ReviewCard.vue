<template>
  <article class="review-card">
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
        <div class="top-row">
          <div class="title-block">
            <h3 class="movie-title">{{ review.title }}</h3>
            <p v-if="review.tagline" class="movie-tagline">{{ review.tagline }}</p>
          </div>

          <div class="top-right">
            <div class="global-rating">
              <div class="global-stars">
                <span class="star">★</span>
                <span class="global-score">{{ formatOneDecimal(review.rating_avg) }}</span>
                <span class="global-outof">/10</span>
              </div>
              <div class="global-count">{{ formatCount(review.rating_count) }} ratings</div>
            </div>

            <div class="card-actions">
              <button type="button" class="icon-btn" @click="$emit('edit', review)" :disabled="busy">
                Edit
              </button>
              <button
                type="button"
                class="icon-btn danger"
                @click="$emit('delete', review)"
                :disabled="busy"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

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
              @click="$emit('toggle-rewatch', review)"
              :disabled="busy"
              :title="review.rewatch ? 'Marked as rewatchable' : 'Mark as rewatchable'"
            >
              <span class="rewatch-dot" />
              <span class="rewatch-text">{{ review.rewatch ? 'Rewatch' : 'One-time' }}</span>
            </button>
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

            <span v-if="review.genresText" class="fact-pill genres-pill" :title="review.genresText">
              {{ review.genresText }}
            </span>
          </div>
        </footer>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
type ReviewCard = {
  movieId: number
  title: string
  tagline: string | null
  release_date: string
  runtime: number | null
  rating_avg: number
  rating_count: number
  budget: number | null
  genresText: string
  user_rating: number | null
  user_thoughts: string | null
  rewatch?: boolean | null
  posterUrl?: string | null
}

const props = defineProps<{
  review: ReviewCard
  busy?: boolean
}>()

defineEmits<{
  (e: 'edit', r: ReviewCard): void
  (e: 'delete', r: ReviewCard): void
  (e: 'toggle-rewatch', r: ReviewCard): void
}>()

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
</script>

<style scoped src="@/styles/reviewCard.css"></style>

