/*
Purpose: Central data store — all reference data (teachers, classes, rooms, subjects, etc.)
         plus localStorage persistence layer (save/load/reset)
Inputs:  Imported by app.js at startup; other modules import getters
Outputs: Exports TEACHERS, CLASSES, ROOMS, SUBJECTS, DEPTS, CURRICULUM, SCHED, SETTINGS
         Exports save/load functions for localStorage
Dependencies: utils.js (PAL)
*/

import { PAL } from './utils.js';

// ──────────────────────────────────────────────
// BELLS
// ──────────────────────────────────────────────
export const BELLS = [
  { n:1,  s:'8:00',  e:'8:45'  },
  { n:2,  s:'8:55',  e:'9:40'  },
  { n:3,  s:'10:00', e:'10:45' },
  { n:4,  s:'10:55', e:'11:40' },
  { n:5,  s:'12:10', e:'12:55' },
  { n:6,  s:'13:05', e:'13:50' },
  { n:7,  s:'14:00', e:'14:45' },
  { n:8,  s:'14:55', e:'15:40' },
  { n:9,  s:'15:50', e:'16:35' },
  { n:10, s:'16:45', e:'17:30' },
  { n:11, s:'17:40', e:'18:25' },
  { n:12, s:'18:35', e:'19:20' },
];

export const DAYS = ['Понеділок','Вівторок','Середа','Четвер','П\'ятниця'];

// ──────────────────────────────────────────────
// DEPARTMENTS
// ──────────────────────────────────────────────
export let DEPTS = [
  { id:1, name:'Математично-природнича',    head:1,  color:'#3b5bdb' },
  { id:2, name:'Мовно-літературна',          head:0,  color:'#7c3aed' },
  { id:3, name:'Суспільно-гуманітарна',      head:18, color:'#0f766e' },
  { id:4, name:'Художньо-естетична',         head:9,  color:'#d97706' },
  { id:5, name:'Фізкультури та здоров\'я',   head:7,  color:'#dc2626' },
  { id:6, name:'Початкових класів',          head:23, color:'#0ea5e9' },
];

// ──────────────────────────────────────────────
// SUBJECTS
// ──────────────────────────────────────────────
export let SUBJECTS = [
  { id:1,  name:'Математика',       deptId:1, color:'#3b5bdb' },
  { id:2,  name:'Алгебра',          deptId:1, color:'#2563eb' },
  { id:3,  name:'Геометрія',        deptId:1, color:'#1d4ed8' },
  { id:4,  name:'Фізика',           deptId:1, color:'#0ea5e9' },
  { id:5,  name:'Хімія',            deptId:1, color:'#7c3aed' },
  { id:6,  name:'Біологія',         deptId:1, color:'#16a34a' },
  { id:7,  name:'Інформатика',      deptId:1, color:'#0f766e' },
  { id:8,  name:'Укр. мова',        deptId:2, color:'#dc2626' },
  { id:9,  name:'Укр. література',  deptId:2, color:'#b91c1c' },
  { id:10, name:'Англійська мова',  deptId:2, color:'#d97706' },
  { id:11, name:'Нім. мова',        deptId:2, color:'#b45309' },
  { id:12, name:'Франц. мова',      deptId:2, color:'#92400e' },
  { id:13, name:'Зарубіжна літ.',   deptId:2, color:'#ea580c' },
  { id:14, name:'Географія',        deptId:3, color:'#854d0e' },
  { id:15, name:'Історія України',  deptId:3, color:'#6b21a8' },
  { id:16, name:'Всесвітня іст.',   deptId:3, color:'#581c87' },
  { id:17, name:'Правознавство',    deptId:3, color:'#4c1d95' },
  { id:18, name:'Економіка',        deptId:3, color:'#7c3aed' },
  { id:19, name:'Музика',           deptId:4, color:'#db2877' },
  { id:20, name:'Образотворче',     deptId:4, color:'#be185d' },
  { id:21, name:'Трудове навч.',    deptId:4, color:'#9d174d' },
  { id:22, name:'Фізкультура',      deptId:5, color:'#16a34a' },
  { id:23, name:'Захист України',   deptId:5, color:'#15803d' },
  { id:24, name:'Початк. навч.',    deptId:6, color:'#0369a1' },
  { id:25, name:'Природознавство',  deptId:1, color:'#065f46' },
  { id:26, name:'Математика (поч)', deptId:1, color:'#1e40af' },
];

