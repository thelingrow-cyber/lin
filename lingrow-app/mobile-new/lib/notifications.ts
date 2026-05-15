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

export async function scheduleNextReviewNotification(): Promise<void> {
  try {
    const allProgress = await getAllProgress();
    const now = new Date();

    const futureReviews = allProgress
      .filter((p) => p.nextReview && new Date(p.nextReview) > now)
      .map((p) => new Date(p.nextReview!).getTime())
      .sort((a, b) => a - b);

    if (futureReviews.length === 0) return;

    const nextReviewTime = new Date(futureReviews[0]);

    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Lingrow',
        body: 'Hora de revisar. Não deixe o inglês ir embora.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: nextReviewTime,
      },
    });
  } catch {
    // silencioso — notificação é feature auxiliar, não deve travar o app
  }
}
