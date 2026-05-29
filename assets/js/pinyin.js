/* ============================================================
   ACADEMIA MANDARINGOO — Tabla Pinyin Interactivo
   pinyin.js — Lógica principal
   ============================================================ */


/* ─── 1. CONSTANTES ─── */
const AUDIO_BASE_PATH = 'assets/media/audio/';

const TONE_MARKS = {
    'a': ['ā', 'á', 'ǎ', 'à'],
    'e': ['ē', 'é', 'ě', 'è'],
    'i': ['ī', 'í', 'ǐ', 'ì'],
    'o': ['ō', 'ó', 'ǒ', 'ò'],
    'u': ['ū', 'ú', 'ǔ', 'ù'],
    'ü': ['ǖ', 'ǘ', 'ǚ', 'ǜ']
};

const VOWEL_PRIORITY = ['a', 'e', 'o', 'iu', 'ui'];


/* ─── 2. TABLA PINYIN — Audio y tonos ─── */

/**
 * Formatea un pinyin añadiendo la marca tonal correspondiente.
 * @param {string} pinyin - Sílaba en pinyin (ej: "ba", "liu")
 * @param {number|string} tone - Número de tono (1–4)
 * @returns {string} Pinyin con acento tonal
 */
function formatPinyin(pinyin, tone) {
    const toneIndex = parseInt(tone) - 1;

    for (const vow of VOWEL_PRIORITY) {
        if (pinyin.includes(vow)) {
            if (vow === 'iu') return pinyin.replace('u', TONE_MARKS['u'][toneIndex]);
            if (vow === 'ui') return pinyin.replace('i', TONE_MARKS['i'][toneIndex]);
            return pinyin.replace(vow, TONE_MARKS[vow][toneIndex]);
        }
    }

    // Fallback: primera vocal encontrada
    for (const char of pinyin) {
        if (TONE_MARKS[char]) {
            return pinyin.replace(char, TONE_MARKS[char][toneIndex]);
        }
    }

    return pinyin;
}

/**
 * Reproduce el archivo de audio correspondiente a un pinyin y tono.
 * @param {string} pinyin - Sílaba en pinyin
 * @param {number|string} tone - Número de tono (1–4)
 */
function playAudio(pinyin, tone) {
    const audioPath = AUDIO_BASE_PATH + pinyin.replace('ü', 'v') + tone + '.mp3';
    const audio = new Audio(audioPath);

    audio.onerror = () => {
        console.error('No se pudo cargar el audio:', audioPath);
        alert('Audio no disponible para: ' + pinyin + ' tono ' + tone);
    };

    audio.play().catch(err => console.error('Error al reproducir:', err));
}

/**
 * Muestra el menú flotante de selección de tono junto a la celda clickeada.
 * @param {HTMLElement} element - Celda de la tabla
 * @param {string} pinyin - Sílaba en pinyin
 */
function showToneMenu(element, pinyin) {
    const sndPlayer       = document.getElementById('snd_player');
    const rect            = element.getBoundingClientRect();
    const scrollTop       = window.pageYOffset  || document.documentElement.scrollTop;
    const scrollLeft      = window.pageXOffset  || document.documentElement.scrollLeft;
    const menuHeight      = sndPlayer.offsetHeight || 200;
    const centerY         = rect.top + scrollTop + (rect.height / 2) - (menuHeight / 2);

    sndPlayer.style.top     = centerY + 'px';
    sndPlayer.style.left    = (rect.right + scrollLeft + 10) + 'px';
    sndPlayer.style.display = 'block';

    // Actualizar etiquetas y reasignar eventos (cloneNode elimina los viejos)
    sndPlayer.querySelectorAll('a').forEach((link, index) => {
        const tone          = index + 1;
        const formatted     = formatPinyin(pinyin, tone);
        link.querySelector('.pinyin-display').textContent = formatted;

        const freshLink = link.cloneNode(true);
        link.replaceWith(freshLink);
    });

    sndPlayer.querySelectorAll('a').forEach(link => {
        link.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            playAudio(pinyin, this.dataset.tone);
        };
    });
}


/* ─── 3. TABLA PINYIN — Highlight de fila y columna ─── */

