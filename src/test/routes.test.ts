import { describe, expect, it } from 'vitest';
import { pageFromPath, pagePath, ROUTES } from '../ui/routes';
describe('rotas de publicação sem incluir dados pessoais',()=>{
 it('abre o dashboard na raiz e aceita cada rota interna',()=>{expect(pageFromPath('/')).toBe('home');for(const [page,path] of Object.entries(ROUTES))expect(pageFromPath('/'+path)).toBe(page);});
 it('mantém compatibilidade com o caminho anterior de Pages',()=>{expect(pageFromPath('/oaolife/ajustes','/oaolife/')).toBe('settings');expect(pagePath('workout','/oaolife/')).toBe('/oaolife/treino');});
 it('rotas desconhecidas abrem o dashboard sem alterar registros',()=>{expect(pageFromPath('/nao-existe')).toBe('home');expect(pageFromPath('/ajustes/')).toBe('settings');});
});
