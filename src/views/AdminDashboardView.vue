<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { GRADE_META, SUBJECT_META } from '@/data/books';
import { logoutAdmin } from '@/domain/adminAuth';
import { exportEventsAsCsv } from '@/domain/analytics';
import { createDashboardReport, resolveDateRange, type DatePreset } from '@/domain/adminStats';
import type { GradeId, SubjectId } from '@/types';

const router = useRouter();

const datePreset = ref<DatePreset>('7d');
const customStart = ref(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
const customEnd = ref(new Date().toISOString().slice(0, 10));

const subjectFilter = ref<'all' | SubjectId>('all');
const gradeFilter = ref<'all' | GradeId>('all');
const unitFilter = ref('');
const levelFilter = ref('');

const refreshTick = ref(0);

const dateRange = computed(() => resolveDateRange(datePreset.value, customStart.value, customEnd.value));

const report = computed(() => {
  refreshTick.value;

  return createDashboardReport(dateRange.value, {
    subjectId: subjectFilter.value === 'all' ? null : subjectFilter.value,
    gradeId: gradeFilter.value === 'all' ? null : gradeFilter.value,
    unit: unitFilter.value ? Number.parseInt(unitFilter.value, 10) : null,
    level: levelFilter.value ? Number.parseInt(levelFilter.value, 10) : null
  });
});

const maxTrendValue = computed(() => {
  const values = report.value.dailyTrend.flatMap((point) => [point.activeDevices, point.gameStarts, point.gameCompletions]);
  return Math.max(1, ...values);
});

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const remain = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remain).padStart(2, '0')}`;
}

function refreshReport() {
  refreshTick.value += 1;
}

function exportCsv() {
  const csv = exportEventsAsCsv(report.value.filteredEvents);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `usage-report-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function logout() {
  logoutAdmin();
  router.replace('/admin/login');
}
</script>

