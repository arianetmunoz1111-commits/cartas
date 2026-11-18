
    const $board = document.querySelector('.board')
    const $moves = document.querySelector('#moves')
    const $pairs = document.querySelector('#pairs')
    const $time = document.querySelector('#time')
    const $best = document.querySelector('#best')
    const $restart = document.querySelector('.restart')
    const $difficultyButtons = document.querySelectorAll('.difficulty button')
    const $dialog = document.querySelector('dialog')
    const $dialogText = $dialog.querySelector('p')

    const EMOJIS = [
      '💻', '🐱', '🦊', '🐼', '👁️', '🐵', '🌷', '🐯', '💙',
      '🌸', '🐙', '🧠', '✨', '🦋', '👀', '🔥', '😎', '🐧'
    ]
    const MISMATCH_DELAY = 900 
    const BEST_KEY = 'memory-best'

    let size = 4
    let firstCard = null
    let secondCard = null
    let isBoardLocked = false
    let moves = 0
    let matchedPairs = 0
    let startTime = 0
    let timerId = null
    let mismatchTimeoutId = null
    let winTimeoutId = null

    
    function shuffle(array) {
      const result = [...array]

      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = result[i]
        result[i] = result[j]
        result[j] = temp
      }

      return result
    }

    function createDeck(pairs) {
      const chosen = shuffle(EMOJIS).slice(0, pairs)
      return shuffle([...chosen, ...chosen])
    }

    function createCard(emoji) {
      const $card = document.createElement('button')
      $card.className = 'card'
      $card.dataset.emoji = emoji
      $card.setAttribute('aria-label', 'Carta boca abajo')
      $card.innerHTML = `
        <div class="card-inner">
          <div class="face face-back">?</div>
          <div class="face face-front">${emoji}</div>
        </div>
      `
      return $card
    }

    function startGame() {
      clearTimeout(mismatchTimeoutId)
      clearTimeout(winTimeoutId)
      stopTimer()

      firstCard = null
      secondCard = null
      isBoardLocked = false
      moves = 0
      matchedPairs = 0
      startTime = 0

      const pairs = (size * size) / 2
      const deck = createDeck(pairs)

      $board.style.setProperty('--cols', size)
      $board.style.setProperty('--card-font', size === 4 ? 'clamp(28px, 8vw, 56px)' : 'clamp(20px, 5vw, 38px)')
      $board.replaceChildren(...deck.map(createCard))

      updateStats()
      $time.textContent = '00:00'
    }

    function flipCard($card) {
      if (isBoardLocked) return
      if ($card === firstCard) return
      if ($card.classList.contains('is-matched')) return

      if (!startTime) startTimer()

      $card.classList.add('is-flipped')
      $card.setAttribute('aria-label', `Carta ${$card.dataset.emoji}`)

      if (!firstCard) {
        firstCard = $card
        return
      }

      secondCard = $card
      moves++
      checkForMatch()
    }

    function checkForMatch() {
      const isMatch = firstCard.dataset.emoji === secondCard.dataset.emoji

      if (isMatch) {
        firstCard.classList.add('is-matched')
        secondCard.classList.add('is-matched')
        firstCard.disabled = true
        secondCard.disabled = true
        matchedPairs++
        resetTurn()
        updateStats()

        if (matchedPairs === (size * size) / 2) win()
        return
      }

    
      isBoardLocked = true
      firstCard.classList.add('is-wrong')
      secondCard.classList.add('is-wrong')
      updateStats()

      mismatchTimeoutId = setTimeout(() => {
        for (const $card of [firstCard, secondCard]) {
          $card.classList.remove('is-flipped', 'is-wrong')
          $card.setAttribute('aria-label', 'Carta boca abajo')
        }
        resetTurn()
      }, MISMATCH_DELAY)
    }

    function resetTurn() {
      firstCard = null
      secondCard = null
      isBoardLocked = false
    }

    
    function startTimer() {
      startTime = Date.now()
      timerId = setInterval(renderTime, 250)
    }

    function stopTimer() {
      clearInterval(timerId)
      timerId = null
    }

    function getElapsedSeconds() {
      return startTime ? Math.floor((Date.now() - startTime) / 1000) : 0
    }

    function formatTime(totalSeconds) {
      const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
      const seconds = String(totalSeconds % 60).padStart(2, '0')
      return `${minutes}:${seconds}`
    }

    function renderTime() {
      $time.textContent = formatTime(getElapsedSeconds())
    }

    function updateStats() {
      $moves.textContent = moves
      $pairs.textContent = `${matchedPairs}/${(size * size) / 2}`
      const best = readBest()[size]
      $best.textContent = best ? `${best.moves} mov.` : '—'
    }


    function readBest() {
      try {
        return JSON.parse(localStorage.getItem(BEST_KEY)) ?? {}
      } catch {
        return {}
      }
    }

    function saveBest(result) {
      const best = readBest()
      const previous = best[size]
      const isBetter = !previous ||
        result.moves < previous.moves ||
        (result.moves === previous.moves && result.seconds < previous.seconds)

      if (!isBetter) return false

      best[size] = result
      try {
        localStorage.setItem(BEST_KEY, JSON.stringify(best))
      } catch {
       
      }
      return true
    }

    function win() {
      stopTimer()
      renderTime()

      const seconds = getElapsedSeconds()
      const isRecord = saveBest({ moves, seconds })
      updateStats()

      $dialogText.innerHTML = `
        Has encontrado todas las parejas en <strong>${moves} movimientos</strong>
        y <strong>${formatTime(seconds)}</strong>.
        ${isRecord ? '<br>🏆 ¡Nuevo récord!' : ''}
      `
      
      winTimeoutId = setTimeout(() => $dialog.showModal(), 700)
    }

   
    $board.addEventListener('click', (event) => {
      const $card = event.target.closest('.card')
      if ($card) flipCard($card)
    })

    $difficultyButtons.forEach(($button) => {
      $button.addEventListener('click', () => {
        size = Number($button.dataset.size)
        $difficultyButtons.forEach(($b) => $b.setAttribute('aria-pressed', String($b === $button)))
        startGame()
      })
    })

    $restart.addEventListener('click', startGame)

    $dialog.addEventListener('close', startGame)

    startGame()
