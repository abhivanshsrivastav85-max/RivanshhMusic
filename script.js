// ---------------------------------------------------------------------
// 100% FULL SONG STREAMING ENGINE (Multi-Server Fallback)
// ---------------------------------------------------------------------
const SAAVN_ENDPOINTS = [
  'https://saavn.me/api/search/songs',
  'https://jiosaavn-api-privatecvc2.vercel.app/search/songs',
  'https://saavn-api.vercel.app/search/songs'
];

async function searchMedia(queryText){
  const q = (queryText || $('query').value).trim();
  if(!q) return;
  $('results').innerHTML = `<p class="msg">Searching full songs for "${q}"...</p>`;

  if(currentMode === 'music'){
    let resultsFound = false;

    for(const endpoint of SAAVN_ENDPOINTS){
      try {
        const res = await fetch(`${endpoint}?query=${encodeURIComponent(q)}&limit=25`);
        if(!res.ok) continue;
        const json = await res.json();
        const list = json.data?.results || json.results || (Array.isArray(json.data) ? json.data : null);

        if(list && list.length > 0){
          tracks = list.map(item => {
            let directStream = '';
            
            // Full song direct MP3 URL pick karna (320kbps ya 160kbps)
            if(item.downloadUrl && item.downloadUrl.length > 0){
              const highQuality = item.downloadUrl.find(d => d.quality === '320kbps') || item.downloadUrl[item.downloadUrl.length - 1];
              directStream = highQuality.url || highQuality.link;
            } else if(item.media_url){
              directStream = item.media_url;
            }

            let img = fallbackArt;
            if(item.image && item.image.length > 0){
              const highImg = item.image.find(i => i.quality === '500x500') || item.image[item.image.length - 1];
              img = highImg.url || highImg.link;
            }

            return {
              id: item.id,
              title: (item.name || item.title || '').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&'),
              channel: (item.artists?.primary?.[0]?.name || item.primaryArtists || item.singers || 'Official'),
              thumbnail: img,
              directAudio: directStream
            };
          });

          resultsFound = true;
          break; // Working endpoint milte hi loop stop hoga
        }
      } catch(e) {
        console.warn(`Server ${endpoint} fail ho gaya, agle server par jaa rahe hain...`);
      }
    }

    if(!resultsFound){
      $('results').innerHTML = `<p class="msg">Server busy hai ya gaana nahi mila. Kuch der baad try karein ya naya naam search karein.</p>`;
      return;
    }
  } else {
    // YouTube Search
    try {
      const ytRes = await fetch(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(q)}&filter=videos`);
      const ytJson = await ytRes.json();
      if(ytJson.items && ytJson.items.length > 0){
        tracks = ytJson.items.map(item => ({
          id: item.url.replace('/watch?v=', ''),
          title: item.title,
          channel: item.uploaderName || 'Official',
          thumbnail: item.thumbnail,
          directAudio: ''
        }));
      }
    } catch(err) {
      console.warn("YouTube search error:", err);
    }
  }

  renderTracks();
                                }
function getStreamableAudioUrl(track){
  if(track.directAudio && track.directAudio.length > 10){
    return track.directAudio;
  }
  return '';
                                                        }
