!function(t){var e={};function n(a){if(e[a])return e[a].exports;var r=e[a]={i:a,l:!1,exports:{}};return t[a].call(r.exports,r,r.exports,n),r.l=!0,r.exports}n.m=t,n.c=e,n.d=function(t,e,a){n.o(t,e)||Object.defineProperty(t,e,{configurable:!1,enumerable:!0,get:a})},n.r=function(t){Object.defineProperty(t,"__esModule",{value:!0})},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="dist",n(n.s=1)}([function(t,e,n){"use strict";n.r(e);var a={0:"იან",1:"თებ",2:"მარ",3:"აპრ",4:"მაი",5:"ივნ",6:"ივლ",7:"აგვ",8:"სექ",9:"ოქტ",10:"ნოე",11:"დეკ"};var r=class{constructor(){this.date=new Date,this.now=null,this.sDate=null}getNow(){const t=this.date.getMonth()+1,e=this.date.getDate()+1,n=this.date.getFullYear();return this.now=new Date(`${t} ${e},${n}`),this.now}setDate(t=this.now){return this.sDate=new Date(t),this.sDate}getPrevDay(){let t=this.now||this.date;t.setDate(t.getDate()-1),this.setDate(t);let e=this.sDate.getDate(),n=a[this.sDate.getMonth()];return this.sDate=`${e} ${n}`,this.sDate}setFromTo(t,e){const n=new Date(t),r=n.getMonth();let s=[];s.push({day:n.getDate(),month:a[r]});for(let t=0;t<e;t++)n.setDate(n.getDate()+1),s.push({day:n.getDate(),month:a[n.getMonth()]});return s}};const s={from:[60,100,130,160,190,220,250,280,310,340,370,400,430],to:[99,129,159,189,219,249,279,309,339,369,399,429,460]},i=[{apidra:[12,13,14,15,16,17,18,19,20,21,22,23,24]},{apidra:[17,18,19,20,21,22,23,24,25,26,27,28,29]},{apidra:[16,17,18,19,20,21,22,23,24,25,26,27,28]},{apidra:[2,2,3,4,4,4,4,5,5,6,6,6,7],lantus:[25,26,26,26,26,26,27,27,28,28,28,29,29]},{apidra:[0,0,1,2,2,3,4,4,4,5,5,5,6]}],o=document.querySelector(".add_row"),l=document.querySelector(".set_date"),d=document.querySelector(".modal"),u=document.querySelector(".print"),c=document.querySelector("tbody"),p=document.querySelector(".save_btn"),h=document.querySelector(".load_btn"),f=document.querySelectorAll("button"),g=60,m=460;let y=new r;function v(t,e){let n=s.from.length,a=this.firstChild.value||t,r=null;for(let a=0;a<n;a++)t<=s.to[a]&&t>=s.from[a]&&(r=void 0!==i[e].lantus?{apidra:i[e].apidra[a],lantus:i[e].lantus[a]}:i[e].apidra[a]);return a||(this.innerHTML+=""),this.innerHTML="object"==typeof r&&r?`\n                   <span>${a}</span>\n                   <span class="apidra">${r.apidra}</span>\n                   <span class="lantus">${r.lantus}</span>\n                   \n        `:void 0!==r&&r?`\n                   <span>${a}</span>\n                   <span class="apidra">${r}</span>\n                   `:`<span>${a}</span>`}function b(t){let e=document.createElement("tr"),n=0;for(let a=0;a<6;a++){let r=document.createElement("th");0===a?r.textContent="string"==typeof t?t:y.getPrevDay():(r.className="dose",r.setAttribute("data-index",n++),r.innerHTML='<input type="text">'),e.className="data",e.appendChild(r)}e.addEventListener("dblclick",t=>{let e="th"==t.target.localName,n=""==t.target.className;if(e&&n)return t.target.parentNode.remove()}),c.appendChild(e),document.querySelectorAll(".dose").forEach(t=>{t.addEventListener("keyup",D),t.addEventListener("dblclick",x)})}function x(t){let e="dose"==t.target.className?t.target:"apidra"!==t.target.className,n=null,a=null;void 0!==e.children?(n=Number(e.children[0].textContent),a=e.getAttribute("data-index"),e.children[0].innerHTML=`<input type="text" value=${n} data-index=${a}>`):e&&(n=t.target.textContent,a=t.target.parentNode.getAttribute("data-index"),t.target.innerHTML=`<input type="text" value=${n} data-index="${a}">`)}function D(t){let e=t.target,n=Number(e.value),a=t.target.parentNode.getAttribute("data-index")||e.getAttribute("data-index");if(13===t.which&&n>=g&&n<=m)v.call(this,n,a);else if(27===t.which)return this.innerHTML="<span></span>"}y.getNow(),l.addEventListener("click",function(t){t.preventDefault();const e=document.querySelector("#date").value,n=Number(document.querySelector("#durotation").value);if(n&&e&&n>0){let t=e.split("-"),a=`${t[1]} ${t[2]}, ${t[0]}`,r=y.setFromTo(a,n);r.forEach(t=>{let e=`${t.day} ${t.month}`;b(e)}),d.style.display="none"}}),o.addEventListener("click",b),p.addEventListener("click",function(t){let e=document.querySelectorAll('tr[class="data"]'),n=(JSON.parse(localStorage.getItem("sugar")),[]);e.forEach((t,e)=>{let a=Array.prototype.slice.call(t.children),r=a[0].textContent,s=[];a.map((t,e)=>{if(0!==e){let e=t.firstChild.nextSibling||t.firstChild;e&&e.previousElementSibling?s.push(e.previousElementSibling.textContent):e&&e.textContent?s.push(e.textContent):s.push("")}}),n.push({day:r,sugars:s}),localStorage.setItem("sugar",JSON.stringify(n))})}),h.addEventListener("click",function(){const t=JSON.parse(localStorage.getItem("sugar"));let e=[];t&&t.map(t=>{e.push(...t.sugars),function(t,e){b(t);let n=document.querySelectorAll(".dose");e.forEach((t,e)=>{let a=n[e].dataset.index;v.call(n[e],t,a)})}(t.day,e)});this.setAttribute("disabled","disabled")}),u.addEventListener("click",t=>{f.forEach(t=>t.classList.add("hide")),window.print()}),window.onafterprint=(()=>{f.forEach(t=>t.classList.remove("hide"))})},function(t,e,n){n(0),t.exports=n(6)},,,,,function(t,e){}]);