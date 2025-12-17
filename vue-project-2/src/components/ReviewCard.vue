<template>
  <article
    class="review-card flip-card"
    :class="{ flipped: isFlipped, expanded: expandedOnMobile }"
    @click="handleCardClick"
    @keydown="handleKeydown"
    role="button"
    tabindex="0"
    :aria-pressed="isFlipped"
  >
    <div class="flip-inner">
      <div class="flip-face flip-front">
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

              <div class="top-right" @click.stop>
                <div class="global-rating">
                  <div class="global-stars">
                    <span class="star">★</span>
                    <span class="global-score">{{ formatOneDecimal(review.rating_avg) }}</span>
                    <span class="global-outof">/10</span>
                  </div>
                  <div class="global-count">{{ formatCount(review.rating_count) }} ratings</div>
                </div>

                <div class="card-actions">
                  <button
                    type="button"
                    class="expand-btn"
                    @click.stop="toggleExpanded"
                    :aria-expanded="expandedOnMobile"
                  >
                    {{ expandedOnMobile ? 'Hide' : 'More' }}
                  </button>

                  <button
                    v-if="!isEditing"
                    type="button"
                    class="icon-btn"
                    aria-label="Edit review"
                    @click.stop="startEdit"
                    :disabled="busy"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm18-11.5a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75L21 5.75z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>

                  <button
                    v-if="isEditing"
                    type="button"
                    class="icon-btn primary"
                    aria-label="Save review"
                    @click.stop="saveEdit"
                    :disabled="busy"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M17 3H5a2 2 0 0 0-2 2v14l4-4h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>

                  <button
                    v-if="isEditing"
                    type="button"
                    class="icon-btn"
                    aria-label="Cancel edit"
                    @click.stop="cancelEdit"
                    :disabled="busy"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                    </svg>
                  </button>

                  <button
                    type="button"
                    class="icon-btn danger"
                    aria-label="Delete review"
                    @click.stop="$emit('delete', review)"
                    :disabled="busy"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M6 7h12M9 7V5h6v2m-8 3v8m4-8v8m4-8v8M5 7l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        fill="none"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div class="user-row" @click.stop>
              <div class="user-rating">
                <span class="label">You rated</span>

                <div v-if="!isEditing" class="rating-line">
                  <span class="chip">
                    <svg class="chip-star" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                        fill="currentColor"
                      />
                    </svg>
                    {{ Math.round(review.user_rating ?? 0) }}/10
                  </span>

                  <span
                    v-if="review.user_rating !== null && review.user_rating !== undefined"
                    class="delta-pill"
                    :class="deltaClass(review)"
                    :title="deltaTitle(review)"
                  >
                    {{ deltaText(review) }}
                  </span>
                </div>

                <div v-else class="edit-rating-line">
                  <input
                    class="edit-rating"
                    type="number"
                    min="0"
                    max="10"
                    step="1"
                    inputmode="numeric"
                    v-model.number="editRating"
                    :disabled="busy"
                    @click.stop
                  />
                  <span class="edit-outof">/10</span>
                </div>

                <button
                  type="button"
                  class="rewatch-toggle"
                  :class="{ on: !!review.rewatch }"
                  @click.stop="$emit('toggle-rewatch', review)"
                  :disabled="busy"
                  :title="review.rewatch ? 'Marked as rewatchable' : 'Mark as rewatchable'"
                >
                  <span class="rewatch-dot" />
                  <span class="rewatch-text">{{ review.rewatch ? 'Rewatch' : 'One-time' }}</span>
                </button>

                <div class="mobile-facts">
                  <div class="mobile-fact-line" v-if="review.runtime">
                    <span class="mobile-fact-label">Runtime</span>
                    <span class="mobile-fact-value">{{ review.runtime }} min</span>
                  </div>
                  <div class="mobile-fact-line">
                    <span class="mobile-fact-label">Budget</span>
                    <span class="mobile-fact-value">
                      {{ review.budget && review.budget > 0 ? formatMoney(review.budget) : 'NA' }}
                    </span>
                  </div>
                  <div class="mobile-fact-line" v-if="review.genresText">
                    <span class="mobile-fact-label">Genres</span>
                    <span class="mobile-fact-value">{{ review.genresText }}</span>
                  </div>
                </div>
              </div>

              <div class="user-thoughts desktop-only">
                <span class="label">Your thoughts</span>

                <p v-if="!isEditing" class="thoughts-text">
                  {{ review.user_thoughts || '—' }}
                </p>

                <textarea
                  v-else
                  class="edit-thoughts"
                  rows="4"
                  v-model="editThoughts"
                  :disabled="busy"
                  @click.stop
                ></textarea>
              </div>
            </div>

            <footer class="bottom-row desktop-only" @click.stop>
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
      </div>

      <div class="flip-face flip-back">
        <div class="flip-back-inner">
          <div class="flip-back-title">Your thoughts</div>
          <div class="flip-back-movie">{{ review.title }}</div>
          <p class="flip-back-text">
            {{ review.user_thoughts || '—' }}
          </p>
          <div class="flip-back-hint">Tap to flip back</div>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, toRefs, watch } from 'vue'

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

