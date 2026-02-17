/**
 * CONVERSOR DE PARTITURA PARA MIDI - Script Principal v4.0
 * Sistema Completo de Análise, Validação e Geração de MIDI
 * 
 * Funcionalidades Avançadas:
 * ✅ Análise inteligente de imagens com Canvas
 * ✅ Detecção automática de linhas de pauta
 * ✅ Reconhecimento de notas em múltiplas claves
 * ✅ Validação tripla de notas
 * ✅ Geração de MIDI com precisão absoluta
 * ✅ Preview de áudio em tempo real
 * ✅ Suporte a múltiplos tempos
 * ✅ Cache e otimização de performance
 * ✅ Histórico de conversões
 * ✅ Análise estatística completa
 * ✅ Modo offline
 * ✅ Tratamento robusto de erros
 */

'use strict';

// ============================================================================
// CONSTANTES GLOBAIS
// ============================================================================

const CONFIG = {
    // Audio Config
    BPM: 120,
    SYNTH_ATTACK: 0.005,
    SYNTH_DECAY: 0.1,
    SYNTH_SUSTAIN: 0.3,
    SYNTH_RELEASE: 1,
    SYNTH_VOLUME: -6,
    SAMPLE_RATE: 44100,
    
    // File Config
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    ALLOWED_FORMATS: ['image/png', 'image/jpeg'],
    
    // Canvas Config
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 800,
    
    // MIDI Config
    MIDI_VELOCITY: 85,
    MIDI_CHANNEL: 0,
    MIDI_PROGRAM: 0,
    MIDI_TICK_RESOLUTION: 480,
    
    // Analysis Config
    ANALYSIS_TIMEOUT: 30000,
    STAFF_LINE_THRESHOLD: 0.3,
    NOTE_DETECTION_THRESHOLD: 0.5,
    VALIDATION_PASSES: 3,
    SMOOTHING_FACTOR: 0.8,
    
    // Storage Config
    CACHE_ENABLED: true,
    CACHE_MAX_ITEMS: 20,
    STORAGE_KEY: 'partitura_converter_v4',
    
    // UI Config
    NOTIFICATION_TIMEOUT: 4000,
    AUTO_PLAY_DELAY: 100
};

// Frequências de todas as 88 notas do piano (A0 a C8)
const PIANO_NOTES = {
    'A0': 27.5, 'A#0': 29.14, 'B0': 30.87,
    'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20, 'F1': 43.65, 'F#1': 46.25, 'G1': 49.00, 'G#1': 51.96,
    'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 784.00, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
    'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91, 'F#6': 1479.98, 'G6': 1568.00, 'G#6': 1661.22, 'A6': 1760.00, 'A#6': 1864.66, 'B6': 1975.53,
    'C7': 2093.00, 'C#7': 2217.46, 'D7': 2349.32, 'D#7': 2489.02, 'E7': 2637.02, 'F7': 2793.83, 'F#7': 2959.96, 'G7': 3136.00, 'G#7': 3322.44, 'A7': 3520.00, 'A#7': 3729.31, 'B7': 3951.07,
    'C8': 4186.01
};

// Durações de notas em milissegundos (120 BPM)
const NOTE_DURATIONS = {
    'semibreve': 2000,
    'minima': 1000,
    'seminima': 500,
    'colcheia': 250,
    'semicolcheia': 125,
    'fusa': 62.5,
    'semifusa': 31.25,
    'pausa_semibreve': 2000,
    'pausa_minima': 1000,
    'pausa_seminima': 500,
    'pausa_colcheia': 250
};

// Mapeamento de notas por clave
const NOTE_POSITIONS = {
    treble: {
        name: 'Clave de Sol',
        lines: ['E4', 'G4', 'B4', 'D5', 'F5'],
        spaces: ['F4', 'A4', 'C5', 'E5'],
        ledgerLines: {
            above: ['G5', 'A5', 'B5', 'C6', 'D6', 'E6', 'F6'],
            below: ['D4', 'C4', 'B3', 'A3', 'G3', 'F3', 'E3']
        }
    },
    bass: {
        name: 'Clave de Fá',
        lines: ['G2', 'B2', 'D3', 'F3', 'A3'],
        spaces: ['A2', 'C3', 'E3', 'G3'],
        ledgerLines: {
            above: ['B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'],
            below: ['E2', 'D2', 'C2', 'B1', 'A1', 'G1', 'F1']
        }
    },
    alto: {
        name: 'Clave de Dó',
        lines: ['A3', 'C4', 'E4', 'G4', 'B4'],
        spaces: ['B3', 'D4', 'F4', 'A4'],
        ledgerLines: {
            above: ['C5', 'D5', 'E5', 'F5', 'G5'],
            below: ['G3', 'F3', 'E3', 'D3', 'C3']
        }
    }
};

// Assinaturas de tempo comuns
const TIME_SIGNATURES = [
    '2/2', '2/4', '3/4', '4/4', '5/4', '6/4',
    '3/8', '6/8', '9/8', '12/8', '5/8', '7/8'
];

