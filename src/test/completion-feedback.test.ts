import { describe, expect, it, vi, afterEach } from 'vitest';
import { completedTransitions, completionPattern, vibrateCompletion } from '../ui/CompletionFeedback';
import { emptyData, makeDay, summaries } from '../domain/daily';
afterEach(()=>vi.unstubAllGlobals());
describe('conclusão de blocos',()=>{
 it('celebra apenas a transição para concluído, sem repetir em outras gravações',()=>{const data=emptyData(),date='2026-10-26';data.days.push(makeDay(data,date));const before=summaries(data,date);data.days[0].water.fill(500);const after=summaries(data,date);expect(completedTransitions(before,after)).toEqual(['water']);expect(completedTransitions(after,after)).toEqual([]);expect(completedTransitions(after,before)).toEqual([]);});
 it('solicita o padrão forte e respeita a preferência de desativar',()=>{const vibrate=vi.fn(()=>true);vi.stubGlobal('navigator',{vibrate});expect(vibrateCompletion(true)).toBe(true);expect(vibrate).toHaveBeenCalledWith(completionPattern);expect(vibrateCompletion(false)).toBe(false);expect(vibrate).toHaveBeenCalledTimes(1);});
 it('API ausente ou rejeitada não impede a conclusão',()=>{vi.stubGlobal('navigator',{});expect(vibrateCompletion(true)).toBe(false);vi.stubGlobal('navigator',{vibrate:()=>{throw Error('Indisponível');}});expect(vibrateCompletion(true)).toBe(false);});
});