// ──────────────────────────────────────────────
// CURRICULUM  parallel → subjectId → hours/week
// ──────────────────────────────────────────────
export let CURRICULUM = {
  1:  { 26:4,8:7,10:2,22:3,19:1,20:1,21:1,24:3,25:2 },
  2:  { 26:4,8:7,10:2,22:3,19:1,20:1,21:1,24:3,25:2 },
  3:  { 1:4,8:5,9:2,10:3,22:3,19:1,20:1,21:1,14:2 },
  4:  { 1:4,8:5,9:2,10:3,22:3,19:1,20:1,21:1,14:2 },
  5:  { 1:4,8:2,9:2,10:3,22:3,19:1,20:1,21:2,14:2,6:2,15:1,16:1 },
  6:  { 1:4,8:2,9:2,10:3,22:3,4:2,6:2,14:2,15:2,16:1,20:1,21:2 },
  7:  { 2:2,3:2,8:2,9:2,10:3,22:3,4:2,5:2,6:2,14:2,15:2,16:1,7:1,21:2 },
  8:  { 2:3,3:2,8:2,9:2,10:3,22:2,4:2,5:2,6:2,14:2,15:2,16:1,7:2,21:2 },
  9:  { 2:3,3:2,8:2,9:2,10:3,22:2,4:3,5:2,6:2,14:2,15:2,16:2,7:2,17:1 },
  10: { 2:4,3:2,8:2,9:2,10:3,22:2,4:3,5:2,6:2,14:1,15:2,16:2,7:2,18:1,23:1 },
  11: { 2:4,3:2,8:2,9:2,10:3,22:2,4:3,5:2,6:2,14:1,15:2,16:2,7:2,18:1,23:1 },
};

