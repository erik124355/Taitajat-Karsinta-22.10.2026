
<script setup>
import '../styles/style.css';
import { ref, computed, onMounted, onUnmounted } from 'vue';

const API_URL = 'http://localhost:3000/api/tapahtumat';

const imageModules = import.meta.glob('../images/*', {
  eager: true,
  query: '?url',
  import: 'default',
});

const logoImage = imageModules['../images/logo.svg'] || '';

const tapahtumat = ref([]);
const loading = ref(true);
const error = ref('');
const searchQuery = ref('');
const selectedCategory = ref('');
const sortOrder = ref('asc');
const activeLink = ref('etusivu');
const selectedEventId = ref(null);
const navMenuOpen = ref(false);
const favoriteEventIds = ref(loadFavoriteEventIds());

const heartOutlineImage = imageModules['../images/heart-outline.svg'];
const heartFilledImage = imageModules['../images/heart-filled.svg'];
const locationImage = imageModules['../images/location.svg'];
const peopleImage = imageModules['../images/people.svg'];
const calendarImage = imageModules['../images/calendar.svg'];
const usersImage = imageModules['../images/users.svg'];

let observer;
let requestController;

const selectedEvent = computed(() =>
  tapahtumat.value.find(
    event => String(event.id) === String(selectedEventId.value)
  ) || null
);

const categories = computed(() => {
  return [...new Set(
    tapahtumat.value
      .map(event => event.kategoria)
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, 'fi'));
});

const filteredEvents = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('fi');

  const results = tapahtumat.value.filter(event => {
    const matchesSearch = [
      event.nimi,
      event.paikkakunta,
      event.kategoria,
    ].some(value =>
      String(value ?? '').toLocaleLowerCase('fi').includes(query)
    );

    const matchesCategory =
      !selectedCategory.value ||
      event.kategoria === selectedCategory.value;

    return matchesSearch && matchesCategory;
  });

  return results.sort((a, b) => {
    const comparison = String(a.nimi ?? '').localeCompare(
      String(b.nimi ?? ''),
      'fi',
      { sensitivity: 'base' }
    );

    return sortOrder.value === 'asc' ? comparison : -comparison;
  });
});

const totalParticipants = computed(() =>
  filteredEvents.value.reduce(
    (total, event) => total + (Number(event.osallistujat) || 0),
    0
  )
);

function getEventImage(event) {
  const filename = String(event?.kuva ?? '')
    .replaceAll('\\', '/')
    .split('/')
    .pop();

  return imageModules[`../images/${filename}`] || '';
}

function loadFavoriteEventIds() {
  let storedFavorites;

  try {
    storedFavorites = window.localStorage.getItem('favoriteEventIds');
  } catch (err) {
    console.error('Failed to read favorite events from local storage.', err);
    return new Set();
  }

  if (!storedFavorites) {
    return new Set();
  }

  try {
    const favoriteIds = JSON.parse(storedFavorites);

    if (
      !Array.isArray(favoriteIds) ||
      !favoriteIds.every(eventId => typeof eventId === 'string')
    ) {
      throw new TypeError('Stored favorite event IDs must be an array of strings.');
    }

    return new Set(favoriteIds);
  } catch (err) {
    console.error('Failed to parse favorite events from local storage.', err);
    return new Set();
  }
}

function isFavorite(event) {
  return favoriteEventIds.value.has(String(event.id));
}

function toggleFavorite(event) {
  const eventId = String(event.id);
  const favorites = new Set(favoriteEventIds.value);

  if (favorites.has(eventId)) {
    favorites.delete(eventId);
  } else {
    favorites.add(eventId);
  }

  favoriteEventIds.value = favorites;

  try {
    window.localStorage.setItem(
      'favoriteEventIds',
      JSON.stringify([...favorites])
    );
  } catch (err) {
    console.error('Failed to save favorite events to local storage.', err);
  }
}

