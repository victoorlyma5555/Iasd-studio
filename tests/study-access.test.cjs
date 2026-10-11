const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');

function fixture({manager=false,anonymous=false,studyPermission=false}={}){
 const reads=[],rpcCalls=[],local=new Map([['iasd-study-seed','ovdd']]);
 const rows=[{id:'course-1',owner:'founder',title:'Curso público',description:'',lessons:[],created_at:'2026-01-01',updated_at:'2026-01-01'}];
 const courseQuery={select(){return this},order(){return Promise.resolve({data:rows,error:null})},eq(){return this},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({error:null}),then(resolve){resolve({data:rows,error:null})}};
 const ctx={console,cloudRole:manager?'founder':'member',document:{getElementById:()=>null,querySelectorAll:()=>[],addEventListener(){},body:{classList:{remove(){},toggle(){}}}},localStorage:{getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v)},sessionStorage:{getItem:()=>null,setItem(){}},Date,Math,JSON,crypto:require('node:crypto').webcrypto,setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},URLSearchParams,location:{search:''},Event:class{},window:{iasdCloud:{from:t=>(reads.push(t),courseQuery),rpc:async name=>{rpcCalls.push(name);return{data:rows,error:null}}},iasdCurrentUser:()=>({id:'account-1',is_anonymous:anonymous}),IASDAccess:{canStudy:()=>manager||studyPermission,canManage:()=>manager},addEventListener(){},dispatchEvent(){}}};ctx.IASDAccess=ctx.window.IASDAccess;
 let source=fs.readFileSync(path.join(__dirname,'../ui/estudo.js'),'utf8');
 source=source.replace('window.IASDEstudoCore={','window.testStudy={isMember,isF,homeHTML,courseHTML,lessonHTML,load,loadProg,saveProg};window.IASDEstudoCore={');
 vm.runInNewContext(source,ctx);return{ctx,reads,rpcCalls,T:ctx.window.testStudy,S:ctx.window.IASDEstudoCore.S};
}

test('full accounts load the sanitized course catalog through the RPC',async()=>{
 const f=fixture();await f.T.load();assert.deepEqual(f.rpcCalls,['iasd_study_courses_public']);assert.deepEqual(f.reads,[]);assert.equal(f.S.courses[0].title,'Curso público');
});

test('authorized course managers keep the existing editing catalog',async()=>{
 const f=fixture({manager:true});await f.T.load();assert.deepEqual(f.rpcCalls,[]);assert.deepEqual(f.reads,['iasd_study_courses']);
});

test('anonymous sessions do not load the authenticated study catalog',async()=>{
 const f=fixture({anonymous:true});assert.equal(f.T.isMember(),false);await f.T.load();assert.deepEqual(f.rpcCalls,[]);assert.deepEqual(f.reads,[]);
});

test('study permission alone does not expose or execute administrative editing',async()=>{
 const f=fixture({studyPermission:true});await f.T.load();f.S.cid='course-1';
 assert.equal(f.T.isF(),false);assert.deepEqual(f.reads,[]);
 assert.doesNotMatch(f.T.homeHTML(),/Novo curso/);
 assert.doesNotMatch(f.T.courseHTML(),/Editar curso|Importar lições/);
 const before=JSON.stringify(f.S.courses),api=f.ctx.window.IASDEstudo;
 api.setCourse('title','Alterado');api.addLesson();api.delBlock(0);api.moveLesson(0,1);api.toggleEdit();
 await api.newCourse();await api.delCourse();
 assert.equal(JSON.stringify(f.S.courses),before);assert.equal(f.S.edit,false);assert.deepEqual(f.reads,[]);
});
