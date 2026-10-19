import { describe, expect, it } from 'vitest';
import { installedViewportSize } from '../ui/useInstalledViewport';
const phone={innerWidth:393,innerHeight:793,screenWidth:393,screenHeight:852,coveredInset:59,visualHeight:759,visualOffset:0,editing:false};
describe('altura da PWA instalada no iOS',()=>{
 it('recupera a faixa omitida das medidas do WebKit sem somar insets duas vezes',()=>{expect(installedViewportSize(phone)).toEqual({height:852,keyboard:false});expect(installedViewportSize({...phone,innerHeight:852,visualHeight:852})).toEqual({height:852,keyboard:false});});
 it('não força a tela física quando a barra de status ocupa uma área fora da página',()=>{expect(installedViewportSize({...phone,coveredInset:0})).toEqual({height:793,keyboard:false});});
 it('preserva janelas menores e multitarefa',()=>{expect(installedViewportSize({...phone,screenWidth:1024,screenHeight:1366,innerWidth:600,innerHeight:800,visualHeight:800})).toEqual({height:800,keyboard:false});});
 it('acompanha orientação sem confundir largura e altura',()=>{expect(installedViewportSize({...phone,innerWidth:852,innerHeight:372,coveredInset:44})).toEqual({height:393,keyboard:false});});
 it('deixa o menu acima do teclado e restaura a altura ao fechar',()=>{expect(installedViewportSize({...phone,editing:true,visualHeight:480})).toEqual({height:480,keyboard:true});expect(installedViewportSize({...phone,editing:true})).toEqual({height:852,keyboard:false});});
 it('não confunde a área segura ou o visual viewport reduzido com teclado sem edição',()=>{expect(installedViewportSize({...phone,visualHeight:480})).toEqual({height:852,keyboard:false});expect(installedViewportSize({...phone,editing:true,visualHeight:480,visualOffset:30})).toEqual({height:510,keyboard:true});});
});