async function fetchEvents() {
  requestController?.abort();
  requestController = new AbortController();

  loading.value = true;
  error.value = '';

  const timeout = setTimeout(() => {
    requestController?.abort();
  }, 10000);

  try {
    console.log('Loading events from:', API_URL);

    const response = await fetch(API_URL, {
      signal: requestController.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('API did not return an array of events.');
    }

    tapahtumat.value = data;
    console.log(`Loaded ${data.length} events.`);

    syncFromHash();
  } catch (err) {
    console.error('Event loading failed:', err);

    if (err.name === 'AbortError') {
      error.value =
        'Tapahtumien lataus aikakatkaistiin. Tarkista backend-yhteys.';
    } else {
      error.value =
        `Tapahtumien lataaminen epäonnistui: ${err.message}`;
    }
  } finally {
    clearTimeout(timeout);
    loading.value = false;
  }
}

function syncFromHash() {
  const hash = window.location.hash;
  const queryString = hash.includes('?')
    ? hash.split('?').slice(1).join('?')
    : '';

  const params = new URLSearchParams(queryString);
  const eventId = params.get('id');

  selectedEventId.value = eventId;

  if (eventId) {
    activeLink.value = 'tapahtumat';
  }
}

function openEvent(event) {
  selectedEventId.value = event.id;
  activeLink.value = 'tapahtumat';

  window.location.hash =
    `tapahtumat?id=${encodeURIComponent(event.id)}`;

  document.getElementById('tapahtumat')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

function goBackToEvents() {
  selectedEventId.value = null;
  window.location.hash = 'tapahtumat';
}

function scrollToEvents() {
  activeLink.value = 'tapahtumat';

  document.getElementById('tapahtumat')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

function updateActiveLink() {
  if (selectedEventId.value) {
    activeLink.value = 'tapahtumat';
    return;
  }

  activeLink.value = window.scrollY < 150
    ? 'etusivu'
    : 'tapahtumat';
}

function handleHashChange() {
  syncFromHash();
}

onMounted(() => {
  fetchEvents();

  window.addEventListener('hashchange', handleHashChange);
  window.addEventListener('scroll', updateActiveLink, {
    passive: true,
  });

  const eventsSection = document.getElementById('tapahtumat');

  if (eventsSection && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          activeLink.value = 'tapahtumat';
        } else if (window.scrollY < 150) {
          activeLink.value = 'etusivu';
        }
      },
      {
        rootMargin: '-15% 0px -65% 0px',
        threshold: 0,
      }
    );

    observer.observe(eventsSection);
  }
});

onUnmounted(() => {
  requestController?.abort();
  observer?.disconnect();

  window.removeEventListener('hashchange', handleHashChange);
  window.removeEventListener('scroll', updateActiveLink);
});
</script>



