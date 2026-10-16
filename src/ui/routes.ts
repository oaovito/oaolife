import type { Page } from './shared';
export const ROUTES:Record<Page,string>={home:'',workout:'treino',meals:'alimentacao',water:'hidratacao',cardio:'cardio',mobility:'mobilidade',plan:'plano',progress:'evolucao',settings:'ajustes'};
export function pageFromPath(path:string,base='/'):Page {const relative=path.startsWith(base)?path.slice(base.length).replace(/\/$/,''):'';return (Object.keys(ROUTES) as Page[]).find(key=>ROUTES[key]===relative)??'home';}
export function pagePath(page:Page,base='/'){return `${base}${ROUTES[page]}`;}
