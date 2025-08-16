'use strict'

// ---------------------------
// ELEMENTOS
// ---------------------------
const gallery = document.getElementById('gallery')
const API_URL = 'https://api.thecatapi.com/v1/images/search?limit=20'
const loadingElem = document.getElementById('loading')
const header = document.getElementById('mainHeader')
const modal = document.getElementById('modal')
const modalImage = document.getElementById('modalImage')
const modalClose = document.getElementById('modalClose')
const saveImageBtn = document.getElementById('saveImage')
const favoriteImageBtn = document.getElementById('favoriteImage')
const favoriteCount = document.getElementById('favoriteCount')
const backToTop = document.getElementById('backToTop')
const topToBack = document.getElementById('topToBack')

let loading = false
let scrollAnimation = null
let scrollingDirection = null
let currentImageUrl = null

// ---------------------------
// FAVORITOS LOCALSTORAGE
// ---------------------------
function getFavorites() {
  return JSON.parse(localStorage.getItem('favorites') || '[]')
}

function saveFavorites(favs) {
  localStorage.setItem('favorites', JSON.stringify(favs))
  updateFavoriteCount()
}

function addFavorite(url) {
  const favs = getFavorites()
  if (!favs.includes(url)) {
    favs.push(url)
    saveFavorites(favs)
  }
}

function removeFavorite(url) {
  let favs = getFavorites()
  favs = favs.filter(f => f !== url)
  saveFavorites(favs)
}

function toggleFavorite(url) {
  const favs = getFavorites()
  if (favs.includes(url)) {
    removeFavorite(url)
    return false
  } else {
    addFavorite(url)
    return true
  }
}

function updateFavoriteCount() {
  const favs = getFavorites()
  favoriteCount.textContent = `${favs.length} ⭐`
}

// ---------------------------
// MODAL
// ---------------------------
function openModal(url) {
  currentImageUrl = url
  modalImage.src = url
  modal.classList.add('show')
  updateModalFavoriteButton()
}

function closeModal() {
  modal.classList.remove('show')
}

function updateModalFavoriteButton() {
  const favs = getFavorites()
  favoriteImageBtn.textContent = favs.includes(currentImageUrl) ? '❌ Remover favorito' : '⭐ Favoritar'
}

// Clique no botão do modal
favoriteImageBtn.addEventListener('click', () => {
  if (!currentImageUrl) return
  const isFav = toggleFavorite(currentImageUrl)

  // Atualiza o texto do botão
  updateModalFavoriteButton()

  // Só anima se for favoritar
  if (isFav) animateStar('⭐', modalImage)

  // Atualiza o card correspondente na galeria
  updateCardFavoriteIcon(currentImageUrl)
})

// ---------------------------
// CRIAR CARD
// ---------------------------
function createCard(url) {
  const card = document.createElement('div')
  card.classList.add('card', 'fade-in')

  const img = document.createElement('img')
  img.src = url
  img.alt = "Gatinho fofo"
  img.addEventListener('click', () => openModal(url))

  const favIcon = document.createElement('span')
  favIcon.classList.add('favorite-icon')
  if (getFavorites().includes(url)) {
    favIcon.textContent = '⭐'
    favIcon.classList.add('active')
  } else {
    favIcon.textContent = '☆'
    favIcon.classList.remove('active')
  }

  favIcon.addEventListener('click', e => {
    e.stopPropagation()
    const isFav = toggleFavorite(url)
    favIcon.textContent = isFav ? '⭐' : '☆'
    favIcon.classList.toggle('active', isFav)
    animateStar(isFav ? '⭐' : '❌', card)
  })

  card.appendChild(favIcon)

  const actions = document.createElement('div')
  actions.classList.add('actions')
  const openBtn = document.createElement('button')
  openBtn.textContent = '🔍 Ver'
  openBtn.addEventListener('click', () => openModal(url))
  actions.appendChild(openBtn)

  card.appendChild(img)
  card.appendChild(actions)
  gallery.appendChild(card)
}

function updateCardFavoriteIcon(url) {
  const cards = gallery.querySelectorAll('.card')
  cards.forEach(card => {
    const img = card.querySelector('img')
    const favIcon = card.querySelector('.favorite-icon')
    if (img && img.src === url && favIcon) {
      const isFav = getFavorites().includes(url)
      favIcon.textContent = isFav ? '⭐' : '☆'
      favIcon.classList.toggle('active', isFav)
    }
  })
}

