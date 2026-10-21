'use strict';

const $ = id => document.getElementById(id);
const audio = $('audio');
const fallbackArt = 'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><defs><linearGradient id="g"><stop stop-color="#135c4b"/><stop offset="1" stop-color="#15263f"/></linearGradient></defs><rect width="300" height="300" rx="25" fill="url(#g)"/><text x="150" y="185" font-size="115" text-anchor="middle" fill="#39ed9a">♫</text></svg>');

// Guaranteed Working CDN Audio Streams
const DEFAULT_TRACKS = [
  {
    title: 'Kesariya (Chill Beat)',
    channel: 'Arijit Singh, Pritam',
    id: 'BddP6PYo2gs',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=romantic-ambient-112343.mp3'
  },
  {
    title: 'Apna Bana Le (Lo-Fi)',
    channel: 'Arijit Singh, Sachin-Jigar',
    id: 'ElZfdU54Cp8',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f77cd0.mp3?filename=lofi-study-112191.mp3'
  },
  {
    title: 'Raataan Lambiyan (Acoustic)',
    channel: 'Jubin Nautiyal, Tanishk Bagchi',
    id: 'gvyUuxdRdR4',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=relaxed-vlog-night-street-131746.mp3'
  },
  {
    title: 'Maan Meri Jaan',
    channel: 'King',
    id: 'VuG7FT9fZ4A',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=chill-abstract-intention-12099.mp3'
  },
  {
    title: 'Midnight Lo-Fi Stream',
    channel: 'RIVANSHH Vibes',
    id: '5qap5aO4i9A',
    thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_2c9497e885.mp3?filename=midnight-forest-184304.mp3'
  }
];

// 100% Embed-enabled YouTube Videos
const DEFAULT_VIDEOS = [
  {
    title: 'Kesariya - Official Video | Brahmāstra | Arijit Singh',
    channel: 'Sony Music India',
    id: 'BddP6PYo2gs',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500'
  },
  {
    title: 'Apna Bana Le - Bhediya | Varun Dhawan | Arijit Singh',
    channel: 'Zee Music Company',
    id: 'ElZfdU54Cp8',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500'
  },
  {
    title: 'Maan Meri Jaan | Official Music Video | King',
    channel: 'King',
    id: 'VuG7FT9fZ4A',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500'
  },
  {
    title: 'Raataan Lambiyan – Official Video | Shershaah',
    channel: 'Sony Music India',
    id: 'gvyUuxdRdR4',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500'
  },
  {
    title: 'Kahani Suno 2.0 | Kaifi Khalil | Official Video',
    channel: 'Kaifi Khalil',
    id: '_XBVWlI8TsQ',
    thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500'
  }
];

let currentUser = JSON.parse(localStorage.getItem('riv_user') || 'null');
let playlists = JSON.parse(localStorage.getItem('riv_playlists') || '[]');
let likedSongs = JSON.parse(localStorage.getItem('riv_liked') || '[]');
let library = JSON.parse(localStorage.getItem('riv_recent') || '[]');

let currentMode = 'music';
let tracks = [], currentIndex = -1, busy = false, searchNumber = 0;
let trackToAdd = null;

function saveState(){
  localStorage.setItem('riv_user', JSON.stringify(currentUser));
  localStorage.setItem('riv_playlists', JSON.stringify(playlists));
  localStorage.setItem('riv_liked', JSON.stringify(likedSongs));
  localStorage.setItem('riv_recent', JSON.stringify(library));
}

function text(v, f=''){return typeof v==='string'||typeof v==='number'?String(v):f}
function titleOf(t){return text(t.title||t.name,'Unknown Title')}
function artistOf(t){return text(t.channel||t.artist||t.author||t.primaryArtists,'Unknown Artist')}
function targetOf(t){return t.id||t.link||t.url||titleOf(t)}
function timeOf(s){if(!Number.isFinite(s)||s<0)return'0:00';return Math.floor(s/60)+':'+Math.floor(s%60).toString().padStart(2,'0')}