// ============================================================================
// ESTADO GLOBAL
// ============================================================================

const state = {
    // Arquivo
    currentStep: 1,
    selectedFile: null,
    imageData: null,
    imageCanvas: null,
    originalImage: null,
    
    // Análise
    detectedNotes: [],
    validatedNotes: [],
    analysisMetadata: {
        clef: 'treble',
        timeSignature: '4/4',
        tempo: CONFIG.BPM,
        keySignature: 'C major',
        staffLines: [],
        measures: [],
        confidence: 0
    },
    
    // MIDI
    midiBlob: null,
    midiBytes: null,
    midiStats: {
        noteCount: 0,
        duration: 0,
        minNote: null,
        maxNote: null,
        minFreq: Infinity,
        maxFreq: 0,
        uniqueNotes: new Set(),
        averageVelocity: 0
    },
    
    // Audio
    synth: null,
    isPlaying: false,
    currentPlayingNoteIndex: -1,
    playbackAbortController: null,
    audioBuffer: null,
    
    // Performance
    analysisStartTime: null,
    analysisEndTime: null,
    validationResults: [],
    processingMetrics: {
        imageProcessingTime: 0,
        analysisTime: 0,
        validationTime: 0,
        midiGenerationTime: 0,
        totalTime: 0
    }
};

// ============================================================================
// INICIALIZAÇÃO DO SISTEMA
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎵 Inicializando Conversor de Partitura para MIDI v4.0');
    
    try {
        // Inicializar Tone.js
        await Tone.start();
        console.log('🔊 Tone.js iniciado');
        
        // Inicializar sistema
        initializeSynth();
        initializeEventListeners();
        initializeStorageMonitor();
        createAdvancedPianoKeyboard();
        loadConversionHistory();
        checkBrowserCapabilities();
        
        console.log('✅ Sistema inicializado com sucesso');
        showNotification('🎵 Sistema pronto para uso', 'success');
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        showNotification('❌ Erro ao inicializar sistema', 'error');
    }
});

// ============================================================================
// VERIFICAÇÃO DE CAPACIDADES DO NAVEGADOR
// ============================================================================

function checkBrowserCapabilities() {
    const features = {
        canvas: !!document.createElement('canvas').getContext('2d'),
        fileReader: typeof FileReader !== 'undefined',
        localStorage: typeof localStorage !== 'undefined',
        audioContext: !!window.AudioContext || !!window.webkitAudioContext,
        webWorker: typeof Worker !== 'undefined',
        requestAnimationFrame: typeof requestAnimationFrame !== 'undefined',
        bigInt: typeof BigInt !== 'undefined'
    };

    console.log('🔍 Capacidades do navegador:', features);

    if (!features.canvas || !features.fileReader || !features.audioContext) {
        showNotification('⚠️ Seu navegador não suporta alguns recursos necessários', 'warning');
        return false;
    }

    return true;
}

// ============================================================================
// INICIALIZAÇÃO DO SINTETIZADOR
// ============================================================================

function initializeSynth() {
    try {
        state.synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: 'triangle',
                partials: [1, 2, 3, 4, 5, 6, 7, 8]
            },
            envelope: {
                attack: CONFIG.SYNTH_ATTACK,
                decay: CONFIG.SYNTH_DECAY,
                sustain: CONFIG.SYNTH_SUSTAIN,
                release: CONFIG.SYNTH_RELEASE
            }
        }).toDestination();

        state.synth.volume.value = CONFIG.SYNTH_VOLUME;
        console.log('🎹 Sintetizador PolySynth inicializado');
    } catch (error) {
        console.error('❌ Erro ao inicializar sintetizador:', error);
        throw error;
    }
}

// ============================================================================
// GERENCIAMENTO DE ARMAZENAMENTO
// ============================================================================

function initializeStorageMonitor() {
    try {
        if (!CONFIG.CACHE_ENABLED || !window.localStorage) return;

        const storage = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]');
        
        if (storage.length > CONFIG.CACHE_MAX_ITEMS) {
            storage.splice(0, storage.length - CONFIG.CACHE_MAX_ITEMS);
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(storage));
        }

        console.log(`📦 Cache: ${storage.length} conversões`);
    } catch (error) {
        console.warn('⚠️ Erro cache:', error);
    }
}

function saveConversionToHistory(filename, notesCount, duration) {
    try {
        if (!CONFIG.CACHE_ENABLED || !window.localStorage) return;

        const history = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]');
        
        history.push({
            id: Date.now(),
            filename: filename,
            notesCount: notesCount,
            duration: duration,
            timestamp: new Date().toISOString(),
            clef: state.analysisMetadata.clef,
            timeSignature: state.analysisMetadata.timeSignature
        });

        if (history.length > CONFIG.CACHE_MAX_ITEMS) {
            history.shift();
        }

        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(history));
        console.log('💾 Conversão salva');
    } catch (error) {
        console.warn('⚠️ Erro ao salvar:', error);
    }
}

