import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import GradeView from '@/views/GradeView.vue';
import UnitView from '@/views/UnitView.vue';
import LevelView from '@/views/LevelView.vue';
import GameView from '@/views/GameView.vue';
import VictoryView from '@/views/VictoryView.vue';
const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', name: 'Home', component: HomeView },
        { path: '/grade/:subject', name: 'Grade', component: GradeView },
        { path: '/unit/:subject/:grade', name: 'Unit', component: UnitView },
        { path: '/level/:subject/:grade/:unit', name: 'Level', component: LevelView },
        { path: '/game/:subject/:grade/:unit/:level', name: 'Game', component: GameView },
        { path: '/victory/:subject/:grade/:unit/:level', name: 'Victory', component: VictoryView },
        { path: '/unit/:grade', redirect: (to) => `/unit/chinese/${String(to.params.grade ?? '')}` },
        {
            path: '/level/:grade/:unit',
            redirect: (to) => `/level/chinese/${String(to.params.grade ?? '')}/${String(to.params.unit ?? '')}`
        },
        {
            path: '/game/:grade/:unit/:level',
            redirect: (to) => `/game/chinese/${String(to.params.grade ?? '')}/${String(to.params.unit ?? '')}/${String(to.params.level ?? '')}`
        },
        {
            path: '/victory/:grade/:unit/:level',
            redirect: (to) => `/victory/chinese/${String(to.params.grade ?? '')}/${String(to.params.unit ?? '')}/${String(to.params.level ?? '')}`
        },
        { path: '/:pathMatch(.*)*', redirect: '/' }
    ]
});
export default router;