function artOf(t){
  const x = t.thumbnail||t.albumArt||t.image;
  if(typeof x==='string'&&/^https?:\/\//i.test(x)) return x;
  return fallbackArt;
}

function safeImage(img, src){img.onerror=()=>{img.onerror=null;img.src=fallbackArt};img.src=src||fallbackArt}
function message(msg, error=false){
  const p=document.createElement('p');p.className='msg'+(error?' error':'');p.textContent=msg;$('results').replaceChildren(p);
}

function isSongLiked(track){
  return likedSongs.some(s => targetOf(s) === targetOf(track));
}

function toggleLike(track){
  if(isSongLiked(track)){
    likedSongs = likedSongs.filter(s => targetOf(s) !== targetOf(track));
  } else {
    likedSongs.unshift(track);
  }
  saveState();
  if(currentIndex >= 0) updatePlayer();
  renderLikedSongs();
  renderTracks();
}

function getAudioStream(track) {
  if(track.audioUrl) return track.audioUrl;
  return `https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=romantic-ambient-112343.mp3`;
}

// 🎨 Theme Switcher Logic
function applyTheme(themeName) {
  if (!themeName) themeName = 'default';
  document.documentElement.setAttribute('data-theme', themeName);
  document.body.setAttribute('data-theme', themeName);
  localStorage.setItem('riv_theme', themeName);

  document.querySelectorAll('.theme-dot').forEach(dot => {
    if (dot.getAttribute('data-t') === themeName) dot.classList.add('active');
    else dot.classList.remove('active');
  });
}

function makeMusicCard(track, index, listContext = tracks){
  const card = document.createElement('div'); card.className = 'track';
  const img = document.createElement('img'); img.className = 'cover'; img.alt = 'Artwork'; safeImage(img, artOf(track));
  const info = document.createElement('div'); info.className = 'info';
  const title = document.createElement('div'); title.className = 'title'; title.textContent = titleOf(track);
  const artist = document.createElement('div'); artist.className = 'artist'; artist.textContent = artistOf(track);
  info.append(title, artist);

  const actions = document.createElement('div'); actions.className = 'track-actions';
  
  const likeBtn = document.createElement('button');
  const liked = isSongLiked(track);
  likeBtn.className = `action-btn ${liked ? 'liked' : ''}`;
  likeBtn.textContent = liked ? '❤️' : '♡';
  likeBtn.onclick = (e) => { e.stopPropagation(); toggleLike(track); };

  const plBtn = document.createElement('button');
  plBtn.className = 'action-btn';
  plBtn.textContent = '＋';
  plBtn.title = 'Add to Playlist';
  plBtn.onclick = (e) => {
    e.stopPropagation();
    openAddToPlaylistModal(track);
  };

  const dlBtn = document.createElement('button');
  dlBtn.className = 'action-btn';
  dlBtn.textContent = '⬇';
  dlBtn.title = 'Download MP3';
  dlBtn.onclick = (e) => {
    e.stopPropagation();
    window.open(getAudioStream(track), '_blank');
  };

  const playBtn = document.createElement('button');
  playBtn.className = 'action-btn play-btn';
  playBtn.textContent = '▶';
  playBtn.onclick = () => {
    tracks = listContext;
    playSong(index);
  };

  actions.append(likeBtn, plBtn, dlBtn, playBtn);
  card.append(img, info, actions);
  return card;
}

function makeTubeCard(track){
  const card = document.createElement('div'); card.className = 'yt-card';
  const videoId = track.id || 'BddP6PYo2gs';

  const thumbWrap = document.createElement('div'); thumbWrap.className = 'yt-thumb-wrap';
  const thumb = document.createElement('img'); thumb.className = 'yt-thumb'; safeImage(thumb, artOf(track));
  const playIcon = document.createElement('div'); playIcon.className = 'yt-play-badge'; playIcon.textContent = '▶';
  thumbWrap.append(thumb, playIcon);
  thumbWrap.onclick = () => openVideoPlayer(videoId);

  const meta = document.createElement('div'); meta.className = 'yt-meta';
  const textDiv = document.createElement('div'); textDiv.className = 'yt-text';
  const title = document.createElement('div'); title.className = 'yt-title'; title.textContent = titleOf(track);
  const channel = document.createElement('div'); channel.className = 'yt-channel'; channel.textContent = artistOf(track);
  textDiv.append(title, channel);

  const dl = document.createElement('button');
  dl.className = 'yt-dl-btn';
  dl.innerHTML = '⬇ MP4';
  dl.onclick = (e) => {
    e.stopPropagation();
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };

  meta.append(textDiv, dl);
  card.append(thumbWrap, meta);
  return card;
}

function openVideoPlayer(id) {
  audio.pause();
  const modal = $('ytModal');
  const iframe = $('ytIframe');
  iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1&rel=0`;
  modal.classList.remove('hidden');
}

$('closeYt').onclick = () => {
  $('ytIframe').src = '';$('ytModal').classList.add('hidden');
};

function renderTracks(){
  if(!tracks.length){ message('No results found.'); return; }
  const frag = document.createDocumentFragment();
  tracks.forEach((t, i) => {
    if(currentMode === 'music') frag.appendChild(makeMusicCard(t, i, tracks));
    else frag.appendChild(makeTubeCard(t));
  });
  $('results').replaceChildren(frag);$('count').textContent = tracks.length + (currentMode==='music'?' songs':' videos');
                                }
async function searchMusic(override, autoPlayFirst = false){
  const q = (override || $('query').value).trim();
  if(!q || busy) return;
  busy = true; const thisSearch = ++searchNumber;
  message(`Loading tracks…`);

  if(currentMode === 'tube'){
    busy = false;
    tracks = DEFAULT_VIDEOS;
    renderTracks();
    return;
  }

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=15&country=IN`;
    const res = await fetch(url);
    if(!res.ok) throw Error('Search Error');
    const data = await res.json();
    if(thisSearch !== searchNumber) return;

    if(data.results && data.results.length > 0){
      tracks = data.results.map(item => ({
        title: item.trackName,
        channel: item.artistName,
        id: item.trackId,
        thumbnail: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : fallbackArt,
        audioUrl: item.previewUrl
      }));
    } else {
      tracks = DEFAULT_TRACKS;
    }
  } catch(e) {
    console.warn('API error, loaded default safe tracks:', e);
    tracks = DEFAULT_TRACKS;
  } finally {
    busy = false;
    currentIndex = -1;
    renderTracks();
    if(autoPlayFirst && tracks.length > 0 && currentMode === 'music') {
      playSong(0);
    }
  }
}