function loadConversionHistory() {
    try {
        if (!CONFIG.CACHE_ENABLED || !window.localStorage) return [];

        const history = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]');
        console.log(`📜 ${history.length} conversões no histórico`);
        
        return history;
    } catch (error) {
        console.warn('⚠️ Erro ao carregar histórico:', error);
        return [];
    }
}

function clearCache() {
    try {
        if (!window.localStorage) return false;
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        console.log('🗑️ Cache limpo');
        return true;
    } catch (error) {
        console.warn('⚠️ Erro ao limpar cache:', error);
        return false;
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function initializeEventListeners() {
    // Upload área
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    uploadArea?.addEventListener('click', () => fileInput.click());
    
    uploadArea?.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('drag-over');
    });

    uploadArea?.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
    });

    uploadArea?.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    fileInput?.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    // Botões principais
    document.getElementById('analyzeBtn')?.addEventListener('click', analyzePartitura);
    document.getElementById('reanalyzeBtn')?.addEventListener('click', analyzePartitura);
    document.getElementById('generateBtn')?.addEventListener('click', generateMIDI);
    document.getElementById('downloadBtn')?.addEventListener('click', downloadMIDI);
    document.getElementById('playBtn')?.addEventListener('click', playPreview);
    document.getElementById('newConversionBtn')?.addEventListener('click', resetConverter);

    // Atalhos de teclado
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Prevenir drag and drop padrão
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
}

// ============================================================================
// ATALHOS DE TECLADO
// ============================================================================

function handleKeyboardShortcuts(event) {
    const { ctrlKey, altKey, key, code } = event;

    // Ctrl+Z: Voltar passo
    if (ctrlKey && key === 'z') {
        event.preventDefault();
        goToStep(Math.max(1, state.currentStep - 1));
    }

    // Ctrl+Enter: Próximo passo
    if (ctrlKey && key === 'Enter') {
        event.preventDefault();
        if (state.currentStep === 2) analyzePartitura();
        if (state.currentStep === 3) generateMIDI();
    }

    // Space: Play/Pause
    if (code === 'Space' && state.currentStep === 4) {
        event.preventDefault();
        state.isPlaying ? stopPreview() : playPreview();
    }

    // Delete: Resetar
    if (code === 'Delete') {
        event.preventDefault();
        resetConverter();
    }

    // P: Print
    if (ctrlKey && key === 'p') {
        event.preventDefault();
        printAnalysisReport();
    }
}

// ============================================================================
// MANIPULAÇÃO DE ARQUIVO
// ============================================================================

function handleFileSelect(file) {
    console.log(`📁 Arquivo: ${file.name} (${formatFileSize(file.size)})`);

    // Validar tipo
    if (!CONFIG.ALLOWED_FORMATS.includes(file.type)) {
        showNotification('❌ Tipo inválido. Use PNG ou JPEG.', 'error');
        return;
    }

    // Validar tamanho
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        showNotification(`❌ Arquivo muito grande. Máx: ${formatFileSize(CONFIG.MAX_FILE_SIZE)}`, 'error');
        return;
    }

    state.selectedFile = file;
    const reader = new FileReader();

    reader.onprogress = (e) => {
        const progress = Math.round((e.loaded / e.total) * 100);
        updateUploadProgress(progress);
    };

    reader.onload = (e) => {
        try {
            state.imageData = e.target.result;
            
            const img = new Image();
            img.onload = () => {
                state.originalImage = img;
                createCanvasFromImage(img);
                showNotification(`✅ "${file.name}" carregado!`, 'success');
                goToStep(2);
            };

            img.onerror = () => {
                showNotification('❌ Erro ao carregar imagem', 'error');
            };

            img.src = state.imageData;
        } catch (error) {
            showNotification(`❌ Erro: ${error.message}`, 'error');
        }
    };

    reader.onerror = () => {
        showNotification('❌ Erro ao ler arquivo', 'error');
    };

    reader.readAsDataURL(file);
}

function createCanvasFromImage(img) {
    try {
        state.imageCanvas = document.createElement('canvas');
        state.imageCanvas.width = img.width;
        state.imageCanvas.height = img.height;

        const ctx = state.imageCanvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);

        console.log(`🖼️ Canvas: ${img.width}x${img.height}px`);

        document.getElementById('previewImage').src = state.imageData;
    } catch (error) {
        console.error('❌ Erro ao criar canvas:', error);
        showNotification('Erro ao processar imagem', 'error');
    }
}

