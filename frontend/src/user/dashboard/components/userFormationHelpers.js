import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import {
  faAward,
  faCalendarAlt,
  faGraduationCap
} from '@fortawesome/free-solid-svg-icons';

dayjs.extend(relativeTime);

export function getThemeClasses(isInProgress, isCompleted) {
  if (isInProgress) return 'bg-amber-500/20 text-amber-700 dark:text-amber-300';
  if (isCompleted) return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300';
  return 'bg-[#b3c34c]/20 text-[#73841e] dark:text-[#d4e84a]';
}

export function getFormationIcon(isCompleted, isScheduled) {
  if (isCompleted) return faAward;
  if (isScheduled) return faCalendarAlt;
  return faGraduationCap;
}

export function combineFormations(attendances, allPublishedFormations) {
  const items = [...(attendances || [])];
  const attendedFormationIds = new Set(
    items.map((a) => a.formation?.id).filter(Boolean)
  );

  (allPublishedFormations || []).forEach((f) => {
    if (!attendedFormationIds.has(f.id) && f.status !== 'DRAFT') {
      const isClosed = Boolean(f.isClosed || f.status === 'CLOSED');
      items.push({
        id: `scheduled-${f.id}`,
        formation: f,
        checkInDate: null,
        checkOutDate: null,
        isScheduled: !isClosed,
        isClosedNonAttended: isClosed
      });
    }
  });

  return items;
}

export function computeCounts(combinedItems) {
  let upcoming = 0;
  let inProgress = 0;
  let completed = 0;

  combinedItems.forEach((item) => {
    const isClosed = Boolean(item.formation?.isClosed || item.formation?.status === 'CLOSED');
    if (item.checkOutDate || item.isClosedNonAttended || (isClosed && !item.checkInDate)) {
      completed += 1;
    } else if (item.checkInDate) {
      inProgress += 1;
    } else {
      upcoming += 1;
    }
  });

  return { upcoming, inProgress, completed, total: combinedItems.length };
}

export function filterAndSortItems(items, activeTab) {
  return items
    .filter((item) => {
      const isClosed = Boolean(item.formation?.isClosed || item.formation?.status === 'CLOSED');
      const isCompletedOrClosed = Boolean(item.checkOutDate || item.isClosedNonAttended || (isClosed && !item.checkInDate));
      const isInProgress = Boolean(item.checkInDate && !item.checkOutDate);
      const isUpcoming = Boolean(!item.checkInDate && !item.checkOutDate && !isClosed && !item.isClosedNonAttended);

      if (activeTab === 'UPCOMING') return isUpcoming;
      if (activeTab === 'IN_PROGRESS') return isInProgress;
      if (activeTab === 'COMPLETED') return isCompletedOrClosed;
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.formation?.formationDate || 0);
      const dateB = new Date(b.formation?.formationDate || 0);

      const aInProgress = !!a.checkInDate && !a.checkOutDate;
      const bInProgress = !!b.checkInDate && !b.checkOutDate;
      if (aInProgress !== bInProgress) return aInProgress ? -1 : 1;

      const aCompleted = !!a.checkOutDate || a.isClosedNonAttended || a.formation?.isClosed;
      const bCompleted = !!b.checkOutDate || b.isClosedNonAttended || b.formation?.isClosed;
      if (aCompleted !== bCompleted) return aCompleted ? -1 : 1;

      return dateB - dateA;
    });
}

export function calculateRelativeTimeBadge(formationDate, t) {
  if (!formationDate) return null;
  const now = dayjs();
  const target = dayjs(formationDate);
  const diffHours = target.diff(now, 'hour');
  const diffDays = target.diff(now, 'day');

  if (diffHours >= 0 && diffHours <= 24) {
    return {
      type: 'today',
      text: `${t('dashboard.todayAt', 'Hoy a las')} ${target.format('HH:mm')}`
    };
  }
  if (diffDays === 1) {
    return {
      type: 'tomorrow',
      text: `${t('dashboard.tomorrowAt', 'Mañana a las')} ${target.format('HH:mm')}`
    };
  }
  if (diffDays > 1 && diffDays <= 7) {
    return {
      type: 'soon',
      text: t('dashboard.inDays', 'En {{count}} días', { count: diffDays })
    };
  }
  return null;
}
