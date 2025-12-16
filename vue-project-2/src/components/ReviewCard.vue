<template>
  <article class="review-card" :class="{ expanded: expandedOnMobile }">
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
                @click.stop="startEdit"
                :disabled="busy"
              >
                Edit
              </button>

              <button v-else type="button" class="icon-btn" @click.stop="cancelEdit" :disabled="busy">
                Cancel
              </button>

              <button
                v-if="isEditing"
                type="button"
                class="icon-btn primary"
                @click.stop="saveEdit"
                :disabled="busy"
              >
                Save
              </button>

              <button
                type="button"
                class="icon-btn danger"
                @click.stop="$emit('delete', review)"
                :disabled="busy"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        <div class="user-row" @click.stop>
          <div class="user-rating">
            <span class="label">You rated</span>

            <div v-if="!isEditing" class="rating-line">
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
            ></textarea>
          </div>
        </div>

        <div class="mobile-details" v-show="expandedOnMobile" @click.stop>
          <div class="user-thoughts">
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
            ></textarea>
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

// ----- inline edit state -----
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
    editRating.value === null || Number.isNaN(editRating.value) ? null : Math.round(editRating.value)
  const thoughts = editThoughts.value?.trim() ? editThoughts.value.trim() : null

  emit('save', { movieId: review.value.movieId, rating, thoughts })
  isEditing.value = false
}

const isMobile = ref(false)
const expanded = ref(false)

function measureMobile() {
  isMobile.value = window.matchMedia('(max-width: 640px)').matches
  if (!isMobile.value) expanded.value = false
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
