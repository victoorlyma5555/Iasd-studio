export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
  const q=String(req.query?.q||'').trim();
  if(!q) return res.status(400).json({error:'Digite algo para pesquisar.'});
  if(q.length>120) return res.status(400).json({error:'Pesquisa muito longa.'});
  const key=process.env.YOUTUBE_API_KEY;
  if(!key) return res.status(503).json({error:'YOUTUBE_API_KEY_NOT_CONFIGURED'});
  try{
    const params=new URLSearchParams({
      part:'snippet',
      type:'video',
      videoEmbeddable:'true',
      safeSearch:'moderate',
      maxResults:'12',
      relevanceLanguage:'pt',
      regionCode:'BR',
      q,
      key
    });
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
    })).filter(item=>/^[\\w-]{11}$/.test(item.id||''));
    res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({items});
  }catch(error){
    return res.status(500).json({error:'Não foi possível pesquisar no YouTube agora.'});
  }
}
