class MemoryGame {
    constructor() {
        this.gameArea = document.getElementById('gameArea');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.victoryScreen = document.getElementById('victoryScreen');
        this.finalScreen = document.getElementById('finalScreen');
        this.pairsElement = document.getElementById('pairs');
        this.timerElement = document.getElementById('timer');
        this.movesElement = document.getElementById('moves');
        this.memoryBoard = document.getElementById('memoryBoard');
        this.muteBtn = document.getElementById('muteBtn');
        
        this.gameRunning = false;
        this.pairs = 0;
        this.moves = 0;
        this.timeElapsed = 0;
        this.isMuted = false;
        this.maxPairs = 8;
        
        this.cards = [];
        this.flippedCards = [];
        this.matchedCards = [];
        this.gameTimer = null;
        
        this.audioContext = null;
        
        // Símbolos para as cartas
        this.symbols = ['💕', '💖', '💗', '💘', '💝', '💞', '💟', '💌', '💕', '💖', '💗', '💘', '💝', '💞', '💟', '💌'];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateDisplay();
        this.initSounds();
    }
    
    initSounds() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API não suportada');
        }
    }
    
    playSound(frequency, duration, type = 'sine') {
        if (this.isMuted || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('yesBtn').addEventListener('click', () => this.acceptProposal());
        document.getElementById('noBtn').addEventListener('click', () => this.rejectProposal());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.restartGame());
        this.muteBtn.addEventListener('click', () => this.toggleMute());
    }
    
    startGame() {
        this.startScreen.style.display = 'none';
        this.gameArea.style.display = 'block';
        this.gameRunning = true;
        this.pairs = 0;
        this.moves = 0;
        this.timeElapsed = 0;
        this.flippedCards = [];
        this.matchedCards = [];
        
        this.createCards();
        this.updateDisplay();
        this.startTimer();
        this.playSound(440, 0.2);
    }
    
    createCards() {
        this.memoryBoard.innerHTML = '';
        this.cards = [];
        
        // Embaralhar os símbolos
        const shuffledSymbols = [...this.symbols].sort(() => Math.random() - 0.5);
        
        // Criar as cartas
        for (let i = 0; i < 16; i++) {
            const card = {
                id: i,
                symbol: shuffledSymbols[i],
                isFlipped: false,
                isMatched: false,
                element: null
            };
            
            this.cards.push(card);
            this.createCardElement(card);
        }
    }
    
    createCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.className = 'memory-card';
        cardElement.dataset.cardId = card.id;
        cardElement.innerHTML = '?';
        
        cardElement.addEventListener('click', () => this.flipCard(card.id));
        
        card.element = cardElement;
        this.memoryBoard.appendChild(cardElement);
    }
    
    flipCard(cardId) {
        if (!this.gameRunning) return;
        
        const card = this.cards.find(c => c.id === cardId);
        
        if (!card || card.isFlipped || card.isMatched || this.flippedCards.length >= 2) {
            return;
        }
        
        // Virar a carta
        card.isFlipped = true;
        this.flippedCards.push(card);
        card.element.classList.add('flipped');
        card.element.innerHTML = card.symbol;
        
        this.playSound(523, 0.1);
        
        // Verificar se virou 2 cartas
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateDisplay();
            this.checkMatch();
        }
    }
    
    checkMatch() {
        const [card1, card2] = this.flippedCards;
        
        if (card1.symbol === card2.symbol) {
            // Par encontrado!
            card1.isMatched = true;
            card2.isMatched = true;
            this.matchedCards.push(card1, card2);
            
            card1.element.classList.add('matched');
            card2.element.classList.add('matched');
            
            this.pairs++;
            this.updateDisplay();
            this.playSound(659, 0.2);
            
            // Verificar vitória
            if (this.pairs === this.maxPairs) {
                setTimeout(() => this.winGame(), 500);
            }
        } else {
            // Par errado
            card1.element.classList.add('wrong');
            card2.element.classList.add('wrong');
            this.playSound(200, 0.3);
            
            // Virar as cartas de volta após um tempo
            setTimeout(() => {
                card1.isFlipped = false;
                card2.isFlipped = false;
                card1.element.classList.remove('flipped', 'wrong');
                card2.element.classList.remove('flipped', 'wrong');
                card1.element.innerHTML = '?';
                card2.element.innerHTML = '?';
            }, 1000);
        }
        
        this.flippedCards = [];
    }
    
    startTimer() {
        this.gameTimer = setInterval(() => {
            if (this.gameRunning) {
                this.timeElapsed++;
                this.updateDisplay();
                
                // Timeout após 5 minutos
                if (this.timeElapsed >= 300) {
                    this.gameOver();
                }
            }
        }, 1000);
    }
    
    winGame() {
        this.gameRunning = false;
        clearInterval(this.gameTimer);
        this.gameArea.style.display = 'none';
        this.victoryScreen.style.display = 'block';
        this.playSound(523, 0.2);
        setTimeout(() => this.playSound(659, 0.2), 200);
        setTimeout(() => this.playSound(784, 0.3), 400);
    }
    
    gameOver() {
        this.gameRunning = false;
        clearInterval(this.gameTimer);
        this.gameArea.style.display = 'none';
        this.gameOverScreen.style.display = 'block';
        document.getElementById('finalPairs').textContent = this.pairs;
        this.playSound(200, 0.5);
    }
    
    acceptProposal() {
        this.victoryScreen.style.display = 'none';
        this.finalScreen.style.display = 'block';
        this.playSound(523, 0.2);
        setTimeout(() => this.playSound(659, 0.2), 200);
        setTimeout(() => this.playSound(784, 0.2), 400);
        setTimeout(() => this.playSound(1047, 0.3), 600);
    }
    
    rejectProposal() {
        alert('Que pena! 😢 Mas você pode tentar novamente!');
        this.restartGame();
    }
    
    restartGame() {
        this.gameArea.style.display = 'none';
        this.gameOverScreen.style.display = 'none';
        this.victoryScreen.style.display = 'none';
        this.finalScreen.style.display = 'none';
        this.startScreen.style.display = 'block';
        this.gameRunning = false;
        if (this.gameTimer) clearInterval(this.gameTimer);
    }
    
    updateDisplay() {
        this.pairsElement.textContent = this.pairs;
        this.movesElement.textContent = this.moves;
        
        const minutes = Math.floor(this.timeElapsed / 60);
        const seconds = this.timeElapsed % 60;
        this.timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        const icon = this.muteBtn.querySelector('i');
        icon.className = this.isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
    }
}

// Inicializar o jogo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new MemoryGame();
});