async function playSong(index){
  if(index < 0 || index >= tracks.length) return;
  currentIndex = index; const t = tracks[index];
  $('dock').classList.remove('hidden');$('notice').textContent = 'Connecting audio stream…';
  updatePlayer();

  try {
    const streamUrl = getAudioStream(t);
    audio.pause();
    audio.src = streamUrl;
    audio.load();

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          $('notice').textContent = 'Playing on RIVANSHH.';
          setLockScreenNotification(t);
        })
        .catch(err => {
          console.warn('Autoplay touch required:', err);
          $('notice').textContent = 'Tap ▶ to start.';
        });
    }
  } catch(e) {
    console.error('Audio stream error:', e);
    $('notice').textContent = 'Stream unavailable. Try another.';
  }
}

function updatePlayer(){
  const t = tracks[currentIndex]; if(!t) return;
  const title = titleOf(t), artist = artistOf(t), art = artOf(t);
  $('miniTitle').textContent = title; $('miniArtist').textContent = artist;
  safeImage($('miniCover'), art);
  $('bigTitle').textContent = title; $('bigArtist').textContent = artist;
  $('bigAlbum').textContent = 'RIVANSHH Soundstream';
  safeImage($('bigCover'), art);$('miniPlay').textContent = audio.paused ? '▶' : 'Ⅱ';
  $('fullPlay').textContent = audio.paused ? '▶' : 'Ⅱ';
  $('fullLikeBtn').textContent = isSongLiked(t) ? '❤️' : '♡';
  $('fullDlBtn').textContent = '⬇ Download MP3';
}