// ──────────────────────────────────────────────
// ROOMS
// ──────────────────────────────────────────────
export let ROOMS = [
  { id:1,  num:'101',   name:'Математики №1',    cap:32, type:'classroom', subjects:[1,2,3],    hardTeachers:[],  softTeachers:[1,13],  note:'' },
  { id:2,  num:'102',   name:'Математики №2',    cap:30, type:'classroom', subjects:[1,2,3],    hardTeachers:[],  softTeachers:[22,27], note:'' },
  { id:3,  num:'201',   name:'Фізики',           cap:28, type:'lab',       subjects:[4],        hardTeachers:[2], softTeachers:[14],    note:'Лаб. обладнання' },
  { id:4,  num:'202',   name:'Хімії',            cap:28, type:'lab',       subjects:[5],        hardTeachers:[3], softTeachers:[10,37], note:'Витяжка' },
  { id:5,  num:'203',   name:'Біології',         cap:30, type:'lab',       subjects:[6],        hardTeachers:[4], softTeachers:[16,31], note:'' },
  { id:6,  num:'301',   name:'Укр. мови №1',     cap:32, type:'classroom', subjects:[8,9],      hardTeachers:[],  softTeachers:[0,15],  note:'' },
  { id:7,  num:'302',   name:'Укр. мови №2',     cap:30, type:'classroom', subjects:[8,9],      hardTeachers:[],  softTeachers:[34,35], note:'' },
  { id:8,  num:'305',   name:'Інозем. мов №1',   cap:16, type:'classroom', subjects:[10,11],    hardTeachers:[],  softTeachers:[6,20],  note:'Для груп' },
  { id:9,  num:'306',   name:'Інозем. мов №2',   cap:16, type:'classroom', subjects:[10,11,12], hardTeachers:[],  softTeachers:[32],    note:'' },
  { id:10, num:'401',   name:'Географії/Іст.',   cap:30, type:'classroom', subjects:[14,15,16], hardTeachers:[],  softTeachers:[5,18,29],note:'' },
  { id:11, num:'105',   name:'Інформатики №1',   cap:20, type:'computer',  subjects:[7],        hardTeachers:[],  softTeachers:[11],    note:'20 ПК' },
  { id:12, num:'106',   name:'Інформатики №2',   cap:20, type:'computer',  subjects:[7],        hardTeachers:[],  softTeachers:[11],    note:'' },
  { id:13, num:'СЗ-А', name:'Спортзал вел.',     cap:80, type:'gym',       subjects:[22],       hardTeachers:[],  softTeachers:[7,21],  note:'' },
  { id:14, num:'СЗ-Б', name:'Спортзал мал.',     cap:30, type:'gym',       subjects:[22],       hardTeachers:[],  softTeachers:[33],    note:'' },
  { id:15, num:'207',   name:'Трудового навч.',   cap:25, type:'workshop',  subjects:[21],       hardTeachers:[12],softTeachers:[30],    note:'' },
  { id:16, num:'Акт.',  name:'Актова зала',       cap:200,type:'art',       subjects:[19,20],    hardTeachers:[],  softTeachers:[19,9],  note:'' },
  { id:17, num:'111',   name:'Поч. класи №1',    cap:30, type:'classroom', subjects:[24,26],    hardTeachers:[],  softTeachers:[23,24], note:'' },
  { id:18, num:'112',   name:'Поч. класи №2',    cap:30, type:'classroom', subjects:[24,26],    hardTeachers:[],  softTeachers:[25,26], note:'' },
];

