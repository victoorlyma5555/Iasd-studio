export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
  const q=String(req.query?.q||'').trim();
  if(!q) return res.status(400).json({error:'Digite algo para pesquisar.'});
  if(q.length>120) return res.status(400).json({error:'Pesquisa muito longa.'});
  const key=process.env.YOUTUBE_API_KEY;
  if(!key) return res.status(503).json({error:'YOUTUBE_API_KEY_NOT_CONFIGURED'});
  try{
    const music=String(req.query?.music||'')==='1';
    const params=new URLSearchParams({
      part:'snippet',
      type:'video',
      videoEmbeddable:'true',
      safeSearch:'moderate',
      maxResults:'15',
      relevanceLanguage:'pt',
      regionCode:'BR',
      q,
      key
    });
    if(music)params.set('videoCategoryId','10');
    const response=await fetch('https://www.googleapis.com/youtube/v3/search?'+params);
    const data=await response.json();
    if(!response.ok){
      const msg=data?.error?.message||'Erro ao consultar o YouTube.';
      return res.status(response.status).json({error:msg});
    }
    const items=(data.items||[]).map(item=>({
      id:item?.id?.videoId,
      title:item?.snippet?.title||'Vídeo do YouTube',
      channel:item?.snippet?.channelTitle||'',
      thumbnail:item?.snippet?.thumbnails?.medium?.url||item?.snippet?.thumbnails?.default?.url||''
    })).filter(item=>/^[\w-]{11}$/.test(item.id||''));
    /* duração (1 unidade de cota a mais): ajuda a escolher entre clipe, versão ao vivo ou 1 hora de pad */
    try{
      const ids=items.map(i=>i.id).join(',');
      if(ids){
        const dp=new URLSearchParams({part:'contentDetails',id:ids,key});
        const dr=await fetch('https://www.googleapis.com/youtube/v3/videos?'+dp);
        const dd=await dr.json();
        const secs={};
        (dd.items||[]).forEach(v=>{
          const m=/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(v?.contentDetails?.duration||'');
          if(m)secs[v.id]=(+m[1]||0)*3600+(+m[2]||0)*60+(+m[3]||0);
        });
        items.forEach(i=>{if(secs[i.id])i.duration=secs[i.id]});
      }
    }catch(e){}
    res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({items});
  }catch(error){
    return res.status(500).json({error:'Não foi possível pesquisar no YouTube agora.'});
  }
}