const { review, busy } = toRefs(props)

const emit = defineEmits<{
  (e: 'delete', r: ReviewCard): void
  (e: 'toggle-rewatch', r: ReviewCard): void
  (e: 'save', payload: { movieId: number; rating: number | null; thoughts: string | null }): void
}>()

const isFlipped = ref(false)
function toggleFlip() {
  if (!isMobile.value) return
  if (isEditing.value) return
  isFlipped.value = !isFlipped.value
}

function handleCardClick(e: MouseEvent) {
  if (!isMobile.value) return

  const el = e.target as HTMLElement | null
  if (!el) return
  if (el.closest('button, a, input, textarea, select, label')) return
  toggleFlip()
}

// ✅ FIX: allow space inside textarea/input; only flip on Enter/Space when NOT focused on controls
function handleKeydown(e: KeyboardEvent) {
  if (!isMobile.value) return

  const el = e.target as HTMLElement | null
  if (el?.closest('button, a, input, textarea, select, label')) return

  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    toggleFlip()
  }
}

const isEditing = ref(false)
const editRating = ref<number | null>(review.value.user_rating ?? null)
const editThoughts = ref<string>(review.value.user_thoughts ?? '')

watch(
  () => review.value,
  (r) => {
    if (!isEditing.value) {
      editRating.value = r.user_rating ?? null
      editThoughts.value = r.user_thoughts ?? ''
    }
  },
  { deep: true },
)

function startEdit() {
  isEditing.value = true
  isFlipped.value = false
  editRating.value = review.value.user_rating ?? null
  editThoughts.value = review.value.user_thoughts ?? ''
}

function cancelEdit() {
  isEditing.value = false
  editRating.value = review.value.user_rating ?? null
  editThoughts.value = review.value.user_thoughts ?? ''
}

function saveEdit() {
  const rating =
    editRating.value === null || Number.isNaN(editRating.value)
      ? null
      : Math.round(editRating.value)
  const thoughts = editThoughts.value?.trim() ? editThoughts.value.trim() : null

  emit('save', { movieId: review.value.movieId, rating, thoughts })
  isEditing.value = false
}

const isMobile = ref(false)
const expanded = ref(false)

function measureMobile() {
  isMobile.value = window.matchMedia('(max-width: 640px)').matches
  if (!isMobile.value) {
    expanded.value = false
    isFlipped.value = false
  }
}

onMounted(() => {
  measureMobile()
  window.addEventListener('resize', measureMobile, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measureMobile)
})

const expandedOnMobile = computed(() => isMobile.value && expanded.value)

function toggleExpanded() {
  if (!isMobile.value) return
  expanded.value = !expanded.value
}

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