// ---------------------------
// CARREGAR GALERIA
// ---------------------------
async function loadGallery() {
  if (loading) return
  loading = true
  loadingElem.style.display = 'block'

  try {
    const res = await fetch(API_URL)
    const data = await res.json()
    data.forEach(cat => createCard(cat.url))
  } catch (err) {
    console.error("Erro ao carregar imagens:", err)
  } finally {
    loading = false
    loadingElem.style.display = 'none'
  }
}

// ---------------------------
// SALVAR IMAGEM (ou abrir em nova aba)
// ---------------------------
async function saveImage(url) {
  try {
    // Tenta baixar a imagem automaticamente
    const res = await fetch(url)
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'gatinho-' + Date.now() + '.jpg'

    // Tenta disparar o download
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(a.href)
  } catch (err) {
    console.warn("Não foi possível baixar automaticamente, abrindo em nova aba...", err)
    // Se falhar, abre em nova aba para o usuário salvar manualmente
    window.open(url, '_blank')
  }
}

// ---------------------------
// ANIMAÇÃO DE ESTRELA
// ---------------------------
function animateStar(type = '⭐', targetElement = modal) {
  const star = document.createElement('div')
  star.classList.add('flying-star')
  star.innerHTML = type
  star.style.fontSize = '2rem'
  star.style.position = 'fixed'
  star.style.zIndex = 9999
  star.style.pointerEvents = 'none'
  star.style.transition = 'transform 0.5s ease, opacity 0.5s ease'
  document.body.appendChild(star)

  const rect = targetElement.getBoundingClientRect()
  star.style.left = rect.left + rect.width/2 - 20 + 'px'
  star.style.top = rect.top + rect.height/2 - 20 + 'px'

  setTimeout(() => {
    star.style.transform = 'translateY(-200px) scale(5)'
    star.style.opacity = '0'
  }, 50)

  setTimeout(() => star.remove(), 550)
}

// ---------------------------
// SCROLL INFINITO
// ---------------------------
function startScroll(direction) {
  if (scrollingDirection === direction) return
  stopScroll()
  scrollingDirection = direction

  function step() {
    if (direction === 'up' && window.scrollY > 0) {
      window.scrollBy({ top: -5, behavior: 'auto' })
      scrollAnimation = requestAnimationFrame(step)
    } else if (direction === 'down' && window.innerHeight + window.scrollY < document.body.scrollHeight) {
      window.scrollBy({ top: 2, behavior: 'auto' })
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 200) loadGallery()
      scrollAnimation = requestAnimationFrame(step)
    } else stopScroll()
  }
  step()
}

function stopScroll() {
  scrollingDirection = null
  if (scrollAnimation) cancelAnimationFrame(scrollAnimation)
}

// ---------------------------
// EVENTOS
// ---------------------------
modalClose.addEventListener('click', closeModal)
modal.addEventListener('click', e => { if (e.target === modal) closeModal() })
saveImageBtn.addEventListener('click', () => { if (currentImageUrl) saveImage(currentImageUrl) })

// Scroll buttons
backToTop.addEventListener('click', () => scrollingDirection==='up'? stopScroll() : startScroll('up'))
topToBack.addEventListener('click', () => scrollingDirection==='down'? stopScroll() : startScroll('down'))

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) header.classList.add('shrink')
  else header.classList.remove('shrink')

  if (window.scrollY > 100) backToTop.classList.add('show'), topToBack.classList.add('show')
  else backToTop.classList.remove('show'), topToBack.classList.remove('show')

  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) loadGallery()
})

// ---------------------------
// TOGGLE DE TEMA
// ---------------------------
const themeToggleBtn = document.getElementById('themeToggle');

// Pega o tema salvo ou define padrão
let currentTheme = localStorage.getItem('theme') || 'light-theme';
document.body.classList.add(currentTheme);
updateThemeButton();

themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  document.body.classList.toggle('dark-theme');
  
  currentTheme = document.body.classList.contains('dark-theme') ? 'dark-theme' : 'light-theme';
  localStorage.setItem('theme', currentTheme);
  
  updateThemeButton();
});

function updateThemeButton() {
  themeToggleBtn.textContent = currentTheme === 'dark-theme' ? '☀️' : '🌙';
}

// ---------------------------
// RESPONSIVIDADE DO MENU 
// ---------------------------
const hamburgerBtn = document.getElementById('hamburgerBtn');
const headerActions = document.querySelector('.header-actions');

hamburgerBtn.addEventListener('click', () => {
  headerActions.classList.toggle('open');
  // animação simples do hamburguer
  hamburgerBtn.classList.toggle('active');
});

// ---------------------------
// INIT
// ---------------------------
updateFavoriteCount()
loadGallery()
