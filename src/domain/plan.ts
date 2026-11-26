import type { Exercise, Muscle, WorkoutTemplate, TrainingWeek, Meal } from './model';
const e = (id:string,name:string,muscle:Muscle,sets:number,reps:[number,number],reference:number|null,extra:Partial<Exercise>={}):Exercise => ({ id,name,muscle,sets,reps,reference,mode:'total',compound:false,...extra });
const vertical=e('supino-vertical','Supino vertical','Peito',3,[6,10],50,{compound:true});
const articulado=e('supino-articulado','Supino articulado máquina','Peito',3,[8,12],30,{mode:'lado',compound:true});
const crucifixo=e('crucifixo','Crucifixo máquina','Peito',4,[10,15],65);
const desenvolvimento=e('desenvolvimento','Desenvolvimento máquina','Deltoide anterior',3,[8,12],25,{mode:'lado',compound:true});
const lateralBaixa=e('lateral-baixa','Elevação lateral polia baixa','Deltoide lateral',4,[12,15],6,{smallStep:true});
const lateralMedia=e('lateral-media','Elevação lateral polia média','Deltoide lateral',4,[12,20],5,{smallStep:true});
// Tríceps (26/11/2026, proprietário): 3 polia + 3 francês polia + 3 seated dips, em A1 e A2.
const triceps=e('triceps','Tríceps polia','Tríceps',3,[8,12],31);
const frances=e('frances','Tríceps francês polia','Tríceps',3,[10,15],26);
const dips=e('triceps-seated-dips','Tríceps seated dips','Tríceps',3,[8,12],null,{compound:true});
const puxada=e('puxada','Puxada alta','Costas',4,[8,12],70,{compound:true});
const remada=e('remada','Remada máquina','Costas',3,[8,12],55,{mode:'lado',compound:true});
const smith=e('remada-smith','Remada Smith','Costas',3,[10,12],30,{mode:'lado',compound:true});
const posterior=e('posterior','Posterior na polia','Deltoide posterior',5,[12,20],6);
const rosca=e('rosca-w','Rosca barra W','Bíceps',4,[8,12],30);
const alternada=e('rosca-alternada','Rosca alternada','Bíceps',4,[10,15],16,{mode:'halter'});
const encolhimento=e('encolhimento','Encolhimento Smith','Trapézio',3,[10,15],30,{mode:'lado'});
const pelvica=e('pelvica','Elevação pélvica','Glúteos',4,[8,12],40,{mode:'lado',priority:true,compound:true,notes:'Controlar a fase excêntrica.'});
const abdutora=e('abdutora','Cadeira abdutora','Glúteos',3,[12,20],null,{priority:true});
const flexora=e('flexora','Cadeira flexora','Posteriores',4,[8,12],null,{priority:true,smallStep:true,notes:'Evitar compensações lombares.'});
const romeno=e('romeno','Terra romeno / stiff','Posteriores',3,[8,12],null,{priority:true,compound:true,notes:'Execução condicionada à tolerância da coluna e avaliação das limitações relacionadas à hipercifose. Evitar compensações lombares.'});
const leg=e('leg','Leg press vertical','Quadríceps',4,[10,15],100,{compound:true});
const panturrilha=e('panturrilha','Panturrilha máquina, joelho estendido','Panturrilhas',4,[8,12],90,{priority:true,notes:'Amplitude completa; evitar impulso.'});
const sentado=e('panturrilha-sentado','Panturrilha sentado','Panturrilhas',4,[12,20],null,{priority:true,notes:'Amplitude completa; evitar impulso.'});
const extensora=e('extensora','Cadeira extensora','Quadríceps',4,[10,15],85,{smallStep:true});
const original:WorkoutTemplate[]=[
 {id:'A1',title:'Peito, ombros e tríceps',exercises:[vertical,articulado,{...crucifixo,fst:true},desenvolvimento,lateralBaixa,lateralMedia,triceps,frances,dips]},
 {id:'B1',title:'Costas, posterior de ombro, bíceps e trapézio',exercises:[puxada,remada,smith,posterior,rosca,alternada,encolhimento]},
 {id:'C1',title:'Glúteos e posteriores',exercises:[pelvica,abdutora,flexora,romeno,leg,panturrilha,sentado]},
 {id:'A2',title:'Peito, ombros e tríceps',exercises:[articulado,{...vertical,reps:[8,12]},crucifixo,desenvolvimento,lateralBaixa,{...lateralMedia,fst:true},triceps,frances,dips]},
 {id:'B2',title:'Costas, posterior de ombro, bíceps e trapézio',exercises:[{...puxada,sets:3},{...remada,sets:4},smith,posterior,rosca,alternada,encolhimento]},
 {id:'C2',title:'Quadríceps, glúteos e posteriores',exercises:[panturrilha,{...leg,reps:[8,12]},extensora,{...flexora,reps:[10,15]},{...pelvica,sets:3,reps:[10,15]},abdutora,sentado]}
];
function freeze<T>(value:T):T { if (value && typeof value==='object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
// DADO PESSOAL: plano de treino individual. Migrar para repositório privado (docs/PERSONAL_DATA_INVENTORY.md).
export const ORIGINAL_PLAN = freeze(original);
// Versão do plano de treino. Ao mudar o plano, incremente: sessões abertas de hoje em diante
// são reconciliadas (reconcileOpenSessions), sem perder séries registradas.
export const TRAINING_PLAN_VERSION='2026-11-26-triceps';
export const EXERCISES = [...new Map(ORIGINAL_PLAN.flatMap(t=>t.exercises).map(e=>[e.id,e])).values()];
export const WEEKS:TrainingWeek[] = [
 [0.75,3,4,'Calibração'],[0.85,2,3,'Adaptação'],[1,1,2,'Volume completo'],[0.55,4,5,'Recuperação'],
 [0.85,2,3,'Retomada'],[1,1,2,'Sobrecarga'],[1,1,2,'Consolidação'],[0.55,4,5,'Recuperação'],
 [0.9,2,3,'Bloco final'],[1,1,2,'Progressão'],[1,1,2,'Consolidação final'],[0.75,2,3,'Avaliação']
].map((r,i)=>({week:i+1,volume:r[0] as number,rir:[r[1],r[2]] as [number,number],goal:r[3] as string}));
// DADO PESSOAL: plano alimentar antigo. Migrar para repositório privado (docs/PERSONAL_DATA_INVENTORY.md).
export const LEGACY_MEALS:Meal[]=[
 {id:'m1',title:'Refeição 1',foods:['500 ml de leite integral','2 fatias de pão de forma']},
 {id:'m2',title:'Refeição 2',foods:['300 g de molho vermelho com carne moída','150 g de arroz branco cozido']},
 {id:'m3',title:'Refeição 3',foods:['500 ml de leite integral']},
 {id:'m4',title:'Refeição 4',foods:['200 g de iogurte Itambé Grego Flocos']},
 {id:'m5',title:'Refeição 5',foods:['300 g de peito de frango desfiado','150 g de macarrão cozido']}
];
export const FIVE_MEALS:Meal[]=[
 {id:'m1',title:'Refeição 1',foods:['200 g de iogurte grego','2 pães franceses']},
 {id:'m2',title:'Refeição 2',foods:['200 g de peito de frango','200 g de arroz branco cozido']},
 {id:'m3',title:'Refeição 3',foods:['500 ml de leite integral','1 colher de sopa de Nescau']},
 {id:'m4',title:'Refeição 4',foods:['Frutas à vontade — registre o consumo']},
 {id:'m5',title:'Refeição 5',foods:['200 g de peito de frango','200 g de arroz branco cozido']}
];
export const WATER_LABELS=['Água 1','Água 2','Água 3','Água 4','Água 5','Água 6'];
export const CARDIO_DAYS=['A1','B1','C1','A2','B2','C2'];
export const MOBILITY_DAYS=['A1','B1','A2'];
export const LOAD_LABEL={total:'kg total',lado:'kg por lado',halter:'kg por halter'};


// DADO PESSOAL: plano alimentar individual. Migrar para repositório privado (docs/PERSONAL_DATA_INVENTORY.md).
export const MEALS:Meal[]=[
 {id:'m1',title:'Café da manhã · líquida',foods:['200 g de iogurte grego natural','300 ml de leite desnatado','40 g de leite em pó desnatado','30 g de aveia']},
 {id:'m2',title:'Almoço · sólida',foods:['200 g de peito de frango grelhado','250 g de arroz branco cozido']},
 {id:'m3',title:'Lanche · líquida',foods:['200 g de iogurte grego natural','300 ml de leite desnatado','40 g de leite em pó desnatado','30 g de aveia']},
 {id:'m4',title:'Jantar · sólida',foods:['180 g de patinho magro grelhado','200 g de arroz branco cozido']},
];
