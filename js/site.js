// istobarton.com — small, dependency-free behavior
(function(){
  // ---- Video links: paste a YouTube or Vimeo embed URL for each clip ----
  var VIDEOS = {
    standup: 'https://www.youtube-nocookie.com/embed/5ZrGBi1fpeI?autoplay=1&rel=0',
    tarot: 'https://www.youtube-nocookie.com/embed/Hp_i8XBTn60?autoplay=1&rel=0',
    tape1: 'https://www.youtube-nocookie.com/embed/ww8J1woyyWw?autoplay=1&rel=0',
    tape2: 'https://www.youtube-nocookie.com/embed/X5a8M_mUsU8?autoplay=1&rel=0',
    tape3: 'https://www.youtube-nocookie.com/embed/D6A7jUnwL_U?autoplay=1&rel=0'
  };

  // Headshot switcher (home page + resume sidebar)
  document.querySelectorAll('[data-switcher]').forEach(function(root){
    var pics = root.querySelectorAll('[data-slide]');
    var dots = root.querySelectorAll('.dots button');
    var quote = root.querySelector('.quote');
    function show(i){
      pics.forEach(function(p,k){ p.classList.toggle('on', k===i); });
      dots.forEach(function(d,k){ d.setAttribute('aria-pressed', k===i ? 'true' : 'false'); });
      if(quote){
        var d = dots[i];
        quote.classList.add('fade');
        setTimeout(function(){
          quote.querySelector('blockquote').textContent = '“' + d.dataset.q + '”';
          quote.querySelector('figcaption').textContent = d.dataset.s;
          quote.style.setProperty('--c', d.style.getPropertyValue('--c'));
          quote.classList.remove('fade');
        }, 180);
      }
    }
    if(root.classList.contains('side') && pics.length > 1){
      var cur = Math.floor(Math.random() * pics.length), timer = null;
      show(cur);
      var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      function start(){ if(!calm && !timer) timer = setInterval(function(){ cur = (cur + 1) % pics.length; show(cur); }, 5000); }
      function stop(){ clearInterval(timer); timer = null; }
      root.addEventListener('mouseenter', stop); root.addEventListener('mouseleave', start);
      root.addEventListener('focusin', stop); root.addEventListener('focusout', start);
      dots.forEach(function(d,k){ ['click','mouseenter','focus'].forEach(function(ev){ d.addEventListener(ev, function(){ cur = k; }); }); });
      start();
    }
    dots.forEach(function(d,k){
      d.addEventListener('click', function(){ show(k); });
      d.addEventListener('mouseenter', function(){ show(k); });
      d.addEventListener('focus', function(){ show(k); });
    });
  });

  // Lightbox for gallery images. Arrows stay inside the section you opened (headshots or on-stage).
  var lb = document.querySelector('.lb');
  if(lb){
    var all = Array.prototype.slice.call(document.querySelectorAll('[data-full]'))
      // only one copy of each looping filmstrip photo
      .filter(function(el){ return !el.closest('[aria-hidden="true"]'); });
    var img = lb.querySelector('img'), cap = lb.querySelector('figcaption'), dl = lb.querySelector('.dl'), items = all, idx = 0, last = null;
    function open(i){ idx = (i + items.length) % items.length; var el = items[idx];
      img.src = el.dataset.full; img.alt = el.dataset.alt || ''; cap.textContent = el.dataset.cap || '';
      var file = el.dataset.full.split('/').pop().replace(/-\d+\.jpg$/, '').replace(/^hs-/, 'headshot-');
      file = ({ 'headshot-femme': 'headshot-clean-shaven-red', 'headshot-masc': 'headshot-clean-shaven-paisley' })[file] || file;
      dl.href = el.dataset.full;
      dl.setAttribute('download', 'Isto-Barton-' + file.replace(/(^|-)([a-z])/g, function(m, a, c){ return a + c.toUpperCase(); }) + '.jpg');
      lb.classList.add('open'); document.body.style.overflow = 'hidden'; lb.querySelector('.close').focus(); }
    function close(){ lb.classList.remove('open'); document.body.style.overflow = ''; if(last) last.focus(); }
    document.querySelectorAll('[data-full]').forEach(function(el){
      el.addEventListener('click', function(e){ e.preventDefault(); last = el;
        var group = el.closest('.hgrid, .strip');
        items = all.filter(function(x){ return x.closest('.hgrid, .strip') === group; });
        var src = el.dataset.full; var i = items.findIndex(function(x){ return x.dataset.full === src; }); open(i < 0 ? 0 : i); });
    });
    lb.querySelector('.close').addEventListener('click', close);
    lb.querySelector('.prev').addEventListener('click', function(){ open(idx-1); });
    lb.querySelector('.next').addEventListener('click', function(){ open(idx+1); });
    lb.addEventListener('click', function(e){ if(e.target === lb) close(); });
    document.addEventListener('keydown', function(e){ if(!lb.classList.contains('open')) return;
      if(e.key === 'Tab'){ var f = lb.querySelectorAll('button, a'), first = f[0], lastB = f[f.length-1];
        if(e.shiftKey && document.activeElement === first){ e.preventDefault(); lastB.focus(); }
        else if(!e.shiftKey && document.activeElement === lastB){ e.preventDefault(); first.focus(); } }
      if(e.key === 'Escape') close(); if(e.key === 'ArrowLeft') open(idx-1); if(e.key === 'ArrowRight') open(idx+1); });
  }

  // Filmstrip: once the page has loaded, fetch every strip photo so none are blank when they scroll in
  if(document.querySelector('.strip')){
    window.addEventListener('load', function(){
      document.querySelectorAll('.strip img').forEach(function(im){ im.loading = 'eager'; });
    });
  }

  // Footer dots do a little wave the first time the footer scrolls into view
  var fd = document.querySelector('.fdots');
  if(fd && 'IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){ if(es[0].isIntersecting){ fd.classList.add('wave'); io.disconnect(); } }, { threshold: 1 });
    io.observe(fd);
  }

  // Lite video embeds: only load the player when someone presses play
  document.querySelectorAll('[data-video]').forEach(function(btn){
    var url = VIDEOS[btn.dataset.video];
    if(!url){ btn.setAttribute('aria-disabled','true'); btn.tabIndex = -1; return; }
    btn.addEventListener('click', function(){
      var f = document.createElement('iframe'); f.src = url; f.title = btn.getAttribute('aria-label');
      f.allow = 'autoplay; fullscreen; picture-in-picture'; f.allowFullscreen = true;
      btn.parentNode.appendChild(f); btn.remove();
    });
  });
})();