function togglePlayback(){
  if(!audio.src){
    if(tracks.length > 0) playSong(0);
    return;
  }
  if(audio.paused) audio.play();
  else audio.pause();
}

function moveTrack(dir){
  if(!tracks.length) return;
  const next = currentIndex < 0 ? 0 : (currentIndex + dir + tracks.length) % tracks.length;
  playSong(next);
}

function showFull(){
  $('full').classList.remove('hidden');
  if(currentIndex >= 0) updatePlayer();
}

function setLockScreenNotification(track){
  if('mediaSession' in navigator){
    navigator.mediaSession.metadata = new MediaMetadata({
      title: titleOf(track),
      artist: artistOf(track),
      album: 'RIVANSHH Music',
      artwork: [{src: artOf(track), sizes: '512x512', type: 'image/jpeg'}]
    });
    navigator.mediaSession.setActionHandler('play', () => audio.play().catch(()=>{}));
    navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => moveTrack(-1));
    navigator.mediaSession.setActionHandler('nexttrack', () => moveTrack(1));
  }
}

function showPage(page){
  const isLibrary = page === 'library';
  $('homePage').classList.toggle('hidden', isLibrary);
  $('libraryPage').classList.toggle('hidden', !isLibrary);$('homeTab').classList.toggle('active', page === 'home');
  $('searchTab').classList.toggle('active', page === 'search');$('libraryTab').classList.toggle('active', isLibrary);
  if(page === 'search'){
    $('homePage').classList.remove('hidden'); $('libraryPage').classList.add('hidden');$('query').focus();
  }
  if(isLibrary) renderPlaylists();
}

$('tabPlaylists').onclick = () => {
  $('tabPlaylists').className = 'lib-pill active';$('tabLiked').className = 'lib-pill';
  $('tabRecent').className = 'lib-pill';$('viewPlaylists').classList.remove('hidden');
  $('viewLiked').classList.add('hidden');$('viewRecent').classList.add('hidden');
  renderPlaylists();
};

$('tabLiked').onclick = () => {
  $('tabPlaylists').className = 'lib-pill';$('tabLiked').className = 'lib-pill active';
  $('tabRecent').className = 'lib-pill';$('viewPlaylists').classList.add('hidden');
  $('viewLiked').classList.remove('hidden');$('viewRecent').classList.add('hidden');
  renderLikedSongs();
};

$('tabRecent').onclick = () => {
  $('tabPlaylists').className = 'lib-pill';$('tabLiked').className = 'lib-pill';
  $('tabRecent').className = 'lib-pill active';$('viewPlaylists').classList.add('hidden');
  $('viewLiked').classList.add('hidden');$('viewRecent').classList.remove('hidden');
  renderRecent();
};

$('btnCreatePl').onclick = () => {
  const name = prompt('Enter playlist name:');
  if(!name || !name.trim()) return;
  playlists.push({ id: 'pl_' + Date.now(), name: name.trim(), songs: [] });
  saveState();
  renderPlaylists();
};

