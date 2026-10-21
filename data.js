'use strict';
/* ===================================================
   👇 UPI DETAILS CONFIGURED 👇
=================================================== */
const MY_UPI_ID = 'anurag1983@fam'; 
const MY_UPI_NAME = 'RIVANSHH MUSIC';
const AMOUNT = 0; 
/* =================================================== */

const API_BASE = 'https://api.riteshyt.in';
const API_KEY = 'riteshfree900bfd96adabe73bae45f2a7';
const $ = id => document.getElementById(id);
const audio = $('audio');
const fallbackArt = 'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><defs><linearGradient id="g"><stop stop-color="#135c4b"/><stop offset="1" stop-color="#15263f"/></linearGradient></defs><rect width="300" height="300" rx="25" fill="url(#g)"/><text x="150" y="185" font-size="115" text-anchor="middle" fill="#39ed9a">♫</text></svg>');

const BACKUP_TRACKS = [
  {
    title: 'Kesariya',
    channel: 'Arijit Singh, Pritam',
    id: 'BddP6PYo2gs',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300'
  },
  {
    title: 'Apna Bana Le',
    channel: 'Arijit Singh, Sachin-Jigar',
    id: 'ElZfdU54Cp8',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300'
  },
  {
    title: 'Raataan Lambiyan',
    channel: 'Jubin Nautiyal, Tanishk Bagchi',
    id: 'gvyUuxdRdR4',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300'
  },
  {
    title: 'Maan Meri Jaan',
    channel: 'King',
    id: 'VuG7FT9fZ4A',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'
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
function titleOf(t){return text(t.title,'Unknown Title')}
function artistOf(t){return text(t.channel||t.artist||t.author,'Unknown Artist')}
function targetOf(t){return t.id||t.link||t.url||titleOf(t)}
function timeOf(s){if(!Number.isFinite(s)||s<0)return'0:00';return Math.floor(s/60)+':'+Math.floor(s%60).toString().padStart(2,'0')}

function artOf(t){
  const x = t.albumArt||t.thumbnail||t.thumbnails||t.image;
  if(typeof x==='string'&&/^https?:\/\//i.test(x)) return x;
  if(Array.isArray(x)){const a = x.find(v=>v&&typeof v.url==='string'&&/^https?:\/\//i.test(v.url)); if(a) return a.url;}
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

function getDownloadUrl(target, isVideo = false) {
  const type = isVideo ? 'video' : 'audio';
  const ext = isVideo ? 'mp4' : 'mp3';
  return `${API_BASE}/download?query=${encodeURIComponent(target)}&dl_type=${type}&ext=${ext}&api_key=${encodeURIComponent(API_KEY)}`;
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
  
