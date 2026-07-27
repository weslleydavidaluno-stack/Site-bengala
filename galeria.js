const items = document.querySelectorAll('#galeria-grid .galeria-item');
const captions = Array.from(items).map(fig => fig.querySelector('figcaption').textContent);
const sources = Array.from(items).map(fig => fig.querySelector('img').getAttribute('src'));

const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lb-img');
const lbCap = document.getElementById('lb-cap');
let current = 0;

function openLB(i) { current = i; render(); lightbox.showModal(); }
function render() { lbImg.src = sources[current]; lbCap.textContent = captions[current]; }

items.forEach(fig => {
    fig.addEventListener('click', () => openLB(Number(fig.dataset.index)));
});

document.getElementById('lb-close').addEventListener('click', () => lightbox.close());
document.getElementById('lb-prev').addEventListener('click', () => { current = (current - 1 + sources.length) % sources.length; render(); });
document.getElementById('lb-next').addEventListener('click', () => { current = (current + 1) % sources.length; render(); });

lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.close(); });
document.addEventListener('keydown', (e) => {
    if (!lightbox.open) return;
    if (e.key === 'Escape') lightbox.close();
    if (e.key === 'ArrowRight') { current = (current + 1) % sources.length; render(); }
    if (e.key === 'ArrowLeft') { current = (current - 1 + sources.length) % sources.length; render(); }
});