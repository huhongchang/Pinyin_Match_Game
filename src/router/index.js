import { createRouter, createWebHistory } from 'vue-router';
import { isAdminLoggedIn } from '@/domain/adminAuth';
import { trackPageView } from '@/domain/analytics';
import HomeView from '@/views/HomeView.vue';
import GradeView from '@/views/GradeView.vue';
import UnitView from '@/views/UnitView.vue';
import LevelView from '@/views/LevelView.vue';
import GameView from '@/views/GameView.vue';
import VictoryView from '@/views/VictoryView.vue';
import AdminLoginView from '@/views/AdminLoginView.vue';
import AdminDashboardView from '@/views/AdminDashboardView.vue';
function parsePositiveInt(value) {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
        return undefined;
    }
    return parsed;
}
const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', name: 'Home', component: HomeView },
        { path: '/admin/login', name: 'AdminLogin', component: AdminLoginView },
        {
            path: '/admin',
            name: 'AdminDashboard',
            component: AdminDashboardView,
            meta: { requiresAdmin: true }
        },
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
router.beforeEach((to) => {
    if (to.name === 'AdminLogin' && isAdminLoggedIn()) {
        return '/admin';
    }
    if (to.meta.requiresAdmin && !isAdminLoggedIn()) {
        return {
            path: '/admin/login',
            query: {
                redirect: to.fullPath
            }
        };
    }
    return true;
});
router.afterEach((to) => {
    if (to.path.startsWith('/admin')) {
        return;
    }
    trackPageView(to.path, String(to.name ?? ''), {
        subjectId: typeof to.params.subject === 'string' ? to.params.subject : undefined,
        gradeId: typeof to.params.grade === 'string' ? to.params.grade : undefined,
        unit: parsePositiveInt(to.params.unit),
        level: parsePositiveInt(to.params.level)
    });
});
export default router;