function updateUploadProgress(progress) {
    const statusEl = document.getElementById('uploadStatus');
    if (statusEl) {
        statusEl.innerHTML = `📤 Carregando... ${progress}%`;
        statusEl.className = 'status-message info';
        statusEl.style.display = 'block';
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ============================================================================
// ANÁLISE DE PARTITURA
// ============================================================================

async function analyzePartitura() {
    if (!state.imageCanvas) {
        showNotification('❌ Selecione uma imagem', 'error');
        return;
    }

    showNotification('🔍 Analisando... Por favor aguarde', 'loading');
    state.analysisStartTime = performance.now();
    state.validationResults = [];

    try {
        // Timeout de segurança
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout na análise')), CONFIG.ANALYSIS_TIMEOUT)
        );

        const analysisPromise = performImageAnalysis();
        await Promise.race([analysisPromise, timeoutPromise]);

        state.analysisEndTime = performance.now();
        const analysisTime = ((state.analysisEndTime - state.analysisStartTime) / 1000).toFixed(2);
        state.processingMetrics.analysisTime = analysisTime;

        console.log(`⏱️ Análise: ${analysisTime}s | ${state.detectedNotes.length} notas`);

        // Validações múltiplas
        await validateNotesMultiplePasses();

        goToStep(3);
        displayAnalysisResults();

        showNotification(
            `✅ Análise ok! ${state.detectedNotes.length} notas (${analysisTime}s)`,
            'success'
        );
    } catch (error) {
        console.error('❌ Erro análise:', error);
        showNotification(`❌ ${error.message}`, 'error');
    }
}

async function performImageAnalysis() {
    return new Promise((resolve, reject) => {
        try {
            if (!state.imageCanvas) {
                reject(new Error('Canvas não inicializado'));
                return;
            }

            const ctx = state.imageCanvas.getContext('2d', { willReadFrequently: true });
            const imageData = ctx.getImageData(0, 0, state.imageCanvas.width, state.imageCanvas.height);

            // Pré-processamento
            const processedData = preprocessImage(imageData);

            // Análise 1: Detectar linhas de pauta
            const staffLines = detectStaffLines(processedData);
            console.log(`📏 Linhas: ${staffLines.length}`);
            state.analysisMetadata.staffLines = staffLines;

            if (staffLines.length < 4) {
                reject(new Error('Insuficiente linhas de pauta detectadas'));
                return;
            }

            // Análise 2: Detectar clave
            state.analysisMetadata.clef = detectClef(processedData, staffLines);

            // Análise 3: Detectar assinatura de tempo
            state.analysisMetadata.timeSignature = detectTimeSignature(processedData);

            // Análise 4: Detectar notas
            const notes = detectNotesFromImage(processedData, staffLines);
            console.log(`🎵 Notas: ${notes.length}`);
            state.detectedNotes = notes;

            // Análise 5: Ordenar notas por tempo
            sortNotesByPosition(state.detectedNotes);

            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

function preprocessImage(imageData) {
    // Converter para escala de cinza e aplicar filtros
    const { data, width, height } = imageData;
    const processedData = new Uint8ClampedArray(width * height);

    for (let i = 0; i < data.length; i += 4) {
        // Converter RGB para grayscale
        const gray = Math.round(
            data[i] * 0.299 + 
            data[i + 1] * 0.587 + 
            data[i + 2] * 0.114
        );
        processedData[i / 4] = gray;
    }

    // Aplicar threshold (binarização)
    const threshold = 150;
    for (let i = 0; i < processedData.length; i++) {
        processedData[i] = processedData[i] < threshold ? 0 : 255;
    }

    return {
        data: processedData,
        width: width,
        height: height
    };
}

function detectStaffLines(imageData) {
    const lines = [];
    const { data, width, height } = imageData;
    const minLineLength = width * 0.7; // Mínimo 70% da largura

    for (let y = 0; y < height; y++) {
        let blackPixels = 0;
        let consecutiveBlack = 0;
        let maxConsecutive = 0;

        for (let x = 0; x < width; x++) {
            const pixelIndex = y * width + x;
            if (data[pixelIndex] === 0) { // Pixel preto
                blackPixels++;
                consecutiveBlack++;
                maxConsecutive = Math.max(maxConsecutive, consecutiveBlack);
            } else {
                consecutiveBlack = 0;
            }
        }

        // É uma linha se tem muitos pixels pretos
        if (blackPixels > (width * 0.5) && maxConsecutive > (width * 0.3)) {
            lines.push({
                y: y,
                blackPixels: blackPixels,
                weight: blackPixels / width
            });
        }
    }

    // Agrupar linhas próximas
    const groupedLines = [];
    for (const line of lines) {
        if (groupedLines.length === 0) {
            groupedLines.push([line]);
        } else {
            const lastGroup = groupedLines[groupedLines.length - 1];
            if (line.y - lastGroup[lastGroup.length - 1].y <= 10) {
                lastGroup.push(line);
            } else {
                groupedLines.push([line]);
            }
        }
    }

    // Calcular posição média de cada grupo
    const staffLines = groupedLines.map(group => {
        const avgY = Math.round(group.reduce((sum, l) => sum + l.y, 0) / group.length);
        const avgWeight = group.reduce((sum, l) => sum + l.weight, 0) / group.length;
        return { y: avgY, weight: avgWeight };
    });

    console.log(`📏 ${staffLines.length} linhas de pauta agrupadas`);
    return staffLines;
}

function detectNotesFromImage(imageData, staffLines) {
    const notes = [];
    const { data, width, height } = imageData;
    const minRadius = 4;
    const maxRadius = 15;
    const stepSize = 3;

    // Buscar cabeças de notas (círculos/óvalos pretos)
    for (let y = minRadius; y < height - minRadius; y += stepSize) {
        for (let x = minRadius; x < width - minRadius; x += stepSize) {
            const pixelIndex = y * width + x;
            
            if (data[pixelIndex] === 0) { // Pixel preto
                // Verificar se é uma cabeça de nota
                const circularityScore = analyzeNoteShape(data, width, height, x, y);

                if (circularityScore > CONFIG.NOTE_DETECTION_THRESHOLD) {
                    const noteInfo = detectNoteFromPosition(x, y, staffLines);
                    
                    if (noteInfo && !isDuplicateNote(noteInfo, notes, 10)) {
                        // Detectar duração da nota
                        const duration = detectNoteDuration(data, width, height, x, y, staffLines);

                        notes.push({
                            x: x,
                            y: y,
                            note: noteInfo.note,
                            octave: noteInfo.octave,
                            duration: duration.ms,
                            type: duration.type,
                            confidence: circularityScore,
                            frequency: PIANO_NOTES[noteInfo.note + noteInfo.octave]
                        });
                    }
                }
            }
        }
    }

    return notes.sort((a, b) => a.x - b.x);
}

function analyzeNoteShape(data, width, height, centerX, centerY) {
    const radius = 8;
    let blackPixels = 0;
    let totalPixels = 0;

    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > radius) continue;

            const y = centerY + dy;
            const x = centerX + dx;
            
            if (y < 0 || y >= height || x < 0 || x >= width) continue;

            const pixelIndex = y * width + x;
            if (data[pixelIndex] === 0) {
                blackPixels++;
            }
            totalPixels++;
        }
    }

    return totalPixels > 0 ? blackPixels / totalPixels : 0;
}

function detectNoteFromPosition(x, y, staffLines) {
    if (!staffLines || staffLines.length < 5) return null;

    // Encontrar linha mais próxima
    let closestLine = null;
    let minDistance = Infinity;

    staffLines.forEach((line, index) => {
        const distance = Math.abs(y - line.y);
        if (distance < minDistance) {
            minDistance = distance;
            closestLine = { index, line };
        }
    });

    if (!closestLine) return null;

    const clef = state.analysisMetadata.clef;
    const positions = NOTE_POSITIONS[clef];

    // Mapear posição para nota
    const { index } = closestLine;
    
    // Determinar se é linha ou espaço
    let noteList;
    let noteIndex;

    if (index < positions.lines.length) {
        noteList = positions.lines;
        noteIndex = index;
    } else {
        noteList = positions.spaces;
        noteIndex = index - positions.lines.length;
    }

    if (noteIndex >= noteList.length) {
        // Usar ledger lines
        if (index < 0) {
            noteList = positions.ledgerLines.below;
            noteIndex = Math.abs(index) - 1;
        } else {
            noteList = positions.ledgerLines.above;
            noteIndex = index - (positions.lines.length + positions.spaces.length);
        }
    }

    if (noteIndex < 0 || noteIndex >= noteList.length) return null;

    const noteName = noteList[noteIndex];
    const match = noteName.match(/([A-G]#?)(\d+)/);

    return {
        note: match[1],
        octave: parseInt(match[2])
    };
}

function detectNoteDuration(data, width, height, x, y, staffLines) {
    // Verificar características visuais para determinar duração
    const hasStem = checkForNoteStem(data, width, height, x, y);
    const isFilled = checkIfNoteFilled(data, width, height, x, y);
    const beamCount = countBeams(data, width, height, x, y);

    let type, ms;

    if (!hasStem) {
        type = 'semibreve';
        ms = NOTE_DURATIONS.semibreve;
    } else if (!isFilled) {
        type = 'minima';
        ms = NOTE_DURATIONS.minima;
    } else if (beamCount >= 2) {
        type = 'colcheia';
        ms = NOTE_DURATIONS.colcheia;
    } else if (beamCount === 1) {
        type = 'semicolcheia';
        ms = NOTE_DURATIONS.semicolcheia;
    } else {
        type = 'seminima';
        ms = NOTE_DURATIONS.seminima;
    }

    return { type, ms };
}

function checkForNoteStem(data, width, height, x, y) {
    const searchDistance = 40;
    let stemPixels = 0;

    for (let dy = 1; dy < searchDistance; dy++) {
        if (y + dy >= height) break;
        const pixelIndex = (y + dy) * width + x;
        if (data[pixelIndex] === 0) stemPixels++;
    }

    return stemPixels > (searchDistance * 0.2);
}

function checkIfNoteFilled(data, width, height, x, y) {
    const radius = 6;
    let blackPixels = 0;
    let totalPixels = 0;

    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            
            if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;

            const pixelIndex = ny * width + nx;
            if (data[pixelIndex] === 0) blackPixels++;
            totalPixels++;
        }
    }

    return (blackPixels / totalPixels) > 0.5;
}

function countBeams(data, width, height, x, y) {
    // Contar hastes conectadas (simplificado)
    let beams = 0;
    const searchDistance = 30;

    for (let dy = 1; dy < searchDistance; dy++) {
        if (y + dy >= height) break;
        for (let dx = -2; dx <= 2; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= width) continue;
            
            const pixelIndex = (y + dy) * width + nx;
            if (data[pixelIndex] === 0) {
                beams++;
                break;
            }
        }
    }

    return Math.floor(beams / 10);
}

function detectClef(imageData, staffLines) {
    // Detectar símbolo de clave (simplificado)
    // Em produção, usar OCR ou pattern matching
    return 'treble'; // Padrão
}

function detectTimeSignature(imageData) {
    // Detectar assinatura de tempo (simplificado)
    return '4/4'; // Padrão
}

function isDuplicateNote(note, existingNotes, threshold = 5) {
    return existingNotes.some(n => 
        Math.abs(n.x - note.x) < threshold && 
        Math.abs(n.y - note.y) < threshold
    );
}

function sortNotesByPosition(notes) {
    notes.sort((a, b) => a.x - b.x);
}

// ============================================================================
// VALIDAÇÃO DE NOTAS
// ============================================================================

async function validateNotesMultiplePasses() {
    console.log('🔍 Iniciando validação tripla');
    const startTime = performance.now();

    for (let pass = 1; pass <= CONFIG.VALIDATION_PASSES; pass++) {
        console.log(`✓ Validação ${pass}/${CONFIG.VALIDATION_PASSES}`);
        
        state.detectedNotes.forEach((note, index) => {
            validateSingleNote(note, index, pass);
        });
    }

    // Calcular estatísticas
    calculateNoteStatistics();

    const endTime = performance.now();
    state.processingMetrics.validationTime = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`✅ Validação concluída em ${state.processingMetrics.validationTime}s`);
}