// ──────────────────────────────────────────────
// CLASSES
// ──────────────────────────────────────────────
export let CLASSES = [
  { id:1,  parallel:1,  letter:'А', teacherId:23, count:26, roomId:17, groups:{} },
  { id:2,  parallel:1,  letter:'Б', teacherId:24, count:24, roomId:17, groups:{} },
  { id:3,  parallel:2,  letter:'А', teacherId:25, count:28, roomId:18, groups:{} },
  { id:4,  parallel:2,  letter:'Б', teacherId:26, count:26, roomId:18, groups:{} },
  { id:5,  parallel:3,  letter:'А', teacherId:0,  count:30, roomId:null, groups:{} },
  { id:6,  parallel:3,  letter:'Б', teacherId:1,  count:29, roomId:null, groups:{} },
  { id:7,  parallel:4,  letter:'А', teacherId:13, count:31, roomId:null, groups:{} },
  { id:8,  parallel:4,  letter:'Б', teacherId:22, count:28, roomId:null, groups:{} },
  { id:9,  parallel:5,  letter:'А', teacherId:4,  count:32, roomId:null, groups:{ 10:[{n:'Гр.1',t:6},{n:'Гр.2',t:20}] } },
  { id:10, parallel:5,  letter:'Б', teacherId:15, count:30, roomId:null, groups:{ 10:[{n:'Гр.1',t:20},{n:'Гр.2',t:32}] } },
  { id:11, parallel:6,  letter:'А', teacherId:3,  count:33, roomId:null, groups:{ 10:[{n:'Гр.1',t:6},{n:'Гр.2',t:20}] } },
  { id:12, parallel:6,  letter:'Б', teacherId:37, count:31, roomId:null, groups:{ 10:[{n:'Гр.1',t:20},{n:'Гр.2',t:32}] } },
  { id:13, parallel:7,  letter:'А', teacherId:8,  count:30, roomId:null, groups:{ 10:[{n:'Гр.1',t:6},{n:'Гр.2',t:20}], 7:[{n:'Гр.1',t:11},{n:'Гр.2',t:11}] } },
  { id:14, parallel:7,  letter:'Б', teacherId:5,  count:29, roomId:null, groups:{ 10:[{n:'Гр.1',t:20},{n:'Гр.2',t:32}], 7:[{n:'Гр.1',t:11},{n:'Гр.2',t:11}] } },
  { id:15, parallel:8,  letter:'А', teacherId:14, count:28, roomId:null, groups:{ 10:[{n:'Гр.1',t:6},{n:'Гр.2',t:20}], 7:[{n:'Гр.1',t:11},{n:'Гр.2',t:11}] } },
  { id:16, parallel:8,  letter:'Б', teacherId:16, count:30, roomId:null, groups:{ 10:[{n:'Гр.1',t:20},{n:'Гр.2',t:32}], 7:[{n:'Гр.1',t:11},{n:'Гр.2',t:11}] } },
  { id:17, parallel:9,  letter:'А', teacherId:29, count:27, roomId:null, groups:{ 10:[{n:'Гр.1',t:6},{n:'Гр.2',t:20}], 7:[{n:'Гр.1',t:11},{n:'Гр.2',t:11}] } },
  { id:18, parallel:9,  letter:'Б', teacherId:36, count:29, roomId:null, groups:{ 10:[{n:'Гр.1',t:20},{n:'Гр.2',t:32}], 7:[{n:'Гр.1',t:11},{n:'Гр.2',t:11}] } },
  { id:19, parallel:9,  letter:'В', teacherId:18, count:28, roomId:null, groups:{ 10:[{n:'Гр.1',t:6},{n:'Гр.2',t:20}] } },
  { id:20, parallel:10, letter:'А', teacherId:34, count:26, roomId:null, groups:{ 10:[{n:'Гр.1',t:6},{n:'Гр.2',t:20}], 7:[{n:'Гр.1',t:11},{n:'Гр.2',t:11}] } },
  { id:21, parallel:10, letter:'Б', teacherId:35, count:28, roomId:null, groups:{ 10:[{n:'Гр.1',t:20},{n:'Гр.2',t:32}], 7:[{n:'Гр.1',t:11},{n:'Гр.2',t:11}] } },
  { id:22, parallel:11, letter:'А', teacherId:17, count:24, roomId:null, groups:{ 10:[{n:'Гр.1',t:6},{n:'Гр.2',t:20}], 7:[{n:'Гр.1',t:11},{n:'Гр.2',t:11}] } },
  { id:23, parallel:11, letter:'Б', teacherId:28, count:25, roomId:null, groups:{ 10:[{n:'Гр.1',t:20},{n:'Гр.2',t:32}], 7:[{n:'Гр.1',t:11},{n:'Гр.2',t:11}] } },
];