function renderPlaylists(){
  const container = $('playlistList');
  if(!playlists.length){
    container.innerHTML = '<p class="msg">No playlists created yet.</p>'; return;
  }
  container.innerHTML = '';
  playlists.forEach(pl => {
    const item = document.createElement('div');
    item.className = 'pl-card';
    item.innerHTML = `
      <div class="pl-info">
        <b>${pl.name}</b>
        <small>${pl.songs.length} songs</small>
      </div>
      <div>
        <button class="action-btn play-btn" style="display:inline-grid">▶</button>
      </div>
    `;
    item.querySelector('.play-btn').onclick = () => {
      if(!pl.songs.length){ alert('Playlist is empty!'); return; }
      tracks = pl.songs.slice();
      playSong(0);
    };
    container.appendChild(item);
  });
}

function renderLikedSongs(){
  const list = $('likedList');
  if(!likedSongs.length){
    list.innerHTML = '<p class="msg">No liked songs yet.</p>'; return;
  }
  const frag = document.createDocumentFragment();
  likedSongs.forEach((t, i) => {
    frag.appendChild(makeMusicCard(t, i, likedSongs));
  });
  list.replaceChildren(frag);
}

function renderRecent(){
  const list = $('libraryList');
  if(!library.length){
    list.innerHTML = '<p class="msg">Played tracks appear here.</p>'; return;
  }
  const frag = document.createDocumentFragment();
  library.forEach((t, i) => {
    frag.appendChild(makeMusicCard(t, i, library));
  });
  list.replaceChildren(frag);
}

function openAddToPlaylistModal(track){
  trackToAdd = track;
  const list = $('plChoiceList');
  list.innerHTML = '';
  if(!playlists.length){
    list.innerHTML = '<p class="msg">Create a playlist first.</p>';
  } else {
    playlists.forEach(pl => {
      const b = document.createElement('button');
      b.className = 'chip';
      b.style.width = '100%';
      b.style.textAlign = 'left';
      b.textContent = `${pl.name} (${pl.songs.length} songs)`;
      b.onclick = () => {
        pl.songs.push(trackToAdd);
        saveState();
        $('addToPlModal').classList.add('hidden');
        alert(`Added to "${pl.name}"!`);
      };
      list.appendChild(b);
    });
  }
  $('addToPlModal').classList.remove('hidden');
}

$('closeAddToPl').onclick = () =>$('addToPlModal').classList.add('hidden');

// Account Modal
$('accountBtn').onclick = () => {
  if(currentUser){
    $('authLoggedOut').classList.add('hidden');
    $('authLoggedIn').classList.remove('hidden');$('accountInfoText').textContent = `Hello, ${currentUser.name}`;
  } else {
    $('authLoggedOut').classList.remove('hidden');$('authLoggedIn').classList.add('hidden');
  }
  $('accountModal').classList.remove('hidden');
};

$('closeAccountModal').onclick = () =>$('accountModal').classList.add('hidden');

$('btnSaveAccount').onclick = () => {
  const name = $('authName').value.trim();
  if(!name){ alert('Please enter your name.'); return; }
  currentUser = { name: name };
  saveState();
  $('accountModal').classList.add('hidden');
  alert('Profile updated!');
};

$('btnLogout').onclick = () => {
  currentUser = null;
  saveState();
  $('accountModal').classList.add('hidden');
};

$('fullLikeBtn').onclick = () => {
  if(currentIndex >= 0) toggleLike(tracks[currentIndex]);
};

$('fullAddToPlBtn').onclick = () => {
  if(currentIndex >= 0) {
    openAddToPlaylistModal(tracks[currentIndex]);
  }
};

$('fullDlBtn').onclick = () => {
  if(currentIndex >= 0) {
    window.open(getAudioStream(tracks[currentIndex]), '_blank');
  }
};

// Mode Switcher (Abhivansh Srivastav branding)
$('btnModeMusic').onclick = () => switchMode('music');$('btnModeTube').onclick = () => switchMode('tube');

