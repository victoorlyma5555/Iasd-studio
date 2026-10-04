// Known regression: intentionally fails until account isolation is fixed.
// Real browser script, fake storage and Supabase. No network or real accounts.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('switching accounts must not upload the previous account notes',async()=>{
  const values=new Map(), writes=[], intervals=[], timers=[];
  let authChanged, current={id:'account-a'};
  const originalNote={x:'Private note belonging to account A',t:10};
  values.set('iasd-notes-v1',JSON.stringify({'john|1|1':originalNote}));
  values.set('iasd-hl-v1','{}');
  const cloud={
    auth:{onAuthStateChange(fn){authChanged=fn;return {data:{subscription:{unsubscribe(){}}}};}},
    from(table){
      assert.equal(table,'iasd_bible_data');
      return {
        select(){return this;},eq(){return this;},
        async maybeSingle(){return {data:null,error:null};},
        async upsert(row){writes.push(JSON.parse(JSON.stringify(row)));return {error:null};}
      };
    }
  };
  const context={
    console,localStorage:{
      getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)
    },
    setInterval:fn=>{intervals.push(fn);return intervals.length;},clearInterval(){},clearTimeout(){},
    setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length;},
    document:{addEventListener(){},createElement(){return {};},head:{appendChild(){}},body:{classList:{remove(){}}}},
    IASDPages:{hlApply(){},rdPaint(){}}
  };
  context.window=context;
  context.iasdCloud=cloud;
  context.iasdCurrentUser=()=>current;
  vm.runInNewContext(fs.readFileSync(new URL('../ui/bible-plus.js',import.meta.url),'utf8'),context);
  intervals[0]();
  await timers.find(x=>x.ms===1200).fn();
  writes.length=0;
  current=null;
  authChanged('SIGNED_OUT',null);
  current={id:'account-b'};
  authChanged('SIGNED_IN',{user:current});
  await timers.findLast(x=>x.ms===400).fn();
  await Promise.resolve();
  const leak=writes.some(row=>row.user_id==='account-b'&&row.notes['john|1|1']?.x===originalNote.x);
  assert.equal(leak,false,'Account A notes were uploaded to account B');
});