// ──────────────────────────────────────────────
// TEACHERS
// ──────────────────────────────────────────────
export let TEACHERS = [
  { id:0,  last:'Боднарчук',   first:'Г.В.',  deptId:2, subjects:[8,9],      hours:22, maxH:24, unavail:[], absent:false, color:'#3b5bdb' },
  { id:1,  last:'Коваль',      first:'А.А.',  deptId:1, subjects:[1,2,3],    hours:18, maxH:24, unavail:[], absent:false, color:'#7c3aed' },
  { id:2,  last:'Козак',       first:'О.Б.',  deptId:1, subjects:[4],        hours:20, maxH:24, unavail:[], absent:true,  color:'#0ea5e9' },
  { id:3,  last:'Лукащук',     first:'М.С.',  deptId:1, subjects:[5],        hours:19, maxH:24, unavail:[], absent:false, color:'#16a34a' },
  { id:4,  last:'Матвієнко',   first:'А.Б.',  deptId:1, subjects:[6],        hours:17, maxH:24, unavail:[], absent:false, color:'#dc2626' },
  { id:5,  last:'Пошпур',      first:'М.М.',  deptId:3, subjects:[14],       hours:16, maxH:24, unavail:[], absent:false, color:'#d97706' },
  { id:6,  last:'Руда',        first:'Т.О.',  deptId:2, subjects:[10,11],    hours:24, maxH:28, unavail:[], absent:false, color:'#854d0e' },
  { id:7,  last:'Яцишин',      first:'Д.Я.',  deptId:5, subjects:[22],       hours:28, maxH:32, unavail:[], absent:false, color:'#db2877' },
  { id:8,  last:'Марціняк',    first:'О.І.',  deptId:1, subjects:[1,2,3],    hours:21, maxH:24, unavail:[], absent:true,  color:'#0f766e' },
  { id:9,  last:'Міліновська', first:'Н.Р.',  deptId:4, subjects:[20],       hours:14, maxH:18, unavail:[], absent:false, color:'#7c3aed' },
  { id:10, last:'Гогусь',      first:'О.В.',  deptId:1, subjects:[5],        hours:20, maxH:24, unavail:[], absent:true,  color:'#854d0e' },
  { id:11, last:'Рибій',       first:'О.Я.',  deptId:1, subjects:[7],        hours:18, maxH:24, unavail:[], absent:false, color:'#0f766e' },
  { id:12, last:'Соколовський',first:'В.В.',  deptId:4, subjects:[21],       hours:24, maxH:28, unavail:[], absent:false, color:'#3b5bdb' },
  { id:13, last:'Глуха',       first:'С.М.',  deptId:1, subjects:[1,2],      hours:19, maxH:24, unavail:[], absent:false, color:'#7c3aed' },
  { id:14, last:'Данилюк',     first:'О.В.',  deptId:1, subjects:[4],        hours:16, maxH:24, unavail:[], absent:false, color:'#0ea5e9' },
  { id:15, last:'Казімірук',   first:'Т.О.',  deptId:2, subjects:[8,9],      hours:22, maxH:24, unavail:[], absent:false, color:'#dc2626' },
  { id:16, last:'Костюк',      first:'Г.М.',  deptId:1, subjects:[6],        hours:17, maxH:24, unavail:[], absent:false, color:'#16a34a' },
  { id:17, last:'Кузь',        first:'І.С.',  deptId:1, subjects:[1,2,3],    hours:18, maxH:24, unavail:[], absent:false, color:'#d97706' },
  { id:18, last:'Литвин',      first:'І.В.',  deptId:3, subjects:[14,15],    hours:15, maxH:20, unavail:[], absent:false, color:'#6b21a8' },
  { id:19, last:'Луранська',   first:'Ю.Р.',  deptId:4, subjects:[19],       hours:12, maxH:18, unavail:[], absent:false, color:'#db2877' },
  { id:20, last:'Процьків',    first:'Г.В.',  deptId:2, subjects:[10,12],    hours:20, maxH:24, unavail:[], absent:false, color:'#d97706' },
  { id:21, last:'Свистун',     first:'О.В.',  deptId:5, subjects:[22],       hours:26, maxH:32, unavail:[], absent:false, color:'#dc2626' },
  { id:22, last:'Ярощук',      first:'І.Д.',  deptId:1, subjects:[1,2,3],    hours:21, maxH:24, unavail:[], absent:false, color:'#3b5bdb' },
  { id:23, last:'Кульчицька',  first:'Т.В.',  deptId:6, subjects:[24,26],    hours:28, maxH:32, unavail:[], absent:false, color:'#0ea5e9' },
  { id:24, last:'Чорна',       first:'Г.І.',  deptId:6, subjects:[24,26],    hours:28, maxH:32, unavail:[], absent:false, color:'#16a34a' },
  { id:25, last:'Губар',       first:'Т.В.',  deptId:6, subjects:[24,26],    hours:20, maxH:28, unavail:[], absent:false, color:'#854d0e' },
  { id:26, last:'Ковальчук',   first:'Л.М.',  deptId:6, subjects:[24,26],    hours:19, maxH:28, unavail:[], absent:false, color:'#6b21a8' },
  { id:27, last:'Козак',       first:'Р.В.',  deptId:1, subjects:[1,2,3],    hours:18, maxH:24, unavail:[], absent:false, color:'#0f766e' },
  { id:28, last:'Кузь',        first:'В.М.',  deptId:1, subjects:[5],        hours:19, maxH:24, unavail:[], absent:false, color:'#7c3aed' },
  { id:29, last:'Вінніков',    first:'В.В.',  deptId:3, subjects:[14,15,16], hours:15, maxH:20, unavail:[], absent:false, color:'#854d0e' },
  { id:30, last:'Гавронський', first:'В.А.',  deptId:4, subjects:[21],       hours:20, maxH:24, unavail:[], absent:false, color:'#d97706' },
  { id:31, last:'Рогаль',      first:'І.Я.',  deptId:1, subjects:[6,25],     hours:16, maxH:20, unavail:[], absent:false, color:'#16a34a' },
  { id:32, last:'Бомок',       first:'А.Я.',  deptId:2, subjects:[10,13],    hours:18, maxH:24, unavail:[], absent:false, color:'#dc2626' },
  { id:33, last:'Іващук',      first:'В.В.',  deptId:5, subjects:[22,23],    hours:22, maxH:28, unavail:[], absent:false, color:'#0ea5e9' },
  { id:34, last:'Мартинюк',    first:'Я.В.',  deptId:2, subjects:[8,9],      hours:21, maxH:24, unavail:[], absent:false, color:'#3b5bdb' },
  { id:35, last:'Палац',       first:'Г.Р.',  deptId:2, subjects:[8,9],      hours:22, maxH:24, unavail:[], absent:false, color:'#6b21a8' },
  { id:36, last:'Слободян',    first:'О.П.',  deptId:3, subjects:[15,16,17], hours:18, maxH:24, unavail:[], absent:false, color:'#854d0e' },
  { id:37, last:'Кравчук',     first:'Т.П.',  deptId:1, subjects:[5,6],      hours:19, maxH:24, unavail:[], absent:false, color:'#7c3aed' },
];