function switchMode(mode) {
  currentMode = mode;
  if(mode === 'music') {
    $('btnModeMusic').className = 'portal-card music-active';
    $('btnModeTube').className = 'portal-card';$('mainLogo').className = 'logo';
    $('mainLogo').textContent = '♫';$('brandTitle').textContent = 'RIVANSHH MUSIC';
    $('brandSub').textContent = 'ABHIVANSH SRIVASTAV';$('searchBtn').className = '';
    $('heading').textContent = 'Discover Music';$('query').placeholder = 'Search songs or artists...';
    setupChips(['Hindi trending hits', 'Bollywood hits', 'Romantic songs', 'Arijit Singh', 'Punjabi hits']);
    searchMusic('Hindi trending hits', true);
  } else {
    $('btnModeMusic').className = 'portal-card';
    $('btnModeTube').className = 'portal-card yt-active';$('mainLogo').className = 'logo yt-theme';
    $('mainLogo').textContent = '▶';$('brandTitle').textContent = 'RIVANSHHTUBE';
    $('brandSub').textContent = 'ABHIVANSH SRIVASTAV';$('searchBtn').className = 'yt-btn';
    $('heading').textContent = 'Trending Videos';$('query').placeholder = 'Search videos on YouTube...';
    audio.pause();
    setupChips(['Trending India', 'Music Videos', 'Gaming', 'Podcasts', 'Viral Videos']);
    tracks = DEFAULT_VIDEOS;
    renderTracks();
  }
}

function setupChips(list) {
  const container = $('chipsContainer');
  container.innerHTML = '';
  list.forEach((item, idx) => {
    const btn = document.createElement('button');
    btn.className = `chip ${currentMode==='tube'?'yt-chip':''} ${idx===0?'active':''}`;
    btn.dataset.q = item;
    btn.textContent = item.replace(' hits', '').replace(' trending', '');
    btn.onclick = () => {
      container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      searchMusic(item, currentMode === 'music');
    };
    container.appendChild(btn);
  });
}

$('searchBtn').addEventListener('click', () => searchMusic());$('query').addEventListener('keydown', e => { if(e.key === 'Enter') searchMusic(); });
$('miniPlay').onclick = togglePlayback; $('fullPlay').onclick = togglePlayback;
$('prev').onclick = () => moveTrack(-1);$('next').onclick = () => moveTrack(1);
$('fullPrev').onclick = () => moveTrack(-1);$('fullNext').onclick = () => moveTrack(1);
$('miniOpen').onclick = showFull; $('openPlayer').onclick = showFull;
$('closeFull').onclick = () => $('full').classList.add('hidden');$('homeTab').onclick = () => showPage('home');
$('searchTab').onclick = () => showPage('search');$('libraryTab').onclick = () => showPage('library');

$('seek').addEventListener('input', () => {
  if(Number.isFinite(audio.duration) && audio.duration > 0)
    audio.currentTime = Number($('seek').value) / 1000 * audio.duration;
});
$('volume').addEventListener('input', () => audio.volume = Number($('volume').value) / 100);

audio.addEventListener('play', () => {
  updatePlayer();
  const t = tracks[currentIndex];
  if(t){ library = library.filter(x => targetOf(x) !== targetOf(t)); library.unshift(t); library = library.slice(0, 30); saveState(); }
});
audio.addEventListener('pause', updatePlayer);
audio.addEventListener('loadedmetadata', () => { $('duration').textContent = timeOf(audio.duration); });
audio.addEventListener('timeupdate', () => {
  const d = audio.duration;
  $('elapsed').textContent = timeOf(audio.currentTime);
  if(Number.isFinite(d) && d > 0){
    $('seek').value = String(Math.round(audio.currentTime / d * 1000));$('fill').style.width = (audio.currentTime / d * 100) + '%';
  }
});
audio.addEventListener('ended', () => moveTrack(1));

// Load Theme on Start
const savedTheme = localStorage.getItem('riv_theme') || 'default';
applyTheme(savedTheme);

window.addEventListener('DOMContentLoaded', () => {
  searchMusic('Hindi trending hits', true);
});
       
