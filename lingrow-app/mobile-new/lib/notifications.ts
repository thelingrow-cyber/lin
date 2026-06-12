import * as Notifications from 'expo-notifications';
import { getAllProgress } from '@/store/lingrow';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function hasNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

const MIN_DELAY_MS = 30 * 60 * 1000;      // nunca notificar antes de 30 min
const OVERDUE_DELAY_MS = 3 * 60 * 60 * 1000; // 3 horas se já vencido

export async function scheduleNextReviewNotification(): Promise<void> {
  try {
    const allProgress = await getAllProgress();
    const now = new Date();

    const hasDue = allProgress.some(
      (p) => p.nextReview && new Date(p.nextReview) <= now
    );

    const futureReviews = allProgress
      .filter((p) => p.nextReview && new Date(p.nextReview) > now)
      .map((p) => new Date(p.nextReview!).getTime())
      .sort((a, b) => a - b);

    let notifyAt: Date;

    if (hasDue) {
      // cards já vencidos — avisa em 3 horas
      notifyAt = new Date(now.getTime() + OVERDUE_DELAY_MS);
    } else if (futureReviews.length > 0) {
      // notifica no vencimento do próximo card — mas nunca antes de 30 min.
      // Cobre os vencimentos curtos ("Difícil" → +10min), que antes
      // não geravam lembrete nenhum (gap A-notif da auditoria 2026-06-12).
      notifyAt = new Date(Math.max(futureReviews[0], now.getTime() + MIN_DELAY_MS));
    } else {
      // nenhum card no horizonte — nada para notificar
      return;
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Lingrow',
        body: 'Hora de revisar. Não deixe o inglês ir embora.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notifyAt,
      },
    });
  } catch {
    // silencioso — notificação é feature auxiliar, não deve travar o app
  }
}