function initTableHighlight() {
    const pinyinTable = document.getElementById('tablepress-148');
    if (!pinyinTable) return;

    pinyinTable.addEventListener('mouseover', function (e) {
        const cell = e.target.closest('td, th');
        if (!cell) return;

        const row       = cell.parentElement;
        const cellIndex = Array.from(row.children).indexOf(cell);

        row.classList.add('highlight');

        pinyinTable.querySelectorAll('tr').forEach(r => {
            const cells = r.querySelectorAll('th, td');
            if (cells[cellIndex]) cells[cellIndex].classList.add('column-highlight');
        });

        cell.classList.add('current-cell');
    });

    pinyinTable.addEventListener('mouseout', function (e) {
        const cell = e.target.closest('td, th');
        if (!cell) return;

        pinyinTable.querySelectorAll('.highlight').forEach(el       => el.classList.remove('highlight'));
        pinyinTable.querySelectorAll('.column-highlight').forEach(el => el.classList.remove('column-highlight'));
        pinyinTable.querySelectorAll('.current-cell').forEach(el    => el.classList.remove('current-cell'));
    });
}


/* ─── 4. TABLA PINYIN — Click para reproducir ─── */

function initTableClickHandler() {
    const pinyinTable     = document.getElementById('tablepress-148');
    const sndPlayer       = document.getElementById('snd_player');
    const clickRuleSelect = document.getElementById('clickRule');
    if (!pinyinTable) return;

    pinyinTable.addEventListener('click', function (e) {
        const cell = e.target.closest('td');
        if (!cell || !cell.textContent.trim() || cell.classList.contains('column-1')) return;

        e.stopPropagation();
        const pinyin    = cell.textContent.trim().replace(/<\/?b>/g, '');
        const clickRule = clickRuleSelect.value;

        if (clickRule) {
            playAudio(pinyin, clickRule);
        } else {
            showToneMenu(cell, pinyin);
        }
    });

    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', function (e) {
        if (!sndPlayer.contains(e.target)) {
            sndPlayer.style.display = 'none';
        }
    });

    // Evitar cierre al hacer clic dentro del menú
    sndPlayer.addEventListener('click', e => e.stopPropagation());
}


/* ─── 5. VIDEOS — Autoplay por IntersectionObserver ─── */

/**
 * Configura un video para que se reproduzca automáticamente cuando
 * el elemento observado entra en pantalla (una sola vez).
 * @param {string} videoId   - ID del elemento <video>
 * @param {string} sectionId - ID del elemento a observar (puede ser el mismo video)
 */
function initAutoplayVideo(videoId, sectionId) {
    const video   = document.getElementById(videoId);
    const section = document.getElementById(sectionId || videoId);
    if (!video || !section) return;

    let hasPlayed = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasPlayed) {
                video.play().catch(err => console.log('Error al reproducir el video:', err));
                hasPlayed = true;
            }
        });
    }, { threshold: 0.5 });

    observer.observe(section);

    video.addEventListener('ended', function () {
        video.currentTime = 1.5;
        video.pause();
    });
}


/* ─── 6. MODAL — Términos y condiciones ─── */

function initTermsModal() {
    const modal    = document.getElementById('termsModal');
    const openBtn  = document.getElementById('openTerms');
    const closeX   = document.querySelector('.close-btn');
    const closeBtn = document.getElementById('closeTermsBtn');

    if (!modal) return;

    const openModal  = () => { modal.style.display = 'flex'; document.body.style.overflow = 'hidden'; };
    const closeModal = () => { modal.style.display = 'none'; document.body.style.overflow = 'auto'; };

    if (openBtn)  openBtn.onclick  = (e) => { e.preventDefault(); openModal(); };
    if (closeX)   closeX.onclick   = closeModal;
    if (closeBtn) closeBtn.onclick = closeModal;

    window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // Bloquear clic derecho en el cuerpo del modal
    const termsBody = document.querySelector('.terms-body');
    if (termsBody) {
        termsBody.oncontextmenu = (e) => {
            e.preventDefault();
            alert('Contenido protegido por Academia MandarinGoo.');
        };
    }
}


/* ─── 7. FOOTER — Año dinámico ─── */

function setCurrentYear() {
    const el = document.getElementById('current-year');
    if (el) el.textContent = new Date().getFullYear();
}


/* ─── 8. INICIALIZACIÓN ─── */

document.addEventListener('DOMContentLoaded', function () {
    // Tabla pinyin
    initTableHighlight();
    initTableClickHandler();

    // Videos con autoplay por scroll
    initAutoplayVideo('maumau-video',    'maumau-video');
    initAutoplayVideo('mission-video',   'mission-video-section');
    initAutoplayVideo('ourcurso-video',  'ourcurso-video-section');

    // Modal de términos
    initTermsModal();

    // Footer: año actual
    setCurrentYear();
});
