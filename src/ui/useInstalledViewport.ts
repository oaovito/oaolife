import { useLayoutEffect } from 'react';

interface InstalledViewport {
 innerWidth:number; innerHeight:number; screenWidth:number; screenHeight:number;
 coveredInset:number; visualHeight:number; visualOffset:number; editing:boolean;
}
// Installed WebKit can subtract safe areas from both viewport units and JS
// viewport measurements: https://bugs.webkit.org/show_bug.cgi?id=254868
// Only use the physical CSS screen size for a full-width, edge-to-edge app.
export function installedViewportSize(v:InstalledViewport){
 const screenHeight=Math.abs(v.innerWidth-v.screenWidth)<=1?v.screenHeight:Math.abs(v.innerWidth-v.screenHeight)<=1?v.screenWidth:null;
 const fullHeight=v.coveredInset>0&&screenHeight!==null?screenHeight:v.innerHeight;
 const visibleBottom=v.visualHeight+Math.max(0,v.visualOffset);
 const keyboard=v.editing&&v.visualHeight>0&&fullHeight-visibleBottom>120;
 return {height:keyboard?visibleBottom:fullHeight,keyboard};
}
export function useInstalledViewport(){
 useLayoutEffect(()=>{
  const display=matchMedia('(display-mode: standalone)');
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(!ios||!(display.matches||(navigator as Navigator&{standalone?:boolean}).standalone))return;
  const root=document.documentElement,viewport=window.visualViewport;
  const probe=document.createElement('div');
  probe.style.cssText='position:fixed;top:0;left:0;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none;padding-top:var(--safe-area-top,0px);padding-left:env(safe-area-inset-left,0px);padding-right:env(safe-area-inset-right,0px)';
  document.body.append(probe);root.dataset.iosInstalled='true';
  let frame=0;
  const update=()=>{
   if(viewport&&Math.abs(viewport.scale-1)>.01)return; // Preserve pinch zoom.
   const insets=getComputedStyle(probe),active=document.activeElement;
   const editing=active instanceof HTMLElement&&active.matches('input:not([type=button]):not([type=checkbox]):not([type=radio]),textarea,[contenteditable=true]');
   const size=installedViewportSize({innerWidth:window.innerWidth,innerHeight:window.innerHeight,screenWidth:screen.width,screenHeight:screen.height,coveredInset:Math.max(parseFloat(insets.paddingTop)||0,parseFloat(insets.paddingLeft)||0,parseFloat(insets.paddingRight)||0),visualHeight:viewport?.height??window.innerHeight,visualOffset:viewport?.offsetTop??0,editing});
   root.style.setProperty('--installed-viewport-height',`${size.height}px`);
   root.dataset.keyboardOpen=String(size.keyboard);
  };
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update);};
  update();
  for(const event of ['resize','orientationchange','pageshow','focus'])window.addEventListener(event,schedule);
  for(const event of ['visibilitychange','focusin','focusout'])document.addEventListener(event,schedule);
  viewport?.addEventListener('resize',schedule);viewport?.addEventListener('scroll',schedule);
  return()=>{cancelAnimationFrame(frame);probe.remove();delete root.dataset.iosInstalled;delete root.dataset.keyboardOpen;root.style.removeProperty('--installed-viewport-height');for(const event of ['resize','orientationchange','pageshow','focus'])window.removeEventListener(event,schedule);for(const event of ['visibilitychange','focusin','focusout'])document.removeEventListener(event,schedule);viewport?.removeEventListener('resize',schedule);viewport?.removeEventListener('scroll',schedule);};
 },[]);
}
