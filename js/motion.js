(() => {
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 let observer;
 const selector='.section-header,.hero-content,.hero-visual,.news-heading,.news-carousel,.philosophy-quote-card,.bee-values,.philosophy-points > .point-card,.program-card,.pillar-card,.facility-card,.tuition-box,.steps-timeline,.faq-item,.testimonial-card,.footer-col,.admin-card,.news-feed > .news-card,.admin-post,.donation-note,.donation-title,.donation-intro,.donation-steps,.stepper-header,.form-step,.success-card';
 function prepare(root=document){
  if(preference.matches)return;
  const elements=[...(root.matches?.(selector)?[root]:[]),...root.querySelectorAll(selector)];
  for(const el of elements){if(el.hasAttribute('data-scroll-fade'))continue;el.setAttribute('data-scroll-fade','');const rect=el.getBoundingClientRect();el.classList.toggle('is-in-view',rect.bottom>70&&rect.top<innerHeight);observer.observe(el);}
 }
 function start(){
  observer?.disconnect();
  if(preference.matches){document.querySelectorAll('[data-scroll-fade]').forEach(el=>{el.removeAttribute('data-scroll-fade');el.classList.remove('is-in-view');});return;}
  observer=new IntersectionObserver(entries=>{for(const entry of entries){entry.target.classList.toggle('is-in-view',entry.isIntersecting);}},{rootMargin:'-70px 0px -20px 0px',threshold:0});
  document.querySelectorAll('[data-scroll-fade]').forEach(el=>observer.observe(el));prepare();
 }
 document.addEventListener('DOMContentLoaded',()=>{start();new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)prepare(node);}).observe(document.body,{childList:true,subtree:true});});
 preference.addEventListener('change',start);
})();


window.addEventListener('DOMContentLoaded',()=>{const section=document.getElementById('profil'),values=section?.querySelector('.bee-values');if(!values)return;const size=()=>{let top=0,node=values;while(node&&node!==section){top+=node.offsetTop;node=node.offsetParent;}section.style.setProperty('--bee-banner-height',(top+values.offsetHeight)+'px');};size();const resize=new ResizeObserver(size);resize.observe(section);resize.observe(values);window.addEventListener('resize',size);});
window.addEventListener("DOMContentLoaded",()=>{const hero=document.querySelector(".hero-section"),stats=hero?.querySelector(".hero-stats");if(!stats)return;const size=()=>{let top=0,node=stats;while(node&&node!==hero){top+=node.offsetTop;node=node.offsetParent;}hero.style.setProperty("--hero-photo-height",top+"px");};size();const resize=new ResizeObserver(size);resize.observe(hero);resize.observe(hero.querySelector(".hero-content"));window.addEventListener("resize",size);});
