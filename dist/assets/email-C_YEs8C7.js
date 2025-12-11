import{c as s}from"./index-fNQUHhi2.js";/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i=s("Loader",[["path",{d:"M12 2v4",key:"3427ic"}],["path",{d:"m16.2 7.8 2.9-2.9",key:"r700ao"}],["path",{d:"M18 12h4",key:"wj9ykh"}],["path",{d:"m16.2 16.2 2.9 2.9",key:"1bxg5t"}],["path",{d:"M12 18v4",key:"jadmvz"}],["path",{d:"m4.9 19.1 2.9-2.9",key:"bwix9q"}],["path",{d:"M2 12h4",key:"j09sii"}],["path",{d:"m4.9 4.9 2.9 2.9",key:"giyufr"}]]),c=t=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t),r=t=>{const a=/^(\+90|0)?5\d{9}$/,e=t.replace(/\s/g,"");return a.test(e)};async function d(t,a){try{const e=await fetch("/api/send-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"partner_submission",toEmail:t,payload:a})});if(!e.ok){const n=await e.text().catch(()=>"");console.warn("✉️ [Email] API responded non-OK:",e.status,n)}}catch(e){console.warn("✉️ [Email] API call failed; continuing silently:",e)}}export{i as L,c as a,d as s,r as v};
