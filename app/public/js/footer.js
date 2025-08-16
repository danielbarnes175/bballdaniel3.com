// Handles footer privacy policy smooth scroll (replacement for inline onclick="return myScroll();")
// Assumption: original myScroll() likely intended to scroll to top before navigating or just allow navigation.
// Here we attempt smooth scroll to top, then follow link. Adjust if different behavior desired.
(function(){
  function handleClick(e){
    // If same-page anchor and we want smooth scroll
    try {
      // Could add logic if needed; currently just allows default navigation.
      // Example smooth scroll to top:
      window.scrollTo({top:0, behavior:'smooth'});
    } catch(_) {}
    // No preventDefault so link still works; remove scrollTo if not desired.
  }
  function init(){
    document.querySelectorAll('[data-scroll-link]').forEach(a => {
      a.removeEventListener('click', handleClick); // idempotent after swup
      a.addEventListener('click', handleClick);
    });
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  document.addEventListener('swup:contentReplaced', init);
})();
