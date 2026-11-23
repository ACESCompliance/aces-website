// Shared site scripts (2026-11-22)
// Email shown in the footer, assembled in the browser so scrapers miss it.
(function(){
  var u='nalsharife',d='acescompliancesystems.com',e=u+'@'+d;
  var link=document.getElementById('footer-email-link');
  if(link){link.textContent=e;link.href='mai'+'lto:'+e;}
})();

// Mobile menu toggle.
(function(){
  var nav=document.querySelector('.nav');
  var burger=document.getElementById('nav-burger');
  var menu=document.getElementById('nav-menu');
  if(!nav||!burger||!menu) return;
  function setOpen(open){
    nav.classList.toggle('open',open);
    burger.classList.toggle('open',open);
    burger.setAttribute('aria-expanded',open?'true':'false');
  }
  burger.addEventListener('click',function(){ setOpen(!nav.classList.contains('open')); });
  Array.prototype.forEach.call(menu.querySelectorAll('a'),function(a){
    a.addEventListener('click',function(){ setOpen(false); });
  });
})();