// ──────────────────────────────────────────────
// ABSENCES & SUBSTITUTION LOG
// ──────────────────────────────────────────────
export let ABSENCES = [
  { teacherId:2,  from:'2025-05-13', to:'2025-05-15', reason:'Курси кваліфікації', note:'' },
  { teacherId:8,  from:'2025-05-13', to:'2025-05-17', reason:'Хвороба',           note:'' },
  { teacherId:10, from:'2025-05-13', to:'2025-05-13', reason:'Відрядження',       note:'' },
];

export let SUBLOG = [
  { date:'2025-05-13', absentId:8,  subId:17, subjId:1, classId:9,  lesson:3, status:'pending'   },
  { date:'2025-05-13', absentId:2,  subId:14, subjId:4, classId:17, lesson:5, status:'confirmed' },
  { date:'2025-05-12', absentId:10, subId:3,  subjId:5, classId:15, lesson:4, status:'confirmed' },
];

// ──────────────────────────────────────────────
// SCHEDULE  SCHED[day][slot] = [{classId,subjectId,teacherId,roomId,group}]
// ──────────────────────────────────────────────
export let SCHED = {};

// ──────────────────────────────────────────────
// SETTINGS
// ──────────────────────────────────────────────
export let SETTINGS = {
  schoolName: 'Школа №7 м. Тернопіль',
  year:       '2025–2026',
  maxLessons: 12,
  norm:       18,
  autoSub:    true,
  notif:      true,
};

