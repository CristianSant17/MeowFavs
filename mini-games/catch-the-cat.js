'use strict'

const gameContainer = document.getElementById('game-container')
const startBtn = document.getElementById('startGame')
const scoreElem = document.getElementById('score')
const levelElem = document.getElementById('level')
const livesElem = document.getElementById('lives')

const API_URL = 'https://api.thecatapi.com/v1/images/search?limit=10'
let imageBuffer = []
let score = 0
let level = 1
let lives = 5
let catTimeout = null
let currentCat = null
let catTime = 2000 // tempo inicial do gato na tela

// -------------------
// FUNÇÕES DE JOGO
// -------------------
async function preloadImages() {
  try {
    const res = await fetch(API_URL)
    const data = await res.json()
    data.forEach(cat => imageBuffer.push(cat.url))
  } catch (err) {
    console.error("Erro ao carregar imagens:", err)
  }
}

function getRandomImage() {
  if (imageBuffer.length === 0) return null
  return imageBuffer.shift() // pega a primeira da fila
}

function spawnCat() {
  if (lives <= 0) return

  const imgSrc = getRandomImage()
  if (!imgSrc) return // nenhuma imagem disponível ainda

  const cat = document.createElement('img')
  cat.src = imgSrc
  cat.classList.add('cat')
  const size = 80
  const maxX = gameContainer.clientWidth - size
  const maxY = gameContainer.clientHeight - size
  cat.style.left = Math.random() * maxX + 'px'
  cat.style.top = Math.random() * maxY + 'px'
  cat.style.width = size + 'px'
  cat.style.height = size + 'px'
  cat.style.position = 'absolute'
  cat.style.cursor = 'pointer'

  cat.addEventListener('click', () => {
    score++
    updateScore()
    gameContainer.removeChild(cat)
    currentCat = null
    clearTimeout(catTimeout)
    spawnCat()
  })

  gameContainer.appendChild(cat)
  currentCat = cat

  // o gato some se não for clicado
  catTimeout = setTimeout(() => {
    if (currentCat) {
      gameContainer.removeChild(currentCat)
      currentCat = null
      lives--
      updateLives()
      if (lives <= 0) {
        endGame()
      } else {
        spawnCat()
      }
    }
  }, catTime)
}

function updateScore() {
  scoreElem.textContent = score
  // A cada 10 pontos sobe de nível
  if (score % 10 === 0) {
    level++
    updateLevel()
    // aumenta dificuldade: gato fica menos tempo
    catTime = Math.max(500, catTime - 200)
    lives++ // ganha vida a cada nível
    updateLives()
  }
}

function updateLevel() {
  levelElem.textContent = level
}

function updateLives() {
  livesElem.textContent = lives
}

function startGame() {
  score = 0
  level = 1
  lives = 5
  catTime = 2000
  updateScore()
  updateLevel()
  updateLives()
  gameContainer.innerHTML = ''
  spawnCat()
  // pré-carrega imagens em segundo plano
  if (imageBuffer.length < 5) preloadImages()
}

function endGame() {
  alert(`Game Over! Você chegou ao nível ${level} com ${score} pontos.`)
  gameContainer.innerHTML = ''
  currentCat = null
  imageBuffer = [] // limpa buffer
  preloadImages() // carrega novas imagens para o próximo jogo
}

// -------------------
// INICIALIZAÇÃO
// -------------------
startBtn.addEventListener('click', startGame)
preloadImages()
