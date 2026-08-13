export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'POST only'});
  if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:'OPENAI_API_KEY is not configured'});
  try{
    const {image,question,context}=req.body||{};
    if(!image||typeof image!=='string') return res.status(400).json({error:'image is required'});
    const prompt=question
      ? `Answer the user's question about the image. The prior identification was ${context?.title||'unknown'}. Be concise, accurate, friendly, and avoid inventing facts. If the question is religious, distinguish visual facts from interpretation. User question: ${question}`
      : `Identify the most visually salient object or subject in this image. Return a short useful description and 2-5 factual tags. Do not identify private people or infer sensitive personal traits. If it is a person, describe them generically (for example, "person wearing a blue shirt") rather than naming them. If the image is unclear, say so.`;
    const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',input:[{role:'user',content:[{type:'input_text',text:prompt},{type:'input_image',image_url:image,detail:'low'}]}],max_output_tokens:300})});
    const raw=await response.text();if(!response.ok)return res.status(response.status).send(raw);
    const data=JSON.parse(raw);const text=data.output_text||data.output?.flatMap(x=>x.content||[]).map(x=>x.text||'').join('')||'';
    if(question) return res.status(200).json({answer:text});
    let parsed;try{parsed=JSON.parse(text)}catch{parsed={title:'I see something',description:text,icon:'✦',confidence:'AI',facts:[]}}
    return res.status(200).json(parsed);
  }catch(e){console.error(e);return res.status(500).json({error:'Vision request failed'});}
}