// ──────────────────────────────────────────────
// LOCALSTORAGE — PERSISTENCE
// ──────────────────────────────────────────────
const LS_KEYS = {
  teachers:  'sg_teachers',
  classes:   'sg_classes',
  rooms:     'sg_rooms',
  sched:     'sg_sched',
  settings:  'sg_settings',
  absences:  'sg_absences',
  sublog:    'sg_sublog',
  depts:     'sg_depts',
  subjects:  'sg_subjects',
  curriculum:'sg_curriculum',
};

export function saveAll() {
  try {
    localStorage.setItem(LS_KEYS.teachers,   JSON.stringify(TEACHERS));
    localStorage.setItem(LS_KEYS.classes,    JSON.stringify(CLASSES));
    localStorage.setItem(LS_KEYS.rooms,      JSON.stringify(ROOMS));
    localStorage.setItem(LS_KEYS.sched,      JSON.stringify(SCHED));
    localStorage.setItem(LS_KEYS.settings,   JSON.stringify(SETTINGS));
    localStorage.setItem(LS_KEYS.absences,   JSON.stringify(ABSENCES));
    localStorage.setItem(LS_KEYS.sublog,     JSON.stringify(SUBLOG));
    localStorage.setItem(LS_KEYS.depts,      JSON.stringify(DEPTS));
    localStorage.setItem(LS_KEYS.subjects,   JSON.stringify(SUBJECTS));
    localStorage.setItem(LS_KEYS.curriculum, JSON.stringify(CURRICULUM));
  } catch(e) {
    console.warn('localStorage save failed:', e);
  }
}

export function loadAll() {
  try {
    const t  = localStorage.getItem(LS_KEYS.teachers);
    const c  = localStorage.getItem(LS_KEYS.classes);
    const r  = localStorage.getItem(LS_KEYS.rooms);
    const s  = localStorage.getItem(LS_KEYS.sched);
    const st = localStorage.getItem(LS_KEYS.settings);
    const ab = localStorage.getItem(LS_KEYS.absences);
    const sl = localStorage.getItem(LS_KEYS.sublog);
    const d  = localStorage.getItem(LS_KEYS.depts);
    const su = localStorage.getItem(LS_KEYS.subjects);
    const cu = localStorage.getItem(LS_KEYS.curriculum);

    if (t)  Object.assign(TEACHERS,  [], JSON.parse(t)),  TEACHERS.length = 0, JSON.parse(t).forEach(x => TEACHERS.push(x));
    if (c)  { CLASSES.length = 0;    JSON.parse(c).forEach(x => CLASSES.push(x)); }
    if (r)  { ROOMS.length = 0;      JSON.parse(r).forEach(x => ROOMS.push(x)); }
    if (ab) { ABSENCES.length = 0;   JSON.parse(ab).forEach(x => ABSENCES.push(x)); }
    if (sl) { SUBLOG.length = 0;     JSON.parse(sl).forEach(x => SUBLOG.push(x)); }
    if (d)  { DEPTS.length = 0;      JSON.parse(d).forEach(x => DEPTS.push(x)); }
    if (su) { SUBJECTS.length = 0;   JSON.parse(su).forEach(x => SUBJECTS.push(x)); }
    if (s)  Object.assign(SCHED, JSON.parse(s));
    if (st) {
      const saved = JSON.parse(st);
      // Migration: if user has old 7-lesson limit, upgrade to 12
      if (saved.maxLessons === 7) saved.maxLessons = 12;
      Object.assign(SETTINGS, saved);
    }
    if (cu) Object.assign(CURRICULUM, JSON.parse(cu));

    return true;
  } catch(e) {
    console.warn('localStorage load failed:', e);
    return false;
  }
}

export function resetAll() {
  Object.values(LS_KEYS).forEach(k => localStorage.removeItem(k));
}

// Auto-save on SCHED/TEACHERS change — call after any mutation
export function autosave() {
  try { saveAll(); } catch(e) { /* silent */ }
}
