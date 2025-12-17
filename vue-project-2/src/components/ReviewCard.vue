<template>
  <article
    class="review-card flip-card"
    :class="{ flipped: isFlipped, expanded: expandedOnMobile }"
    @click="handleCardClick"
    role="button"
    tabindex="0"
    :aria-pressed="isFlipped"
    @keydown="handleCardKeydown"
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

                <div class="card-actions" v-if="!isMobile || isFlipped">
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
                    @click.stop="startEdit"
                    :disabled="busy"
                    aria-label="Edit review"
                    title="Edit"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path
                        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.83H5v-.92l9.06-9.06.92.92L5.92 20.08zM20.71 7.04a1.003 1.003 0 0 0 0-1.42L18.37 3.29a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z"
                      />
                    </svg>
                  </button>

                  <button
                    v-if="isEditing"
                    type="button"
                    class="icon-btn primary"
                    @click.stop="saveEdit"
                    :disabled="busy"
                    aria-label="Save"
                    title="Save"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </button>

                  <button
                    v-if="isEditing"
                    type="button"
                    class="icon-btn"
                    @click.stop="cancelEdit"
                    :disabled="busy"
                    aria-label="Cancel"
                    title="Cancel"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path
                        d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L12 13.41l-6.29 6.3-1.42-1.41L10.59 12 4.29 5.71 5.7 4.29 12 10.59l6.29-6.3z"
                      />
                    </svg>
                  </button>

                  <button
                    type="button"
                    class="icon-btn danger"
                    @click.stop="$emit('delete', review)"
                    :disabled="busy"
                    aria-label="Delete review"
                    title="Delete"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z" />
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
                    <svg
                      class="chip-star"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                      />
                    </svg>

                    {{ formatUserRating(review.user_rating) }}/10
                  </span>

                  <span
                    v-if="review.user_rating !== null && review.user_rating !== undefined"
                    class="delta-pill"
                    :class="deltaClass(review)"
                    :title="deltaTitle(review)"
                  >
                    {{ deltaText(review) }}
                  </span>

                  <button
                    v-if="isMobile"
                    type="button"
                    class="rewatch-toggle inline"
                    :class="{ on: !!review.rewatch }"
                    @click.stop="$emit('toggle-rewatch', review)"
                    :disabled="busy"
                    :title="review.rewatch ? 'Marked as rewatchable' : 'Mark as rewatchable'"
                  >
                    <span class="rewatch-dot" />
                    <span class="rewatch-text">{{ review.rewatch ? 'Rewatch' : 'One-time' }}</span>
                  </button>
                </div>

                <div v-else class="edit-rating-line">
                  <input
                    class="edit-rating"
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    inputmode="decimal"
                    v-model.number="editRating"
                    :disabled="busy"
                    @click.stop
                  />
                  <span class="edit-outof">/10</span>
                </div>

                <button
                  v-if="!isMobile"
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
        <div class="flip-back-inner" @click.stop>
          <div class="flip-back-top">
            <div class="flip-back-title">Your thoughts</div>

            <div class="flip-back-actions" v-if="isMobile">
              <button
                v-if="!isEditing"
                type="button"
                class="icon-btn"
                @click.stop="startEditFromBack"
                :disabled="busy"
                aria-label="Edit"
                title="Edit"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path
                    d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.83H5v-.92l9.06-9.06.92.92L5.92 20.08zM20.71 7.04a1.003 1.003 0 0 0 0-1.42L18.37 3.29a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z"
                  />
                </svg>
              </button>

              <button
                v-if="isEditing"
                type="button"
                class="icon-btn primary"
                @click.stop="saveEdit"
                :disabled="busy"
                aria-label="Save"
                title="Save"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </button>

              <button
                v-if="isEditing"
                type="button"
                class="icon-btn"
                @click.stop="cancelEdit"
                :disabled="busy"
                aria-label="Cancel"
                title="Cancel"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path
                    d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L12 13.41l-6.29 6.3-1.42-1.41L10.59 12 4.29 5.71 5.7 4.29 12 10.59l6.29-6.3z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div class="flip-back-movie">{{ review.title }}</div>

          <div v-if="isMobile && isEditing" class="flip-back-form">
            <div class="flip-back-field">
              <div class="flip-back-label">Rating</div>
              <div class="flip-back-rating">
                <input
                  class="flip-back-input"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  inputmode="decimal"
                  v-model.number="editRating"
                  :disabled="busy"
                />
                <span class="flip-back-outof">/10</span>
              </div>
            </div>

            <div class="flip-back-field">
              <div class="flip-back-label">Thoughts</div>
              <textarea
                class="flip-back-textarea"
                rows="5"
                v-model="editThoughts"
                :disabled="busy"
              />
            </div>
          </div>

          <p v-else class="flip-back-text">
            {{ review.user_thoughts || '—' }}
          </p>

          <div class="flip-back-hint" v-if="isMobile && !isEditing">Tap to flip back</div>
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

const isMobile = ref(false)
const expanded = ref(false)
const isFlipped = ref(false)

function measureMobile() {
  isMobile.value = window.matchMedia('(max-width: 640px)').matches
  if (!isMobile.value) {
    expanded.value = false
    isFlipped.value = false
    isEditing.value = false
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

function toggleFlip() {
  if (!isMobile.value) return
  if (busy?.value) return
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

function handleCardKeydown(e: KeyboardEvent) {
  if (!isMobile.value) return

  const target = e.target as HTMLElement | null
  if (!target) return

  if (target.closest('input, textarea, select, button, a, label')) return

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
  if (busy?.value) return
  isEditing.value = true
  isFlipped.value = false
  editRating.value = review.value.user_rating ?? null
  editThoughts.value = review.value.user_thoughts ?? ''
}

function startEditFromBack() {
  if (!isMobile.value) return
  if (busy?.value) return
  isEditing.value = true
  isFlipped.value = true
  editRating.value = review.value.user_rating ?? null
  editThoughts.value = review.value.user_thoughts ?? ''
}

function cancelEdit() {
  if (busy?.value) return
  isEditing.value = false
  editRating.value = review.value.user_rating ?? null
  editThoughts.value = review.value.user_thoughts ?? ''
}

/** ✅ UPDATED: do NOT round, keep decimals (0.5 etc) */
function saveEdit() {
  if (busy?.value) return

  const r = editRating.value
  const rating = r === null || r === undefined || Number.isNaN(r) ? null : Math.round(r * 10) / 10

  const thoughts = editThoughts.value?.trim() ? editThoughts.value.trim() : null

  emit('save', { movieId: review.value.movieId, rating, thoughts })
  isEditing.value = false
}

function formatOneDecimal(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return n.toFixed(1)
}

function formatUserRating(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  const v = Math.round(n * 10) / 10
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
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
  return Intl.NumberFormat('en-US', {
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
  return `You (${formatUserRating(r.user_rating)}) vs TMDB (${formatOneDecimal(r.rating_avg)})`
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
