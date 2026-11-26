import { nutritionDaySchema, archivedNutritionSchema, legacyNutritionSchema, referenceSchema, foodKeys } from './nutritionSchema';
import { z } from 'zod';
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s => { const d = new Date(s+'T12:00:00Z'); return !Number.isNaN(+d) && d.toISOString().slice(0,10) === s; }, 'Data inválida');
const id = z.string().min(1).max(160);
const text = z.string().max(5000);
const num = z.number().finite().nonnegative();
const timestamp = z.string().datetime();
export const sessionNames = ['A1','B1','C1','A2','B2','C2'] as const;
export const sessionNameSchema = z.enum(sessionNames);
export type SessionName = z.infer<typeof sessionNameSchema>;
export const groups = ['Peito','Costas','Deltoide lateral','Deltoide anterior','Deltoide posterior','Bíceps','Tríceps','Trapézio','Quadríceps','Posteriores','Glúteos','Panturrilhas'] as const;
export type Muscle = typeof groups[number];
export const loadModeSchema = z.enum(['total','lado','halter']);
export type LoadMode = z.infer<typeof loadModeSchema>;
export interface Exercise { id: string; name: string; muscle: Muscle; sets: number; reps: [number,number]; reference: number|null; mode: LoadMode; compound: boolean; priority?: boolean; fst?: boolean; notes?: string; smallStep?: boolean }
export interface WorkoutTemplate { id: SessionName; title: string; exercises: Exercise[] }
export const completedSetSchema = z.object({ id, done: z.boolean(), skipped: z.boolean().default(false), load: num.max(2000).nullable(), reps: z.number().int().min(0).max(300).nullable(), rir: num.max(10).nullable(), technique: z.boolean().nullable(), range: z.boolean().nullable(), notes: text, mode: loadModeSchema });
export type CompletedSet = z.infer<typeof completedSetSchema>;
const plannedExerciseSchema = z.object({ id, name: text, muscle: z.enum(groups), reps: z.tuple([num,num]), reference: num.nullable(), suggested: num.nullable(), mode: loadModeSchema, rir: z.tuple([num,num]), rest: text, notes: text, fst: z.boolean(), sets: z.array(completedSetSchema).min(1).max(10) });
export type PlannedExercise = z.infer<typeof plannedExerciseSchema>;
export const workoutSchema = z.object({ id, cycleId: id, date: dateSchema, timezone: text, template: sessionNameSchema, week: z.number().int().min(1).max(12), volume: num.max(1), exercises: z.array(plannedExerciseSchema).max(20), status: z.enum(['open','complete','partial']), reason: text, startedAt: timestamp, closedAt: timestamp.nullable() });
export type WorkoutSession = z.infer<typeof workoutSchema>;
export const trainingCycleSchema = z.object({ id, start: dateSchema, end:dateSchema.optional(), originalVersion: z.literal('original-1'), createdAt: timestamp, overrides: z.record(dateSchema, sessionNameSchema.nullable()) });
export type TrainingCycle = z.infer<typeof trainingCycleSchema>;
export const mobilityExerciseSchema = z.object({ id, name: z.string().min(1).max(200), description: text, sets: z.number().int().min(1).max(20), reps: num.max(300).nullable(), duration: num.max(3600).nullable(), rest: num.max(600), resistance: text, instructions: text, image: z.string().max(3000000).refine(s => !s || /^data:image\/(png|jpeg|webp);base64,/.test(s), 'Use imagem PNG, JPEG ou WebP') });
export type MobilityExercise = z.infer<typeof mobilityExerciseSchema>;
export const mobilityProtocolSchema = z.object({ id, name: text, exercises: z.array(mobilityExerciseSchema).max(30), days: z.array(sessionNameSchema), updatedAt: timestamp });
export type MobilityProtocol = z.infer<typeof mobilityProtocolSchema>;
const cardioSchema = z.object({ planVersion: z.enum(['legacy','weekly-360']).default('legacy'), planned: num.max(60).nullable(), elapsed: num.max(86400), runningSince: z.number().finite().nullable(), status: z.enum(['idle','paused','running','complete','partial']), mode: text, minimumSpeed: num.max(30).nullable().default(null), speed: num.max(30).nullable().default(null), intensity: z.enum(['Leve','Moderada']), rpe: num.max(10).nullable(), heartRate: num.max(250).nullable(), notes: text });
export type CardioSession = z.infer<typeof cardioSchema>;
export const sequenceSchema = z.object({ elapsed:num.max(86400), runningSince:z.number().finite().nullable(), completedAt:timestamp.nullable() });
export type MobilitySequence = z.infer<typeof sequenceSchema>;
const mobilitySessionSchema = z.object({ sequences:z.record(id,sequenceSchema).default({}), protocol: mobilityProtocolSchema.nullable(), sets: z.record(id,z.object({ done:z.boolean(), seconds:num.max(86400), runningSince:z.number().finite().nullable(), discomfort:num.max(10).nullable(), pain:num.max(10).nullable(), notes:text })) });
export const recoverySchema = z.object({ sleep: num.max(24).nullable(), fatigue: num.max(10).nullable(), soreness: num.max(10).nullable(), pain: num.max(10).nullable(), jointPain: z.boolean(), symptoms: z.boolean(), notes: text });
export type RecoveryLog = z.infer<typeof recoverySchema>;
export const blockKeys = ['workout','meals','water','cardio','mobility','hormonal'] as const;
export type BlockKey = typeof blockKeys[number];
const declarationSchema = z.object({ at: timestamp, note: text });
export const hydrationSchema=z.object({version:z.literal('liquids-1'),target:num.positive().max(20000),bottle:num.positive().max(5000),entries:z.array(z.object({id,at:timestamp,ml:num.positive().max(5000)}))});
export const dailySchema = z.object({hydration:hydrationSchema.nullable().default(null), archivedNutrition:z.array(archivedNutritionSchema).default([]), nutrition:nutritionDaySchema.nullable().default(null), previousNutrition:legacyNutritionSchema.nullable().default(null), declarations: z.partialRecord(z.enum(blockKeys), declarationSchema).default({}), id: dateSchema, cycleId: id.nullable(), timezone: text, createdAt: timestamp, recorded:z.array(z.enum(['meals','water','cardio','mobility','recovery'])).default([]), meals: z.array(z.array(z.boolean()).min(1).max(10)).min(4).max(5), mealTimes: z.array(timestamp.nullable()).min(4).max(5), water: z.array(num.max(5000)).length(6), waterTargets: z.array(num.min(1).max(5000)).length(6), cardio: cardioSchema, mobility: mobilitySessionSchema, recovery: recoverySchema });
export type DailyLog = z.infer<typeof dailySchema>;
export const measurementSchema = z.object({ id, date:dateSchema, weight:num.min(20).max(400).nullable(), waist:num.min(20).max(300).nullable(), systolic:num.min(40).max(300).nullable(), diastolic:num.min(20).max(200).nullable(), restingHR:num.min(20).max(250).nullable(), body:text, notes:text });
export type BodyMeasurement = z.infer<typeof measurementSchema>;
const nutritionSchema = z.object({ id, name:z.string().min(1).max(200), brand:text, quantity:num.min(0.1), unit:z.enum(['g','ml','unidade']), kcal:num.nullable(), protein:num.nullable(), carbs:num.nullable(), fat:num.nullable(), source:text, certainty:z.enum(['confirmado','estimado','desconhecido']) });
export type Food = z.infer<typeof nutritionSchema>;
const recipeSchema = z.object({ id, name:z.string().min(1).max(200), yieldGrams:num.min(1), ingredients:z.array(z.object({ foodId:id, quantity:num.min(0.1) })).min(1), notes:text });
export type Recipe = z.infer<typeof recipeSchema>;
export const progressionSchema = z.object({ id, cycleId:id, sessionId:id, exerciseId:id, date:dateSchema, previous:num, next:num, mode:loadModeSchema, reason:text, createdAt:timestamp, undoneAt:timestamp.nullable() });
export type ProgressionDecision = z.infer<typeof progressionSchema>;
const photoSchema = z.object({ id, date:dateSchema, angle:z.enum(['Frente','Costas','Lateral']), data:z.string().max(10000000).regex(/^data:image\/(png|jpeg|webp);base64,/), notes:text });
export type PhotoRecord = z.infer<typeof photoSchema>;
const settingsSchema = z.object({ id:z.literal('settings'), haptics:z.boolean().default(true), theme:z.enum(['dark','light']), timezone:z.string().min(1).max(100).refine(s=>{try{new Intl.DateTimeFormat('pt-BR',{timeZone:s});return true;}catch{return false;}},'Fuso inválido'), increments:z.record(id,num.min(0.01).max(100)), cardioMinutes:num.max(60).nullable(), waterTarget:num.min(500).max(600),hydrationTarget:num.positive().max(20000).default(4000),bottleVolume:num.positive().max(5000).default(500),calorieGoal:num.positive().max(10000).default(2000),proteinGoal:num.positive().max(1000).default(190),setPolicy:z.enum(['full','full-deload','periodized']).default('full-deload'), mealTimes:z.array(z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).or(z.literal(''))).length(5), lastBackup:timestamp.nullable(), installationNotice:z.boolean() });
export type AppSettings = z.infer<typeof settingsSchema>;
const adjustmentSchema = z.object({ id, at:timestamp, kind:text, detail:text });
export const hormonalProtocolSchema=z.object({
 name:z.string().min(1).max(200),weeks:z.number().int().min(1).max(52),
 entries:z.array(z.object({id,substance:z.string().min(1).max(200),doseMg:num.min(0.01).max(10000),frequency:z.enum(['daily','weekly']),weekday:z.number().int().min(0).max(6).nullable(),fromWeek:z.number().int().min(1).max(52),toWeek:z.number().int().min(1).max(52)})).min(1).max(50),
}).refine(p=>p.entries.every(e=>e.fromWeek<=e.toWeek&&e.toWeek<=p.weeks),'Período inválido');
export type HormonalProtocol=z.infer<typeof hormonalProtocolSchema>;
const hormonalLogSchema=z.object({id,date:dateSchema,week:z.number().int().min(1).max(52),entryId:id,substance:text,doseMg:num.min(0.01).max(10000),notes:text,at:timestamp});
export const hormonalImportSchema=z.object({format:z.literal('oaolife-hormonal-1'),protocol:hormonalProtocolSchema});
const currentAppDataSchema = z.object({ schemaVersion:z.literal(9), nutritionOverrides:z.partialRecord(z.enum(foodKeys),referenceSchema).default({}), hormonalProtocol:hormonalProtocolSchema.nullable().default(null), hormonalLogs:z.array(hormonalLogSchema).default([]), profile:z.object({ id:z.literal('local-user'), age:num.max(120), height:num.max(250), initialWeight:num.max(400) }), settings:settingsSchema, cycles:z.array(trainingCycleSchema), sessions:z.array(workoutSchema), days:z.array(dailySchema), measurements:z.array(measurementSchema), photos:z.array(photoSchema), foods:z.array(nutritionSchema), recipes:z.array(recipeSchema), mobility:mobilityProtocolSchema.nullable(), decisions:z.array(progressionSchema), adjustments:z.array(adjustmentSchema) });
// Older snapshots retain measurements, targets and protocols; timer state is additive.
export const appDataSchema = z.preprocess(value => {
 if(value && typeof value === 'object' && 'schemaVersion' in value && (value.schemaVersion === 2 || value.schemaVersion === 3 || value.schemaVersion === 4 || value.schemaVersion === 5 || value.schemaVersion === 6 || value.schemaVersion === 7 || value.schemaVersion === 8)) return {...value, schemaVersion:9};
 return value;
}, currentAppDataSchema);
export type AppData = z.infer<typeof appDataSchema>;
export type BlockStatus = 'Não iniciado'|'Em andamento'|'Concluído'|'Parcial'|'Não programado'|'Pendente de revisão';
export interface BlockSummary { status:BlockStatus; done:number; total:number; subtitle:string }
export type UserProfile = AppData['profile'];
export type TrainingWeek = { week:number; volume:number; rir:[number,number]; goal:string };
export type PlannedSet = { exerciseId:string; index:number; reps:[number,number]; rir:[number,number] };
export type LoadHistory = { exerciseId:string; date:string; load:number; mode:LoadMode };
export type ProgressionRule = { exerciseId:string; increment:number|null };
export type MealPlan = { meals:Meal[] };
export type Meal = { id:string; title:string; foods:string[] };
export type FoodLog = { date:string; meal:number; food:number; done:boolean };
export type HydrationPlan = { targets:number[] };
export type WaterLog = { date:string; bottle:number; ml:number };
export type CardioPlan = { days:SessionName[]; minutes:number|null };
export type MobilitySession = DailyLog['mobility'];
export type SleepLog = Pick<RecoveryLog,'sleep'>;
export type AdjustmentHistory = AppData['adjustments'][number];
export interface SyncOperation { id:string; at:string; revision:number; state:'local-only'|'pending'|'conflict'; kind:string }