<template>
  <div>
    <header v-if="!selectedEvent" class="site-header">
      <nav class="main-nav" aria-label="Päänavigaatio">
        <a href="#etusivu" class="brand" aria-label="Tapahtumakalenteri – etusivu">
          <img
            v-if="logoImage"
            :src="logoImage"
            alt="Tapahtumakalenteri"
            class="brand-logo"
          />
          <span v-else class="brand-fallback">
            <span class="brand-icon">T</span>
            Tapahtumakalenteri
          </span>
        </a>

        <button
          type="button"
          class="nav-menu-toggle"
          :aria-expanded="navMenuOpen"
          aria-controls="main-navigation-links"
          :aria-label="navMenuOpen ? 'Sulje valikko' : 'Avaa valikko'"
          @click="navMenuOpen = !navMenuOpen"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div
          id="main-navigation-links"
          class="nav-links"
          :class="{ 'nav-links-open': navMenuOpen }"
        >
          <a
            href="#etusivu"
            class="nav-link"
            :class="{ active: activeLink === 'etusivu' }"
            :aria-current="activeLink === 'etusivu' ? 'page' : undefined"
            @click="activeLink = 'etusivu'; navMenuOpen = false"
          >
            Etusivu
          </a>
          <a
            href="#tapahtumat"
            class="nav-link"
            :class="{ active: activeLink === 'tapahtumat' }"
            :aria-current="activeLink === 'tapahtumat' ? 'page' : undefined"
            @click="activeLink = 'tapahtumat'; navMenuOpen = false"
          >
            Tapahtumat
          </a>
          <a href="#suosikit" class="nav-link" @click="navMenuOpen = false">Suosikit</a>
          <a href="#yhteystiedot" class="nav-link" @click="navMenuOpen = false">Yhteystiedot</a>
        </div>
      </nav>
    </header>

    <main>
      <section v-if="!selectedEvent" id="etusivu" class="hero">
        <div class="hero-decoration hero-decoration-one"></div>
        <div class="hero-decoration hero-decoration-two"></div>

        <div class="hero-content">
          <p class="hero-eyebrow">LÖYDÄ UUSIA KOKEMUKSIA</p>
          <h1>Tapahtumakalenteri</h1>
          <p>Löydät tulevat tapahtumat ympäri Suomen</p>

          <button
            type="button"
            class="hero-button"
            @click="scrollToEvents"
          >
            Tutustu tapahtumiin <span>↓</span>
          </button>
        </div>
      </section>

      <section id="tapahtumat" class="events-section">
        <!-- Individual event page -->
        <div v-if="selectedEvent">
          <button
            type="button"
            class="back-button"
            @click="goBackToEvents"
          >
            <span>←</span> Takaisin tapahtumiin
          </button>

          <div class="event-detail-layout">
            <div class="event-detail-image-wrapper">
              <img
                v-if="getEventImage(selectedEvent)"
                :src="getEventImage(selectedEvent)"
                :alt="selectedEvent.nimi"
                class="event-detail-image"
              />
              <div v-else class="image-placeholder">
                <span class="placeholder-icon">▧</span>
                Ei kuvaa saatavilla
              </div>
            </div>

            <div class="event-detail-content">
              <span class="detail-category">
                {{ selectedEvent.kategoria }}
              </span>

              <h2>{{ selectedEvent.nimi }}</h2>

              <p class="event-detail-description">
                {{
                  selectedEvent['tarkemmat tiedot'] ||
                  'Lisätietoja ei ole saatavilla.'
                }}
              </p>

              <div class="event-detail-meta">
                <div class="event-fact">
                  <span class="detail-icon">
                    <img :src="locationImage" alt="" aria-hidden="true" />
                  </span>
                  <div class="event-fact-text">
                    <span class="event-fact-label">Paikkakunta</span>
                    <strong>{{ selectedEvent.paikkakunta }}</strong>
                  </div>
                </div>
                <div class="event-fact">
                  <span class="detail-icon people-icon">
                    <img :src="peopleImage" alt="" aria-hidden="true" />
                  </span>
                  <div class="event-fact-text">
                    <span class="event-fact-label">Osallistujia</span>
                    <strong>{{ selectedEvent.osallistujat }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Event listing -->
        <div v-else>
          <div class="section-heading">
            <p class="section-eyebrow">LÖYDÄ OMA TAPAHTUMASI</p>
            <h2 id="events-title">Tulevat tapahtumat</h2>
            <p>Inspiroidu, löydä uutta ja lähde mukaan.</p>
          </div>

          <!-- Search and filters -->
          <div class="filter-bar">
            <div class="filter-control search-control">
              <label for="event-search">Haku</label>
              <div class="search-input-wrapper">
                <span class="search-icon">⌕</span>
                <input
                  id="event-search"
                  v-model="searchQuery"
                  type="search"
                  placeholder="Hae nimellä tai paikkakunnalla..."
                />
              </div>
            </div>

            <div class="filter-control">
              <label for="category-filter">Kategoriat</label>
              <select id="category-filter" v-model="selectedCategory">
                <option value="">Kaikki kategoriat</option>
                <option
                  v-for="category in categories"
                  :key="category"
                  :value="category"
                >
                  {{ category }}
                </option>
              </select>
            </div>

            <div class="filter-control">
              <label for="sort-order">Lajittelu</label>
              <select id="sort-order" v-model="sortOrder">
                <option value="asc">A–Ö</option>
                <option value="desc">Ö–A</option>
              </select>
            </div>
          </div>

          <div class="results-summary">
            <span>
              {{ filteredEvents.length }}
              {{
                filteredEvents.length === 1
                  ? 'tapahtuma'
                  : 'tapahtumaa'
              }}
            </span>

            <button
              v-if="searchQuery || selectedCategory"
              type="button"
              class="clear-filters"
              @click="searchQuery = ''; selectedCategory = ''"
            >
              Tyhjennä suodattimet
            </button>
          </div>

          <div v-if="loading" class="message-state" role="status">
            <div class="loading-spinner"></div>
            <p>Ladataan tapahtumia...</p>
          </div>

          <div v-else-if="error" class="message-state error-state" role="alert">
            <div class="state-icon">!</div>
            <h3>Tapahtumia ei voitu ladata</h3>
            <p>{{ error }}</p>
            <button
              type="button"
              class="retry-button"
              @click="fetchEvents"
            >
              Yritä uudelleen
            </button>
          </div>

          <div
            v-else-if="filteredEvents.length === 0"
            class="message-state"
          >
            <div class="state-icon">⌕</div>
            <h3>Ei tapahtumia</h3>
            <p>Kokeile toista hakusanaa tai valitse toinen kategoria.</p>
          </div>

          <div v-else>
            <div class="events-grid">
              <article
                v-for="event in filteredEvents"
                :key="event.id"
                class="event-card"
                role="link"
                tabindex="0"
                :aria-label="`Avaa tapahtuma ${event.nimi}`"
                @click="openEvent(event)"
                @keydown.enter="openEvent(event)"
                @keydown.space.prevent="openEvent(event)"
              >
                <div class="card-image-wrapper">
                  <img
                    v-if="getEventImage(event)"
                    :src="getEventImage(event)"
                    :alt="event.nimi"
                    class="card-image"
                    loading="lazy"
                  />
                  <div v-else class="image-placeholder">
                    <span class="placeholder-icon">▧</span>
                    Ei kuvaa saatavilla
                  </div>
                  <span class="category-badge">
                    {{ event.kategoria }}
                  </span>
                  <button
                    type="button"
                    class="favorite-button"
                    :aria-label="isFavorite(event) ? 'Poista suosikeista' : 'Lisää suosikiksi'"
                    :aria-pressed="isFavorite(event)"
                    @click.stop="toggleFavorite(event)"
                    @keydown.stop
                  >
                    <img
                      :src="isFavorite(event) ? heartFilledImage : heartOutlineImage"
                      alt=""
                      aria-hidden="true"
                    />
                  </button>
                </div>

                <div class="card-content">
                  <h3>{{ event.nimi }}</h3>

                  <div class="event-details">
                    <div class="detail-row">
                      <span class="detail-icon">
                        <img :src="locationImage" alt="" aria-hidden="true" />
                      </span>
                      <span>{{ event.paikkakunta }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-icon people-icon">
                        <img :src="peopleImage" alt="" aria-hidden="true" />
                      </span>
                      <span>
                        {{ event.osallistujat }} osallistujaa
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <!-- Totals update with the active search and filters -->
            <div class="event-stats">
              <div class="stat-item">
                <div class="stat-value">
                  <img :src="calendarImage" alt="" aria-hidden="true" />
                  <strong class="stat-number">
                    {{ filteredEvents.length }}
                  </strong>
                </div>
                <span class="stat-label">Tapahtumaa yhteensä</span>
              </div>

              <div class="stat-item">
                <div class="stat-value">
                  <img :src="usersImage" alt="" aria-hidden="true" />
                  <strong class="stat-number">
                    {{ totalParticipants.toLocaleString('fi-FI') }}
                  </strong>
                </div>
                <span class="stat-label">Osallistujaa yhteensä</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer v-if="!selectedEvent" id="yhteystiedot" class="site-footer">
      <a href="#etusivu" class="footer-brand">Tapahtumakalenteri</a>
      <p>Löydä tapahtumia ympäri Suomen.</p>
      <span>© {{ new Date().getFullYear() }} Tapahtumakalenteri</span>
    </footer>

    <div id="suosikit">
      <!-- Suosikit-toiminto voidaan toteuttaa myöhemmin. -->
    </div>
  </div>
</template>
