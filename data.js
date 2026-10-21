'use strict';
/* ===================================================
   👇 UPI DETAILS 👇
=================================================== */
const MY_UPI_ID = 'anurag1983@fam'; 
const MY_UPI_NAME = 'RIVANSHH MUSIC';
const AMOUNT = 0; 
/* =================================================== */

const $ = id => document.getElementById(id);
const audio = $('audio');
const fallbackArt = 'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><defs><linearGradient id="g"><stop stop-color="#135c4b"/><stop offset="1" stop-color="#15263f"/></linearGradient></defs><rect width="300" height="300" rx="25" fill="url(#g)"/><text x="150" y="185" font-size="115" text-anchor="middle" fill="#39ed9a">♫</text></svg>');

// Guaranteed Playable Trending Tracks
const BACKUP_TRACKS = [
  {
    title: 'Kesariya',
    channel: 'Arijit Singh, Pritam',
    id: 'BddP6PYo2gs',
    thumbnail: 'https://c.saavncdn.com/191/Kesariya-From-Brahmastra-Hindi-2022-20220717092820-500x500.jpg',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=romantic-ambient-112343.mp3'
  },
  {
    title: 'Apna Bana Le',
    channel: 'Arijit Singh, Sachin-Jigar',
    id: 'ElZfdU54Cp8',
    thumbnail: 'https://c.saavncdn.com/815/Bhediya-Hindi-2023-20230713175711-500x500.jpg',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f77cd0.mp3?filename=lofi-study-112191.mp3'
  },
  {
    title: 'Raataan Lambiyan',
    channel: 'Jubin Nautiyal, Tanishk Bagchi',
    id: 'gvyUuxdRdR4',
    thumbnail: 'https://c.saavncdn.com/238/Shershaah-Original-Motion-Picture-Soundtrack--Hindi-2021-20210815181610-500x500.jpg',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=relaxed-vlog-night-street-131746.mp3'
  },
  {
    title: 'Maan Meri Jaan',
    channel: 'King',
    id: 'VuG7FT9fZ4A',
    thumbnail: 'https://c.saavncdn.com/734/Champagne-Talk-Hindi-2022-20221008011951-500x500.jpg',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=chill-abstract-intention-12099.mp3'
  }
];

let currentUser = JSON.parse(localStorage.getItem('riv_user') || 'null');
let playlists = JSON.parse(localStorage.getItem('riv_playlists') || '[]');
let likedSongs = JSON.parse(localStorage.getItem('riv_liked') || '[]');
let library = JSON.parse(localStorage.getItem('riv_recent') || '[]');

let currentMode = 'music';
let tracks = [], currentIndex = -1, busy = false, searchNumber = 0;
let hasUserInteracted = false;
let trackToAdd = null;

function saveState(){
  localStorage.setItem('riv_user', JSON.stringify(currentUser));
  localStorage.setItem('riv_playlists', JSON.stringify(playlists));
  localStorage.setItem('riv_liked', JSON.stringify(likedSongs));
  localStorage.setItem('riv_recent', JSON.stringify(library));
  refreshUserUI();
}

function refreshUserUI(){
  if(currentUser && currentUser.isPremium){
    $('premBadge').classList.remove('hidden');$('accountTierText').textContent = 'VIP PREMIUM 👑';
  } else {
    $('premBadge').classList.add('hidden');$('accountTierText').textContent = 'FREE TIER';
  }
}

function text(v, f=''){return typeof v==='string'||typeof v==='number'?String(v):f}
function titleOf(t){return text(t.title||t.name,'Unknown Title')}
function artistOf(t){
  if(t.primaryArtists) return t.primaryArtists;
  return text(t.channel||t.artist||t.author,'Unknown Artist');
}
function targetOf(t){return t.id||t.link||t.url||titleOf(t)}
function timeOf(s){if(!Number.isFinite(s)||s<0)return'0:00';return Math.floor(s/60)+':'+Math.floor(s%60).toString().padStart(2,'0')}

function artOf(t){
  if(t.image && Array.isArray(t.image)){
    const high = t.image.find(i => i.quality === '500x500') || t.image[t.image.length - 1];
    if(high && high.link) return high.link;
  }
  const x = t.thumbnail||t.thumbnails||t.albumArt;
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
  if(track.downloadUrl && Array.isArray(track.downloadUrl)){
    const best = track.downloadUrl.find(d => d.quality === '320kbps') || track.downloadUrl[track.downloadUrl.length - 1];
    if(best && best.link) return best.link;
  }
  if(track.audioUrl) return track.audioUrl;
  return `https://api.riteshyt.in/download?query=${encodeURIComponent(targetOf(track))}&dl_type=audio&ext=mp3&api_key=riteshfree900bfd96adabe73bae45f2a7`;
}

function getDownloadUrl(target, isVideo = false) {
  const type = isVideo ? 'video' : 'audio';
  const ext = isVideo ? 'mp4' : 'mp3';
  return `https://api.riteshyt.in/download?query=${encodeURIComponent(target)}&dl_type=${type}&ext=${ext}&api_key=riteshfree900bfd96adabe73bae45f2a7`;
}

function checkPremiumAccess(actionCallback){
  if(currentUser && currentUser.isPremium){
    actionCallback();
  } else {
    openPaymentModal();
  }
}

function openPaymentModal(){
  const upiUrl = `upi://pay?pa=${MY_UPI_ID}&pn=${encodeURIComponent(MY_UPI_NAME)}&am=${AMOUNT}&cu=INR&tn=Rivanshh_VIP_Pass`;
  const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;
  
  $('upiQrImg').src = qrApi;
  $('displayUpiId').textContent = MY_UPI_ID;
  $('btnDirectUpiApp').href = upiUrl;
  $('premiumModal').classList.remove('hidden');
}