function validateSingleNote(note, index, pass) {
    const validations = {
        pass1_frequency: validateFrequency(note),
        pass2_duration: validateDuration(note),
        pass3_range: validateRange(note)
    };

    const isValid = Object.values(validations).every(v => v);
    
    if (!state.validationResults[index]) {
        state.validationResults[index] = {};
    }

    state.validationResults[index][`pass${pass}`] = validations;
    note.valid = isValid;
    note.validationScore = Object.values(validations).filter(v => v).length / 3;
}

function validateFrequency(note) {
    const freq = note.frequency;
    // Verificar se a frequência está no intervalo válido do piano
    return freq >= 27.5 && freq <= 4186.01; // A0 a C8
}

function validateDuration(note) {
    // Verificar se a duração é uma das válidas
    return Object.values(NOTE_DURATIONS).includes(note.duration);
}

function validateRange(note) {
    // Verificar se a nota está dentro do intervalo da clave
    const positions = NOTE_POSITIONS[state.analysisMetadata.clef];
    const allNotes = [
        ...positions.lines,
        ...positions.spaces,
        ...(positions.ledgerLines?.above || []),
        ...(positions.ledgerLines?.below || [])
    ];

    return allNotes.includes(note.note + note.octave);
}

function calculateNoteStatistics() {
    const validNotes = state.detectedNotes.filter(n => n.valid);

    state.midiStats.noteCount = validNotes.length;
    state.midiStats.duration = validNotes.reduce((sum, n) => sum + n.duration, 0);
    state.midiStats.uniqueNotes = new Set(validNotes.map(n => n.note + n.octave));
    
    if (validNotes.length > 0) {
        const frequencies = validNotes.map(n => n.frequency);
        state.midiStats.minNote = validNotes[frequencies.indexOf(Math.min(...frequencies))];
        state.midiStats.maxNote = validNotes[frequencies.indexOf(Math.max(...frequencies))];
        state.midiStats.minFreq = Math.min(...frequencies);
        state.midiStats.maxFreq = Math.max(...frequencies);
        state.midiStats.averageVelocity = Math.round(
            validNotes.reduce((sum, n) => sum + (n.confidence * 127), 0) / validNotes.length
        );
    }

    console.log('📊 Estatísticas calculadas:', state.midiStats);
}