<template>
  <main class="page admin-page">
    <header class="admin-header">
      <div>
        <h1>使用数据后台</h1>
        <p>
          统计区间：{{ new Date(dateRange.startAt).toLocaleString() }} -
          {{ new Date(dateRange.endAt).toLocaleString() }}
        </p>
      </div>
      <div class="admin-header-actions">
        <button class="btn" @click="refreshReport">刷新</button>
        <button class="btn" @click="exportCsv">导出 CSV</button>
        <button class="btn" @click="logout">退出</button>
      </div>
    </header>

    <section class="admin-filters">
      <label>
        <span>时间范围</span>
        <select v-model="datePreset">
          <option value="today">今天</option>
          <option value="7d">近 7 天</option>
          <option value="30d">近 30 天</option>
          <option value="custom">自定义</option>
        </select>
      </label>

      <label v-if="datePreset === 'custom'">
        <span>开始日期</span>
        <input type="date" v-model="customStart" />
      </label>

      <label v-if="datePreset === 'custom'">
        <span>结束日期</span>
        <input type="date" v-model="customEnd" />
      </label>

      <label>
        <span>学科</span>
        <select v-model="subjectFilter">
          <option value="all">全部</option>
          <option v-for="subject in SUBJECT_META" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
        </select>
      </label>

      <label>
        <span>年级</span>
        <select v-model="gradeFilter">
          <option value="all">全部</option>
          <option v-for="grade in GRADE_META" :key="grade.id" :value="grade.id">{{ grade.id }}</option>
        </select>
      </label>

      <label>
        <span>单元</span>
        <input type="number" min="1" v-model="unitFilter" placeholder="全部" />
      </label>

      <label>
        <span>关卡</span>
        <input type="number" min="1" v-model="levelFilter" placeholder="全部" />
      </label>
    </section>

    <section class="admin-summary-grid">
      <article class="admin-summary-card">
        <h3>活跃设备</h3>
        <strong>{{ report.summary.activeDevices }}</strong>
      </article>
      <article class="admin-summary-card">
        <h3>会话数</h3>
        <strong>{{ report.summary.sessions }}</strong>
      </article>
      <article class="admin-summary-card">
        <h3>开始次数</h3>
        <strong>{{ report.summary.gameStarts }}</strong>
      </article>
      <article class="admin-summary-card">
        <h3>通关次数</h3>
        <strong>{{ report.summary.gameCompletions }}</strong>
      </article>
      <article class="admin-summary-card">
        <h3>平均会话时长</h3>
        <strong>{{ formatDuration(report.summary.avgSessionSeconds) }}</strong>
      </article>
      <article class="admin-summary-card">
        <h3>跳出率</h3>
        <strong>{{ formatPercent(report.summary.bounceRate) }}</strong>
      </article>
    </section>

    <section class="admin-section" v-if="report.filteredEvents.length === 0">
      <h2>暂无数据</h2>
      <p>当前筛选条件下还没有采集到事件，先进行几次游戏操作后再回来查看。</p>
    </section>

    <template v-else>
      <section class="admin-section">
        <h2>日趋势</h2>
        <div class="trend-list">
          <div class="trend-row" v-for="point in report.dailyTrend" :key="point.date">
            <div class="trend-date">{{ point.date }}</div>
            <div class="trend-bars">
              <div class="trend-bar-wrap">
                <span>活跃 {{ point.activeDevices }}</span>
                <div class="trend-bar active" :style="{ width: `${(point.activeDevices / maxTrendValue) * 100}%` }" />
              </div>
              <div class="trend-bar-wrap">
                <span>开始 {{ point.gameStarts }}</span>
                <div class="trend-bar start" :style="{ width: `${(point.gameStarts / maxTrendValue) * 100}%` }" />
              </div>
              <div class="trend-bar-wrap">
                <span>通关 {{ point.gameCompletions }}</span>
                <div class="trend-bar complete" :style="{ width: `${(point.gameCompletions / maxTrendValue) * 100}%` }" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="admin-section">
        <h2>学科分布</h2>
        <table class="admin-table">
          <thead>
            <tr>
              <th>学科</th>
              <th>开始次数</th>
              <th>通关次数</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in report.subjectStats" :key="item.subjectId">
              <td>{{ item.subjectName }}</td>
              <td>{{ item.starts }}</td>
              <td>{{ item.completions }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="admin-section">
        <h2>学习漏斗（按会话）</h2>
        <div class="funnel-grid">
          <article class="funnel-card" v-for="stage in report.funnel" :key="stage.key">
            <h3>{{ stage.label }}</h3>
            <strong>{{ stage.sessions }}</strong>
            <p>转化率 {{ formatPercent(stage.conversionRate) }}</p>
            <p v-if="stage.key !== 'home'">流失率 {{ formatPercent(stage.lossRate) }}</p>
          </article>
        </div>
      </section>

      <section class="admin-section two-column">
        <div>
          <h2>页面访问 Top 10</h2>
          <table class="admin-table">
            <thead>
              <tr>
                <th>页面</th>
                <th>PV</th>
                <th>UV</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in report.pageStats.slice(0, 10)" :key="item.path">
                <td>{{ item.path }}</td>
                <td>{{ item.pv }}</td>
                <td>{{ item.uv }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h2>入口 / 退出页</h2>
          <table class="admin-table compact-table">
            <thead>
              <tr>
                <th>类型</th>
                <th>页面</th>
                <th>次数</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in report.entryPages.slice(0, 5)" :key="`entry-${item.path}`">
                <td>入口</td>
                <td>{{ item.path }}</td>
                <td>{{ item.pv }}</td>
              </tr>
              <tr v-for="item in report.exitPages.slice(0, 5)" :key="`exit-${item.path}`">
                <td>退出</td>
                <td>{{ item.path }}</td>
                <td>{{ item.pv }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="admin-section">
        <h2>关卡学习表现 Top 20（按开始次数）</h2>
        <table class="admin-table">
          <thead>
            <tr>
              <th>学科</th>
              <th>年级</th>
              <th>单元</th>
              <th>关卡</th>
              <th>开始</th>
              <th>通关</th>
              <th>完成率</th>
              <th>平均用时</th>
              <th>平均错误</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in report.learningRows" :key="row.key">
              <td>{{ row.subjectId }}</td>
              <td>{{ row.gradeId }}</td>
              <td>{{ row.unit }}</td>
              <td>{{ row.level }}</td>
              <td>{{ row.starts }}</td>
              <td>{{ row.completions }}</td>
              <td>{{ formatPercent(row.completionRate) }}</td>
              <td>{{ formatDuration(row.avgDuration) }}</td>
              <td>{{ row.avgErrors.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </main>
</template>
