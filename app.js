const $ = id => document.getElementById(id);
const audio = $('audio');
let songs = [];
let currentIndex = -1;
let toastTimer;

function toast(message){
  const el=$('toast'); el.textContent=message; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),2200);
}
function time(seconds){
  if(!Number.isFinite(seconds)) return '0:00';
  return `${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
}
function cleanName(name){return name.replace(/\.[^/.]+$/,'').replace(/[_-]+/g,' ').trim()||'Sin título';}

function render(){
  $('songCount').textContent=`${songs.length} ${songs.length===1?'canción':'canciones'}`;
  $('emptyState').hidden=songs.length>0;
  $('songList').innerHTML='';
  songs.forEach((song,index)=>{
    const row=document.createElement('div'); row.className='song';
    const art=document.createElement('div'); art.className='song-art'; art.textContent='♫';
    const details=document.createElement('div'); details.className='song-details';
    const title=document.createElement('strong'); title.textContent=song.title;
    const artist=document.createElement('span'); artist.textContent='Archivo de tu dispositivo';
    details.append(title,artist);
    const play=document.createElement('button'); play.className='song-play'; play.textContent='▶'; play.setAttribute('aria-label',`Reproducir ${song.title}`);
    play.addEventListener('click',()=>playSong(index));
    row.append(art,details,play); row.addEventListener('dblclick',()=>playSong(index));
    $('songList').append(row);
  });
}
function playSong(index){
  if(index<0||index>=songs.length)return;
  currentIndex=index;
  const song=songs[index];
  audio.src=song.url;
  $('nowTitle').textContent=song.title;
  $('nowArtist').textContent='Archivo de tu dispositivo';
  audio.play().then(()=>{$('playBtn').textContent='Ⅱ';}).catch(()=>toast('No se pudo reproducir este archivo.'));
  if('mediaSession' in navigator){
    navigator.mediaSession.metadata=new MediaMetadata({title:song.title,artist:'Jostify'});
    navigator.mediaSession.setActionHandler('play',()=>audio.play());
    navigator.mediaSession.setActionHandler('pause',()=>audio.pause());
    navigator.mediaSession.setActionHandler('previoustrack',previous);
    navigator.mediaSession.setActionHandler('nexttrack',next);
  }
}
function previous(){if(!songs.length)return;playSong((currentIndex-1+songs.length)%songs.length)}
function next(){if(!songs.length)return;playSong((currentIndex+1)%songs.length)}
function addFiles(fileList){
  const files=[...fileList].filter(file=>file.type.startsWith('audio/'));
  if(!files.length){toast('No encontré archivos de audio.');return;}
  files.forEach(file=>songs.push({title:cleanName(file.name),url:URL.createObjectURL(file)}));
  render(); toast(`${files.length} ${files.length===1?'canción añadida':'canciones añadidas'}`);
}
function chooseFiles(){$('filePicker').click()}
$('addBtn').addEventListener('click',chooseFiles);
$('heroAdd').addEventListener('click',chooseFiles);
$('emptyAdd').addEventListener('click',chooseFiles);
$('filePicker').addEventListener('change',event=>{addFiles(event.target.files);event.target.value='';});
$('playBtn').addEventListener('click',()=>{
  if(currentIndex<0){if(songs.length)playSong(0);else chooseFiles();return;}
  if(audio.paused)audio.play();else audio.pause();
});
$('prevBtn').addEventListener('click',previous);
$('nextBtn').addEventListener('click',next);
audio.addEventListener('play',()=>$('playBtn').textContent='Ⅱ');
audio.addEventListener('pause',()=>$('playBtn').textContent='▶');
audio.addEventListener('ended',next);
audio.addEventListener('timeupdate',()=>{
  $('currentTime').textContent=time(audio.currentTime);
  $('duration').textContent=time(audio.duration);
  $('seek').value=audio.duration?Math.round(audio.currentTime/audio.duration*1000):0;
});
$('seek').addEventListener('input',()=>{
  if(audio.duration)audio.currentTime=(Number($('seek').value)/1000)*audio.duration;
});
if('serviceWorker' in navigator && location.protocol.startsWith('http')){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
render();