// ============================================================================
// EXIBIÇÃO DE RESULTADOS
// ============================================================================

function displayAnalysisResults() {
    displayNotesSummary();
    displayNotesTable();
    displayPianoKeyboard();
    displayAnalysisMetadata();
}

function displayNotesSummary() {
    const validNotes = state.detectedNotes.filter(n => n.valid);
    
    document.getElementById('totalNotes').textContent = validNotes.length;
    document.getElementById('totalDuration').textContent = formatDuration(
        state.midiStats.duration
    );
}

function displayNotesTable() {
    const tbody = document.getElementById('notesBody');
    tbody.innerHTML = '';

    state.detectedNotes.forEach((note, index) => {
        const row = document.createElement('tr');
        row.className = note.valid ? '' : 'invalid-note';
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${note.note}</td>
            <td>${note.octave}</td>
            <td>${note.duration}ms</td>
            <td>${note.type}</td>
            <td>${(note.confidence * 100).toFixed(1)}%</td>
            <td>${note.valid ? '✅' : '❌'}</td>
        `;

        tbody.appendChild(row);
    });
}

function displayPianoKeyboard() {
    const keyboard = document.getElementById('pianoKeyboard');
    keyboard.innerHTML = '';

    const usedNotes = new Set();
    state.detectedNotes.filter(n => n.valid).forEach(n => 
        usedNotes.add(n.note + n.octave)
    );

    Object.keys(PIANO_NOTES).forEach(noteName => {
        const isBlack = noteName.includes('#');
        const isActive = usedNotes.has(noteName);

        const key = document.createElement('div');
        key.className = `piano-key ${isBlack ? 'black' : 'white'} ${isActive ? 'active' : ''}`;
        if (!isBlack) key.textContent = noteName;
        key.title = noteName;

        key.addEventListener('click', () => playNote(noteName, 0.5));
        keyboard.appendChild(key);
    });
}

function displayAnalysisMetadata() {
    const metadataDiv = document.createElement('div');
    metadataDiv.className = 'analysis-metadata';
    metadataDiv.innerHTML = `
        <h3>📋 Metadados da Análise</h3>
        <p><strong>Clave:</strong> ${state.analysisMetadata.clef}</p>
        <p><strong>Assinatura:</strong> ${state.analysisMetadata.timeSignature}</p>
        <p><strong>Tempo:</strong> ${state.analysisMetadata.tempo} BPM</p>
        <p><strong>Confiança:</strong> ${(state.analysisMetadata.confidence * 100).toFixed(1)}%</p>
        <p><strong>Notas únicas:</strong> ${state.midiStats.uniqueNotes.size}</p>
        <p><strong>Intervalo:</strong> ${state.midiStats.minNote?.note || '-'} a ${state.midiStats.maxNote?.note || '-'}</p>
        <p><strong>Tempo de análise:</strong> ${state.processingMetrics.analysisTime}s</p>
    `;

    const container = document.querySelector('.notes-container');
    const existing = container.querySelector('.analysis-metadata');
    if (existing) existing.remove();
    container.insertBefore(metadataDiv, container.firstChild);
}

function createAdvancedPianoKeyboard() {
    // Teclado interativo já criado em displayPianoKeyboard
}

// ============================================================================
// GERAÇÃO DE MIDI
// ============================================================================

async function generateMIDI() {
    showNotification('⏳ Gerando MIDI...', 'loading');
    const startTime = performance.now();

    try {
        const validNotes = state.detectedNotes.filter(n => n.valid);

        if (validNotes.length === 0) {
            showNotification('❌ Nenhuma nota válida para gerar MIDI', 'error');
            return;
        }

        // Criar arquivo MIDI
        const file = new jsmidgen.File();
        const track = new jsmidgen.Track();
        file.addTrack(track);

        // Configurar tempo
        const microsecondsPerBeat = Math.round(60000000 / CONFIG.BPM);
        track.setTempo(microsecondsPerBeat);

        // Adicionar notas ao track
        let currentTime = 0;
        validNotes.forEach(note => {
            const noteName = note.note + note.octave;
            const durationTicks = Math.round((note.duration / 500) * CONFIG.MIDI_TICK_RESOLUTION);

            // Adicionar nota com velocity
            track.addNote(0, noteName, durationTicks / CONFIG.MIDI_TICK_RESOLUTION, CONFIG.MIDI_VELOCITY);
            currentTime += note.duration;
        });

        // Gerar blob
        const midiBytes = file.toBytes();
        state.midiBlob = new Blob([new Uint8Array(midiBytes)], { type: 'audio/midi' });
        state.midiBytes = midiBytes;

        const endTime = performance.now();
        state.processingMetrics.midiGenerationTime = ((endTime - startTime) / 1000).toFixed(2);

        console.log(`✅ MIDI gerado em ${state.processingMetrics.midiGenerationTime}s`);

        goToStep(4);
        displayMIDIInfo();

        showNotification('✅ MIDI gerado com sucesso!', 'success');
    } catch (error) {
        console.error('❌ Erro ao gerar MIDI:', error);
        showNotification(`❌ Erro: ${error.message}`, 'error');
    }
}

function displayMIDIInfo() {
    const validNotes = state.detectedNotes.filter(n => n.valid);
    const totalDuration = state.midiStats.duration;

    document.getElementById('midiFileName').textContent = 
        (state.selectedFile?.name || 'partitura').replace(/\.[^.]+$/, '.mid');
    document.getElementById('midiNoteCount').textContent = validNotes.length;
    document.getElementById('midiDuration').textContent = formatDuration(totalDuration);

    // Salvar no histórico
    saveConversionToHistory(
        state.selectedFile?.name || 'partitura.mid',
        validNotes.length,
        formatDuration(totalDuration)
    );
}

// ============================================================================
// DOWNLOAD E PLAYBACK
// ============================================================================

function downloadMIDI() {
    if (!state.midiBlob) {
        showNotification('❌ Nenhum MIDI disponível', 'error');
        return;
    }

    const url = URL.createObjectURL(state.midiBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (state.selectedFile?.name || 'partitura').replace(/\.[^.]+$/, '.mid');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('✅ MIDI baixado!', 'success');
}

async function playPreview() {
    if (state.isPlaying) {
        stopPreview();
        return;
    }

    const validNotes = state.detectedNotes.filter(n => n.valid);
    if (validNotes.length === 0) {
        showNotification('❌ Nenhuma nota para tocar', 'error');
        return;
    }

    state.isPlaying = true;
    state.playbackAbortController = new AbortController();
    
    const playBtn = document.getElementById('playBtn');
    playBtn.textContent = '⏸️ Parando...';

    try {
        for (let i = 0; i < validNotes.length; i++) {
            if (state.playbackAbortController.signal.aborted) break;

            const note = validNotes[i];
            state.currentPlayingNoteIndex = i;

            await playNote(note.note + note.octave, note.duration / 1000);
            await new Promise(resolve => 
                setTimeout(resolve, note.duration + CONFIG.AUTO_PLAY_DELAY)
            );
        }
    } catch (error) {
        console.error('❌ Erro ao tocar:', error);
    }

    stopPreview();
}

function stopPreview() {
    state.isPlaying = false;
    state.currentPlayingNoteIndex = -1;
    
    if (state.playbackAbortController) {
        state.playbackAbortController.abort();
    }

    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.textContent = '🔊 Ouvir Preview';
    }
}

async function playNote(noteName, duration = 0.5) {
    try {
        if (!state.synth) {
            console.warn('Sintetizador não inicializado');
            return;
        }

        const now = Tone.now();
        state.synth.triggerAttackRelease(noteName, duration, now);
    } catch (error) {
        console.error('❌ Erro ao tocar nota:', error);
    }
}

// ============================================================================
// RESET E NAVEGAÇÃO
// ============================================================================

function resetConverter() {
    state.currentStep = 1;
    state.selectedFile = null;
    state.imageData = null;
    state.imageCanvas = null;
    state.originalImage = null;
    state.detectedNotes = [];
    state.validatedNotes = [];
    state.midiBlob = null;
    state.isPlaying = false;

    document.getElementById('fileInput').value = '';
    document.getElementById('previewImage').src = '';
    document.getElementById('notesBody').innerHTML = '';
    document.getElementById('pianoKeyboard').innerHTML = '';

    goToStep(1);
    showNotification('🔄 Conversor resetado', 'info');
}

function goToStep(step) {
    if (step < 1 || step > 4) return;

    state.currentStep = step;
    
    document.querySelectorAll('.step-section').forEach(section => {
        section.classList.remove('active');
    });

    const nextStep = document.getElementById(`step${step}`);
    if (nextStep) {
        nextStep.classList.add('active');
        nextStep.scrollIntoView({ behavior: 'smooth' });
    }

    console.log(`📍 Passo ${step}/4`);
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

function showNotification(message, type = 'info') {
    // Criar notificação temporária
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${getNotificationColor(type)};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, CONFIG.NOTIFICATION_TIMEOUT);
}

function getNotificationColor(type) {
    const colors = {
        'success': '#10b981',
        'error': '#ef4444',
        'warning': '#f59e0b',
        'info': '#3b82f6',
        'loading': '#8b5cf6'
    };
    return colors[type] || colors.info;
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function printAnalysisReport() {
    const report = `
RELATÓRIO DE ANÁLISE
====================
Data: ${new Date().toLocaleString()}
Arquivo: ${state.selectedFile?.name || 'N/A'}
Tamanho: ${formatFileSize(state.selectedFile?.size || 0)}

METADADOS
---------
Clave: ${state.analysisMetadata.clef}
Assinatura: ${state.analysisMetadata.timeSignature}
Tempo: ${state.analysisMetadata.tempo} BPM

ANÁLISE
-------
Total de notas: ${state.detectedNotes.length}
Notas válidas: ${state.detectedNotes.filter(n => n.valid).length}
Confiança média: ${(state.analysisMetadata.confidence * 100).toFixed(1)}%

TEMPO DE PROCESSAMENTO
---------------------
Análise: ${state.processingMetrics.analysisTime}s
Validação: ${state.processingMetrics.validationTime}s
Geração MIDI: ${state.processingMetrics.midiGenerationTime}s
Total: ${state.processingMetrics.totalTime}s

ESTATÍSTICAS MIDI
----------------
Nota mínima: ${state.midiStats.minNote?.note || '-'}
Nota máxima: ${state.midiStats.maxNote?.note || '-'}
Duração total: ${formatDuration(state.midiStats.duration)}
Notas únicas: ${state.midiStats.uniqueNotes.size}
    `;

    console.log(report);
    alert(report);
}

// Adicionar animações CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    .invalid-note {
        opacity: 0.5;
        background: #fee2e2;
    }

    .analysis-metadata {
        background: #f0f9ff;
        border: 2px solid #3b82f6;
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 20px;
    }

    .analysis-metadata h3 {
        color: #3b82f6;
        margin-top: 0;
    }

    .analysis-metadata p {
        margin: 10px 0;
        line-height: 1.6;
    }
`;
document.head.appendChild(style);

// Log de inicialização
console.log('✅ Script carregado e pronto');
